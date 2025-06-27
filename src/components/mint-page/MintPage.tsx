"use client";

import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Box,
  Container,
  Flex,
  Heading,
  Text,
  useColorModeValue,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Button,
  useToast,
  Progress,
  HStack,
} from "@chakra-ui/react";
import { MediaRenderer } from "@/components/shared/MediaRenderer";
import { useMarketplaceContext } from "@/hooks/useMarketplaceContext";
import { useWallet } from "@/hooks/useWallet";
import { useState, useEffect, useMemo } from "react";
import { NftDetails } from "../token-page/NftDetails";
import { NFT_CONTRACTS } from "@/consts/nft_contracts";
import { useParams } from "next/navigation";
import { ethers } from "ethers";
import WatchDogsABI from "@/abis/WatchDogs.json"; // Adjust the path to your ABI file
import { MintTimer } from "./MintTimer";

export default function MintPage() {
  // const { nftContract, contractMetadata } = useMarketplaceContext();
  const params = useParams();
  const mintContractAddress = "0x58da2f96c473e9cb89f0de7c6f1faede70d47c93";
  const { account, provider } = useWallet();
  const toast = useToast();
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [mintPriceWei, setMintPriceWei] = useState<BigInt | null>(null);
  const [isMintingClosed, setIsMintingClosed] = useState(false);
  const [currentSupply, setCurrentSupply] = useState<number>(0);
  const [timeRemaining, setTimeRemaining] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);
  const MAX_SUPPLY = 333;

  // Mint end time - 7 days from now (for testing)
  // In production, this should be a constant date saved in timestamp format
  const MINT_END_DATE = useMemo(() => {
    // Set mint end date - 7 days from the moment the page is loaded
    // In production, this should be a constant date
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 7);
    return endDate.getTime();
  }, []);

  // Countdown to mint end
  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = new Date().getTime();
      const distance = MINT_END_DATE - now;

      // If time is up, close mint
      if (distance <= 0) {
        setIsMintingClosed(true);
        setTimeRemaining(null);
        return;
      }

      // Calculate remaining time
      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      );
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setTimeRemaining({ days, hours, minutes, seconds });
    };

    // Calculate initial remaining time
    calculateTimeRemaining();

    // Update time every second
    const interval = setInterval(calculateTimeRemaining, 1000);

    // Clear interval when component is unmounted
    return () => clearInterval(interval);
  }, [MINT_END_DATE]);

  const bgGradient = useColorModeValue(
    "linear(to-br, purple.100, blue.50)",
    "linear(to-br, purple.900, gray.900)"
  );

  // Find NFT config based on contract address
  const nftConfig = NFT_CONTRACTS.find(
    (item) => item.address.toLowerCase() === mintContractAddress.toLowerCase()
  );

  const contractMetadata = nftConfig;
  const getImageUrl = () => {
    if (nftConfig?.thumbnailUrl) {
      return nftConfig.thumbnailUrl;
    }
    const possibleSources = [
      (contractMetadata as any)?.image_url,
      (contractMetadata as any)?.image,
      contractMetadata?.thumbnailUrl,
      contract?.image,
    ];
    return possibleSources.find((source) => source && source.length > 0) || "";
  };

  // Initialize contract
  const contract = useMemo(() => {
    if (!provider || !mintContractAddress) return null;
    try {
      // Log contract initialization
      console.log("Initializing contract with address:", mintContractAddress);
      const instance = new ethers.Contract(
        mintContractAddress,
        WatchDogsABI,
        provider
      );
      // safe logging of contract functions
      console.log("Contract instance:", instance);
      console.log(
        "Contract functions:",
        instance?.functions ? Object.keys(instance.functions) : []
      );
      return instance;
    } catch (error) {
      console.error("Error initializing contract:", error);
      return null;
    }
  }, [provider, mintContractAddress]);

  // Fetch mint price and minting status
  useEffect(() => {
    if (!contract) return;
    const fetchData = async () => {
      try {
        const price = BigInt("3333000000000000");
        // await contract.mintPrice();
        setMintPriceWei(price);
        // const withdrawn = await contract.withdrawn();
        // setIsMintingClosed(withdrawn);
      } catch (error) {
        console.error("Failed to fetch contract data:", error);
        toast({
          title: "Failed to load contract data",
          description:
            "Unable to fetch mint price or status. Please try again.",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      }
    };
    fetchData();
  }, [contract, toast]);

  // Modify useEffect to fetch the initial number of minted NFTs
  useEffect(() => {
    const init = async () => {
      if (!contract) return;
      try {
        console.log("Calling totalSupply...");
        console.log(
          "Available methods:",
          contract?.functions ? Object.keys(contract.functions) : []
        );
        const result = await contract.totalSupply();
        console.log("TotalSupply result:", result);
        setCurrentSupply(Number(result));
      } catch (error) {
        console.error("Error fetching initial minted count:", error);
        if (error instanceof Error) {
          console.log("Error details:", {
            code: (error as any).code,
            message: error.message,
            data: (error as any).data,
          });
        }
      }
    };

    init();
  }, [contract]);

  // Calculate display values
  const mintPriceEth = mintPriceWei
    ? parseFloat(ethers.formatEther(mintPriceWei.toString())).toFixed(6)
    : "0.0000";
  const totalPriceEth = mintPriceWei
    ? parseFloat(
        ethers.formatEther(
          BigInt(mintPriceWei.toString()) * BigInt(quantity ? quantity : 0)
        )
      ).toFixed(6)
    : "0.0000";

  const fetchMintedCount = async () => {
    if (!contract) return;
    try {
      const totalSupply = await contract.totalSupply();
      setCurrentSupply(Number(totalSupply));
    } catch (error) {
      console.error("Error fetching minted count:", error);
    }
  };

  // Handle minting logic
  const handleMint = async () => {
    if (!account) {
      toast({
        title: "Wallet not connected",
        status: "error",
        isClosable: true,
        duration: 2000,
      });
      return;
    }

    if (!provider) {
      toast({
        title: "No Ethereum provider",
        status: "error",
        isClosable: true,
        duration: 2000,
      });
      return;
    }

    if (!mintPriceWei) {
      toast({
        title: "Mint price not loaded",
        status: "error",
        isClosable: true,
        duration: 2000,
      });
      return;
    }

    setIsLoading(true);
    try {
      const signer = await provider.getSigner();
      const totalCost = BigInt(mintPriceWei.toString()) * BigInt(quantity);

      // Check balance
      const balance = await provider.getBalance(account);
      if (balance < totalCost) {
        toast({
          title: "Insufficient funds",
          description:
            "You don't have enough ETH to complete this mint. Please check your wallet balance.",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
        return;
      }

      const mintInstance = new ethers.Contract(
        mintContractAddress,
        WatchDogsABI,
        signer
      );

      // First check if the transaction will succeed
      try {
        await mintInstance.mint.estimateGas(quantity, {
          value: totalCost,
        });
      } catch (estimateError) {
        toast({
          title: "Insufficient funds",
          description:
            "You don't have enough ETH to complete this mint. Please check your wallet balance.",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
        return;
      }

      const loadingToast = toast({
        title: "Processing...",
        status: "loading",
        duration: null,
        isClosable: true,
      });

      const tx = await mintInstance.mint(quantity, {
        value: totalCost,
      });

      toast.close(loadingToast);
      toast({
        title: "Mint initiated",
        description: "Transaction sent to blockchain",
        status: "success",
        duration: 2000,
        isClosable: true,
      });

      // Wait for transaction confirmation in the background
      tx.wait()
        .then(() => {
          toast({
            title: "Mint confirmed!",
            description: "Transaction has been confirmed on blockchain",
            status: "success",
            duration: 5000,
            isClosable: true,
            onCloseComplete: () => {
              fetchMintedCount();
            },
          });
        })
        .catch((error: any) => {
          console.error("Transaction failed:", error);
          handleTransactionError(error);
        });
    } catch (error: any) {
      console.error("Error minting:", error);
      // check if all toasts are closed before showing new one
      toast.closeAll();

      if (
        error.code === "CALL_EXCEPTION" ||
        error.message?.includes("missing revert data") ||
        error.message?.includes("insufficient funds")
      ) {
        toast({
          title: "Insufficient funds",
          description:
            "You don't have enough ETH to complete this mint. Please check your wallet balance.",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      } else {
        handleTransactionError(error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Error handling function
  const handleTransactionError = (error: any) => {
    let title = "Mint failed";
    let description =
      "Failed to complete the transaction. Please try again later.";

    // Check if it's a CALL_EXCEPTION or insufficient funds error
    if (
      error.code === "CALL_EXCEPTION" ||
      error.message?.includes("missing revert data") ||
      error.message?.toLowerCase().includes("insufficient funds")
    ) {
      title = "Insufficient funds";
      description =
        "You don't have enough ETH to complete this mint. Please check your wallet balance.";
    } else if (
      error.code === 4001 ||
      error.code === "ACTION_REJECTED" ||
      error.message?.includes("user rejected") ||
      error.message?.includes("user rejected action")
    ) {
      title = "Transaction cancelled";
      description = "You cancelled the transaction";
    } else if (error.message?.includes("MintClosed")) {
      title = "Minting closed";
      description = "Minting is currently closed.";
    } else if (error.message?.includes("ExceedsMaxSupply")) {
      title = "Max supply exceeded";
      description =
        "Cannot mint more tokens as the maximum supply has been reached.";
    }

    toast({
      title,
      description,
      status: "error",
      duration: 5000,
      isClosable: true,
    });
  };

  // Colors for light/dark mode
  const textColor = useColorModeValue("gray.800", "white");
  const inputBg = useColorModeValue("gray.50", "rgba(255, 255, 255, 0.08)");
  const buttonBg = useColorModeValue("brand.500", "rgba(255, 255, 255, 0.08)");
  const buttonHoverBg = useColorModeValue(
    "brand.600",
    "rgba(121, 40, 202, 0.92)"
  );
  const disabledBg = useColorModeValue("gray.300", "gray.600");
  const descriptionColor = useColorModeValue("gray.600", "gray.400");
  const quantityBg = useColorModeValue("white", "rgba(255, 255, 255, 0.08)");
  const timerBgColor = useColorModeValue("purple.50", "gray.700");
  const timerTextColor = useColorModeValue("purple.800", "purple.200");

  return (
    <Box>
      {/* Hero Section */}
      <Box bgGradient={bgGradient} py={20} px={4}>
        <Container maxW="container.xl">
          <Flex
            direction={{ base: "column", lg: "row" }}
            gap={{ base: 8, lg: 16 }}
            align="center"
          >
            <Box flex="1" maxW={{ lg: "500px" }}>
              <MediaRenderer
                src={getImageUrl()}
                style={{
                  borderRadius: "12px",
                  width: "100%",
                  height: "auto",
                  aspectRatio: "1",
                }}
              />
            </Box>
            <Box flex="1">
              <Heading size="2xl" mb={6} color={textColor}>
                {contractMetadata?.title || "NFT Collection"}
              </Heading>
              <Box>
                <Text fontSize="xl" color={textColor} mb={4}>
                  Mint Price: {mintPriceEth} ETH
                </Text>

                <Box mb={6} maxW="430px">
                  <Flex justify="space-between" mb={2}>
                    <Text color={textColor}>
                      Progress: {currentSupply} / {MAX_SUPPLY}
                    </Text>
                    <Text color={textColor}>
                      {((currentSupply / MAX_SUPPLY) * 100).toFixed(1)}%
                    </Text>
                  </Flex>
                  <Progress
                    value={(currentSupply / MAX_SUPPLY) * 100}
                    size="sm"
                    colorScheme="brand"
                    borderRadius="full"
                    bg={inputBg}
                  />
                </Box>
                <Box mb={2}>
                  <Text color={textColor} mb={2}>
                    Quantity
                  </Text>
                  <NumberInput
                    defaultValue={1}
                    min={1}
                    max={1000}
                    value={quantity}
                    onChange={(_, num) => setQuantity(num)}
                    maxW="430px"
                    bg={quantityBg}
                  >
                    <NumberInputField
                      color={textColor}
                      _placeholder={{ color: "gray.500" }}
                      height="40px"
                      fontSize="14px"
                      borderRadius="6px"
                    />
                    <NumberInputStepper>
                      <NumberIncrementStepper color={textColor} />
                      <NumberDecrementStepper color={textColor} />
                    </NumberInputStepper>
                  </NumberInput>
                </Box>
                <Button
                  w={{ base: "100%", md: "430px" }}
                  size="md"
                  onClick={handleMint}
                  isLoading={isLoading}
                  loadingText="Minting..."
                  isDisabled={isMintingClosed || !account || !mintPriceWei}
                  bg={isMintingClosed ? disabledBg : buttonBg}
                  _hover={{
                    bg: isMintingClosed ? disabledBg : buttonHoverBg,
                  }}
                  height="40px"
                  borderRadius="6px"
                  fontSize="14px"
                  fontWeight="500"
                  color="white"
                  mb={2}
                >
                  {isMintingClosed
                    ? "Mint Ended"
                    : `Mint (${totalPriceEth} ETH)`}
                </Button>

                {/* Compact timer under the button */}
                {timeRemaining && !isMintingClosed ? (
                  <Box maxW="430px" mt={2}>
                    <MintTimer compact={true} />
                  </Box>
                ) : isMintingClosed ? (
                  <Box
                    maxW="430px"
                    mt={2}
                    bg="red.50"
                    color="red.800"
                    p={2}
                    borderRadius="md"
                    fontSize="xs"
                    textAlign="center"
                  >
                    <Text fontWeight="bold">Mint has ended</Text>
                  </Box>
                ) : null}
              </Box>
            </Box>
          </Flex>
        </Container>
      </Box>

      {/* Content Section */}
      <Container maxW="container.xl" py={12}>
        <Accordion allowMultiple defaultIndex={[0]}>
          {contractMetadata?.description && (
            <AccordionItem>
              <AccordionButton>
                <Box flex="1" textAlign="left">
                  <Heading size="md">Description</Heading>
                </Box>
                <AccordionIcon />
              </AccordionButton>
              <AccordionPanel pb={4}>
                <Text fontSize="lg" color={descriptionColor}>
                  {contractMetadata.description}
                </Text>
              </AccordionPanel>
            </AccordionItem>
          )}
          <NftDetails
            nft={{
              metadata: contractMetadata || {},
              id: 0n,
              type: "ERC721",
              token: {
                address: mintContractAddress,
                type: "ERC721",
              },
            }}
          />
        </Accordion>
      </Container>
    </Box>
  );
}
