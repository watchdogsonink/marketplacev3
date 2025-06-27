// ListingGrid.tsx
import {
  useBreakpointValue,
  SimpleGrid,
  Box,
  Text,
  Flex,
  useColorMode,
  Button,
  HStack,
  Icon,
  useToast,
  Slide,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Image,
  Tooltip,
  Input,
  InputGroup,
  InputLeftElement,
} from "@chakra-ui/react";
import { Link } from "@chakra-ui/next-js";
import { MediaRenderer } from "thirdweb/react";
import { formatEther, ethers } from "ethers";
import { motion } from "framer-motion";
import { client } from "@/consts/client";
import { useListingsByCollection } from "@/hooks/useMarketplaceListings";
import {
  useListingMetadata,
  type ListingMetadata,
} from "@/hooks/useListingsMetadata";
import type { Listing } from "@/hooks/useMarketplaceListings";
import { useState, useMemo, createContext, useContext, useEffect } from "react";
import {
  MdKeyboardDoubleArrowLeft,
  MdKeyboardDoubleArrowRight,
  MdSearch,
} from "react-icons/md";
import { RiArrowLeftSLine, RiArrowRightSLine } from "react-icons/ri";
import { FaPlus, FaMinus } from "react-icons/fa";
import { useWallet } from "@/hooks/useWallet";
import { MARKETPLACE_ADDRESS } from "@/consts/addresses";
import MarketplaceABI from "@/abis/MarketplaceABI.json";
import NFTABI from "@/abis/NFTABI.json";
import { SearchIcon } from "@chakra-ui/icons";

const NATIVE_TOKEN_ADDRESS = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";

// Create context for NFT selection
const SelectionContext = createContext<{
  selectedListings: Listing[];
  toggleListing: (listing: Listing) => void;
  isSelected: (listing: Listing) => boolean;
}>({
  selectedListings: [],
  toggleListing: () => {},
  isSelected: () => false,
});

type ListingGridProps = {
  // onListingUpdate: () => void;
  contract: any;
};

export function ListingGrid({ contract }: ListingGridProps) {
  const { colorMode } = useColorMode();
  const [itemsPerPage] = useState<number>(20);
  const [currentPageIndex, setCurrentPageIndex] = useState<number>(0);
  const [selectedListings, setSelectedListings] = useState<Listing[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  const { account, provider } = useWallet();
  const [isBuying, setIsBuying] = useState(false);
  const [expiredListings, setExpiredListings] = useState<{
    [key: string]: boolean;
  }>({});
  const [notApprovedListings, setNotApprovedListings] = useState<{
    [key: string]: boolean;
  }>({});
  const [blacklistedListings, setBlacklistedListings] = useState<{
    [key: string]: boolean;
  }>({});

  const {
    listings: listingsInSelectedCollection,
    loading: isLoading,
    error: listingsError,
  } = useListingsByCollection(contract.toString(), 100, 0);

  // Filter active listings and apply search
  const filteredListings = useMemo(() => {
    const activeListings =
      listingsInSelectedCollection?.filter(
        (item) => item.status.toString() === "1"
      ) || [];

    // First filter if there's a search
    const searchFiltered = !searchQuery
      ? activeListings
      : activeListings.filter((listing) => {
          const tokenId = listing.tokenId.toString();
          const price = formatEther(listing.pricePerToken);
          const searchLower = searchQuery.toLowerCase();
          return tokenId.includes(searchLower) || price.includes(searchLower);
        });

    // Then sort, first active by price, then inactive
    return [...searchFiltered].sort((a, b) => {
      const isAInactive =
        blacklistedListings[a.listingId.toString()] ||
        notApprovedListings[a.listingId.toString()];
      const isBInactive =
        blacklistedListings[b.listingId.toString()] ||
        notApprovedListings[b.listingId.toString()];

      // If one is inactive and the other is active
      if (isAInactive && !isBInactive) return 1;
      if (!isAInactive && isBInactive) return -1;

      // If both are active or both inactive, sort by price
      const priceA = BigInt(a.pricePerToken.toString());
      const priceB = BigInt(b.pricePerToken.toString());
      return priceA < priceB ? -1 : priceA > priceB ? 1 : 0;
    });
  }, [
    listingsInSelectedCollection,
    searchQuery,
    blacklistedListings,
    notApprovedListings,
  ]);

  // Get current page items
  const currentPageItems = useMemo(() => {
    const start = currentPageIndex * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredListings.slice(start, end);
  }, [filteredListings, currentPageIndex, itemsPerPage]);

  // Fetch metadata for current page items
  const { metadataMap, loading: isMetadataLoading } =
    useListingMetadata(currentPageItems);

  // Function to check if the listing is from a previous owner (blacklisted)
  const checkIfBlacklisted = async (listing: Listing) => {
    try {
      const provider = new ethers.JsonRpcProvider(
        "process.env.ALCHEMY_KEY",
        57073
      );
      const nftContract = new ethers.Contract(
        listing.assetContract,
        NFTABI,
        provider
      );
      const owner = await nftContract.ownerOf(listing.tokenId);
      return owner.toLowerCase() !== listing.listingCreator.toLowerCase();
    } catch (error) {
      console.error("Error checking if blacklisted:", error);
      return false;
    }
  };

  // check which listings are blacklisted
  useEffect(() => {
    const checkBlacklistedListings = async () => {
      // Try to get from cache first
      const cacheKey = `blacklisted_${contract}`;
      const cachedData = localStorage.getItem(cacheKey);
      let blacklistedMap: { [key: string]: boolean } = {};

      if (cachedData) {
        try {
          const parsedCache = JSON.parse(cachedData);
          // Check if cache is older than 24 hours
          if (
            parsedCache.timestamp &&
            Date.now() - parsedCache.timestamp < 1000 * 60 * 60 * 24
          ) {
            blacklistedMap = parsedCache.data || {};
            setBlacklistedListings(blacklistedMap);

            // Update in the background only for new listings that are not in cache
            const uncachedListings = filteredListings.filter(
              (listing) =>
                blacklistedMap[listing.listingId.toString()] === undefined
            );

            if (uncachedListings.length > 0) {
              setTimeout(async () => {
                for (const listing of uncachedListings) {
                  const isBlacklisted = await checkIfBlacklisted(listing);
                  blacklistedMap[listing.listingId.toString()] = isBlacklisted;
                }
                setBlacklistedListings({ ...blacklistedMap });

                // Update cache
                localStorage.setItem(
                  cacheKey,
                  JSON.stringify({
                    timestamp: Date.now(),
                    data: blacklistedMap,
                  })
                );
              }, 100);
            }
            return;
          }
        } catch (e) {
          console.error("Error parsing cached blacklisted data:", e);
        }
      }

      // If no cache or cache expired, check in background
      setTimeout(async () => {
        for (const listing of filteredListings) {
          const isBlacklisted = await checkIfBlacklisted(listing);
          blacklistedMap[listing.listingId.toString()] = isBlacklisted;
        }
        setBlacklistedListings(blacklistedMap);

        localStorage.setItem(
          cacheKey,
          JSON.stringify({
            timestamp: Date.now(),
            data: blacklistedMap,
          })
        );
      }, 100);
    };

    if (filteredListings.length > 0) {
      checkBlacklistedListings();
    }
  }, [filteredListings, contract]);

  // Check if NFT is approved for sale
  const checkIfApproved = async (listing: Listing) => {
    try {
      const provider = new ethers.JsonRpcProvider(
        "process.env.ALCHEMY_KEY",
        57073
      );
      const nftContract = new ethers.Contract(
        listing.assetContract,
        NFTABI,
        provider
      );
      const isApproved = await nftContract.isApprovedForAll(
        listing.listingCreator,
        MARKETPLACE_ADDRESS
      );
      return !isApproved;
    } catch (error) {
      console.error("Error checking if approved:", error);
      return false;
    }
  };

  // Check which listings are not approved
  useEffect(() => {
    const checkNotApprovedListings = async () => {
      const cacheKey = `not_approved_${contract}`;
      const cachedData = localStorage.getItem(cacheKey);
      let notApprovedMap: { [key: string]: boolean } = {};

      if (cachedData) {
        try {
          const parsedCache = JSON.parse(cachedData);
          // Check if cache is older than 24 hours
          if (
            parsedCache.timestamp &&
            Date.now() - parsedCache.timestamp < 1000 * 60 * 60 * 24
          ) {
            notApprovedMap = parsedCache.data || {};
            setNotApprovedListings(notApprovedMap);

            // Update in the background only for new listings that are not in cache
            const uncachedListings = filteredListings.filter(
              (listing) =>
                notApprovedMap[listing.listingId.toString()] === undefined
            );

            if (uncachedListings.length > 0) {
              setTimeout(async () => {
                for (const listing of uncachedListings) {
                  const isNotApproved = await checkIfApproved(listing);
                  notApprovedMap[listing.listingId.toString()] = isNotApproved;
                }
                setNotApprovedListings({ ...notApprovedMap });

                localStorage.setItem(
                  cacheKey,
                  JSON.stringify({
                    timestamp: Date.now(),
                    data: notApprovedMap,
                  })
                );
              }, 100);
            }
            return;
          }
        } catch (e) {
          console.error("Error parsing cached not approved data:", e);
        }
      }

      // If no cache or cache expired, check in background
      setTimeout(async () => {
        for (const listing of filteredListings) {
          const isNotApproved = await checkIfApproved(listing);
          notApprovedMap[listing.listingId.toString()] = isNotApproved;
        }
        setNotApprovedListings(notApprovedMap);

        localStorage.setItem(
          cacheKey,
          JSON.stringify({
            timestamp: Date.now(),
            data: notApprovedMap,
          })
        );
      }, 100);
    };

    if (filteredListings.length > 0) {
      checkNotApprovedListings();
    }
  }, [filteredListings, contract]);

  const toggleListing = (listing: Listing) => {
    if (expiredListings[listing.listingId.toString()]) {
      return; // Don't allow selecting expired listings
    }
    setSelectedListings((prev) => {
      const isAlreadySelected = prev.some(
        (l) => l.listingId === listing.listingId
      );
      if (isAlreadySelected) {
        return prev.filter((l) => l.listingId !== listing.listingId);
      } else {
        return [...prev, listing];
      }
    });
  };

  const isSelected = (listing: Listing) => {
    return selectedListings.some((l) => l.listingId === listing.listingId);
  };

  const handleBuyMultiple = async () => {
    if (!provider || !account) {
      toast({
        title: "Wallet not connected",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsBuying(true);
    try {
      // Calculate the total value of the purchase and check the balance
      const totalValue = selectedListings.reduce(
        (sum, listing) => sum + BigInt(listing.pricePerToken.toString()),
        BigInt(0)
      );

      const balance = await provider.getBalance(account);
      if (balance < totalValue) {
        toast({
          title: "Insufficient funds",
          description:
            "You don't have enough ETH to complete this purchase. Please check your wallet balance.",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
        setIsBuying(false);
        onClose();
        return;
      }

      // Switch to the correct chain first
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
          toast({
            title: "Chain Switch Failed",
            description: "Failed to switch to the correct network",
            status: "error",
            duration: 3000,
            isClosable: true,
          });
          setIsBuying(false);
          return;
        }
      }

      const signer = await provider.getSigner();
      let successCount = 0;
      let failCount = 0;

      const marketplaceInstance = new ethers.Contract(
        MARKETPLACE_ADDRESS,
        MarketplaceABI,
        signer
      );

      // Buy all selected NFTs using the previously calculated totalValue
      for (const listing of selectedListings) {
        try {
          const tx = await marketplaceInstance.buyFromListing(
            listing.listingId,
            account,
            1,
            NATIVE_TOKEN_ADDRESS,
            listing.pricePerToken,
            { value: listing.pricePerToken }
          );
          await tx.wait();
          successCount++;
        } catch (error) {
          console.error(`Error while buying NFT ${listing.tokenId}:`, error);
          failCount++;
        }
      }

      if (successCount > 0) {
        toast({
          title: "NFTs purchased",
          description: `Successfully purchased ${successCount} NFT${
            successCount > 1 ? "s" : ""
          }${failCount > 0 ? `, but ${failCount} failed` : ""}`,
          status: "success",
          duration: 5000,
          isClosable: true,
        });
        setSelectedListings([]);
        window.location.reload();
      }
    } catch (error) {
      console.error("Error while buying NFTs:", error);
      toast({
        title: "Error",
        description: "An error occurred while buying NFTs",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsBuying(false);
      onClose();
    }
  };

  // If loading, show loading state
  if (isLoading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minH="200px"
        width="100%"
      >
        <Text fontSize="lg" color="gray.500">
          Loading listings...
        </Text>
      </Box>
    );
  }

  return (
    <SelectionContext.Provider
      value={{ selectedListings, toggleListing, isSelected }}
    >
      <Box position="relative">
        <Box mb={6}>
          <InputGroup>
            <InputLeftElement pointerEvents="none">
              <SearchIcon color="gray.300" />
            </InputLeftElement>
            <Input
              placeholder="Search by token ID or price"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPageIndex(0);
              }}
              bg={colorMode === "dark" ? "whiteAlpha.50" : "white"}
            />
          </InputGroup>
        </Box>

        {!filteredListings || filteredListings.length === 0 ? (
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            minH="200px"
            width="100%"
          >
            <Text fontSize="lg" color="gray.500">
              No NFTs found matching search criteria
            </Text>
          </Box>
        ) : (
          <>
            <SimpleGrid columns={{ base: 2, sm: 2, md: 4, lg: 5 }} spacing={6}>
              {currentPageItems.map((item) => {
                const listingIdStr = item.listingId.toString();
                const metadata = metadataMap[listingIdStr] || {};
                const isListingSelected = isSelected(item);
                const isBlacklisted = blacklistedListings[listingIdStr];
                const isExpired = expiredListings[listingIdStr];
                const isNotApproved = notApprovedListings[listingIdStr];

                return (
                  <motion.div
                    key={listingIdStr}
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                  >
                    <a
                      href={`/collection/57073/${contract}/token/${item.tokenId.toString()}`}
                      style={{ textDecoration: "none", display: "block" }}
                    >
                      <Box
                        bg={colorMode === "dark" ? "gray.800" : "white"}
                        rounded="xl"
                        overflow="hidden"
                        shadow="sm"
                        borderWidth="1px"
                        borderColor={
                          isListingSelected
                            ? "blue.500"
                            : isBlacklisted || isExpired || isNotApproved
                            ? "red.500"
                            : colorMode === "dark"
                            ? "gray.700"
                            : "gray.200"
                        }
                        transition="all 0.2s"
                        _hover={{
                          shadow: "md",
                          borderColor: isListingSelected
                            ? "blue.600"
                            : isBlacklisted || isExpired || isNotApproved
                            ? "red.600"
                            : "brand.500",
                        }}
                        position="relative"
                        opacity={
                          isBlacklisted || isExpired || isNotApproved ? 0.7 : 1
                        }
                      >
                        {isNotApproved && (
                          <Box
                            position="absolute"
                            top="0"
                            left="0"
                            right="0"
                            bottom="0"
                            bg="rgba(0,0,0,0.5)"
                            zIndex="1"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                          >
                            <Text
                              color="red.300"
                              fontWeight="bold"
                              fontSize="xl"
                              textAlign="center"
                            >
                              NOT APPROVED
                            </Text>
                          </Box>
                        )}

                        {isNotApproved && (
                          <Box
                            as="span"
                            position="absolute"
                            top="8px"
                            right="8px"
                            zIndex="10"
                            bg="red.500"
                            color="white"
                            borderRadius="full"
                            w="24px"
                            h="24px"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                            title={`⚠️ Listing not available!\n\nThis NFT is not approved\nfor trading on the marketplace.`}
                          >
                            <Box as="span" fontWeight="bold" fontSize="xs">
                              i
                            </Box>
                          </Box>
                        )}

                        {isBlacklisted && (
                          <Box
                            position="absolute"
                            top="0"
                            left="0"
                            right="0"
                            bottom="0"
                            bg="rgba(0,0,0,0.5)"
                            zIndex="1"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                          >
                            <Text
                              color="red.300"
                              fontWeight="bold"
                              fontSize="xl"
                              textAlign="center"
                              // textDecoration="line-through"
                            >
                              INACTIVE
                            </Text>
                          </Box>
                        )}

                        {isBlacklisted && (
                          <Box
                            as="span"
                            position="absolute"
                            top="8px"
                            right="8px"
                            zIndex="10"
                            bg="red.500"
                            color="white"
                            borderRadius="full"
                            w="24px"
                            h="24px"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                            title={`⚠️ Listing not available!\n\nThis listing is from a previous owner\nwho already sold this NFT on\nanother marketplace.`}
                          >
                            <Box as="span" fontWeight="bold" fontSize="xs">
                              i
                            </Box>
                          </Box>
                        )}

                        {isExpired && (
                          <Box
                            position="absolute"
                            top="0"
                            left="0"
                            right="0"
                            bottom="0"
                            bg="rgba(0,0,0,0.5)"
                            zIndex="1"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                          >
                            <Text
                              color="red.300"
                              fontWeight="bold"
                              fontSize="xl"
                              textAlign="center"
                            >
                              EXPIRED
                            </Text>
                          </Box>
                        )}

                        {isExpired && (
                          <Box
                            as="span"
                            position="absolute"
                            top="8px"
                            right="8px"
                            zIndex="10"
                            bg="red.500"
                            color="white"
                            borderRadius="full"
                            w="24px"
                            h="24px"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                            title={`⚠️ Listing not available!\n\nThe NFT is no longer approved\nfor trading on the marketplace.`}
                          >
                            <Box as="span" fontWeight="bold" fontSize="xs">
                              i
                            </Box>
                          </Box>
                        )}

                        <Box
                          position="absolute"
                          top="8px"
                          right="8px"
                          zIndex="2"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            toggleListing(item);
                          }}
                          cursor="pointer"
                          bg={isListingSelected ? "red.500" : "blue.500"}
                          color="white"
                          borderRadius="full"
                          w="24px"
                          h="24px"
                          display={
                            isBlacklisted || isExpired || isNotApproved
                              ? "none"
                              : "flex"
                          }
                          alignItems="center"
                          justifyContent="center"
                          _hover={{
                            transform: "scale(1.1)",
                          }}
                        >
                          <Icon
                            as={isListingSelected ? FaMinus : FaPlus}
                            boxSize={3}
                          />
                        </Box>

                        <Box position="relative" paddingBottom="100%">
                          <MediaRenderer
                            client={client as any}
                            src={
                              (metadata as any).image_url ||
                              (metadata as any).image ||
                              ""
                            }
                            style={{
                              position: "absolute",
                              top: 0,
                              left: 0,
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                          />
                        </Box>
                        <Box p={4}>
                          <Text
                            fontWeight="bold"
                            noOfLines={1}
                            textDecoration={
                              isBlacklisted || isExpired || isNotApproved
                                ? "line-through"
                                : undefined
                            }
                          >
                            {(metadata as any)?.metadata?.name ||
                              (metadata as any)?.name ||
                              `#${item.tokenId.toString()}`}
                          </Text>
                          <Text
                            fontSize="sm"
                            color="gray.500"
                            mb={2}
                            textDecoration={
                              isBlacklisted || isExpired || isNotApproved
                                ? "line-through"
                                : undefined
                            }
                          >
                            Token ID: #{item.tokenId.toString()}
                          </Text>
                          <Flex justify="space-between" align="center" mt={1}>
                            <Text
                              fontSize="sm"
                              color="gray.500"
                              textDecoration={
                                isBlacklisted || isExpired || isNotApproved
                                  ? "line-through"
                                  : undefined
                              }
                            >
                              Price
                            </Text>
                            <Text
                              fontSize="sm"
                              fontWeight="bold"
                              textDecoration={
                                isBlacklisted || isExpired || isNotApproved
                                  ? "line-through"
                                  : undefined
                              }
                            >
                              {formatEther(item.pricePerToken.toString())} ETH
                            </Text>
                          </Flex>
                        </Box>
                      </Box>
                    </a>
                  </motion.div>
                );
              })}
            </SimpleGrid>

            {/* Pagination controls */}
            {filteredListings.length > itemsPerPage && (
              <Flex justify="center" mt={8} gap={2}>
                <Button
                  size="sm"
                  onClick={() => setCurrentPageIndex(0)}
                  isDisabled={currentPageIndex === 0}
                >
                  <MdKeyboardDoubleArrowLeft />
                </Button>
                <Button
                  size="sm"
                  onClick={() => setCurrentPageIndex(currentPageIndex - 1)}
                  isDisabled={currentPageIndex === 0}
                >
                  <RiArrowLeftSLine />
                </Button>
                <Text alignSelf="center" mx={2}>
                  Page {currentPageIndex + 1} of{" "}
                  {Math.ceil(filteredListings.length / itemsPerPage)}
                </Text>
                <Button
                  size="sm"
                  onClick={() => setCurrentPageIndex(currentPageIndex + 1)}
                  isDisabled={
                    currentPageIndex ===
                    Math.ceil(filteredListings.length / itemsPerPage) - 1
                  }
                >
                  <RiArrowRightSLine />
                </Button>
                <Button
                  size="sm"
                  onClick={() =>
                    setCurrentPageIndex(
                      Math.ceil(filteredListings.length / itemsPerPage) - 1
                    )
                  }
                  isDisabled={
                    currentPageIndex ===
                    Math.ceil(filteredListings.length / itemsPerPage) - 1
                  }
                >
                  <MdKeyboardDoubleArrowRight />
                </Button>
              </Flex>
            )}
          </>
        )}

        {/* Slide-in bar at the bottom */}
        <Slide
          direction="bottom"
          in={selectedListings.length > 0}
          style={{ zIndex: 10 }}
        >
          <Box
            p={4}
            bg={colorMode === "dark" ? "gray.800" : "white"}
            shadow="lg"
            borderTop="1px"
            borderColor={colorMode === "dark" ? "gray.700" : "gray.200"}
          >
            <Flex justify="space-between" align="center" maxW="7xl" mx="auto">
              <Text>Selected: {selectedListings.length} NFTs</Text>
              <HStack spacing={4}>
                <Button
                  onClick={() => setSelectedListings([])}
                  variant="ghost"
                  colorScheme="red"
                  size="sm"
                >
                  Cancel
                </Button>
                <Button
                  colorScheme="brand"
                  onClick={onOpen}
                  isDisabled={selectedListings.length === 0}
                >
                  Buy {selectedListings.length} NFTs
                </Button>
              </HStack>
            </Flex>
          </Box>
        </Slide>

        {/* Modal for buying NFTs */}
        <Modal isOpen={isOpen} onClose={onClose} isCentered size="md">
          <ModalOverlay backdropFilter="blur(4px)" />
          <ModalContent
            bg={colorMode === "dark" ? "gray.800" : "white"}
            borderRadius="xl"
            mx={4}
          >
            <ModalHeader
              borderBottom="1px"
              borderColor={colorMode === "dark" ? "gray.700" : "gray.200"}
              py={4}
            >
              Buy {selectedListings.length} NFTs
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody py={6}>
              <Box maxH="400px" overflowY="auto">
                {selectedListings.map((listing) => {
                  const metadata =
                    metadataMap[listing.listingId.toString()] || {};
                  return (
                    <Flex
                      key={listing.listingId.toString()}
                      align="center"
                      justify="space-between"
                      mb={4}
                      p={3}
                      bg={colorMode === "dark" ? "gray.700" : "gray.50"}
                      borderRadius="lg"
                    >
                      <Flex align="center" gap={3}>
                        <Image
                          src={metadata.image_url || metadata.image}
                          alt={metadata.name}
                          boxSize="48px"
                          objectFit="cover"
                          borderRadius="md"
                        />
                        <Box>
                          <Text fontWeight="bold">
                            {(metadata as any)?.metadata?.name ||
                              (metadata as any)?.name ||
                              `#${listing.tokenId.toString()}`}
                          </Text>
                          <Text fontSize="sm" color="gray.500">
                            ID: #{listing.tokenId.toString()}
                          </Text>
                        </Box>
                      </Flex>
                      <Text fontWeight="semibold">
                        {formatEther(listing.pricePerToken)} ETH
                      </Text>
                    </Flex>
                  );
                })}
              </Box>
              <Flex
                justify="space-between"
                align="center"
                mt={6}
                pt={4}
                borderTop="1px"
                borderColor={colorMode === "dark" ? "gray.700" : "gray.200"}
              >
                <Text fontWeight="bold">Total</Text>
                <Text fontSize="lg" fontWeight="bold">
                  {formatEther(
                    selectedListings.reduce(
                      (sum, listing) =>
                        sum + BigInt(listing.pricePerToken.toString()),
                      BigInt(0)
                    )
                  )}{" "}
                  ETH
                </Text>
              </Flex>
            </ModalBody>

            <ModalFooter
              borderTop="1px"
              borderColor={colorMode === "dark" ? "gray.700" : "gray.200"}
              py={4}
            >
              <Button variant="ghost" mr={3} onClick={onClose}>
                Cancel
              </Button>
              <Button
                colorScheme="brand"
                onClick={handleBuyMultiple}
                isLoading={isBuying}
                loadingText="Buying..."
                minW="120px"
              >
                Buy NFTs
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </Box>
    </SelectionContext.Provider>
  );
}
