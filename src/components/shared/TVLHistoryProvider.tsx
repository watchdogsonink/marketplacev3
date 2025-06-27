import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { useToast } from "@chakra-ui/react";
import { TVLDataPoint } from "./TVLChart";

// Constants
const TVL_HISTORY_CACHE_KEY = "watch_tvl_history_cache";
const TVL_HISTORY_CACHE_TIMESTAMP_KEY = "watch_tvl_history_cache_timestamp";
const CACHE_VALIDITY_PERIOD = 60 * 60 * 1000; // 1 hour in milliseconds

interface TVLHistoryProviderProps {
  children: React.ReactNode;
  watchTokenContract: ethers.Contract | null;
  stakingContract: ethers.Contract | null;
  provider: ethers.Provider | null;
  stakingContractAddress: string;
  tokenPrice: string;
  totalStaked: string;
  renderChart: (props: {
    tvlHistory: TVLDataPoint[];
    isLoading: boolean;
    currentTVL: number;
  }) => React.ReactNode;
}

export default function TVLHistoryProvider({
  children,
  watchTokenContract,
  stakingContract,
  provider,
  stakingContractAddress,
  tokenPrice,
  totalStaked,
  renderChart,
}: TVLHistoryProviderProps) {
  const [tvlHistory, setTvlHistory] = useState<TVLDataPoint[]>([]);
  const [currentTVL, setCurrentTVL] = useState(0);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  const toast = useToast();

  // Function to save data to localStorage
  const saveHistoryToCache = (history: TVLDataPoint[]) => {
    try {
      localStorage.setItem(TVL_HISTORY_CACHE_KEY, JSON.stringify(history));
      localStorage.setItem(
        TVL_HISTORY_CACHE_TIMESTAMP_KEY,
        Date.now().toString()
      );
      console.log("TVL history saved to cache");
    } catch (error) {
      console.error("Error saving TVL history to cache:", error);
    }
  };

  // Function to retrieve data from localStorage
  const getHistoryFromCache = (): TVLDataPoint[] | null => {
    try {
      const cachedDataString = localStorage.getItem(TVL_HISTORY_CACHE_KEY);
      const cachedTimestampString = localStorage.getItem(
        TVL_HISTORY_CACHE_TIMESTAMP_KEY
      );

      if (!cachedDataString || !cachedTimestampString) {
        console.log("No TVL history cache found");
        return null;
      }

      const cachedTimestamp = parseInt(cachedTimestampString, 10);
      const currentTime = Date.now();

      // Check if cache is expired
      if (currentTime - cachedTimestamp > CACHE_VALIDITY_PERIOD) {
        console.log("TVL history cache expired");
        return null;
      }

      const cachedData = JSON.parse(cachedDataString);
      console.log(
        `TVL history loaded from cache (${cachedData.length} points)`
      );
      return cachedData;
    } catch (error) {
      console.error("Error loading TVL history from cache:", error);
      return null;
    }
  };

  // Function to generate sample TVL history data when real data cannot be fetched
  const generateSampleTVLHistory = (): TVLDataPoint[] => {
    const now = new Date().getTime();
    const day = 24 * 60 * 60 * 1000; // milliseconds in a day
    const baseTokensAmount = Number(totalStaked) || 1000000; // default to 1M if no data

    // Use current token price
    const currentPrice = Number(tokenPrice || 0);
    console.log(
      `Generating sample TVL history using current price: $${currentPrice}`
    );

    const baseValue = baseTokensAmount * currentPrice;

    // Generate data points for the last 30 days
    return Array.from({ length: 30 }, (_, i) => {
      // Create somewhat realistic variations in the TVL
      const randomFactor = 0.8 + Math.random() * 0.4; // between 0.8 and 1.2
      const tokensAmount = baseTokensAmount * randomFactor * (1 + i / 60); // slight upward trend

      // Calculate value using the current token price
      const value = tokensAmount * currentPrice;

      return {
        timestamp: now - (30 - i) * day,
        value: Number(value.toFixed(2)),
        tokensAmount: Number(tokensAmount.toFixed(2)),
      };
    });
  };

  // Function to fetch TVL history from contract
  const fetchTVLHistory = async () => {
    if (!watchTokenContract || !provider) return;

    setIsLoadingHistory(true);

    try {
      // First check the cache
      const cachedHistory = getHistoryFromCache();
      if (cachedHistory && cachedHistory.length > 0) {
        setTvlHistory(cachedHistory);
        setCurrentTVL(cachedHistory[cachedHistory.length - 1].value);
        setIsLoadingHistory(false);
        return; // Exit if data is in cache
      }

      console.log("Fetching WATCH token transfers history from blockchain...");

      // Get current block number
      const latestBlock = await provider.getBlockNumber();
      console.log("Current block:", latestBlock);

      // Start from block 8197074, as specified
      const STARTING_BLOCK = 8197074;
      console.log(`Starting from specified block: ${STARTING_BLOCK}`);

      // Try to fetch events from contract
      let finalHistory: TVLDataPoint[] = [];
      let fetchSuccess = false;

      try {
        // Chunk size - number of blocks in one query (less than 10000 limit)
        const CHUNK_SIZE = 9900;

        // Arrays for all events
        const transfersToStaking: any[] = []; // Transfers TO staking contract
        const transfersFromStaking: any[] = []; // Transfers FROM staking contract

        // Fetch events in chunks, starting from STARTING_BLOCK
        for (
          let fromBlock = STARTING_BLOCK;
          fromBlock <= latestBlock;
          fromBlock += CHUNK_SIZE
        ) {
          const toBlock = Math.min(fromBlock + CHUNK_SIZE - 1, latestBlock);

          console.log(
            `Fetching transfers from blocks ${fromBlock} to ${toBlock}...`
          );

          try {
            // Get all WATCH token transfers
            const transferFilter = watchTokenContract.filters.Transfer();
            const transferEvents = await watchTokenContract.queryFilter(
              transferFilter,
              fromBlock,
              toBlock
            );

            // Filter transfers to and from staking address
            for (const event of transferEvents) {
              const eventObj = event as unknown as {
                args: { from: string; to: string; value: bigint };
              };

              if (!eventObj.args) continue;

              const { from, to, value } = eventObj.args;

              // Staking contract address - compare addresses case-insensitive
              if (to.toLowerCase() === stakingContractAddress.toLowerCase()) {
                // Token was sent TO staking contract (stake)
                transfersToStaking.push({
                  blockNumber: event.blockNumber,
                  transactionIndex: event.transactionIndex,
                  from: from,
                  amount: value,
                  logIndex: (event as any).logIndex || 0,
                });
              } else if (
                from.toLowerCase() === stakingContractAddress.toLowerCase()
              ) {
                // Token was sent FROM staking contract (unstake)
                transfersFromStaking.push({
                  blockNumber: event.blockNumber,
                  transactionIndex: event.transactionIndex,
                  to: to,
                  amount: value,
                  logIndex: (event as any).logIndex || 0,
                });
              }
            }

            console.log(
              `Found ${transfersToStaking.length} transfers TO staking and ${transfersFromStaking.length} transfers FROM staking contract in blocks ${fromBlock}-${toBlock}`
            );
          } catch (chunkError) {
            console.error(
              `Error fetching transfers for blocks ${fromBlock}-${toBlock}:`,
              chunkError
            );
            // Continue with the next chunk despite the error
            continue;
          }
        }

        console.log(
          `Total transfers: ${transfersToStaking.length} TO staking contract and ${transfersFromStaking.length} FROM staking contract`
        );

        if (
          transfersToStaking.length === 0 &&
          transfersFromStaking.length === 0
        ) {
          console.log(
            "No WATCH token transfers found for the staking contract"
          );
        } else {
          // Combine events and sort by blocks and transaction indices
          type TransferEvent = {
            type: "stake" | "unstake";
            blockNumber: number;
            transactionIndex: number;
            logIndex: number;
            amount: bigint;
            timestamp: number;
            address: string; // from/to address
          };

          const allEvents: TransferEvent[] = [
            ...transfersToStaking.map((t) => ({
              type: "stake" as const,
              blockNumber: t.blockNumber,
              transactionIndex: t.transactionIndex,
              logIndex: t.logIndex,
              amount: t.amount,
              timestamp: 0, // We'll fill this later
              address: t.from,
            })),
            ...transfersFromStaking.map((t) => ({
              type: "unstake" as const,
              blockNumber: t.blockNumber,
              transactionIndex: t.transactionIndex,
              logIndex: t.logIndex,
              amount: t.amount,
              timestamp: 0, // We'll fill this later
              address: t.to,
            })),
          ].sort((a, b) => {
            if (a.blockNumber !== b.blockNumber)
              return a.blockNumber - b.blockNumber;
            if (a.transactionIndex !== b.transactionIndex)
              return a.transactionIndex - b.transactionIndex;
            return a.logIndex - b.logIndex;
          });

          console.log(
            `After sorting we have ${allEvents.length} transfer events`
          );

          // Get block timestamps for sorted events
          let totalStakedAmount = ethers.parseEther("0");
          type HistoryPoint = {
            timestamp: number;
            value: number;
            tokensAmount: number;
            blockNumber: number;
            transactionIndex: number;
            type: string;
            description: string;
          };
          const historyPoints: HistoryPoint[] = [];

          // Optimization: fetch block information in groups
          const blockCache = new Map<number, { timestamp: number }>();

          console.log(
            "Processing transfer events to build token flow history..."
          );

          for (let i = 0; i < allEvents.length; i++) {
            const event = allEvents[i];

            // Check if we already have info about this block in cache
            let blockTimestamp;
            if (blockCache.has(event.blockNumber)) {
              blockTimestamp = blockCache.get(event.blockNumber)!.timestamp;
            } else {
              // Get block time if not in cache
              try {
                const block = await provider.getBlock(event.blockNumber);
                if (!block) {
                  console.warn(
                    `Cannot retrieve information for block ${event.blockNumber}, skipping event`
                  );
                  continue;
                }
                blockTimestamp = block.timestamp * 1000; // Convert to milliseconds
                blockCache.set(event.blockNumber, {
                  timestamp: blockTimestamp,
                });
              } catch (blockError) {
                console.error(
                  `Error fetching block ${event.blockNumber}:`,
                  blockError
                );
                continue;
              }
            }

            event.timestamp = blockTimestamp;
            const dateStr = new Date(blockTimestamp).toLocaleDateString();
            const timeStr = new Date(blockTimestamp).toLocaleTimeString();
            const tokenAmount = Number(ethers.formatUnits(event.amount, 18));
            const shortAddress = `${event.address.substring(
              0,
              6
            )}...${event.address.substring(38)}`;

            // Update totalStakedAmount based on the event
            const previousTotalStakedAmount = totalStakedAmount;
            let description = "";

            if (event.type === "stake") {
              totalStakedAmount = totalStakedAmount + event.amount;
              description = `+${tokenAmount.toFixed(
                2
              )} WATCH from ${shortAddress}`;
              console.log(
                `[${dateStr} ${timeStr}] Transfer TO Staking: +${tokenAmount.toFixed(
                  2
                )} WATCH tokens from ${shortAddress}`
              );
            } else if (event.type === "unstake") {
              totalStakedAmount = totalStakedAmount - event.amount;
              description = `-${tokenAmount.toFixed(
                2
              )} WATCH to ${shortAddress}`;
              console.log(
                `[${dateStr} ${timeStr}] Transfer FROM Staking: -${tokenAmount.toFixed(
                  2
                )} WATCH tokens to ${shortAddress}`
              );
            }

            // Convert totalStakedAmount to a readable value
            const totalStakedValue = Number(
              ethers.formatUnits(totalStakedAmount, 18)
            );
            const previousTotalStakedValue = Number(
              ethers.formatUnits(previousTotalStakedAmount, 18)
            );

            // Calculate USD value based on staked tokens and token price
            const tvlValue = totalStakedValue * Number(tokenPrice || 0);
            const previousTvlValue =
              previousTotalStakedValue * Number(tokenPrice || 0);
            const tvlChange = tvlValue - previousTvlValue;

            console.log(
              `[${dateStr} ${timeStr}] Balance: ${previousTotalStakedValue.toFixed(
                2
              )} -> ${totalStakedValue.toFixed(2)} WATCH tokens (${
                event.type === "stake" ? "+" : "-"
              }${tokenAmount.toFixed(2)})`
            );

            console.log(
              `[${dateStr} ${timeStr}] TVL in USD: $${previousTvlValue.toFixed(
                2
              )} -> $${tvlValue.toFixed(2)} (${
                tvlChange >= 0 ? "+" : ""
              }$${tvlChange.toFixed(2)}) at price $${Number(
                tokenPrice || 0
              ).toFixed(8)}`
            );

            // Add point to history with both USD value and token amount
            historyPoints.push({
              timestamp: blockTimestamp,
              value: tvlValue,
              tokensAmount: totalStakedValue,
              blockNumber: event.blockNumber,
              transactionIndex: event.transactionIndex,
              type: event.type,
              description: description,
            });
          }

          console.log(
            `Created ${historyPoints.length} token flow history points`
          );

          // IMPORTANT CHANGE - We DO NOT group transactions by day,
          // instead we show each transaction as a separate point on the chart
          finalHistory = historyPoints
            .map((point) => ({
              timestamp: point.timestamp,
              value: point.value,
              tokensAmount: point.tokensAmount,
              description: point.description,
              type: point.type,
            }))
            .sort((a, b) => a.timestamp - b.timestamp);

          console.log(
            `Final token flow history contains ${finalHistory.length} individual transaction points`
          );

          // Log the final history points
          if (finalHistory.length > 0) {
            console.log("WATCH Token Flow History (all transactions):");
            finalHistory.forEach((point, index) => {
              const date = new Date(point.timestamp);
              console.log(
                `${
                  index + 1
                }. ${date.toLocaleString()}: ${point.tokensAmount.toFixed(
                  2
                )} WATCH tokens ($${point.value.toFixed(2)}) - ${
                  point.description
                }`
              );
            });
          }

          fetchSuccess = finalHistory.length > 0;
        }

        // After successful data retrieval, save to cache
        if (fetchSuccess && finalHistory.length > 0) {
          saveHistoryToCache(finalHistory);
        }
      } catch (fetchError) {
        console.error("Error fetching token transfers:", fetchError);
      }

      // If we couldn't get events from the contract, generate demo data
      if (!fetchSuccess) {
        console.log("No real staking/unstaking events found or error occurred");
        console.log(
          `Using token price for sample data: $${Number(
            tokenPrice || 0
          ).toFixed(8)}`
        );
        console.log(
          "Generating sample token flow history data based on current price and total staked amount"
        );
        finalHistory = generateSampleTVLHistory();
      }

      // Update history state
      setTvlHistory(finalHistory);

      // Set current TVL value based on the last point or current state
      if (finalHistory.length > 0) {
        setCurrentTVL(finalHistory[finalHistory.length - 1].value);
      } else {
        const usdValue = Number(totalStaked) * Number(tokenPrice || 0);
        setCurrentTVL(usdValue);
      }
    } catch (error) {
      console.error("Error fetching token flow history:", error);
      toast({
        title: "Error fetching token flow history",
        status: "error",
        duration: 5000,
        isClosable: true,
      });

      // Generate sample data on error
      console.log(
        "Error occurred during data fetch - falling back to sample data"
      );
      console.log(
        `Current token price used for sample data: $${Number(
          tokenPrice || 0
        ).toFixed(8)}`
      );
      console.log(
        `Current total staked tokens: ${Number(
          totalStaked
        ).toLocaleString()} WATCH`
      );
      console.log("Generating sample token flow history data after error");
      const sampleData = generateSampleTVLHistory();
      setTvlHistory(sampleData);

      if (sampleData.length > 0) {
        setCurrentTVL(sampleData[sampleData.length - 1].value);
      }
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const updateTVLHistory = (newStakedAmount: string) => {
    const tokensAmount = Number(newStakedAmount);
    const usdValue = tokensAmount * Number(tokenPrice || 0);
    const newTVLPoint = {
      timestamp: new Date().getTime(),
      value: usdValue,
      tokensAmount: tokensAmount,
    };

    setTvlHistory((prev) => {
      // Check if the new point is significantly different from the last one
      if (
        prev.length > 0 &&
        Math.abs(
          prev[prev.length - 1].tokensAmount - newTVLPoint.tokensAmount
        ) < 0.01
      ) {
        return prev;
      }

      return [...prev, newTVLPoint];
    });

    setCurrentTVL(usdValue);
  };

  useEffect(() => {
    if (stakingContract && provider && tokenPrice) {
      // When token price changes (whether from DexScreener or fallback pool calculation),
      // we refresh the TVL history to use the updated price
      console.log(
        "Token price updated to:",
        tokenPrice,
        "- refreshing TVL history"
      );
      fetchTVLHistory();
    }
  }, [stakingContract, provider, tokenPrice]);

  useEffect(() => {
    if (totalStaked !== "0") {
      // Update the current TVL point with the latest total staked amount and token price
      updateTVLHistory(totalStaked);
    }
  }, [totalStaked, tokenPrice]); // Also react to token price changes

  return (
    <>
      {renderChart({
        tvlHistory,
        isLoading: isLoadingHistory,
        currentTVL,
      })}
      {children}
    </>
  );
}
