"use client";
import {
  Box,
  Flex,
  Heading,
  Tab,
  TabList,
  Tabs,
  Text,
  Container,
  useColorModeValue,
  IconButton,
  HStack,
  Spinner,
  Tooltip,
  useColorMode,
} from "@chakra-ui/react";
import { useState, useMemo } from "react";
import { useParams } from "next/navigation";

import { useMarketplaceContext } from "@/hooks/useMarketplaceContext";
// ^ This should give us { allNfts, collectionName, isLoading, error, refreshNfts }

import { AllNftsGrid } from "./AllNftsGrid";
// If you are no longer using thirdweb for listing, remove references to ListingGrid, etc.
// import { ListingGrid } from "./ListingGrid";

import { RiTwitterXFill } from "react-icons/ri";
import { FaDiscord, FaGlobe, FaTelegram } from "react-icons/fa";

// If you still have a local config with backgrounds, socials, etc. import it
import { NFT_CONTRACTS } from "@/consts/nft_contracts";
import { ListingGrid } from "@/components/collection-page/ListingGrid";
import { useListingsByCollection } from "@/hooks/useMarketplaceListings";
import { HistoryGrid } from "@/components/collection-page/HistoryGrid";
import { AnalyticsGrid } from "./AnalyticsGrid";
// or adapt as needed

export function Collection() {
  const params = useParams();
  const chainId = params?.chainId;
  const contractAddress = String(params?.contractAddress).toLowerCase();
  const { colorMode } = useColorMode();

  // Grab local JSON data + loading state from context
  const { allNfts, collectionName, isLoading, error, refreshNfts } =
    useMarketplaceContext();

  const [tabIndex, setTabIndex] = useState<number>(0);

  // Suppose you have an array `NFT_CONTRACTS` with extra config
  const collectionConfig = useMemo(() => {
    return NFT_CONTRACTS.find(
      (c) => c.address.toLowerCase() === contractAddress
    );
  }, [contractAddress]);

  // For example, let's find the first NFT that has a valid image
  const firstExistingNFT = allNfts.find((nft) => nft && nft?.metadata?.image);
  // console.log({firstExistingNFT})

  // We'll use that as a "thumbnail"
  const thumbnailImage =
    collectionConfig?.thumbnailUrl ||
    firstExistingNFT?.image_url ||
    firstExistingNFT?.metadata?.image ||
    ""; // fallback

  const { listings: listingsInSelectedCollection } = useListingsByCollection(
    contractAddress,
    10,
    0
  );

  // If your local JSON includes a description, store it in context. Otherwise:
  const descriptionFromJson = ""; // or load from your JSON if it exists

  // console.log({allNfts})
  // If you had a "total supply" from your local JSON, you can just do:
  const totalSupply = allNfts.length; // or read from local JSON if you prefer

  // Optionally handle the `error` from context
  if (error) {
    return (
      <Box textAlign="center" pt={20}>
        <Text fontSize="xl" color="red.400">
          Failed to load local collection data: {error}
        </Text>
      </Box>
    );
  }

  // If still loading data from the JSON file
  if (isLoading && !allNfts.length) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minH="80vh"
      >
        <Spinner
          thickness="4px"
          speed="0.65s"
          emptyColor="gray.200"
          color="purple.500"
          size="xl"
        />
      </Box>
    );
  }

  // For gradient or background
  const bgGradient = useColorModeValue(
    "linear(to-br, purple.100, blue.50)",
    "linear(to-br, purple.900, gray.900)"
  );

  return (
    <>
      {/*
        Header / hero banner area
      */}
      <Box
        bg={collectionConfig?.backgroundUrl ? "transparent" : undefined}
        bgImage={
          collectionConfig?.backgroundUrl
            ? `url(${collectionConfig.backgroundUrl})`
            : undefined
        }
        bgGradient={!collectionConfig?.backgroundUrl ? bgGradient : undefined}
        bgSize="cover"
        bgPosition="center"
        bgRepeat="no-repeat"
        pt={16}
        pb={8}
        px={4}
        textAlign="center"
        position="relative"
      >
        {collectionConfig?.backgroundUrl && (
          <Box
            position="absolute"
            top={0}
            left={0}
            right={0}
            bottom={0}
            bg="blackAlpha.600"
          />
        )}

        <Container maxW="container.xl" position="relative" zIndex={1}>
          {/* If you do NOT want to use thirdweb's MediaRenderer,
              just use a normal <img> or Next.js Image */}
          <Box
            mx="auto"
            mb="12px"
            w="160px"
            h="160px"
            borderRadius="20px"
            overflow="hidden"
          >
            <img
              src={thumbnailImage}
              alt={collectionName || "NFT Collection"}
              style={{
                width: "160px",
                height: "160px",
                objectFit: "cover",
                borderRadius: "20px",
              }}
            />
          </Box>

          {/* Socials */}
          <HStack spacing={4} justify="center" mb={6}>
            {collectionConfig?.socials?.twitter && (
              <Tooltip label="X (Twitter)" placement="top">
                <IconButton
                  as="a"
                  href={collectionConfig.socials.twitter}
                  target="_blank"
                  aria-label="X (Twitter)"
                  icon={<RiTwitterXFill />}
                  variant="ghost"
                  size="lg"
                  _hover={{
                    transform: "translateY(-2px)",
                    color: "brand.500",
                  }}
                />
              </Tooltip>
            )}
            {collectionConfig?.socials?.website && (
              <Tooltip label="Website" placement="top">
                <IconButton
                  as="a"
                  href={collectionConfig.socials.website}
                  target="_blank"
                  aria-label="Website"
                  icon={<FaGlobe />}
                  variant="ghost"
                  size="lg"
                  _hover={{
                    transform: "translateY(-2px)",
                    color: "brand.500",
                  }}
                />
              </Tooltip>
            )}
            {collectionConfig?.socials?.discord && (
              <Tooltip label="Discord" placement="top">
                <IconButton
                  as="a"
                  href={collectionConfig.socials.discord}
                  target="_blank"
                  aria-label="Discord"
                  icon={<FaDiscord />}
                  variant="ghost"
                  size="lg"
                  _hover={{
                    transform: "translateY(-2px)",
                    color: "brand.500",
                  }}
                />
              </Tooltip>
            )}
            {collectionConfig?.socials?.telegram && (
              <Tooltip label="Telegram" placement="top">
                <IconButton
                  as="a"
                  href={collectionConfig.socials.telegram}
                  target="_blank"
                  aria-label="Telegram"
                  icon={<FaTelegram />}
                  variant="ghost"
                  size="lg"
                  _hover={{
                    transform: "translateY(-2px)",
                    color: "brand.500",
                  }}
                />
              </Tooltip>
            )}
          </HStack>

          <Heading
            size="2xl"
            mb={3}
            bgGradient="linear(to-r, brand.500, ink.accent)"
            bgClip="text"
          >
            {collectionName || "Unknown collection"}
          </Heading>

          {/* If you have a description from local JSON, display it here */}
          {descriptionFromJson && (
            <Text fontSize="xl" color="gray.500" mb={3} maxW="800px" mx="auto">
              {descriptionFromJson}
            </Text>
          )}
        </Container>
      </Box>

      {/*
        Main area with tabs
      */}
      <Container maxW="container.xl" py={12}>
        <Tabs
          variant="unstyled"
          mx="auto"
          onChange={(index) => setTabIndex(index)}
          isLazy
        >
          <TabList
            mb={5}
            p={0}
            borderRadius="md"
            display="inline-flex"
            gap={1}
            width="100%"
            maxW="640px"
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
              Listings (
              {
                listingsInSelectedCollection.filter(
                  (elem) => elem.status.toString() === "1"
                ).length
              }
              )
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
              All items ({totalSupply})
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
              History
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
              Analytics
            </Tab>
          </TabList>

          <Flex direction="column">
            {tabIndex === 0 && (
              <>
                {listingsInSelectedCollection.filter(
                  (elem) => elem.status.toString() === "1"
                ).length > 0 ? (
                  <ListingGrid contract={contractAddress} />
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
              </>
            )}
            {tabIndex === 1 && <AllNftsGrid />}
            {tabIndex === 2 && <HistoryGrid />}
            {tabIndex === 3 && <AnalyticsGrid />}
          </Flex>
        </Tabs>
      </Container>
    </>
  );
}
