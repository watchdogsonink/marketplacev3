import { Box, Text, useColorModeValue } from "@chakra-ui/react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// Define types for the TVL history data
export type TVLDataPoint = {
  timestamp: number;
  value: number;
  tokensAmount: number;
  description?: string;
  type?: string;
};

interface TVLChartProps {
  tvlHistory: TVLDataPoint[];
  isLoading: boolean;
  height?: string | number;
}

export default function TVLChart({
  tvlHistory,
  isLoading,
  height = "400px",
}: TVLChartProps) {
  // Color values based on theme
  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const textColor = useColorModeValue("gray.800", "white");
  const lineColor = useColorModeValue("#7928CA", "#B794F4");
  const gridColor = useColorModeValue("#E2E8F0", "#2D3748");

  // Format date for display on X-axis
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return `${date.getDate().toString().padStart(2, "0")}.${(
      date.getMonth() + 1
    )
      .toString()
      .padStart(2, "0")}.${date.getFullYear().toString().slice(2)}`;
  };

  if (isLoading) {
    return (
      <Box
        height={height}
        mb={8}
        display="flex"
        justifyContent="center"
        alignItems="center"
      >
        <Text fontSize="lg" color="gray.500">
          Loading staking history...
        </Text>
      </Box>
    );
  }

  if (!tvlHistory || tvlHistory.length === 0) {
    return (
      <Box
        height={height}
        mb={8}
        display="flex"
        justifyContent="center"
        alignItems="center"
      >
        <Text fontSize="lg" color="gray.500">
          No staking history data available
        </Text>
      </Box>
    );
  }

  return (
    <Box height={height} mb={8}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={tvlHistory}>
          <defs>
            <linearGradient id="colorTVL" x1="0" y1="0" x2="0" y2="1">
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
            tickFormatter={formatDate}
            stroke={gridColor}
            tick={{ fill: textColor }}
            interval="preserveEnd"
            minTickGap={40}
            height={40}
          />
          <YAxis
            tickFormatter={(value) =>
              `$${Number(value).toLocaleString("en-US", {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              })}`
            }
            stroke={gridColor}
            tick={{ fill: textColor }}
            domain={["auto", "auto"]}
            padding={{ top: 20 }}
            tickCount={6}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: bgColor,
              borderColor: borderColor,
              borderRadius: "8px",
            }}
            labelFormatter={formatDate}
            formatter={(value: number) => [
              `$${Number(value).toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}`,
              "USD Value",
            ]}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={lineColor}
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorTVL)"
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </Box>
  );
}
