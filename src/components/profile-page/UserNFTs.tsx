import {
  Box,
  Center,
  SimpleGrid,
  Text,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  useColorMode,
  Flex,
  Image,
  HStack,
  Button,
  Checkbox,
  Slide,
  SlideDirection,
  SlideFade,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  VStack,
  useToast,
  Icon,
  InputGroup,
  InputRightAddon,
  IconButton,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Spinner,
  useColorModeValue,
} from "@chakra-ui/react";
import { useState, useEffect, useMemo, createContext, useContext } from "react";
import { Link } from "@chakra-ui/next-js";
import { motion } from "framer-motion";
import { useReadContract } from "thirdweb/react";
import { getContract } from "thirdweb";
import { NFT_CONTRACTS } from "@/consts/nft_contracts";
import { client } from "@/consts/client";
import { MediaRenderer } from "thirdweb/react";
import { getOwnedERC721s } from "@/extensions/getOwnedERC721s";
import { getOwnedERC1155s } from "@/extensions/getOwnedERC1155s";
import { NFTGrid } from "@/components/shared/NFTGrid";
import { useListingsByCollection } from "@/hooks/useMarketplaceListings";
import { useListingMetadata } from "@/hooks/useListingsMetadata";
import { formatEther, formatUnits, ethers } from "ethers";
import { fetchNFTExternal } from "@/hooks/useReadNFT";
import { useSearchParams } from "next/navigation";
import { UseQueryResult } from "@tanstack/react-query";
import { useWallet } from "@/hooks/useWallet";
import { FaEthereum, FaPlus, FaMinus, FaStore } from "react-icons/fa";
import { useENS } from "@/hooks/useENS";
import NFTABI from "@/abis/NFTABI.json";
import MarketplaceABI from "@/abis/MarketplaceABI.json";
import { MARKETPLACE_ADDRESS } from "@/consts/addresses";
import { NFTData } from "@/types/nft";
import { useZNS } from "@/hooks/useZNS";

const NATIVE_TOKEN_ADDRESS = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";

// Create context for NFT selection
const SelectionContext = createContext<{
  isSelectionMode: boolean;
  selectedNfts: any[];
  toggleNft: (nft: any) => void;
  isSelected: (nft: any) => boolean;
}>({
  isSelectionMode: false,
  selectedNfts: [],
  toggleNft: () => {},
  isSelected: () => false,
});

function UserListingGrid({ listings }: { listings: any[] }) {
  const { colorMode } = useColorMode();
  const { account } = useWallet();
  const { metadataMap, loading: isMetadataLoading } =
    useListingMetadata(listings);

  if (isMetadataLoading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minH="200px"
        width="100%"
        gridColumn="1/-1"
      >
        <Text fontSize="lg" color="gray.500">
          Loading metadata...
        </Text>
      </Box>
    );
  }

  return (
    <SimpleGrid columns={{ base: 2, sm: 2, md: 4, lg: 5 }} spacing={6}>
      {listings.map((listing) => {
        const listingIdStr = listing.listingId.toString();
        const metadata = metadataMap[listingIdStr] || {};
        const collection = NFT_CONTRACTS.find(
          (c) => c.address.toLowerCase() === listing.assetContract.toLowerCase()
        );
        const isOwnListing =
          listing.listingCreator?.toLowerCase() === account?.toLowerCase();

        // Check if listing is expired
        const currentTime = Math.floor(Date.now() / 1000);
        const isExpired = Number(listing.endTimestamp) < currentTime;
        const isStillActive = Number(listing.status) === 1;
        const showExpired = isExpired && isStillActive;

        return (
          <motion.div
            key={listingIdStr}
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            <Link
              href={`/collection/57073/${
                collection?.address
              }/token/${listing.tokenId.toString()}`}
              _hover={{ textDecoration: "none" }}
            >
              <Box
                bg={colorMode === "dark" ? "gray.800" : "white"}
                rounded="xl"
                overflow="hidden"
                shadow="sm"
                borderWidth="1px"
                borderColor={colorMode === "dark" ? "gray.700" : "gray.200"}
                transition="all 0.2s"
                _hover={{
                  shadow: "md",
                  borderColor: "brand.500",
                }}
                filter={showExpired ? "grayscale(100%)" : "none"}
                opacity={showExpired ? 0.7 : 1}
              >
                <Box position="relative" paddingBottom="100%">
                  {showExpired && (
                    <Box
                      position="absolute"
                      top={2}
                      right={2}
                      bg="red.500"
                      color="white"
                      px={2}
                      py={1}
                      borderRadius="md"
                      fontSize="xs"
                      fontWeight="bold"
                      zIndex={2}
                    >
                      EXPIRED
                    </Box>
                  )}
                  <MediaRenderer
                    client={client as any}
                    src={metadata.image_url || metadata.image || ""}
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
                  <Text fontWeight="bold" noOfLines={1}>
                    {metadata.name || `#${listing.tokenId.toString()}`}
                  </Text>
                  <Text fontSize="sm" color="gray.500" mb={2}>
                    Token ID: #{listing.tokenId.toString()}
                  </Text>
                  <Flex justify="space-between" align="center">
                    <Text fontSize="sm" color="gray.500">
                      Price
                    </Text>
                    <HStack spacing={1} width="100%" justify="flex-end">
                      <Text fontWeight="bold">
                        {formatUnits(listing.pricePerToken, 18)} ETH
                      </Text>
                    </HStack>
                  </Flex>
                </Box>
              </Box>
            </Link>
          </motion.div>
        );
      })}
    </SimpleGrid>
  );
}

interface NFTPriceData {
  tokenId: string;
  price: string;
}

export function UserNFTGrid({
  nfts,
  listedNfts,
}: {
  nfts: any[];
  listedNfts: Set<string>;
}) {
  const { colorMode } = useColorMode();
  const { account } = useWallet();
  const { isSelectionMode, toggleNft, isSelected } =
    useContext(SelectionContext);
  const [nftPrices, setNftPrices] = useState<Record<string, string>>({});
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  const [isCreatingListings, setIsCreatingListings] = useState(false);

  // existing functions
  const isOwnNFT = (nft: any) => {
    if (!account) return false;

    // Handle ZNS NFT
    if (
      nft.collection?.address?.toLowerCase() ===
      "0xfb2cd41a8aec89efbb19575c6c48d872ce97a0a5".toLowerCase()
    ) {
      return nft.owner?.toLowerCase() === account.toLowerCase();
    }

    // Handle raw NFT from getOwnedERC721s (before metadata is added)
    if (typeof nft.owner === "string") {
      return nft.owner.toLowerCase() === account.toLowerCase();
    }

    // Handle NFT with metadata
    const ownerHash = nft?.owner?.hash;
    if (ownerHash && typeof ownerHash === "string") {
      return ownerHash.toLowerCase() === account.toLowerCase();
    }

    return false;
  };

  const isNftListed = (nft: any) => {
    const nftId = `${nft.collection.address.toLowerCase()}-${nft.id}`;
    return listedNfts.has(nftId);
  };
  const handleSelectionClick = (e: React.MouseEvent, nft: any) => {
    e.preventDefault();
    e.stopPropagation();
    toggleNft(nft);
  };

  // New functions to handle prices
  const handlePriceChange = (nftId: string, price: string) => {
    setNftPrices((prev) => ({
      ...prev,
      [nftId]: price,
    }));
  };

  const handleListAll = async () => {
    const selectedNftIds = nfts
      .filter((nft) => isSelected(nft))
      .map((nft) => nft.id.toString());

    const allPricesSet = selectedNftIds.every(
      (nftId) => nftPrices[nftId] && parseFloat(nftPrices[nftId]) > 0
    );

    if (!allPricesSet) {
      toast({
        title: "Prices not set",
        description: "Please set prices for all NFTs",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      // Implement listing of NFTs
      for (const nftId of selectedNftIds) {
        const price = nftPrices[nftId];
        // Add the correct implementation of listing NFT
        console.log(`Listing NFT ${nftId} for ${price} ETH`);
      }

      toast({
        title: "NFT listed successfully",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      onClose();
      setNftPrices({});
    } catch (error) {
      console.error("Error listing NFTs:", error);
      toast({
        title: "Error listing NFTs",
        description: error instanceof Error ? error.message : "Unknown error",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <>
      <SimpleGrid columns={{ base: 2, sm: 2, md: 4, lg: 5 }} spacing={6}>
        {nfts.map((nft) => {
          const nftId = `${nft.collection.address.toLowerCase()}-${nft.id}`;
          const isListed = isNftListed(nft);
          const isOwned = isOwnNFT(nft);
          const canTransfer = isOwned && !isListed;
          const isNftSelected = isSelected(nft);

          return (
            <motion.div
              key={nftId}
              whileHover={{ scale: isListed ? 1.0 : 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <Link
                href={`/collection/57073/${nft.collection.address}/token/${nft.id}`}
                _hover={{ textDecoration: "none" }}
              >
                <Box
                  bg={colorMode === "dark" ? "gray.800" : "white"}
                  rounded="xl"
                  overflow="hidden"
                  shadow="sm"
                  borderWidth="1px"
                  borderColor={
                    isNftSelected
                      ? "blue.500"
                      : colorMode === "dark"
                      ? "gray.700"
                      : "gray.200"
                  }
                  transition="all 0.2s"
                  opacity={isListed ? 0.6 : 1}
                  _hover={{
                    shadow: "md",
                    borderColor: isNftSelected ? "blue.600" : "brand.500",
                  }}
                  position="relative"
                  height="100%"
                >
                  {isListed && (
                    <Box
                      position="absolute"
                      top="8px"
                      right="8px"
                      bg="brand.500"
                      color="white"
                      px="2"
                      py="1"
                      borderRadius="md"
                      fontSize="xs"
                      fontWeight="bold"
                      zIndex="1"
                    >
                      Listed
                    </Box>
                  )}

                  {canTransfer && (
                    <Box
                      position="absolute"
                      top="8px"
                      right="8px"
                      zIndex="1"
                      onClick={(e) => handleSelectionClick(e, nft)}
                      cursor="pointer"
                      bg={isNftSelected ? "red.500" : "blue.500"}
                      color="white"
                      borderRadius="full"
                      w="24px"
                      h="24px"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      _hover={{
                        transform: "scale(1.1)",
                      }}
                    >
                      <Icon as={isNftSelected ? FaMinus : FaPlus} boxSize={3} />
                    </Box>
                  )}

                  <Box position="relative" paddingBottom="100%">
                    <Image
                      src={
                        nft?.image_url ||
                        nft?.image ||
                        nft?.metadata?.image_url ||
                        nft?.metadata?.image ||
                        ""
                      }
                      alt={nft?.metadata?.name || `NFT #${nft?.id}`}
                      position="absolute"
                      top="0"
                      left="0"
                      width="100%"
                      height="100%"
                      objectFit="cover"
                    />
                  </Box>
                  <Box p={4}>
                    <Text fontWeight="bold" noOfLines={1}>
                      {nft.metadata?.name || `#${nft.id}`}
                    </Text>
                    <Text fontSize="sm" color="gray.500" mb={2}>
                      Token ID: #{nft.id}
                    </Text>
                    <Flex justify="space-between" align="center">
                      <Text fontSize="sm" color="gray.500" noOfLines={1}>
                        {nft.collection.title}
                      </Text>
                    </Flex>
                  </Box>
                </Box>
              </Link>
            </motion.div>
          );
        })}
      </SimpleGrid>

      {/* Slide-in bar at the bottom */}
      <Slide
        direction="bottom"
        in={nfts.some((nft) => isSelected(nft))}
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
            <Text>
              Selected: {nfts.filter((nft) => isSelected(nft)).length} NFT
            </Text>
            <HStack spacing={4}>
              <Button
                onClick={() => {
                  nfts.forEach((nft) => {
                    if (isSelected(nft)) {
                      toggleNft(nft);
                    }
                  });
                }}
              >
                Cancel
              </Button>
              <Button colorScheme="brand" onClick={onOpen}>
                List {nfts.filter((nft) => isSelected(nft)).length} NFT
              </Button>
            </HStack>
          </Flex>
        </Box>
      </Slide>

      {/* Modal with prices */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Set prices for NFTs</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>NFT ID</Th>
                  <Th>Price</Th>
                </Tr>
              </Thead>
              <Tbody>
                {nfts
                  .filter((nft) => isSelected(nft))
                  .map((nft) => (
                    <Tr key={nft.id}>
                      <Td>#{nft.id}</Td>
                      <Td>
                        <Box position="relative">
                          <Input
                            type="number"
                            step="0.000001"
                            min="0"
                            placeholder="0.00"
                            value={nftPrices[nft.id] || ""}
                            onChange={(e) =>
                              handlePriceChange(nft.id, e.target.value)
                            }
                            borderRadius="md"
                            borderRightRadius={{ base: "md", md: "0" }}
                          />
                          <Text
                            display={{ base: "block", md: "none" }}
                            fontSize="sm"
                            color="gray.500"
                            textAlign="right"
                            mt={1}
                          >
                            ETH
                          </Text>
                          <Box
                            display={{ base: "none", md: "block" }}
                            position="absolute"
                            top={0}
                            right={0}
                            height="100%"
                            borderLeft="1px"
                            borderColor="inherit"
                            px={3}
                            bg={useColorModeValue("gray.100", "gray.600")}
                            borderRightRadius="md"
                            lineHeight="40px"
                          >
                            ETH
                          </Box>
                        </Box>
                      </Td>
                    </Tr>
                  ))}
              </Tbody>
            </Table>
            <Flex justify="flex-end" mt={6}>
              <Button colorScheme="brand" onClick={handleListAll}>
                List all
              </Button>
            </Flex>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
}

// Add function to stop navigation when button is clicked
const handleTransferClick = (e: React.MouseEvent) => {
  e.preventDefault();
  e.stopPropagation();
};

// Add ENS provider at the top of the component
const ensProvider = new ethers.JsonRpcProvider(
  "https://eth-mainnet.g.alchemy.com/v2/process.env.ALCHEMY_KEY"
);

export function UserNFTs({ address }: { address: string }) {
  const { colorMode } = useColorMode();
  const searchParams = useSearchParams();
  const defaultTab = searchParams.get("tab") === "listings" ? 0 : 1;
  const [tabIndex, setTabIndex] = useState(defaultTab);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedNfts, setSelectedNfts] = useState<any[]>([]);
  const [recipientAddress, setRecipientAddress] = useState("");
  const [isTransferring, setIsTransferring] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  const { ensName } = useENS(recipientAddress);
  const { znsName } = useZNS(recipientAddress);
  const { account, provider } = useWallet();
  const [isListingModalOpen, setIsListingModalOpen] = useState(false);
  const [listingPrice, setListingPrice] = useState("");
  const [isCreatingListings, setIsCreatingListings] = useState(false);
  const [nftPrices, setNftPrices] = useState<{ [key: string]: string }>({});
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [forceLoading, setForceLoading] = useState(true);

  const handlePriceChange = (nftId: string, price: string) => {
    setNftPrices((prev) => ({
      ...prev,
      [nftId]: price,
    }));
  };

  // --- Listings ---
  const listingsResults = NFT_CONTRACTS.filter(
    (collection) => collection.address && collection.address !== "null"
  ).map((collection) => useListingsByCollection(collection.address, 1000, 0));

  const allListings = listingsResults.flatMap(
    (result) => result.listings || []
  );
  const loadingListings = listingsResults.some((result) => result.loading);
  const errorListings = listingsResults.find((result) => result.error)?.error;
  const userListings = allListings.filter(
    (listing) =>
      listing.listingCreator.toLowerCase() === address.toLowerCase() &&
      +listing.status.toString() === 1
  );

  // create a Set to store the identifiers of listed NFTs for easy checking
  const listedNftIds = useMemo(() => {
    const ids = new Set<string>();
    userListings.forEach((listing) => {
      const id = `${listing.assetContract.toLowerCase()}-${listing.tokenId.toString()}`;
      ids.add(id);
    });
    return ids;
  }, [userListings]);

  // --- Get user NFTs ---
  const nftResults = NFT_CONTRACTS.filter(
    (collection) => collection.address && collection.address !== "null"
  ).map((collection) => {
    const contract = getContract({
      address: collection.address,
      chain: collection.chain,
      client: client as any,
    });

    const result = useReadContract(
      collection.type === "ERC1155" ? getOwnedERC1155s : getOwnedERC721s,
      {
        contract,
        owner: address,
      }
    ) as UseQueryResult<any> & { loading: boolean };

    return {
      collection,
      nfts: result.data,
      loadingNFTs: result.loading,
      errorNFTs: result.error,
    };
  });

  const [allNFTs, setAllNFTs] = useState<any[]>([]);

  // Calculate dependencies: whether all hooks have finished loading and how many NFTs we have
  const allLoaded = nftResults.every((r) => !r.loadingNFTs);
  const nftCounts = nftResults
    .map((r) => (r.nfts ? r.nfts.length : 0))
    .join(",");

  useEffect(() => {
    // Force minimum 2.5 seconds of spinner
    const timer = setTimeout(() => {
      setForceLoading(false);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    async function fetchAllNFTs() {
      let results: any[] = [];

      try {
        // Group NFTs by collection for optimized loading
        const nftsByCollection = nftResults.reduce(
          (acc, { collection, nfts }) => {
            if (nfts && nfts.length > 0) {
              acc.push({ collection, nfts });
            }
            return acc;
          },
          [] as { collection: any; nfts: any[] }[]
        );

        // Load NFTs in parallel for each collection
        const collectionPromises = nftsByCollection.map(
          async ({ collection, nfts }) => {
            try {
              // Load metadata in batches of 10 NFTs for better performance
              const batchSize = 10;
              const batches = [];

              for (let i = 0; i < nfts.length; i += batchSize) {
                const batch = nfts.slice(i, i + batchSize);
                batches.push(batch);
              }

              const batchResults = await Promise.all(
                batches.map(async (batch) => {
                  const nftPromises = batch.map((nft: any) => {
                    // Special handling for ZNS NFTs
                    if (
                      collection.address.toLowerCase() ===
                      "0xfb2cd41a8aec89efbb19575c6c48d872ce97a0a5".toLowerCase()
                    ) {
                      const domainName = nft.domain;
                      const tokenId = nft.id;
                      return {
                        animation_url: null,
                        external_app_url: null,
                        id: tokenId,
                        image_url: "/zns/zns.webp",
                        is_unique: true,
                        media_type: null,
                        media_url: "/zns/zns.webp",
                        metadata: {
                          attributes: [
                            {
                              trait_type: "Domain",
                              value: `${domainName}.ink`,
                            },
                          ],
                          description: "ZNS Domain Names on Ink",
                          image: "/zns/zns.webp",
                          name: `${domainName}.ink`,
                        },
                        owner: address,
                        collection: {
                          address: collection.address,
                          title: "ZNS Domain Names",
                          chain: {
                            id: 57073,
                          },
                        },
                      };
                    }
                    // Regular NFT handling
                    return fetchNFTExternal(
                      collection.address,
                      nft?.id?.toString()
                    );
                  });
                  return Promise.all(nftPromises);
                })
              );

              // Combine results from all batches
              const nftWithMeta = batchResults.flat().map((nft: any) => ({
                ...nft,
                collection,
              }));

              return nftWithMeta;
            } catch (err) {
              console.error(
                `Error fetching NFTs for collection ${collection.address}:`,
                err
              );
              return [];
            }
          }
        );

        const collectionsResults = await Promise.all(collectionPromises);
        results = collectionsResults.flat();

        // Update state only if the component is still mounted
        setAllNFTs(results);
      } catch (err) {
        console.error("Error fetching NFT metadata:", err);
        setAllNFTs([]);
      } finally {
        setIsInitialLoading(false);
      }
    }

    if (allLoaded && nftCounts !== "") {
      fetchAllNFTs();
    }
  }, [allLoaded, nftCounts]);

  // Add function to check if NFT is listed
  const isNftListed = (nft: any) => {
    return userListings.some(
      (listing) =>
        listing.assetContract.toLowerCase() ===
          nft.collection.address.toLowerCase() &&
        listing.tokenId.toString() === nft.id.toString() &&
        +listing.status.toString() === 1
    );
  };

  // Add function to handle transfer
  const handleTransfer = (nft: any) => {
    // You can add transfer logic here
    console.log("Transfer NFT:", nft);
  };

  // Function to select NFT
  const toggleNft = (nft: any) => {
    if (
      selectedNfts.some(
        (selected) =>
          selected.id === nft.id &&
          selected.collection.address === nft.collection.address
      )
    ) {
      setSelectedNfts(
        selectedNfts.filter(
          (selected) =>
            !(
              selected.id === nft.id &&
              selected.collection.address === nft.collection.address
            )
        )
      );
    } else {
      setSelectedNfts([...selectedNfts, nft]);
    }
  };

  // Function to check if NFT is selected
  const isSelected = (nft: any) => {
    return selectedNfts.some(
      (selected) =>
        selected.id === nft.id &&
        selected.collection.address === nft.collection.address
    );
  };

  // Handle multiple NFT transfer
  const handleTransferNfts = async () => {
    if (!provider || !account) {
      toast({
        title: "Wallet not connected",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    let targetAddress = recipientAddress;

    // Resolve ENS or ZNS domains
    try {
      if (recipientAddress.endsWith(".eth")) {
        const resolvedENS = await ensProvider.resolveName(recipientAddress);
        if (!resolvedENS) {
          throw new Error("Could not resolve ENS name");
        }
        targetAddress = resolvedENS;
      } else if (recipientAddress.endsWith(".ink")) {
        const response = await fetch(
          `https://zns.bio/api/resolveDomain?chain=57073&domain=${recipientAddress.replace(
            ".ink",
            ""
          )}`
        );
        const data = await response.json();
        if (data.code !== 200 || !data.address) {
          throw new Error("Could not resolve ZNS name");
        }
        targetAddress = data.address;
      }
    } catch (error) {
      console.error("Domain resolution error:", error);
      toast({
        title: "Domain Resolution Error",
        description:
          "Could not resolve domain name. Please use a valid address, ENS, or ZNS domain.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    // Check if the address is valid
    if (!ethers.isAddress(targetAddress)) {
      toast({
        title: "Invalid address",
        description: "Please enter a valid address, ENS, or ZNS domain",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (selectedNfts.length === 0) {
      toast({
        title: "No NFTs selected",
        description: "Please select at least one NFT to transfer",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsTransferring(true);
    const signer = await provider.getSigner();
    let successCount = 0;
    let failCount = 0;

    for (const nft of selectedNfts) {
      try {
        const nftContract = new ethers.Contract(
          nft.collection.address,
          NFTABI,
          signer
        );
        const tx = await nftContract.transferFrom(
          account,
          targetAddress,
          nft.id
        );
        await tx.wait();
        successCount++;
      } catch (error) {
        console.error(`Error transferring NFT ${nft.id}:`, error);
        failCount++;
      }
    }

    setIsTransferring(false);
    onClose();

    if (successCount > 0) {
      toast({
        title: "Transfer successful",
        description: `Successfully transferred ${successCount} NFT${
          successCount > 1 ? "s" : ""
        }${failCount > 0 ? `, but ${failCount} failed` : ""}`,
        status: "success",
        duration: 5000,
        isClosable: true,
      });

      // Refresh the list of NFTs
      setSelectedNfts([]);
      setIsSelectionMode(false);
      window.location.reload();
    } else if (failCount > 0) {
      toast({
        title: "Transfer failed",
        description: `Failed to transfer ${failCount} NFT${
          failCount > 1 ? "s" : ""
        }`,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Add function to create multiple listings
  const handleCreateMultipleListings = async () => {
    if (!provider || !account) {
      toast({
        title: "Wallet not connected",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    // Check if all NFTs have prices set
    const missingPrices = selectedNfts.some(
      (nft) => !nftPrices[nft.id] || parseFloat(nftPrices[nft.id]) <= 0
    );
    if (missingPrices) {
      toast({
        title: "Missing prices",
        description: "Set price for all selected NFTs",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsCreatingListings(true);
    const signer = await provider.getSigner();
    let successCount = 0;
    let failCount = 0;

    try {
      // First check and set approvals for all contracts
      const approvalPromises = [
        ...new Set(selectedNfts.map((nft) => nft.collection.address)),
      ].map(async (contractAddress) => {
        const nftContract = new ethers.Contract(
          contractAddress,
          NFTABI,
          signer
        );
        const isApproved = await nftContract.isApprovedForAll(
          account,
          MARKETPLACE_ADDRESS
        );
        if (!isApproved) {
          const tx = await nftContract.setApprovalForAll(
            MARKETPLACE_ADDRESS,
            true
          );
          await tx.wait();
        }
      });

      await Promise.all(approvalPromises);

      // Now create listings with individual prices
      for (const nft of selectedNfts) {
        try {
          const marketplaceInstance = new ethers.Contract(
            MARKETPLACE_ADDRESS,
            MarketplaceABI,
            signer
          );

          const listingParams = {
            assetContract: nft.collection.address,
            tokenId: nft.id,
            quantity: 1,
            currency: NATIVE_TOKEN_ADDRESS,
            pricePerToken: ethers.parseUnits(nftPrices[nft.id], "ether"),
            startTimestamp: Math.floor(Date.now() / 1000),
            endTimestamp: Math.floor(Date.now() / 1000) + 31536000, // 365 days (1 year)
            reserved: false,
          };

          const tx = await marketplaceInstance.createListing(listingParams);
          await tx.wait();
          successCount++;
        } catch (error) {
          console.error(`Error listing NFT ${nft.id}:`, error);
          failCount++;
        }
      }

      if (successCount > 0) {
        toast({
          title: "NFT listed",
          description: `Successfully listed ${successCount} NFT${
            successCount > 1 ? "" : ""
          }${failCount > 0 ? `, but ${failCount} failed` : ""}`,
          status: "success",
          duration: 5000,
          isClosable: true,
        });
        setSelectedNfts([]);
        setNftPrices({});
        window.location.reload();
      }
    } catch (error) {
      console.error("Error listing NFT:", error);
      toast({
        title: "Error",
        description: "An error occurred while listing NFT",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsCreatingListings(false);
      setIsListingModalOpen(false);
    }
  };

  return (
    <Box mb={8} position="relative">
      <SelectionContext.Provider
        value={{ isSelectionMode: true, selectedNfts, toggleNft, isSelected }}
      >
        <Tabs
          variant="unstyled"
          mx="auto"
          onChange={(index) => setTabIndex(index)}
          defaultIndex={defaultTab}
          isLazy
        >
          <TabList
            mb={0}
            p={4}
            borderRadius="md"
            display="inline-flex"
            gap={1}
            width="100%"
            maxW="320px"
          >
            <Tab
              flex="1"
              px={2}
              py={2}
              borderRadius="md"
              border="1px"
              borderColor={colorMode === "dark" ? "gray.700" : "gray.200"}
              _selected={{
                color: "white",
                bg: "brand.500",
                boxShadow: "sm",
                borderColor: "brand.500",
              }}
              _hover={{
                bg: colorMode === "dark" ? "gray.700" : "gray.200",
                color: colorMode === "dark" ? "white" : "gray.700",
              }}
              transition="all 0.2s"
            >
              Active listings ({userListings?.length || 0})
            </Tab>
            <Tab
              flex="1"
              px={2}
              py={2}
              borderRadius="md"
              border="1px"
              borderColor={colorMode === "dark" ? "gray.700" : "gray.200"}
              _selected={{
                color: "white",
                bg: "brand.500",
                boxShadow: "sm",
                borderColor: "brand.500",
              }}
              _hover={{
                bg: colorMode === "dark" ? "gray.700" : "gray.200",
                color: colorMode === "dark" ? "white" : "gray.700",
              }}
              transition="all 0.2s"
            >
              All items ({allNFTs.length})
            </Tab>
          </TabList>

          <TabPanels>
            <TabPanel>
              {loadingListings ? (
                <Center minH="200px">
                  <VStack spacing={4}>
                    <Spinner
                      size="xl"
                      color="brand.500"
                      thickness="4px"
                      speed="0.65s"
                    />
                    <Text color="gray.500">Loading active listings...</Text>
                  </VStack>
                </Center>
              ) : errorListings ? (
                <Center>
                  <Text color="red.500">Error loading listings</Text>
                </Center>
              ) : userListings && userListings.length > 0 ? (
                <UserListingGrid listings={userListings} />
              ) : (
                <Box
                  display="flex"
                  justifyContent="center"
                  alignItems="center"
                  minH="200px"
                  width="100%"
                  gridColumn="1/-1"
                >
                  <Text fontSize="lg" color="gray.500">
                    No active listings
                  </Text>
                </Box>
              )}
            </TabPanel>
            <TabPanel>
              {forceLoading ||
              isInitialLoading ||
              !allLoaded ||
              nftResults.some((r) => r.loadingNFTs) ? (
                <Center minH="200px">
                  <VStack spacing={4}>
                    <Spinner
                      size="xl"
                      color="brand.500"
                      thickness="4px"
                      speed="0.65s"
                    />
                    <Text color="gray.500">Loading NFT collections...</Text>
                    <Text fontSize="sm" color="gray.400">
                      This may take a few seconds
                    </Text>
                  </VStack>
                </Center>
              ) : !isInitialLoading && allNFTs && allNFTs.length > 0 ? (
                <UserNFTGrid nfts={allNFTs} listedNfts={listedNftIds} />
              ) : !isInitialLoading && allLoaded ? (
                <Box
                  display="flex"
                  justifyContent="center"
                  alignItems="center"
                  minH="200px"
                  width="100%"
                  gridColumn="1/-1"
                >
                  <Text fontSize="lg" color="gray.500">
                    No NFTs found in this wallet
                  </Text>
                </Box>
              ) : null}
            </TabPanel>
          </TabPanels>
        </Tabs>

        {/* Floating bar at the bottom */}
        <Box
          position="fixed"
          bottom={0}
          left={0}
          right={0}
          bg={
            useColorMode().colorMode === "dark"
              ? "rgba(26, 32, 44, 0.8)"
              : "rgba(255, 255, 255, 0.8)"
          }
          backdropFilter="blur(10px)"
          boxShadow="0 -4px 6px -1px rgba(0, 0, 0, 0.1), 0 -2px 4px -1px rgba(0, 0, 0, 0.06)"
          p={4}
          zIndex={1000}
          borderTopWidth="1px"
          borderTopColor={
            useColorMode().colorMode === "dark" ? "gray.700" : "gray.200"
          }
          transform={`translateY(${selectedNfts.length > 0 ? "0" : "100%"})`}
          transition="transform 0.3s ease-in-out"
        >
          <Flex
            justify="space-between"
            align="center"
            maxW="container.xl"
            mx="auto"
          >
            <HStack>
              <Text>Selected: {selectedNfts.length} items</Text>
              <Button
                variant="ghost"
                colorScheme="red"
                onClick={() => setSelectedNfts([])}
                size="sm"
              >
                Cancel all
              </Button>
            </HStack>
            <HStack spacing={4}>
              <Button
                colorScheme="purple"
                onClick={() => setIsListingModalOpen(true)}
                isDisabled={selectedNfts.length === 0}
                leftIcon={<FaStore />}
              >
                List {selectedNfts.length} NFTs
              </Button>
              <Button
                colorScheme="blue"
                onClick={onOpen}
                isDisabled={selectedNfts.length === 0}
              >
                Transfer {selectedNfts.length} NFTs
              </Button>
            </HStack>
          </Flex>
        </Box>

        {/* Modal for listing multiple NFTs */}
        <Modal
          isOpen={isListingModalOpen}
          onClose={() => {
            setIsListingModalOpen(false);
            setNftPrices({});
          }}
          isCentered
          size="xl"
        >
          <ModalOverlay backdropFilter="blur(10px)" />
          <ModalContent
            bg={colorMode === "dark" ? "gray.800" : "white"}
            borderRadius="xl"
            boxShadow="xl"
          >
            <ModalHeader
              borderBottomWidth="1px"
              borderColor={colorMode === "dark" ? "gray.700" : "gray.200"}
            >
              List {selectedNfts.length} NFTs for sale
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody py={6}>
              <VStack spacing={4} align="stretch">
                <Table variant="simple">
                  <Thead>
                    <Tr>
                      <Th pl={4}>NFT</Th>
                      <Th>ID</Th>
                      <Th>Price (ETH)</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {selectedNfts.map((nft) => (
                      <Tr key={nft.id}>
                        <Td pl={4}>
                          <HStack spacing={3}>
                            <Image
                              src={nft?.image_url || nft?.metadata?.image}
                              alt={nft?.metadata?.name}
                              boxSize="48px"
                              objectFit="cover"
                              borderRadius="md"
                            />
                            <Text fontWeight="medium" noOfLines={1}>
                              {nft?.metadata?.name || `NFT #${nft.id}`}
                            </Text>
                          </HStack>
                        </Td>
                        <Td>#{nft.id}</Td>
                        <Td>
                          <Box position="relative">
                            <Input
                              type="number"
                              step="0.000001"
                              min="0"
                              placeholder="0.00"
                              value={nftPrices[nft.id] || ""}
                              onChange={(e) =>
                                handlePriceChange(nft.id, e.target.value)
                              }
                              borderRadius="md"
                              borderRightRadius={{ base: "md", md: "0" }}
                            />
                            <Text
                              display={{ base: "block", md: "none" }}
                              fontSize="sm"
                              color="gray.500"
                              textAlign="right"
                              mt={1}
                            >
                              ETH
                            </Text>
                            <Box
                              display={{ base: "none", md: "block" }}
                              position="absolute"
                              top={0}
                              right={0}
                              height="100%"
                              borderLeft="1px"
                              borderColor="inherit"
                              px={3}
                              bg={useColorModeValue("gray.100", "gray.600")}
                              borderRightRadius="md"
                              lineHeight="40px"
                            >
                              ETH
                            </Box>
                          </Box>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </VStack>
            </ModalBody>

            <ModalFooter
              borderTopWidth="1px"
              borderColor={colorMode === "dark" ? "gray.700" : "gray.200"}
            >
              <Button
                variant="ghost"
                mr={3}
                onClick={() => {
                  setIsListingModalOpen(false);
                  setNftPrices({});
                }}
              >
                Cancel
              </Button>
              <Button
                colorScheme="brand"
                onClick={handleCreateMultipleListings}
                isLoading={isCreatingListings}
                loadingText="Listing..."
              >
                List NFTs
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* Transfer modal */}
        <Modal isOpen={isOpen} onClose={onClose} isCentered>
          <ModalOverlay backdropFilter="blur(10px)" />
          <ModalContent
            bg={colorMode === "dark" ? "gray.800" : "white"}
            borderRadius="xl"
            boxShadow="xl"
          >
            <ModalHeader
              borderBottomWidth="1px"
              borderColor={colorMode === "dark" ? "gray.700" : "gray.200"}
            >
              Transfer {selectedNfts.length} NFTs
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody py={6}>
              <VStack spacing={6} align="stretch">
                <FormControl>
                  <FormLabel>Recipient Address, ENS or ZNS</FormLabel>
                  <Input
                    placeholder="0x... or name.eth or name.ink"
                    value={recipientAddress}
                    onChange={(e) => setRecipientAddress(e.target.value)}
                    size="md"
                    borderRadius="md"
                  />
                </FormControl>
                {(ensName || znsName) &&
                  recipientAddress.toLowerCase() !==
                    (ensName || znsName)?.toLowerCase() && (
                    <Text fontSize="sm" color="green.500">
                      Resolved to: {ensName || znsName}
                    </Text>
                  )}

                <Box
                  bg={colorMode === "dark" ? "gray.700" : "gray.100"}
                  p={4}
                  borderRadius="md"
                >
                  <VStack spacing={4} align="stretch">
                    <Text
                      fontSize="sm"
                      color={colorMode === "dark" ? "gray.300" : "gray.600"}
                    >
                      Selected NFTs to transfer:
                    </Text>
                    <Table variant="simple" size="sm">
                      <Tbody>
                        {selectedNfts.map((nft) => (
                          <Tr key={nft.id}>
                            <Td pl={0} border="none">
                              <HStack spacing={3}>
                                <Image
                                  src={nft?.image_url || nft?.metadata?.image}
                                  alt={nft?.metadata?.name}
                                  boxSize="32px"
                                  objectFit="cover"
                                  borderRadius="md"
                                />
                                <Text fontWeight="medium">
                                  {nft?.metadata?.name || `NFT #${nft.id}`}
                                </Text>
                              </HStack>
                            </Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </VStack>
                </Box>

                <Text fontSize="sm" color="orange.500" fontWeight="medium">
                  Please verify the address carefully. Transfers cannot be
                  undone.
                </Text>
              </VStack>
            </ModalBody>

            <ModalFooter
              borderTopWidth="1px"
              borderColor={colorMode === "dark" ? "gray.700" : "gray.200"}
            >
              <Button variant="ghost" mr={3} onClick={onClose}>
                Cancel
              </Button>
              <Button
                colorScheme="brand"
                onClick={handleTransferNfts}
                isLoading={isTransferring}
                loadingText="Transferring..."
              >
                Transfer NFTs
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </SelectionContext.Provider>
    </Box>
  );
}
