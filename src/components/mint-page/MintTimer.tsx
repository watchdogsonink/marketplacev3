import { Box, Text, Flex, useColorModeValue } from "@chakra-ui/react";
import { useState, useEffect, useMemo } from "react";

interface MintTimerProps {
  compact?: boolean;
}

// Exported component for displaying timer on main page
export function MintTimer({ compact = false }: MintTimerProps) {
  const timerBgColor = useColorModeValue(
    compact ? "rgba(255, 255, 255, 0.85)" : "purple.50",
    compact ? "rgba(0, 0, 0, 0.7)" : "gray.700"
  );
  const timerTextColor = useColorModeValue("purple.800", "purple.200");

  // States
  const [timeRemaining, setTimeRemaining] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);
  const [isMintingClosed, setIsMintingClosed] = useState(false);

  // End date - 7 days from now (for testing)
  const MINT_END_DATE = useMemo(() => {
    const endDate = new Date("2025-03-31T16:00:00");
    return endDate.getTime();
  }, []);

  // Timer countdown logic
  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = new Date().getTime();
      const distance = MINT_END_DATE - now;

      if (distance <= 0) {
        setIsMintingClosed(true);
        setTimeRemaining(null);
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      );
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setTimeRemaining({ days, hours, minutes, seconds });
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 1000);
    return () => clearInterval(interval);
  }, [MINT_END_DATE]);

  if (!timeRemaining && isMintingClosed) {
    return (
      <Box
        bg={compact ? "rgba(220, 38, 38, 0.8)" : "red.50"}
        color={compact ? "white" : "red.800"}
        p={compact ? 1 : 2}
        borderRadius="md"
        fontSize={compact ? "xs" : "sm"}
        textAlign="center"
        boxShadow={compact ? "md" : "none"}
      >
        Mint ended
      </Box>
    );
  }

  if (!timeRemaining) return null;

  // compact version to display on the image
  if (compact) {
    return (
      <Flex
        bg={timerBgColor}
        p={1}
        px={2}
        borderRadius="md"
        fontSize="md"
        justify="center"
        align="center"
        boxShadow="md"
      >
        <Text fontSize="md" fontWeight="bold" color={timerTextColor} mr={1}>
          Mint Ends In:
        </Text>
        <Text fontWeight="bold" color={timerTextColor}>
          {timeRemaining.days}d
        </Text>
        <Text mx={1} color={timerTextColor}>
          :
        </Text>
        <Text fontWeight="bold" color={timerTextColor}>
          {timeRemaining.hours}h
        </Text>
        <Text mx={1} color={timerTextColor}>
          :
        </Text>
        <Text fontWeight="bold" color={timerTextColor}>
          {timeRemaining.minutes}m
        </Text>
        <Text mx={1} color={timerTextColor}>
          :
        </Text>
        <Text fontWeight="bold" color={timerTextColor}>
          {timeRemaining.seconds}s
        </Text>
      </Flex>
    );
  }

  // standart version
  return (
    <Box bg={timerBgColor} p={2} borderRadius="md" fontSize="sm">
      <Text
        fontWeight="medium"
        mb={1}
        textAlign="center"
        color={timerTextColor}
      >
        Mint Ends In:
      </Text>
      <Flex justify="space-between" align="center">
        <Box textAlign="center" flex="1">
          <Text fontWeight="bold" color={timerTextColor}>
            {timeRemaining.days}d
          </Text>
        </Box>
        <Box textAlign="center" flex="1">
          <Text fontWeight="bold" color={timerTextColor}>
            {timeRemaining.hours}h
          </Text>
        </Box>
        <Box textAlign="center" flex="1">
          <Text fontWeight="bold" color={timerTextColor}>
            {timeRemaining.minutes}m
          </Text>
        </Box>
        <Box textAlign="center" flex="1">
          <Text fontWeight="bold" color={timerTextColor}>
            {timeRemaining.seconds}s
          </Text>
        </Box>
      </Flex>
    </Box>
  );
}
