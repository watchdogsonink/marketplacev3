"use client";

import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Stat,
  StatLabel,
  StatNumber,
  StatGroup,
  StatHelpText,
  useColorModeValue,
  Card,
  CardBody,
  SimpleGrid,
  Spinner,
  Center,
  useToast,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Button,
  Link,
  Flex,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { useWallet } from "@/hooks/useWallet";
import { ethers } from "ethers";
import { useReadContract } from "thirdweb/react";
import { getContract } from "thirdweb";
import { client } from "@/consts/client";
import { getOwnedERC721s } from "@/extensions/getOwnedERC721s";
import NFTABI from "@/abis/NFTABI.json";
import StakingABI from "@/abis/WatchStaking.json";
import { useZNS } from "@/hooks/useZNS";

const WATCH_CONTRACT = "0x58da2f96c473e9cb89f0de7c6f1faede70d47c93";
const STAKING_CONTRACT = "0x238883c8Ea5B732d346D9Db9461CA82bD3960660";

// Addresses Table Component
function AddressesTable() {
  const [addresses, setAddresses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [znsNames, setZnsNames] = useState<{ [key: string]: string }>({});
  const { account } = useWallet();
  const toast = useToast();
  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const textColor = useColorModeValue("gray.600", "gray.400");
  const hoverBg = useColorModeValue("gray.50", "gray.700");
  const highlightBg = useColorModeValue("purple.50", "purple.900");

  const CACHE_KEY = "watchdogs_stats_cache";
  const CACHE_EXPIRY = 1 * 60 * 1000; // 1 minute in milliseconds

  useEffect(() => {
    async function fetchAllAddresses() {
      setIsLoading(true);

      try {
        // Check cache
        const cachedData = localStorage.getItem(CACHE_KEY);
        if (cachedData) {
          const { timestamp, addresses, znsNames } = JSON.parse(cachedData);
          const now = Date.now();

          // If cache is current (less than 1 minute)
          if (now - timestamp < CACHE_EXPIRY) {
            console.log(
              "Using cached data from",
              new Date(timestamp).toLocaleTimeString()
            );
            setAddresses(addresses);
            setZnsNames(znsNames);
            setIsLoading(false);
            return;
          } else {
            console.log("Cache expired, fetching new data");
          }
        }

        // Get provider
        const provider = new ethers.JsonRpcProvider("process.env.ALCHEMY_KEY");

        // initialize contracts
        const stakingContract = new ethers.Contract(
          STAKING_CONTRACT,
          StakingABI,
          provider
        );

        const nftContract = new ethers.Contract(
          WATCH_CONTRACT,
          NFTABI,
          provider
        );

        // Collect addresses from staking events
        const stakedFilter = stakingContract.filters.Staked();
        const stakedEvents = await stakingContract.queryFilter(stakedFilter);

        // Collect addresses from NFT transfer events
        const transferFilter = nftContract.filters.Transfer(null, null, null);
        const transferEvents = await nftContract.queryFilter(transferFilter);

        // Set of unique addresses
        const uniqueAddresses = new Set<string>();

        // Map to store data for each address
        const addressData: { [address: string]: any } = {};

        // processing staking events
        for (const event of stakedEvents) {
          try {
            // Extract user address from event data
            const user =
              event.topics && event.topics.length > 1
                ? ethers.getAddress(ethers.dataSlice(event.topics[1], 12)) // Address is indexed, so it's in topics
                : "";

            if (user) {
              const address = user.toLowerCase();
              uniqueAddresses.add(address);

              if (!addressData[address]) {
                addressData[address] = {
                  address,
                  hasStaking: false,
                  stakedAmount: "0",
                  nftCount: 0,
                  totalPoints: 0,
                };
              }

              addressData[address].hasStaking = true;
            }
          } catch (error) {
            console.error("Error processing staking event:", error);
          }
        }

        // processing NFT transfer events
        for (const event of transferEvents) {
          try {
            // Extract recipient from event data (topics[2] is 'to')
            const recipient =
              event.topics && event.topics.length > 2
                ? ethers.getAddress(ethers.dataSlice(event.topics[2], 12))
                : "";

            if (recipient) {
              const address = recipient.toLowerCase();
              uniqueAddresses.add(address);

              if (!addressData[address]) {
                addressData[address] = {
                  address,
                  hasStaking: false,
                  stakedAmount: "0",
                  nftCount: 0,
                  totalPoints: 0,
                };
              }
            }
          } catch (error) {
            console.error("Error processing transfer event:", error);
          }
        }

        // Check current balances for each address
        const addressesArray = Array.from(uniqueAddresses);
        console.log(`Found ${addressesArray.length} unique addresses`);

        // Process addresses in batches to avoid overload
        const BATCH_SIZE = 100;
        for (let i = 0; i < addressesArray.length; i += BATCH_SIZE) {
          const batch = addressesArray.slice(i, i + BATCH_SIZE);

          await Promise.all(
            batch.map(async (address) => {
              try {
                // Check staking balance
                const stakedAmount = await stakingContract.stakedBalances(
                  address
                );
                const stakedFormatted = ethers.formatUnits(stakedAmount, 18);
                addressData[address].stakedAmount = stakedFormatted;

                // Check NFT count
                const nftBalance = await nftContract.balanceOf(address);
                addressData[address].nftCount = Number(nftBalance);

                // Calculate points
                const stakedPoints = Math.floor(
                  parseFloat(stakedFormatted) / 333_333
                );
                const nftPoints = Number(nftBalance) * 30;
                addressData[address].totalPoints = stakedPoints + nftPoints;
              } catch (error) {
                console.error(
                  `Error fetching data for address ${address}:`,
                  error
                );
              }
            })
          );

          // Add a small delay between batches
          if (i + BATCH_SIZE < addressesArray.length) {
            await new Promise((r) => setTimeout(r, 500));
          }
        }

        // Convert to array and sort by points
        const sortedAddresses = Object.values(addressData)
          .filter(
            (item) =>
              item.totalPoints > 0 ||
              parseFloat(item.stakedAmount) > 0 ||
              item.nftCount > 0
          )
          .sort((a, b) => b.totalPoints - a.totalPoints);

        // Fetch ZNS names for all addresses
        const znsData: { [key: string]: string } = {};

        // Fetch in batches to avoid rate limiting
        const batchSize = 10;
        for (let i = 0; i < sortedAddresses.length; i += batchSize) {
          const batch = sortedAddresses.slice(i, i + batchSize);

          await Promise.all(
            batch.map(async (item) => {
              try {
                // Check ZNS registry
                const znsName = await checkZnsName(item.address);
                if (znsName) {
                  znsData[item.address.toLowerCase()] = znsName;
                }
              } catch (error) {
                console.error(`Error fetching ZNS for ${item.address}:`, error);
              }
            })
          );

          // Add a small delay between batches
          if (i + batchSize < sortedAddresses.length) {
            await new Promise((r) => setTimeout(r, 500));
          }
        }

        // Add data to cache
        const cacheData = {
          timestamp: Date.now(),
          addresses: sortedAddresses,
          znsNames: znsData,
        };
        localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
        console.log("Data cached at", new Date().toLocaleTimeString());

        setAddresses(sortedAddresses);
        setZnsNames(znsData);
        console.log(`Found ${Object.keys(znsData).length} ZNS names`);
      } catch (error) {
        console.error("Error fetching addresses:", error);
        toast({
          title: "Failed to load addresses",
          description: "Failed to load address table",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false);
      }
    }

    fetchAllAddresses();
  }, [toast]);

  // Function to check for ZNS name
  const checkZnsName = async (address: string) => {
    try {
      // Use the fetch API to call the ZNS API endpoint
      const znsResponse = await fetch(
        `https://zns.bio/api/resolveAddress?chain=57073&address=${address}`
      );
      if (znsResponse.ok) {
        const data = await znsResponse.json();
        if (data.code === 200 && data.primaryDomain) {
          // Return the primary domain if exists
          console.log(`Found ZNS for ${address}: ${data.primaryDomain}`);
          return data.primaryDomain;
        }
      }
    } catch (error) {
      console.error(`Error fetching ZNS for ${address}:`, error);
    }
    return null;
  };

  // Display name - ZNS or shortened address
  const getDisplayName = (address: string) => {
    const lowercaseAddr = address.toLowerCase();
    return znsNames[lowercaseAddr] || shortenAddress(address);
  };

  // Shortening addresses for display
  const shortenAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(
      address.length - 4
    )}`;
  };

  if (isLoading) {
    return (
      <Center py={10}>
        <VStack spacing={4}>
          <Spinner
            thickness="4px"
            speed="0.65s"
            emptyColor="gray.200"
            color="brand.500"
            size="xl"
          />
          <Text color="gray.500">Loading addresses...</Text>
        </VStack>
      </Center>
    );
  }

  return (
    <Box>
      <Heading size="md" mb={4}>
        RANKING
      </Heading>
      <Card
        bg={bgColor}
        p={0}
        overflow="hidden"
        borderWidth="1px"
        borderColor={borderColor}
      >
        <TableContainer>
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>Position</Th>
                <Th>Address</Th>
                <Th isNumeric>Staked WATCH</Th>
                <Th isNumeric>NFT Count</Th>
                <Th isNumeric>Total Points</Th>
              </Tr>
            </Thead>
            <Tbody>
              {addresses.map((item, index) => {
                const isCurrentUser =
                  item.address.toLowerCase() === account?.toLowerCase();

                return (
                  <Tr
                    key={item.address}
                    _hover={{ bg: hoverBg }}
                    bg={isCurrentUser ? highlightBg : undefined}
                  >
                    <Td fontWeight="bold">{index + 1}</Td>
                    <Td>
                      <Flex align="center">
                        <Link
                          href={`https://explorer.inkonchain.com/address/${item.address}`}
                          isExternal
                          color="blue.500"
                        >
                          {getDisplayName(item.address)}
                        </Link>
                      </Flex>
                    </Td>
                    <Td isNumeric>
                      {parseFloat(item.stakedAmount).toFixed(2)}
                    </Td>
                    <Td isNumeric>{item.nftCount}</Td>
                    <Td isNumeric fontWeight="bold">
                      {item.totalPoints}
                    </Td>
                  </Tr>
                );
              })}
            </Tbody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  );
}

export default function StatsPage() {
  const { account, provider } = useWallet();
  const [watchBalance, setWatchBalance] = useState<string>("0");
  const [stakedAmount, setStakedAmount] = useState<string>("0");
  const [watchNFTs, setWatchNFTs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalPoints, setTotalPoints] = useState(0);
  const toast = useToast();

  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const textColor = useColorModeValue("gray.800", "white");
  const lineColor = useColorModeValue("#7928CA", "#B794F4");
  const gridColor = useColorModeValue("#E2E8F0", "#2D3748");
  const bgGradient = useColorModeValue(
    "linear(to-br, purple.100, blue.50)",
    "linear(to-br, purple.900, gray.900)"
  );

  useEffect(() => {
    async function fetchData() {
      if (!account || !provider) {
        setIsLoading(false);
        return;
      }

      try {
        // Get staked WATCH
        const stakingContract = new ethers.Contract(
          STAKING_CONTRACT,
          StakingABI,
          provider
        );

        // Get user's staked amount using stakedBalances
        const stakedAmount = await stakingContract.stakedBalances(account);
        const stakedFormatted = ethers.formatUnits(stakedAmount, 18);
        setStakedAmount(stakedFormatted);

        // Get WATCH NFTs
        const contract = getContract({
          address: WATCH_CONTRACT,
          chain: {
            id: 57073,
            rpc: "process.env.ALCHEMY_KEY",
          },
          client: client as any,
        });

        const nfts = await getOwnedERC721s({
          contract,
          owner: account,
        });

        setWatchNFTs(nfts || []);

        // Calculate points
        const stakedPoints = Math.floor(parseFloat(stakedFormatted) / 333_333); // 1 point per 333,333 WATCH
        const nftPoints = (nfts || []).length * 30; // 30 points per NFT
        setTotalPoints(stakedPoints + nftPoints);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast({
          title: "Failed to load statistics",
          description: "Failed to load statistics",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [account, provider, toast]);

  if (!account) {
    return (
      <Container maxW="container.xl" py={12}>
        <Center minH="60vh">
          <Text fontSize="xl" color="gray.500">
            Connect your wallet to view your statistics
          </Text>
        </Center>
      </Container>
    );
  }

  if (isLoading) {
    return (
      <Container maxW="container.xl" py={12}>
        <Center minH="60vh">
          <VStack spacing={4}>
            <Spinner
              thickness="4px"
              speed="0.65s"
              emptyColor="gray.200"
              color="brand.500"
              size="xl"
            />
            <Text color="gray.500">Loading statistics...</Text>
          </VStack>
        </Center>
      </Container>
    );
  }

  return (
    <Box>
      {/* Hero Section */}
      <Box
        py={20}
        px={4}
        position="relative"
        _before={{
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: "url('/stats.webp')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          opacity: 0.3,
          zIndex: -1,
        }}
      >
        <Container maxW="container.xl">
          <Heading
            size="2xl"
            mb={6}
            textAlign="center"
            bgGradient="linear(to-r, brand.500, ink.accent)"
            bgClip="text"
            width="auto"
            padding="0.2em 0"
          >
            Your Statistics
          </Heading>
          <Text fontSize="xl" textAlign="center" mb={8} color="gray.500">
            Track your points from staked WATCH and owned NFTs
          </Text>
        </Container>
      </Box>

      {/* Main Content */}
      <Box pt={8}>
        <Container maxW="container.lg" py={8}>
          <VStack spacing={8} align="stretch">
            {/* Overview Section */}
            <Box>
              <Heading size="md" mb={4}>
                YOUR POINTS
              </Heading>
              <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                <Card
                  bg={bgColor}
                  p={4}
                  borderWidth="1px"
                  borderColor={borderColor}
                >
                  <Stat>
                    <StatLabel>Total Points</StatLabel>
                    <StatNumber>{totalPoints}</StatNumber>
                    <StatHelpText>
                      Combined points from staking and NFTs
                    </StatHelpText>
                  </Stat>
                </Card>
                <Card
                  bg={bgColor}
                  p={4}
                  borderWidth="1px"
                  borderColor={borderColor}
                >
                  <Stat>
                    <StatLabel>Staked WATCH Points</StatLabel>
                    <StatNumber>
                      {Math.floor(parseFloat(stakedAmount) / 333_333)}
                    </StatNumber>
                    <StatHelpText>
                      From {parseFloat(stakedAmount).toFixed(2)} staked WATCH
                    </StatHelpText>
                  </Stat>
                </Card>
                <Card
                  bg={bgColor}
                  p={4}
                  borderWidth="1px"
                  borderColor={borderColor}
                >
                  <Stat>
                    <StatLabel>NFT Points</StatLabel>
                    <StatNumber>{watchNFTs.length * 30}</StatNumber>
                    <StatHelpText>From owned WATCH NFTs</StatHelpText>
                  </Stat>
                </Card>
              </SimpleGrid>
            </Box>

            {/* Points System Details */}
            <Box>
              <Heading size="md" mb={4}>
                POINTS SYSTEM
              </Heading>
              <Card
                bg={bgColor}
                p={6}
                borderWidth="1px"
                borderColor={borderColor}
              >
                <VStack spacing={4} align="stretch">
                  <StatGroup
                    gap={4}
                    p={4}
                    borderRadius="lg"
                    bg={useColorModeValue("gray.50", "gray.700")}
                    alignItems="center"
                    display="grid"
                    gridTemplateColumns={{
                      base: "repeat(1, 1fr)",
                      sm: "repeat(1, 1fr)",
                      md: "repeat(2, 1fr)",
                    }}
                    width="100%"
                  >
                    <Stat textAlign={{ base: "center", md: "left" }}>
                      <StatLabel>Staking Points</StatLabel>
                      <StatNumber>1 point</StatNumber>
                      <StatHelpText>per 333,333 staked WATCH</StatHelpText>
                    </Stat>
                    <Stat textAlign={{ base: "center", md: "right" }}>
                      <StatLabel>NFT Points</StatLabel>
                      <StatNumber>30 points</StatNumber>
                      <StatHelpText>per owned WATCHDOGS NFT</StatHelpText>
                    </Stat>
                  </StatGroup>
                  <Box
                    p={4}
                    bg={useColorModeValue("purple.50", "purple.900")}
                    borderRadius="md"
                    borderWidth="1px"
                    borderColor={useColorModeValue("purple.200", "purple.700")}
                  >
                    <Text
                      fontSize="sm"
                      color={useColorModeValue("purple.800", "purple.100")}
                    >
                      Your total points: <strong>{totalPoints}</strong>
                    </Text>
                  </Box>
                </VStack>
              </Card>
            </Box>

            {/* Addresses Table */}
            <AddressesTable />
          </VStack>
        </Container>
      </Box>
    </Box>
  );
}
