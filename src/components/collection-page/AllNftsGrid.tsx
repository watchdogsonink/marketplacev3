"use client";

import { useMarketplaceContext } from "@/hooks/useMarketplaceContext";
import {
  Box,
  Flex,
  SimpleGrid,
  useBreakpointValue,
  Text,
  Button,
  useColorMode,
  Input,
  InputGroup,
  InputLeftElement,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import { useState, useMemo } from "react";
import {
  MdKeyboardDoubleArrowLeft,
  MdKeyboardDoubleArrowRight,
  MdSearch,
} from "react-icons/md";
import { RiArrowLeftSLine, RiArrowRightSLine } from "react-icons/ri";
import { Link } from "@chakra-ui/next-js";
import { useListingsByCollection } from "@/hooks/useMarketplaceListings";
import { BiLeftArrow } from "react-icons/bi";

export function AllNftsGrid() {
  const { colorMode } = useColorMode();
  const { allNfts, collectionName, isLoading, nftContract } =
    useMarketplaceContext();

  // Search
  const [searchQuery, setSearchQuery] = useState("");

  // Filter NFTs based on search
  const filteredNfts = useMemo(() => {
    if (!searchQuery) return allNfts;

    return allNfts.filter((nft) => {
      const displayName =
        nft.metadata?.metadata?.name ||
        nft.metadata?.name ||
        `Token #${nft.id.toString()}`;
      const tokenId = nft.id.toString();
      const searchLower = searchQuery.toLowerCase();

      return (
        displayName.toLowerCase().includes(searchLower) ||
        tokenId.includes(searchLower)
      );
    });
  }, [allNfts, searchQuery]);

  // Fetching list of listed NFTs
  const { listings } = useListingsByCollection(nftContract || "", 10000, 0);

  // Function to check if NFT is listed for sale (has an active listing)
  const isNftListed = (tokenId: string) => {
    return listings.some(
      (listing) =>
        listing.tokenId.toString() === tokenId.toString() &&
        listing.status.toString() === "1"
    );
  };

  // Pagination state
  const [itemsPerPage] = useState<number>(20);
  const [currentPageIndex, setCurrentPageIndex] = useState<number>(0);

  // In-memory pagination: slice allNfts for display
  const totalItems = filteredNfts.length;
  const numberOfPages = Math.ceil(totalItems / itemsPerPage);

  // We only slice out the items for the current page
  const currentPageItems = useMemo(() => {
    const start = currentPageIndex * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredNfts.slice(start, end);
  }, [filteredNfts, currentPageIndex, itemsPerPage]);

  const columns = useBreakpointValue({
    base: 2,
    sm: 2,
    md: 4,
    lg: 5,
  });

  // If there's a known fallback while loading, you can handle it
  if (isLoading && !allNfts.length) {
    return (
      <Box textAlign="center" py="50px">
        <Text fontSize="lg" color="gray.500">
          Loading NFTs...
        </Text>
      </Box>
    );
  }

  return (
    <>
      <Box mb={6}>
        <InputGroup>
          <InputLeftElement pointerEvents="none">
            <MdSearch color="gray.300" />
          </InputLeftElement>
          <Input
            placeholder="Search by name or token ID"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPageIndex(0);
            }}
            bg={colorMode === "dark" ? "whiteAlpha.50" : "white"}
          />
        </InputGroup>
      </Box>

      <SimpleGrid columns={columns} spacing={6}>
        {currentPageItems && currentPageItems.length > 0 ? (
          currentPageItems.map((item) => {
            // Use either top-level "image_url" or metadata.image
            const imageSrc = item?.image_url || item.metadata?.image;
            const displayName =
              item.metadata?.metadata?.name ||
              item.metadata?.name ||
              `Token #${item.id.toString()}`;

            // Checking if NFT is listed
            const isListed = isNftListed(item.id);

            return (
              <motion.div
                key={item.id}
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <Link
                  href={`/collection/57073/${nftContract}/token/${item.id}`}
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
                    opacity={isListed ? 0.5 : 1}
                    position="relative"
                  >
                    <Box position="relative" paddingBottom="100%">
                      <img
                        src={imageSrc || "/fallback.png"}
                        alt={displayName}
                        style={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                      {isListed && (
                        <Box
                          position="absolute"
                          top="5px"
                          right="5px"
                          bg="brand.500"
                          color="white"
                          fontSize="xs"
                          px={2}
                          py={1}
                          borderRadius="md"
                          fontWeight="bold"
                        >
                          Listed
                        </Box>
                      )}
                    </Box>
                    <Box p={4}>
                      <Text fontWeight="bold" noOfLines={1}>
                        {displayName}
                      </Text>
                      <Text fontSize="sm" color="gray.500" mb={2}>
                        Token ID: #{item.id}
                      </Text>
                      <Flex justify="space-between" align="center" mt={1}>
                        <Text fontSize="sm" color="gray.500">
                          {collectionName}
                        </Text>
                      </Flex>
                    </Box>
                  </Box>
                </Link>
              </motion.div>
            );
          })
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
              No NFTs found matching search criteria
            </Text>
          </Box>
        )}
      </SimpleGrid>

      {/* Pagination Controls */}
      {numberOfPages > 1 && (
        <Box
          mx="auto"
          maxW={{ base: "90vw", lg: "700px" }}
          mt="20px"
          px="10px"
          py="5px"
          overflowX="auto"
        >
          <Flex direction="row" justifyContent="center" gap="3">
            <Button
              onClick={() => setCurrentPageIndex(0)}
              isDisabled={currentPageIndex === 0}
            >
              <MdKeyboardDoubleArrowLeft />
            </Button>
            <Button
              isDisabled={currentPageIndex === 0}
              onClick={() => setCurrentPageIndex(currentPageIndex - 1)}
            >
              <RiArrowLeftSLine />
            </Button>
            <Text my="auto">
              Strona {currentPageIndex + 1} z {numberOfPages}
            </Text>
            <Button
              isDisabled={currentPageIndex === numberOfPages - 1}
              onClick={() => setCurrentPageIndex(currentPageIndex + 1)}
            >
              <RiArrowRightSLine />
            </Button>
            <Button
              onClick={() => setCurrentPageIndex(numberOfPages - 1)}
              isDisabled={currentPageIndex === numberOfPages - 1}
            >
              <MdKeyboardDoubleArrowRight />
            </Button>
          </Flex>
        </Box>
      )}
    </>
  );
}
