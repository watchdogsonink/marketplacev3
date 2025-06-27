import { NATIVE_TOKEN_ICON_MAP } from "@/consts/supported_tokens";
import { useMarketplaceContext } from "@/hooks/useMarketplaceContext";
import {
  Button,
  Flex,
  Input,
  Text,
  Image,
  useToast,
  Tooltip,
  Box,
  InputGroup,
  InputRightAddon,
} from "@chakra-ui/react";
import { useRef, useState, useMemo } from "react";
import { useWallet } from "@/hooks/useWallet";
import { ethers } from "ethers";
import NFTABI from "@/abis/NFTABI.json";
import MarketplaceABI from "@/abis/MarketplaceABI.json";
import { NATIVE_TOKEN_ADDRESS } from "thirdweb";
import { useRouter } from "next/navigation";
import { formatUnits } from "ethers";
import CancelListingButton from "./CancelListingButton";
import {
  Listing,
  useListingsByCollection,
} from "@/hooks/useMarketplaceListings";
import { MARKETPLACE_ADDRESS } from "@/consts/addresses";

type Props = {
  tokenId: bigint;
  account: string;
  onSuccess?: () => void;
  isAlreadyListed: boolean;
  activeListing?: Listing;
};

export default function CreateListing(props: Props) {
  const [isCreatingListing, setIsCreatingListing] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const priceRef = useRef<HTMLInputElement>(null);
  const { tokenId, account, isAlreadyListed, activeListing } = props;
  const toast = useToast();
  const router = useRouter();

  const { nftContract, marketplaceContract, listingsInSelectedCollection } =
    useMarketplaceContext();
  const { provider } = useWallet();

  const nativeToken = {
    tokenAddress: NATIVE_TOKEN_ADDRESS,
    symbol: "ETH",
    icon: NATIVE_TOKEN_ICON_MAP[57073] || "",
  };

  const currency = nativeToken;

  const handleSwitchChain = async () => {
    if (!provider || !window.ethereum) return;
    const network = await provider.getNetwork();
    const requiredChainId = "57073";
    if (network.chainId.toString() !== requiredChainId) {
      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: ethers.toBeHex(requiredChainId) }],
        });
      } catch (switchError: any) {
        console.error("Error switching chain:", switchError);
        throw new Error("Failed to switch chain");
      }
    }
  };

  const {
    listings: marketplaceListings,
    loading: listingsLoading,
    error: listingsError,
    refetch: refetchAllListings,
  } = useListingsByCollection(nftContract, 10, 0);

  const handleList = async () => {
    const value = priceRef.current?.value;
    if (!value) {
      return toast({
        title: "Please enter a listing price",
        status: "error",
        isClosable: true,
        duration: 2000,
      });
    }

    setIsCreatingListing(true);
    try {
      const loadingToast = toast({
        title: "Creating listing...",
        description: "Please wait",
        status: "loading",
        duration: 5000,
      });

      await handleSwitchChain();

      if (!provider) throw new Error("No provider found");
      const signer = await provider.getSigner();

      const nftContractRead = new ethers.Contract(
        nftContract.toString(),
        NFTABI,
        provider
      );

      const isApproved = await nftContractRead.isApprovedForAll(
        account,
        MARKETPLACE_ADDRESS
      );
      if (!isApproved) {
        const nftContractWrite = new ethers.Contract(
          nftContract.toString(),
          NFTABI,
          signer
        );
        const approvalTx = await nftContractWrite.setApprovalForAll(
          MARKETPLACE_ADDRESS,
          true
        );
        await approvalTx.wait();
      }

      const listingParams = {
        assetContract: nftContract,
        tokenId: tokenId,
        quantity: 1,
        currency: nativeToken.tokenAddress,
        pricePerToken: ethers.parseUnits(value, "ether"),
        startTimestamp: Math.floor(Date.now() / 1000),
        endTimestamp: Math.floor(Date.now() / 1000) + 31536000, // 365 days (1 year)
        reserved: false,
      };

      const marketplaceInstance = new ethers.Contract(
        MARKETPLACE_ADDRESS,
        MarketplaceABI,
        signer
      );

      const tx = await marketplaceInstance.createListing(listingParams);

      // first toast
      if (priceRef.current) {
        priceRef.current.value = "";
      }
      toast.close(loadingToast);

      props.onSuccess?.();

      toast({
        title: "Listing initiated",
        description: "Transaction sent to blockchain",
        status: "success",
        duration: 2000,
        isClosable: true,
        position: "bottom",
      });

      // check transaction status in the background
      tx.wait()
        .then((receipt: any) => {
          if (receipt.status === 1) {
            // transaction confirmed successfully
            toast({
              title: "Listing confirmed",
              description: "Your NFT has been listed successfully",
              status: "success",
              duration: 3000,
              isClosable: true,
              position: "bottom",
            });
          } else {
            // transaction failed on-chain
            toast({
              title: "Transaction Failed",
              description:
                "Transaction was rejected by the blockchain. Please try again.",
              status: "error",
              duration: 3000,
              isClosable: true,
              position: "bottom",
            });
          }
        })
        .catch((txError: any) => {
          console.error("Transaction confirmation error:", txError);
          // dont show error toast, because transaction might have been successful
          // even though there was a problem reading the confirmation
        });
    } catch (err: any) {
      // error logging
      console.error("Error creating listing - Full error object:", err);
      console.log("Error details:", {
        code: err.code,
        message: err.message,
        name: err.name,
        stack: err.stack,
        data: err.data,
        reason: err.reason,
        error: err.error,
        transaction: err.transaction,
      });

      // check if the user rejected the transaction
      if (
        err.code === 4001 ||
        err.code === "ACTION_REJECTED" ||
        err.message?.includes("user denied") ||
        err.message?.includes("user rejected")
      ) {
        toast({
          title: "Transaction Cancelled",
          description: "You cancelled the listing creation",
          status: "info",
          duration: 3000,
          isClosable: true,
          position: "bottom",
        });
      }
      // check if transaction was rejected due to low gas
      else if (
        err.code === -32603 ||
        err.code === -32000 ||
        err.message?.toLowerCase().includes("transaction underpriced") ||
        err.message?.toLowerCase().includes("insufficient gas") ||
        err.message?.toLowerCase().includes("out of gas") ||
        err.reason?.toLowerCase().includes("gas") ||
        (err.error &&
          typeof err.error === "object" &&
          "message" in err.error &&
          String(err.error.message).toLowerCase().includes("gas"))
      ) {
        console.log("Gas error detected:", {
          code: err.code,
          message: err.message,
          error: err.error,
        });

        toast({
          title: "Transaction Failed",
          description:
            "Transaction was rejected due to low gas limit. Please try again with higher gas.",
          status: "error",
          duration: 5000,
          isClosable: true,
          position: "bottom",
        });
      } else {
        toast({
          title: "Error",
          description: err.message || "Unknown error",
          status: "error",
          duration: 2000,
          isClosable: true,
        });
      }
    } finally {
      setIsCreatingListing(false);
    }
  };

  // Check if the NFT contract address is 0xaaaa (case-insensitive)
  const isSpecificContract = nftContract.toLowerCase() !== "";

  return (
    <Box>
      {isSpecificContract ? (
        <Flex direction="column" gap={2}>
          <InputGroup maxW="430px" width="100%">
            <Input
              ref={priceRef}
              type="number"
              step="0.000001"
              min="0"
              value={
                isAlreadyListed
                  ? activeListing
                    ? formatUnits(activeListing.pricePerToken, 18)
                    : ""
                  : inputValue
              }
              placeholder="Enter listing price"
              isReadOnly={isAlreadyListed}
              onChange={(e) => {
                setInputValue(e.target.value);
                if (priceRef.current) {
                  priceRef.current.value = e.target.value;
                }
              }}
            />
            <InputRightAddon>ETH</InputRightAddon>
          </InputGroup>
          {isAlreadyListed && activeListing ? (
            <Box maxW="430px" width="100%">
              <CancelListingButton
                listingId={activeListing.listingId}
                onSuccess={props.onSuccess}
                w="100%"
                size="md"
                h="40px"
              />
            </Box>
          ) : (
            <Button
              colorScheme="brand"
              onClick={handleList}
              isLoading={isCreatingListing}
              loadingText="Creating..."
              maxW="430px"
              width="100%"
              size="md"
              h="40px"
            >
              List
            </Button>
          )}
        </Flex>
      ) : (
        <Text fontSize="lg" color="blue.500" fontWeight="bold">
          Listing will be available after the minting closes.
        </Text>
      )}
    </Box>
  );
}
