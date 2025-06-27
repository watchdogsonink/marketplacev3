"use client";

import {
  Box,
  Heading,
  Text,
  useColorModeValue,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatGroup,
  Flex,
  Button,
} from "@chakra-ui/react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import { formatEther } from "ethers";
import { useParams } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import {
  MdKeyboardDoubleArrowLeft,
  MdKeyboardDoubleArrowRight,
} from "react-icons/md";
import { RiArrowLeftSLine, RiArrowRightSLine } from "react-icons/ri";

type HistoryItem = {
  timestamp: string;
  price: string;
};

export function AnalyticsGrid() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [itemsPerPage] = useState<number>(30);
  const [currentPageIndex, setCurrentPageIndex] = useState<number>(0);
  const params = useParams();
  const contractAddress = params.contractAddress as string;

  const lineColor = useColorModeValue("#7928CA", "#B794F4");
  const gradientStart = useColorModeValue(
    "rgba(121, 40, 202, 0.2)",
    "rgba(183, 148, 244, 0.2)"
  );
  const gradientEnd = useColorModeValue(
    "rgba(121, 40, 202, 0)",
    "rgba(183, 148, 244, 0)"
  );
  const gridColor = useColorModeValue("#E2E8F0", "#2D3748");
  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const textColor = useColorModeValue("gray.800", "white");
  const tooltipTextColor = useColorModeValue("gray.600", "gray.300");

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        console.log("Fetching analytics for contract:", contractAddress);
        if (!contractAddress) {
          console.error("No contract address provided");
          return;
        }

        const formattedAddress = contractAddress.toLowerCase();
        const url = `https://weycliznaagngmzpancf.supabase.co/storage/v1/object/public/market_trades/${formattedAddress}.json`;
        console.log("Fetching from URL:", url);

        const response = await fetch(url, {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
          },
          cache: "no-store",
        });

        if (!response.ok) {
          console.error("Response status:", response.status);
          console.error("Response status text:", response.statusText);
          throw new Error(`Network response was not ok: ${response.status}`);
        }

        const data = await response.json();
        console.log("Received data:", data);

        // sort data by timestamp and prepare data for chart
        const sortedData = data.data
          .map((item: any) => ({
            timestamp: new Date(item.timestamp).getTime(),
            price: parseFloat(formatEther(item.price)),
          }))
          .sort((a: any, b: any) => a.timestamp - b.timestamp);

        setHistory(sortedData);
      } catch (error) {
        console.error("Failed to fetch history:", error);
        setHistory([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (contractAddress) {
      fetchHistory();
    } else {
      console.error("No contract address available in params");
      setIsLoading(false);
    }
  }, [contractAddress]);

  // order data by timestamp (from newest to oldest) and split into pages
  const sortedHistory = useMemo(() => {
    return [...history].sort(
      (a, b) => Number(b.timestamp) - Number(a.timestamp)
    );
  }, [history]);

  const totalItems = sortedHistory.length;
  const numberOfPages = Math.ceil(totalItems / itemsPerPage);

  // data to display on current page (reverse order, so on chart from left to right are from oldest to newest)
  const currentPageItems = useMemo(() => {
    const start = currentPageIndex * itemsPerPage;
    const end = start + itemsPerPage;
    return sortedHistory.slice(start, end).reverse();
  }, [sortedHistory, currentPageIndex, itemsPerPage]);

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
          Loading analytics...
        </Text>
      </Box>
    );
  }

  if (!history.length) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minH="200px"
        width="100%"
      >
        <Text fontSize="lg" color="gray.500">
          No data available
        </Text>
      </Box>
    );
  }

  return (
    <Box
      p={6}
      bg={bgColor}
      borderRadius="xl"
      borderWidth="1px"
      borderColor={borderColor}
    >
      <Heading size="lg" mb={8}>
        Price History
      </Heading>
      <Box height="400px" mb={8}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={currentPageItems}>
            <defs>
              <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={lineColor} stopOpacity={0.2} />
                <stop offset="95%" stopColor={lineColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={gridColor}
              vertical={false}
            />
            <XAxis
              dataKey="timestamp"
              tickFormatter={(timestamp) =>
                new Date(timestamp).toLocaleDateString()
              }
              stroke={gridColor}
              tick={{ fill: textColor }}
            />
            <YAxis
              tickFormatter={(value) => `${value} ETH`}
              stroke={gridColor}
              tick={{ fill: textColor }}
              domain={["auto", "auto"]}
              padding={{ top: 20 }}
              allowDataOverflow={false}
              tickCount={6}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: bgColor,
                borderColor: borderColor,
                borderRadius: "8px",
                color: tooltipTextColor,
              }}
              labelStyle={{ color: tooltipTextColor }}
              itemStyle={{ color: tooltipTextColor }}
              labelFormatter={(timestamp) =>
                new Date(timestamp).toLocaleString()
              }
              formatter={(value: any) => [`${value} ETH`, "Price"]}
            />
            <Area
              type="monotone"
              dataKey="price"
              stroke={lineColor}
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorPrice)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </Box>

      {/* Chart pagination */}
      {numberOfPages > 1 && (
        <Box
          mx="auto"
          maxW={{ base: "90vw", lg: "700px" }}
          mt="20px"
          mb="20px"
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

      <Box mt={8}>
        <Heading size="md" mb={4}>
          Collection Statistics
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
            sm: "repeat(2, 1fr)",
            md: "repeat(4, 1fr)",
          }}
          width="100%"
        >
          <Stat textAlign={{ base: "center", md: "left" }}>
            <StatLabel>Average Price</StatLabel>
            <StatNumber>
              {(
                history.reduce((acc, item) => acc + Number(item.price), 0) /
                history.length
              ).toFixed(6)}{" "}
              ETH
            </StatNumber>
          </Stat>

          <Stat textAlign="center">
            <StatLabel>Lowest Price</StatLabel>
            <StatNumber>
              {Math.min(...history.map((item) => Number(item.price))).toFixed(
                6
              )}{" "}
              ETH
            </StatNumber>
          </Stat>

          <Stat textAlign="center">
            <StatLabel>Highest Price</StatLabel>
            <StatNumber>
              {Math.max(...history.map((item) => Number(item.price))).toFixed(
                6
              )}{" "}
              ETH
            </StatNumber>
          </Stat>

          <Stat textAlign={{ base: "center", md: "right" }}>
            <StatLabel>Total Volume</StatLabel>
            <StatNumber>
              {history
                .reduce((acc, item) => acc + Number(item.price), 0)
                .toFixed(6)}{" "}
              ETH
            </StatNumber>
          </Stat>
        </StatGroup>
      </Box>
    </Box>
  );
}
