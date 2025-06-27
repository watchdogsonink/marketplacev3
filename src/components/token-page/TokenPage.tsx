"use client";

import { client } from "@/consts/client";
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
  Link,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useColorModeValue,
  Spinner,
  Input,
  Button,
  Image,
  Center,
  InputGroup,
  InputRightAddon,
  Tooltip,
} from "@chakra-ui/react";
import { formatUnits } from "ethers";
import { MediaRenderer } from "@/components/shared/MediaRenderer";
import { shortenAddress } from "@/utils/shortenAddress";
import { NftAttributes } from "./NftAttributes";
import CreateListing from "./CreateListing";
import { useMarketplaceContext } from "@/hooks/useMarketplaceContext";
import { NftDetails } from "./NftDetails";
import RelatedListings from "./RelatedListings";
import {
  useListingsByCollection,
  type Listing,
} from "@/hooks/useMarketplaceListings";
import { useWallet } from "@/hooks/useWallet";
import { useReadNFT } from "@/hooks/useReadNFT";
import CancelListingButton from "./CancelListingButton";
import BuyFromListingButton from "./BuyFromListingButton";
import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import React from "react";
import { NFT_CONTRACTS } from "@/consts/nft_contracts";
import { ethers } from "ethers";
import NFTABI from "@/abis/NFTABI.json";
import { MARKETPLACE_ADDRESS } from "@/consts/addresses";

type Props = {
  tokenId: bigint;
};

export function Token(props: Props) {
  const { nftContract, contractMetadata } = useMarketplaceContext();
  const { tokenId } = props;
  const { account, connectWallet } = useWallet();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isNftListed, setIsNftListed] = useState(false);
  const [isNotApproved, setIsNotApproved] = useState(false);

  const bgGradient = useColorModeValue(
    "linear(to-br, purple.100, blue.50)",
    "linear(to-br, purple.900, gray.900)"
  );

  const {
    data: nft,
    isLoading: isLoadingNFT,

    error,
  } = useReadNFT({
    tokenId,
    contract: nftContract,
    type: "ERC721",
  });

  // console.log({ nft });

  const {
    listings: marketplaceListings,
    loading: listingsLoading,
    error: listingsError,
    refetch: refetchListings,
  } = useListingsByCollection(nftContract, 10, 0);

  // filter listings for specific token
  const tokenListings = marketplaceListings.filter((item: Listing) => {
    return (
      item.assetContract.toLowerCase() === nftContract.toLowerCase() &&
      item.tokenId.toString() === tokenId.toString()
    );
  });

  // check if there are active listings from previous owner
  const hasListingsFromPreviousOwner = useMemo(() => {
    if (!nft?.owner) return false;

    return tokenListings.some(
      (listing) =>
        Number(listing.status) === 1 && // active listing
        listing.listingCreator.toLowerCase() !== nft?.owner?.toLowerCase() // not created by current owner
    );
  }, [tokenListings, nft?.owner]);

  // check if NFT has active listings from current owner
  const hasListingsFromCurrentOwner = useMemo(() => {
    if (!nft?.owner) return false;

    return tokenListings.some(
      (listing) =>
        Number(listing.status) === 1 && // active listing
        listing.listingCreator.toLowerCase() === nft?.owner?.toLowerCase() // created by current owner
    );
  }, [tokenListings, nft?.owner]);

  // Define mapping for status values
  const statusTextMap: { [key: number]: string } = {
    0: "Unset",
    1: "Created",
    2: "Completed",
    3: "Cancelled",
  };

  const ownedByYou = nft?.owner?.toLowerCase() === account?.toLowerCase();

  // Find active listing
  const activeListing = tokenListings.find(
    (listing) => Number(listing.status) === 1
  );

  // Find active listing from current owner
  const activeListingFromCurrentOwner = useMemo(() => {
    if (!nft?.owner) return undefined;

    return tokenListings.find(
      (listing) =>
        Number(listing.status) === 1 && // active listing
        listing.listingCreator.toLowerCase() === nft?.owner?.toLowerCase() // created by current owner
    );
  }, [tokenListings, nft?.owner]);

  // Find contract configuration
  const contractConfig = useMemo(() => {
    return NFT_CONTRACTS.find(
      (c) => c.address.toLowerCase() === nftContract.toLowerCase()
    );
  }, [nftContract]);

  // Function to refresh data
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refetchListings();
      // Additional refresh after a short delay
      setTimeout(async () => {
        try {
          await refetchListings();
          // Update isNftListed state based on new data
          const updatedListings = marketplaceListings.filter(
            (item: Listing) => {
              return (
                item.assetContract.toLowerCase() ===
                  nftContract.toLowerCase() &&
                item.tokenId.toString() === tokenId.toString() &&
                Number(item.status) === 1 // Status 1 means active listing
              );
            }
          );
          setIsNftListed(updatedListings.length > 0);
        } catch (error) {
          console.error("Error refreshing listings:", error);
        } finally {
          setIsRefreshing(false);
        }
      }, 2000);
    } catch (error) {
      console.error("Error refreshing listings:", error);
      setIsRefreshing(false);
    }
  }, [refetchListings, nftContract, tokenId, marketplaceListings]);

  // update isNftListed state when listings change - only consider listings from current owner
  useEffect(() => {
    setIsNftListed(hasListingsFromCurrentOwner);
  }, [hasListingsFromCurrentOwner]);

  // check if NFT is approved for sale
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

  // check approval status for active listing
  useEffect(() => {
    const checkApprovalStatus = async () => {
      if (activeListingFromCurrentOwner) {
        const notApproved = await checkIfApproved(
          activeListingFromCurrentOwner
        );
        setIsNotApproved(notApproved);
      }
    };
    checkApprovalStatus();
  }, [activeListingFromCurrentOwner]);

  // if NFT is loading, show spinner
  if (isLoadingNFT) {
    return (
      <Center minH="60vh">
        <Spinner
          thickness="4px"
          speed="0.65s"
          emptyColor="gray.200"
          color="brand.500"
          size="xl"
        />
      </Center>
    );
  }

  // if error occurs
  if (error) {
    return (
      <Center minH="60vh">
        <Text color="red.500">Error loading NFT</Text>
      </Center>
    );
  }

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
              <Link
                href={`/collection/${
                  contractConfig?.chain || "ink"
                }/${nftContract}`}
              >
                <Image
                  src={nft?.image_url || (nft?.image as string)}
                  alt={nft?.metadata?.name || "NFT"}
                  borderRadius="xl"
                  w="full"
                />
              </Link>
            </Box>
            <Box flex="1">
              <Link
                href={`/collection/${
                  contractConfig?.chain || "ink"
                }/${nftContract}`}
                _hover={{ textDecoration: "none" }}
              >
                <Heading
                  size="2xl"
                  mb={6}
                  bgGradient="linear(to-r, brand.500, ink.accent)"
                  bgClip="text"
                >
                  {contractConfig?.title || contractMetadata?.name}
                </Heading>
              </Link>
              <Text fontSize="xl" color="gray.500" mb={4}>
                Owned by:{" "}
                <Link
                  href={`https://explorer.inkonchain.com/address/${nft?.owner}`}
                  color="blue.500"
                  isExternal
                  _hover={{ textDecoration: "none", color: "blue.600" }}
                >
                  {nft?.owner ? shortenAddress(nft.owner) : "N/A"}
                </Link>
                {ownedByYou && " (You)"}
              </Text>
              {/* Forms */}
              <Box>
                {!account ? (
                  <>
                    {activeListingFromCurrentOwner && (
                      <InputGroup w={{ base: "100%", md: "430px" }} mb={2}>
                        <Input
                          value={formatUnits(
                            activeListingFromCurrentOwner.pricePerToken,
                            18
                          )}
                          isReadOnly
                          placeholder="Current listing price"
                        />
                        <InputRightAddon>ETH</InputRightAddon>
                      </InputGroup>
                    )}
                    <Button
                      onClick={connectWallet}
                      bgGradient="linear(to-r, #7928CA, rgb(235, 165, 231))"
                      color="white"
                      w={{ base: "100%", md: "430px" }}
                      size="lg"
                      h="50px"
                      _hover={{
                        bgGradient: "linear(to-r, rgb(235, 165, 231), #7928CA)",
                        transform: "scale(1.02)",
                      }}
                      transition="all 0.3s"
                    >
                      Connect Wallet
                    </Button>
                  </>
                ) : (
                  nft && (
                    <Box>
                      {nft?.owner &&
                        account &&
                        nft.owner.toLowerCase() === account.toLowerCase() && (
                          <Text mb={4}></Text>
                        )}
                      <Flex direction="column" gap={2}>
                        {ownedByYou ? (
                          <CreateListing
                            tokenId={
                              typeof nft.id === "bigint"
                                ? nft.id
                                : BigInt(nft?.id?.toString() || "0")
                            }
                            account={account}
                            onSuccess={handleRefresh}
                            isAlreadyListed={hasListingsFromCurrentOwner}
                            activeListing={activeListingFromCurrentOwner}
                          />
                        ) : (
                          activeListingFromCurrentOwner && (
                            <>
                              <InputGroup
                                w={{ base: "100%", md: "430px" }}
                                mb={0}
                              >
                                <Input
                                  value={formatUnits(
                                    activeListingFromCurrentOwner.pricePerToken,
                                    18
                                  )}
                                  isReadOnly
                                  placeholder="Current listing price"
                                />
                                <InputRightAddon>ETH</InputRightAddon>
                              </InputGroup>
                              {isNotApproved ? (
                                <Tooltip
                                  label="This NFT is not approved for trading on the marketplace."
                                  placement="top"
                                  hasArrow
                                >
                                  <Box
                                    bg="red.500"
                                    color="white"
                                    fontWeight="bold"
                                    p={2}
                                    borderRadius="md"
                                    textAlign="center"
                                    mb={2}
                                    cursor="help"
                                    w={{ base: "100%", md: "430px" }}
                                    h="40px"
                                    display="flex"
                                    alignItems="center"
                                    justifyContent="center"
                                  >
                                    NOT APPROVED
                                  </Box>
                                </Tooltip>
                              ) : (
                                <BuyFromListingButton
                                  account={account}
                                  listing={activeListingFromCurrentOwner}
                                  onSuccess={handleRefresh}
                                  w={{ base: "100%", md: "430px" }}
                                  size="md"
                                  h="40px"
                                />
                              )}
                            </>
                          )
                        )}
                      </Flex>
                    </Box>
                  )
                )}
              </Box>
            </Box>
          </Flex>
        </Container>
      </Box>
      {/* Content Section */}
      <Container maxW="container.xl" py={12}>
        <Accordion allowMultiple defaultIndex={[0, 1, 2]}>
          {nft?.metadata?.description && (
            <AccordionItem>
              <AccordionButton>
                <Box flex="1" textAlign="left">
                  <Heading size="md">Description</Heading>
                </Box>
                <AccordionIcon />
              </AccordionButton>
              <AccordionPanel pb={4}>
                <Text fontSize="lg" color="gray.500">
                  {nft.metadata?.description}
                </Text>
              </AccordionPanel>
            </AccordionItem>
          )}
          {((nft?.attributes &&
            Array.isArray(nft.attributes) &&
            nft.attributes.length > 0) ||
            (nft?.metadata?.attributes &&
              Array.isArray(nft?.metadata?.attributes) &&
              nft?.metadata?.attributes?.length > 0)) && (
            <NftAttributes nft={nft} />
          )}
          {nft && <NftDetails nft={nft as any} />}
          <AccordionItem>
            <AccordionButton>
              <Box flex="1" textAlign="left">
                <Flex align="center">
                  <Heading size="md">Listings ({tokenListings.length})</Heading>
                  {isRefreshing && <Spinner size="sm" ml={2} />}
                </Flex>
              </Box>
              <AccordionIcon />
            </AccordionButton>
            <AccordionPanel pb={4}>
              {tokenListings.length > 0 ? (
                <TableContainer>
                  <Table variant="simple">
                    <Thead>
                      <Tr>
                        <Th>Price</Th>
                        <Th>Expiration</Th>
                        <Th>From</Th>
                        <Th width="200px">Status / Action</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {[...tokenListings]
                        .sort((a, b) => {
                          // first sort by status - active (1) on top
                          if (Number(a.status) === 1 && Number(b.status) !== 1)
                            return -1;
                          if (Number(a.status) !== 1 && Number(b.status) === 1)
                            return 1;
                          // within the same status, sort by time
                          return (
                            Number(b.endTimestamp) - Number(a.endTimestamp)
                          );
                        })
                        .map((item) => (
                          <Tr key={item.listingId.toString()}>
                            <Td>
                              <Text>
                                {formatUnits(item.pricePerToken, 18)} ETH
                              </Text>
                            </Td>
                            <Td>
                              <Box>
                                {(() => {
                                  const currentTime = Math.floor(
                                    Date.now() / 1000
                                  );
                                  const isExpired =
                                    Number(item.endTimestamp) < currentTime;
                                  const isStillActive =
                                    Number(item.status) === 1;
                                  const dateString = new Date(
                                    Number(item.endTimestamp) * 1000
                                  ).toLocaleString();

                                  // Show EXPIRED instead of date if listing is expired AND still active (not cancelled)
                                  if (isExpired && isStillActive) {
                                    return (
                                      <Text color="red.500" fontWeight="bold">
                                        EXPIRED
                                      </Text>
                                    );
                                  }

                                  return <Text>{dateString}</Text>;
                                })()}
                              </Box>
                            </Td>
                            <Td>
                              <Link
                                href={`https://explorer.inkonchain.com/address/${item.listingCreator}`}
                                color="blue.500"
                                isExternal
                                _hover={{
                                  textDecoration: "none",
                                  color: "blue.600",
                                }}
                              >
                                {shortenAddress(item.listingCreator)}
                              </Link>
                            </Td>
                            <Td>
                              <Box width="200px">
                                {Number(item.status) === 1 ? (
                                  item.listingCreator.toLowerCase() ===
                                  account?.toLowerCase() ? (
                                    <CancelListingButton
                                      listingId={item.listingId}
                                      onSuccess={handleRefresh}
                                      w="70%"
                                      size="md"
                                      h="40px"
                                    />
                                  ) : (
                                    <BuyFromListingButton
                                      account={account || ""}
                                      listing={item}
                                      onSuccess={handleRefresh}
                                      w="70%"
                                      size="md"
                                      h="40px"
                                    />
                                  )
                                ) : (
                                  <Text>
                                    Status: {statusTextMap[Number(item.status)]}
                                  </Text>
                                )}
                              </Box>
                            </Td>
                          </Tr>
                        ))}
                    </Tbody>
                  </Table>
                </TableContainer>
              ) : (
                <Text>This item is not listed for sale</Text>
              )}
            </AccordionPanel>
          </AccordionItem>
          {tokenListings.length > 0 && (
            <RelatedListings excludedListingId={tokenListings[0].listingId} />
          )}
        </Accordion>
      </Container>
    </Box>
  );
}
