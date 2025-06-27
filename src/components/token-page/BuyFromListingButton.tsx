// /market/src/components/token-page/BuyFromListingButton.tsx
import { Button, useToast } from "@chakra-ui/react";
import { ethers } from "ethers";
import { useWallet } from "@/hooks/useWallet";
import { useMarketplaceContext } from "@/hooks/useMarketplaceContext";
import MarketplaceABI from "@/abis/MarketplaceABI.json";
import { useState, useMemo } from "react";
import { MARKETPLACE_ADDRESS } from "@/consts/addresses";
import { fetchNFTExternal } from "@/hooks/useReadNFT";

// Minimal ERC20 ABI for allowance and approve calls
const ERC20ABI = [
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
];

// Define the native token address constant (commonly used to denote ETH)
const NATIVE_TOKEN_ADDRESS = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";

type Props = {
  listing: {
    listingId: bigint;
    listingCreator: string;
    assetContract: string;
    tokenId: bigint;
    quantity: bigint;
    currency: string;
    pricePerToken: bigint;
    endTimestamp: bigint;
    currencyValuePerToken?: { displayValue: string; symbol: string };
    status?: number;
  };
  account: string;
  onSuccess?: () => void;
  w?: string | { base: string; md: string };
  size?: string;
  h?: string;
  fontSize?: string;
  fontWeight?: string;
  px?: number;
};

export default function BuyFromListingButton(props: Props) {
  const { account, listing, onSuccess } = props;
  // const { marketplaceContract } = useMarketplaceContext();
  const { provider } = useWallet();
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const { nftContract } = useMarketplaceContext();

  // check if listing is expired
  const isExpired = useMemo(() => {
    const currentTime = Math.floor(Date.now() / 1000);
    return Number(listing.endTimestamp) < currentTime;
  }, [listing.endTimestamp]);

  // if listing is expired, show expired button
  if (isExpired) {
    return (
      <Button
        colorScheme="red"
        isDisabled
        opacity={0.7}
        w={props.w}
        size="md"
        h="40px"
        fontSize="md"
        fontWeight="semibold"
        px={6}
      >
        Expired
      </Button>
    );
  }

  const handleBuy = async () => {
    if (!provider || !account) {
      toast({
        title: "Wallet not connected",
        status: "error",
        isClosable: true,
        duration: 2000,
      });
      return;
    }

    setIsLoading(true);
    try {
      // First check balance before attempting transaction
      const balance = await provider.getBalance(account);
      if (balance < listing.pricePerToken) {
        toast({
          title: "Insufficient funds",
          description:
            "You don't have enough ETH to complete this purchase. Please check your wallet balance.",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
        return;
      }

      const loadingToast = toast({
        title: "Processing...",
        status: "loading",
        duration: 5000,
      });

      // If the listing currency is not native, check and approve ERC20 spending.
      // if (
      //   listing.currency.toLowerCase() !== NATIVE_TOKEN_ADDRESS.toLowerCase()
      // ) {
      //   const tokenContract = new ethers.Contract(
      //     listing.currency,
      //     ERC20ABI,
      //     provider
      //   );
      //   // Calculate required approval: pricePerToken * quantity
      //   const requiredApproval = listing.pricePerToken * listing.quantity;
      //   const currentAllowance: bigint = await tokenContract.allowance(
      //     account,
      //     MARKETPLACE_ADDRESS
      //   );
      //   if (currentAllowance < requiredApproval) {
      //     const signer = await provider.getSigner();
      //     const tokenWithSigner = tokenContract.connect(signer);
      //     const txApprove = await tokenWithSigner.approve(
      //         MARKETPLACE_ADDRESS,
      //       requiredApproval
      //     );
      //     await txApprove.wait();
      //   }
      // }

      // Create a write instance for the marketplace contract using the signer.
      const signer = await provider.getSigner();
      const marketplaceInstance = new ethers.Contract(
        MARKETPLACE_ADDRESS.toString(),
        MarketplaceABI,
        signer
      );

      const expectedTotalPrice = listing.pricePerToken;

      let overrides: Record<string, any> = {};
      if (
        listing.currency.toLowerCase() === NATIVE_TOKEN_ADDRESS.toLowerCase()
      ) {
        overrides = { value: expectedTotalPrice };
      }

      const tx = await marketplaceInstance.buyFromListing(
        listing.listingId.toString(),
        account,
        1,
        NATIVE_TOKEN_ADDRESS,
        expectedTotalPrice,
        overrides
      );

      toast.close(loadingToast);
      onSuccess?.();

      toast.close(loadingToast);
      toast({
        title: "Purchase initiated",
        description: "Transaction sent to blockchain",
        status: "success",
        duration: 2000,
        isClosable: true,
      });

      // check confirmation in the background
      tx.wait()
        .then(async () => {
          toast({
            title: "Purchase confirmed!",
            description: "Transaction has been confirmed on blockchain",
            status: "success",
            duration: 5000,
            isClosable: true,
            onCloseComplete: () => {
              // Refresh page after toast is closed
              window.location.reload();
            },
          });

          try {
            const updatedNFTData = await fetchNFTExternal(
              nftContract,
              listing.tokenId
            );
            onSuccess?.();
          } catch (error) {
            console.error("Error refreshing NFT data:", error);
          }
        })
        .catch((error: any) => {
          console.error("Transaction failed:", error);

          // Check if user rejected transaction
          if (
            error.code === 4001 ||
            error.code === "ACTION_REJECTED" ||
            error.message?.includes("user rejected") ||
            error.message?.includes("User rejected")
          ) {
            toast({
              title: "Transaction cancelled",
              description: "You cancelled the transaction",
              status: "info",
              duration: 3000,
              isClosable: true,
            });
          }
          // Check for insufficient funds or related errors
          else if (
            error.code === "INSUFFICIENT_FUNDS" ||
            error.code === -32000 ||
            error.code === -32603 ||
            error.code === "CALL_EXCEPTION" ||
            (error.message &&
              (error.message.includes("insufficient funds") ||
                error.message.toLowerCase().includes("insufficient fund") ||
                error.message.includes("missing revert data")))
          ) {
            toast({
              title: "Insufficient funds",
              description:
                "You don't have enough ETH to complete this purchase. Please check your wallet balance.",
              status: "error",
              duration: 5000,
              isClosable: true,
            });
          }
          // Check for execution reverted error (likely not approved)
          else if (
            error.message?.includes("execution reverted") ||
            error.data === "0x59c896be"
          ) {
            toast({
              title: "Transaction Failed",
              description:
                "This NFT is not approved for trading on the marketplace.",
              status: "error",
              duration: 5000,
              isClosable: true,
            });
          }
          // Handle other errors
          else {
            toast({
              title: "Transaction failed",
              description: "Failed to complete the purchase. Please try again.",
              status: "error",
              duration: 5000,
              isClosable: true,
            });
          }
        });
    } catch (error: any) {
      console.error("Error buying listing:", error);

      // Check if user rejected transaction
      if (
        error.code === 4001 ||
        error.code === "ACTION_REJECTED" ||
        error.message?.includes("user rejected") ||
        error.message?.includes("User rejected")
      ) {
        toast({
          title: "Transaction cancelled",
          description: "You cancelled the transaction",
          status: "info",
          duration: 3000,
          isClosable: true,
        });
      }
      // Check for insufficient funds or related errors
      else if (
        error.code === "INSUFFICIENT_FUNDS" ||
        error.code === -32000 ||
        error.code === -32603 ||
        error.code === "CALL_EXCEPTION" ||
        (error.message &&
          (error.message.includes("insufficient funds") ||
            error.message.toLowerCase().includes("insufficient fund") ||
            error.message.includes("missing revert data")))
      ) {
        toast({
          title: "Insufficient funds",
          description:
            "You don't have enough ETH to complete this purchase. Please check your wallet balance.",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      }
      // Check for execution reverted error (likely not approved)
      else if (
        error.message?.includes("execution reverted") ||
        error.data === "0x59c896be"
      ) {
        toast({
          title: "Transaction Failed",
          description:
            "This NFT is not approved for trading on the marketplace.",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      }
      // Handle other errors
      else {
        toast({
          title: "Transaction failed",
          description: "Failed to complete the purchase. Please try again.",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      colorScheme="green"
      onClick={handleBuy}
      isLoading={isLoading}
      loadingText="Processing..."
      w={props.w}
      size={props.size}
      h={props.h}
      fontSize={props.fontSize}
      fontWeight={props.fontWeight}
      px={props.px}
    >
      Buy
    </Button>
  );
}
