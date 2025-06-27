"use client";

import {
  Box,
  Container,
  VStack,
  Stat,
  StatLabel,
  StatNumber,
  StatGroup,
  Input,
  Button,
  FormControl,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  useColorModeValue,
  Card,
  SimpleGrid,
  Heading,
  Text,
  useToast,
} from "@chakra-ui/react";
import { useState, useEffect, useMemo } from "react";
import { useWallet } from "@/hooks/useWallet";
import { ethers } from "ethers";
import StakingABI from "@/abis/WatchStaking.json";
import ERC20ABI from "@/abis/ERC20.json";
import axios from "axios";
import TVLChart from "@/components/shared/TVLChart";
import TVLHistoryProvider from "@/components/shared/TVLHistoryProvider";

export default function StakingPage() {
  const [stakeAmount, setStakeAmount] = useState("");
  const [unstakeAmount, setUnstakeAmount] = useState("");
  const [tabIndex, setTabIndex] = useState(0);
  const [totalStaked, setTotalStaked] = useState("0");
  const [rewardsFee, setRewardsFee] = useState("0");
  const [tokenPrice, setTokenPrice] = useState("");
  const [availableTokens, setAvailableTokens] = useState("0");
  const [stakedTokens, setStakedTokens] = useState("0");
  const [rewards, setRewards] = useState("0");
  const [isLoading, setIsLoading] = useState(false);

  const { account, connectWallet, provider } = useWallet();
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

  const stakingContractAddress = "0x238883c8Ea5B732d346D9Db9461CA82bD3960660";
  const watchTokenAddress = "0x53eb0098d09b8d1008f382bbd2a5d4f649111710";
  const trueWatchTokenAddress = "0x53eb0098d09b8d1008f382bbd2a5d4f649111710";

  const MIN_STAKE_AMOUNT = "333333";
  const UNSTAKE_FEE = "0.00025";

  const stakingContract = useMemo(() => {
    if (!provider) return null;
    try {
      return new ethers.Contract(stakingContractAddress, StakingABI, provider);
    } catch (error) {
      console.error("Error initializing staking contract:", error);
      return null;
    }
  }, [provider]);

  const watchTokenContract = useMemo(() => {
    if (!provider) return null;
    try {
      return new ethers.Contract(watchTokenAddress, ERC20ABI, provider);
    } catch (error) {
      console.error("Error initializing token contract:", error);
      return null;
    }
  }, [provider]);

  // Creating public provider for global data fetching
  const publicProvider = useMemo(() => {
    try {
      // INK Chain has ID 57073, as per useZNS.ts
      console.log("Initializing public provider for INK network...");

      // Using Alchemy RPC for INK network
      const provider = new ethers.JsonRpcProvider("process.env.ALCHEMY_KEY");
      console.log("Created public provider for INK mainnet with Alchemy");
      return provider;
    } catch (error) {
      // If Alchemy fails, try alternative RPCs
      try {
        console.log("Attempting to use alternative RPC for INK (DRPC)...");
        const fallbackProvider = new ethers.JsonRpcProvider(
          "https://ink.drpc.org"
        );
        console.log("Created alternative provider for INK network using DRPC");
        return fallbackProvider;
      } catch (fallbackError) {
        // If second option fails, try the official RPC
        try {
          console.log("Attempting to use official RPC for INK...");
          const officialProvider = new ethers.JsonRpcProvider(
            "https://rpc-gel.inkonchain.com"
          );
          console.log("Created provider using official INK RPC");
          return officialProvider;
        } catch (officialError) {
          console.error("Error creating public provider for INK:", error);
          console.error("First fallback provider failed:", fallbackError);
          console.error("Official RPC provider also failed:", officialError);
          return null;
        }
      }
    }
  }, []);

  // Staking contract from public provider (always available)
  const publicStakingContract = useMemo(() => {
    if (!publicProvider) return null;
    try {
      console.log("Initializing public staking contract on INK network...");
      const contract = new ethers.Contract(
        stakingContractAddress,
        StakingABI,
        publicProvider
      );
      console.log("Public staking contract initialized on INK");
      return contract;
    } catch (error) {
      console.error(
        "Error initializing public staking contract on INK:",
        error
      );
      return null;
    }
  }, [publicProvider, stakingContractAddress]);

  // Token contract from public provider (always available)
  const publicWatchTokenContract = useMemo(() => {
    if (!publicProvider) return null;
    try {
      console.log("Initializing public token contract on INK network...");
      const contract = new ethers.Contract(
        watchTokenAddress,
        ERC20ABI,
        publicProvider
      );
      console.log("Public token contract initialized on INK");
      return contract;
    } catch (error) {
      console.error("Error initializing public token contract on INK:", error);
      return null;
    }
  }, [publicProvider, watchTokenAddress]);

  useEffect(() => {
    const fetchTokenPrice = async () => {
      try {
        // First try with DexScreener API
        const response = await axios.get(
          `https://api.dexscreener.com/latest/dex/tokens/${trueWatchTokenAddress}`
        );
        const data = response.data;
        if (data && data.pairs && data.pairs.length > 0) {
          const priceUsd = data.pairs[0].priceUsd;
          setTokenPrice(priceUsd);
          console.log("WATCH price fetched from DexScreener:", priceUsd);
        } else {
          throw new Error("No valid data from DexScreener");
        }
      } catch (error) {
        console.error("Error fetching token price from DexScreener:", error);

        // Fallback to liquidity pool calculation if DexScreener fails
        try {
          // Use the provider from wallet or public provider
          const activeProvider = provider || publicProvider;

          if (!activeProvider) {
            console.error(
              "No provider available for fallback price check (both user and public)"
            );
            setTokenPrice("N/A");
            return;
          }

          console.log(
            "Using provider for fallback price check:",
            provider ? "wallet provider" : "public INK provider"
          );

          // Address of WATCH/WETH liquidity pool on DEX
          const poolAddress = "0x7db9f3b03423eefa7929c1c27cf1cfe1f63a43c5";

          // Simple ABI for pool contract (only needed functions)
          const poolAbi = [
            "function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)",
            "function token0() external view returns (address)",
            "function token1() external view returns (address)",
          ];

          // Create contract instance
          const poolContract = new ethers.Contract(
            poolAddress,
            poolAbi,
            activeProvider
          );

          // Get reserves
          const [reserve0, reserve1] = await poolContract.getReserves();

          // Check which token is which in the pair
          const token0 = await poolContract.token0();
          const watchIsToken0 =
            token0.toLowerCase() === watchTokenAddress.toLowerCase();

          // Get reserves according to token order
          const watchReserve = watchIsToken0 ? reserve0 : reserve1;
          const wethReserve = watchIsToken0 ? reserve1 : reserve0;

          // Get ETH price in USD
          const ethPriceResponse = await fetch(
            "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd"
          );
          const ethPriceData = await ethPriceResponse.json();
          const ethPrice = ethPriceData.ethereum.usd;

          // Calculate WATCH price in ETH
          const watchPriceInEth =
            Number(ethers.formatUnits(wethReserve, 18)) /
            Number(ethers.formatUnits(watchReserve, 18));

          // Calculate WATCH price in USD
          const watchPriceInUsd = watchPriceInEth * ethPrice;

          console.log(
            "WATCH price calculated from blockchain:",
            watchPriceInUsd
          );
          setTokenPrice(watchPriceInUsd.toFixed(8).toString());
        } catch (fallbackError) {
          console.error("Both price sources failed:", fallbackError);
          console.error(
            "Fallback error details:",
            fallbackError instanceof Error
              ? fallbackError.message
              : String(fallbackError)
          );
          setTokenPrice("N/A");
        }
      }
    };
    fetchTokenPrice();
    const interval = setInterval(fetchTokenPrice, 120000); // Refresh every 2 minutes
    return () => clearInterval(interval);
  }, [provider, publicProvider, watchTokenAddress, trueWatchTokenAddress]);

  const fetchGlobalData = async () => {
    // Using contract from user provider or public provider
    const activeStakingContract = stakingContract || publicStakingContract;
    const activeProvider = provider || publicProvider;

    console.log("Calling fetchGlobalData:");
    console.log("- User provider:", provider ? "available" : "unavailable");
    console.log(
      "- Public INK provider:",
      publicProvider ? "available" : "unavailable"
    );
    console.log(
      "- User staking contract:",
      stakingContract ? "available" : "unavailable"
    );
    console.log(
      "- Public INK staking contract:",
      publicStakingContract ? "available" : "unavailable"
    );

    if (!activeStakingContract || !activeProvider) {
      console.error(
        "No active contract or provider available for fetchGlobalData"
      );
      return;
    }

    try {
      console.log("Attempting to fetch totalStaked from INK contract...");
      const totalStakedWei = await activeStakingContract.totalStaked();
      console.log("Received totalStakedWei:", totalStakedWei.toString());
      const formattedTotalStaked = ethers.formatUnits(totalStakedWei, 18);
      console.log("Formatted totalStaked:", formattedTotalStaked);
      setTotalStaked(formattedTotalStaked);

      console.log(
        "Attempting to fetch totalRewardsDeposited from INK contract..."
      );
      const totalRewardsDepositedWei =
        await activeStakingContract.totalRewardsDeposited();
      console.log(
        "Received totalRewardsDepositedWei:",
        totalRewardsDepositedWei.toString()
      );
      const formattedRewardsFee = ethers.formatEther(totalRewardsDepositedWei);
      console.log("Formatted rewardsFee:", formattedRewardsFee);
      setRewardsFee(formattedRewardsFee);
    } catch (error) {
      console.error("Error fetching global data from INK:", error);
      if (error instanceof Error) {
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
      }
      toast({
        title: "Failed to load statistics",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const fetchUserData = async () => {
    if (!account || !stakingContract || !watchTokenContract) return;
    try {
      const availableWei = await watchTokenContract.balanceOf(account);
      setAvailableTokens(ethers.formatUnits(availableWei, 18));
      const stakedWei = await stakingContract.stakedBalances(account);
      setStakedTokens(ethers.formatUnits(stakedWei, 18));
      const rewardsWei = await stakingContract.getPendingRewards(account);
      setRewards(ethers.formatEther(rewardsWei));
    } catch (error) {
      console.error("Error fetching user data:", error);
      toast({
        title: "Failed to load user data",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const refreshAllData = async () => {
    try {
      await fetchGlobalData();
      if (account) {
        await fetchUserData();
      }
    } catch (error) {
      console.error("Error refreshing data:", error);
    }
  };

  const handleMaxClick = () => {
    if (!account) return;
    if (tabIndex === 0) {
      const reserveAmount = "0.00000001";
      const maxAmount =
        Number(availableTokens) > Number(reserveAmount)
          ? (Number(availableTokens) - Number(reserveAmount)).toString()
          : "0";
      setStakeAmount(maxAmount);
    } else {
      setUnstakeAmount(stakedTokens);
    }
  };

  const handleStake = async () => {
    if (!account) {
      toast({
        title: "Wallet not connected",
        status: "error",
        duration: 2000,
        isClosable: true,
      });
      return connectWallet();
    }
    if (!provider || !stakingContract || !watchTokenContract) return;
    if (!stakeAmount || Number(stakeAmount) <= 0) {
      toast({
        title: "Enter valid amount",
        status: "error",
        duration: 2000,
        isClosable: true,
      });
      return;
    }

    if (Number(stakeAmount) < Number(MIN_STAKE_AMOUNT)) {
      toast({
        title: "Minimum stake required",
        description: `You must stake at least ${Number(
          MIN_STAKE_AMOUNT
        ).toLocaleString()} $WATCH`,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    setIsLoading(true);
    try {
      const signer = await provider.getSigner();
      const stakeAmountWei = ethers.parseUnits(stakeAmount, 18);
      const allowance = await watchTokenContract.allowance(
        account,
        stakingContractAddress
      );

      if (allowance < stakeAmountWei) {
        const approveTx = await watchTokenContract
          .connect(signer)
          .approve(stakingContractAddress, stakeAmountWei);

        const approveToastId = toast({
          title: "Approving...",
          description: "Transaction is being processed",
          status: "loading",
          duration: null,
          isClosable: true,
        });

        await approveTx.wait();
        toast.close(approveToastId);
        toast({
          title: "Watch Approved",
          description: "Token approved successfully",
          status: "success",
          duration: 2000,
          isClosable: true,
        });
      }

      const tx = await stakingContract.connect(signer).stake(stakeAmountWei);

      const stakeToastId = toast({
        title: "Staking initiated",
        description: "Transaction is being processed",
        status: "loading",
        duration: null,
        isClosable: true,
      });

      await tx.wait();
      toast.close(stakeToastId);
      toast({
        title: "Watch Staked",
        description: "Stake confirmed successfully",
        status: "success",
        duration: 5000,
        isClosable: true,
      });

      await refreshAllData();
      setStakeAmount("");
    } catch (error) {
      handleTransactionError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnstake = async () => {
    if (!account) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet",
        status: "error",
        duration: 2000,
        isClosable: true,
      });
      return connectWallet();
    }
    if (!provider || !stakingContract) return;
    if (!unstakeAmount || Number(unstakeAmount) <= 0) {
      toast({
        title: "Amount is not valid",
        description: "Please enter a valid amount",
        status: "error",
        duration: 2000,
        isClosable: true,
      });
      return;
    }

    setIsLoading(true);
    try {
      const signer = await provider.getSigner();
      const unstakeAmountWei = ethers.parseUnits(unstakeAmount, 18);
      const tx = await stakingContract
        .connect(signer)
        .unstake(unstakeAmountWei, { value: ethers.parseEther(UNSTAKE_FEE) });

      const loadingToastId = toast({
        title: "Unstaking initiated",
        description: "Transaction is being processed",
        status: "loading",
        duration: null,
        isClosable: true,
      });

      await tx.wait();
      toast.close(loadingToastId);
      toast({
        title: "Unstaked",
        description: "Unstake confirmed successfully",
        status: "success",
        duration: 5000,
        isClosable: true,
      });

      await refreshAllData();
      setUnstakeAmount("");
    } catch (error) {
      handleTransactionError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClaim = async () => {
    if (!account) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet",
        status: "error",
        duration: 2000,
        isClosable: true,
      });
      return connectWallet();
    }
    if (!provider || !stakingContract) return;

    setIsLoading(true);
    try {
      const signer = await provider.getSigner();
      const tx = await stakingContract.connect(signer).claim();
      const loadingToastId = toast({
        title: "Claiming initiated",
        description: "Transaction is being processed",
        status: "loading",
        duration: null,
        isClosable: true,
      });
      await tx.wait();
      toast.close(loadingToastId);
      toast({
        title: "Claim completed",
        description: "Rewards claimed successfully",
        status: "success",
        duration: 5000,
        isClosable: true,
      });

      const rewardsWei = await stakingContract.getPendingRewards(account);
      setRewards(ethers.formatEther(rewardsWei));
    } catch (error) {
      handleTransactionError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTransactionError = (error) => {
    let title = "Transaction failed";
    let description =
      "Failed to complete the transaction. Please try again later.";

    if (error.code === 4001 || error.message?.includes("user rejected")) {
      title = "Transaction cancelled";
      description = "You cancelled the transaction";
    } else if (error.message?.includes("insufficient")) {
      title = "Insufficient funds";
      description = "Check your $WATCH or ETH balance.";
    } else if (error.message?.includes("Must stake at least minStake")) {
      title = "Minimum stake required";
      description = "You must stake at least the minimum amount.";
    } else if (error.message?.includes("Insufficient staked balance")) {
      title = "Insufficient staked balance";
      description = "You don't have enough staked $WATCH to unstake.";
    } else if (error.message?.includes("No rewards to claim")) {
      title = "No rewards";
      description = "There are no rewards to claim.";
    }

    toast({
      title,
      description,
      status: "error",
      duration: 5000,
      isClosable: true,
    });
  };

  const getButtonText = () => {
    if (!account) return "CONNECT WALLET";
    if (tabIndex === 0) return "STAKE $WATCH";
    return "UNSTAKE $WATCH";
  };

  const handleTabChange = (index) => {
    setTabIndex(index);
    setStakeAmount("");
    setUnstakeAmount("");
  };

  useEffect(() => {
    const fetchData = async () => {
      await refreshAllData();
    };
    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [
    account,
    stakingContract,
    provider,
    publicStakingContract,
    publicProvider,
  ]);

  // Function to format USD values
  const formatUsdValue = (value: number) => {
    return `$${value.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

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
          backgroundImage: "url('/stake.webp')",
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
            Staking Dashboard
          </Heading>
          <Text fontSize="xl" textAlign="center" mb={8} color="gray.500">
            Stake your $WATCH and earn ETH rewards
          </Text>
        </Container>
      </Box>

      {/* Main Content */}
      <Box pt={8}>
        <Container maxW="container.lg" py={8}>
          <VStack spacing={8} align="stretch">
            <Tabs>
              <TabList>
                <Tab>Overview</Tab>
                <Tab>TVL History</Tab>
              </TabList>
              <Heading size="md" mb={6}>
                {" "}
              </Heading>
              <TabPanels>
                <TabPanel>
                  {/* Overview Section */}
                  <Box>
                    <Heading size="md" mb={4}>
                      $WATCH STATS
                    </Heading>
                    <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                      <Card
                        bg={bgColor}
                        p={4}
                        borderWidth="1px"
                        borderColor={borderColor}
                      >
                        <Stat>
                          <StatLabel display="flex" alignItems="center" gap={2}>
                            Total Staked
                            <Text fontSize="sm" color="gray.500">
                              ($
                              {(
                                Number(totalStaked) * Number(tokenPrice)
                              ).toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                              )
                            </Text>
                          </StatLabel>
                          <StatNumber>
                            {Number(
                              parseFloat(totalStaked).toFixed(2)
                            ).toLocaleString()}{" "}
                            $WATCH
                          </StatNumber>
                        </Stat>
                      </Card>
                      <Card
                        bg={bgColor}
                        p={4}
                        borderWidth="1px"
                        borderColor={borderColor}
                      >
                        <Stat>
                          <StatLabel>Rewards from Fees</StatLabel>
                          <StatNumber>
                            {parseFloat(rewardsFee).toFixed(8)} ETH
                          </StatNumber>
                        </Stat>
                      </Card>
                      <Card
                        bg={bgColor}
                        p={4}
                        borderWidth="1px"
                        borderColor={borderColor}
                      >
                        <Stat>
                          <StatLabel>$WATCH Price</StatLabel>
                          <StatNumber>{tokenPrice} USDC</StatNumber>
                        </Stat>
                      </Card>
                    </SimpleGrid>
                  </Box>

                  {/* Values Section */}
                  <Box mt={10}>
                    <Heading size="md" mb={4}>
                      YOUR BALANCE
                    </Heading>
                    <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} mb={4}>
                      <Card
                        bg={bgColor}
                        p={4}
                        borderWidth="1px"
                        borderColor={borderColor}
                      >
                        <Stat>
                          <StatLabel>Available</StatLabel>
                          <StatNumber>
                            {account
                              ? parseFloat(availableTokens)
                                  .toFixed(2)
                                  .toLocaleString()
                              : "0.00"}{" "}
                            $WATCH
                          </StatNumber>
                        </Stat>
                      </Card>
                      <Card
                        bg={bgColor}
                        p={4}
                        borderWidth="1px"
                        borderColor={borderColor}
                      >
                        <Stat>
                          <StatLabel>Staked</StatLabel>
                          <StatNumber>
                            {account
                              ? Number(
                                  parseFloat(stakedTokens).toFixed(2)
                                ).toLocaleString()
                              : "0.00"}{" "}
                            $WATCH
                          </StatNumber>
                        </Stat>
                      </Card>
                      <Card
                        bg={bgColor}
                        p={4}
                        borderWidth="1px"
                        borderColor={borderColor}
                      >
                        <Stat>
                          <StatLabel>Your ETH Rewards</StatLabel>
                          <StatNumber>
                            Ξ{" "}
                            {account
                              ? parseFloat(rewards).toFixed(8)
                              : "0.00000000"}
                          </StatNumber>
                        </Stat>
                      </Card>
                    </SimpleGrid>
                    <Button
                      colorScheme="green"
                      width="full"
                      isDisabled={!account || Number(rewards) <= 0}
                      onClick={handleClaim}
                      isLoading={isLoading}
                      bgGradient="linear(to-r, green.200, green.300)"
                      color="black"
                      _hover={{
                        bgGradient: "linear(to-r, green.300, green.400)",
                        transform: "scale(1.02)",
                      }}
                      transition="all 0.3s"
                    >
                      CLAIM REWARDS
                    </Button>
                  </Box>

                  {/* Staking Section */}
                  <Box mt={10}>
                    <Heading size="md" mb={4}>
                      STAKING $WATCH
                    </Heading>
                    <Card
                      bg={bgColor}
                      p={4}
                      borderWidth="1px"
                      borderColor={borderColor}
                    >
                      <Tabs onChange={handleTabChange}>
                        <TabList mb={4}>
                          <Tab>Stake</Tab>
                          <Tab>Unstake</Tab>
                        </TabList>
                        <TabPanels>
                          <TabPanel p={0}>
                            <Box display="flex" alignItems="center" gap={4}>
                              <Input
                                type="number"
                                value={stakeAmount}
                                onChange={(e) => setStakeAmount(e.target.value)}
                                placeholder="0.00"
                                min={MIN_STAKE_AMOUNT}
                                max={availableTokens}
                                disabled={!account}
                              />
                              <Button
                                colorScheme="brand"
                                size="md"
                                onClick={handleMaxClick}
                                disabled={!account}
                              >
                                Max
                              </Button>
                            </Box>
                            <Text mt={2} fontSize="sm" color="gray.500">
                              Available:{" "}
                              {account
                                ? `${parseFloat(
                                    availableTokens
                                  ).toLocaleString()} $WATCH`
                                : "Connect wallet to see your balance"}
                            </Text>
                          </TabPanel>
                          <TabPanel p={0}>
                            <Box display="flex" alignItems="center" gap={4}>
                              <Input
                                type="number"
                                value={unstakeAmount}
                                onChange={(e) =>
                                  setUnstakeAmount(e.target.value)
                                }
                                placeholder="0.00"
                                min="0"
                                max={stakedTokens}
                                disabled={!account}
                              />
                              <Button
                                colorScheme="brand"
                                size="md"
                                onClick={handleMaxClick}
                                disabled={!account}
                              >
                                Max
                              </Button>
                            </Box>
                            <Text mt={2} fontSize="sm" color="gray.500">
                              Staked:{" "}
                              {account
                                ? `${parseFloat(
                                    stakedTokens
                                  ).toLocaleString()} $WATCH`
                                : "Connect wallet to see your balance"}
                            </Text>
                          </TabPanel>
                        </TabPanels>
                      </Tabs>
                      <Button
                        colorScheme="brand"
                        width="full"
                        mt={4}
                        onClick={
                          account
                            ? tabIndex === 0
                              ? handleStake
                              : handleUnstake
                            : connectWallet
                        }
                        isLoading={
                          isLoading && (tabIndex === 0 || tabIndex === 1)
                        }
                        bgGradient="linear(to-r, #7928CA, rgb(235, 165, 231))"
                        color="white"
                        _hover={{
                          bgGradient:
                            "linear(to-r, rgb(235, 165, 231), #7928CA)",
                          transform: "scale(1.02)",
                        }}
                        transition="all 0.3s"
                      >
                        {getButtonText()}
                      </Button>
                      {tabIndex === 0 ? (
                        <Text
                          mt={2}
                          fontSize="12px"
                          color="#7928CA"
                          fontWeight="medium"
                          textAlign="right"
                        >
                          Minimum stake:{" "}
                          {Number(MIN_STAKE_AMOUNT).toLocaleString()} $WATCH
                        </Text>
                      ) : (
                        <Text
                          mt={2}
                          fontSize="12px"
                          color="#7928CA"
                          fontWeight="medium"
                          textAlign="right"
                        >
                          Unstake fee: 0.00025 ETH
                        </Text>
                      )}
                    </Card>
                  </Box>
                </TabPanel>
                <TabPanel>
                  <Box
                    p={6}
                    bg={bgColor}
                    borderRadius="xl"
                    borderWidth="1px"
                    borderColor={borderColor}
                  >
                    <Heading size="lg" mb={8}>
                      Staked $WATCH Value In USD Over Time
                    </Heading>

                    <TVLHistoryProvider
                      watchTokenContract={
                        watchTokenContract || publicWatchTokenContract
                      }
                      stakingContract={stakingContract || publicStakingContract}
                      provider={provider || publicProvider}
                      stakingContractAddress={stakingContractAddress}
                      tokenPrice={tokenPrice}
                      totalStaked={totalStaked}
                      renderChart={({ tvlHistory, isLoading, currentTVL }) => (
                        <TVLChart
                          tvlHistory={tvlHistory}
                          isLoading={isLoading}
                        />
                      )}
                    >
                      <Box mt={8}>
                        <Heading size="md" mb={4}>
                          Staking Statistics
                        </Heading>
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
                            md: "repeat(3, 1fr)",
                          }}
                          width="100%"
                        >
                          <Stat textAlign={{ base: "center", md: "left" }}>
                            <StatLabel>Total Staked $WATCH</StatLabel>
                            <StatNumber>
                              {Number(totalStaked).toLocaleString("en-US")}
                            </StatNumber>
                          </Stat>
                          <Stat textAlign="center">
                            <StatLabel>Current TVL Value</StatLabel>
                            <StatNumber>
                              {formatUsdValue(
                                Number(totalStaked) * Number(tokenPrice || 0)
                              )}
                            </StatNumber>
                          </Stat>
                          <Stat textAlign={{ base: "center", md: "right" }}>
                            <StatLabel>Rewards Pool</StatLabel>
                            <StatNumber>
                              {parseFloat(rewardsFee).toFixed(8)} ETH
                            </StatNumber>
                          </Stat>
                        </StatGroup>
                      </Box>
                    </TVLHistoryProvider>
                  </Box>
                </TabPanel>
              </TabPanels>
            </Tabs>
          </VStack>
        </Container>
      </Box>
    </Box>
  );
}
