"use client";

import {
  Box,
  Container,
  Heading,
  Text,
  useColorMode,
  Button,
  Flex,
} from "@chakra-ui/react";
import { useWallet } from "@/hooks/useWallet";
import { useEffect, useState } from "react";

export default function SwapPage() {
  const { colorMode } = useColorMode();
  const { account, connectWallet } = useWallet();
  const [widgetUrl, setWidgetUrl] = useState("");
  const bgGradient =
    colorMode === "dark"
      ? "linear(to-br, purple.900, gray.900)"
      : "linear(to-br, purple.100, blue.50)";

  useEffect(() => {
    if (account) {
      const url = new URL("https://superswap.ink/");
      url.searchParams.set(
        "token1",
        "0x53EB0098d09B8d1008f382BbD2A5D4f649111710"
      );
      url.searchParams.set("token0", "NATIVE");
      url.searchParams.set("theme", colorMode === "dark" ? "dark" : "light");
      setWidgetUrl(url.toString());
    }
  }, [account, colorMode]);

  if (!account) {
    return (
      <Box>
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
            backgroundImage: "url('/swap.webp')",
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
              Swap $WATCH Tokens
            </Heading>
            <Text fontSize="xl" textAlign="center" mb={8} color="gray.500">
              Connect your wallet to start trading
            </Text>
            <Box textAlign="center">
              <Button
                onClick={connectWallet}
                bgGradient="linear(to-r, #7928CA, rgb(235, 165, 231))"
                color="white"
                _hover={{
                  bgGradient: "linear(to-r, rgb(235, 165, 231), #7928CA)",
                  transform: "scale(1.05)",
                }}
                transition="all 0.3s"
                size="lg"
              >
                Connect Wallet
              </Button>
            </Box>
          </Container>
        </Box>
      </Box>
    );
  }

  return (
    <Box>
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
          backgroundImage: "url('/swap.webp')",
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
            Swap $WATCH Tokens
          </Heading>
          <Text fontSize="xl" textAlign="center" mb={4} color="gray.500">
            Swap ETH for $WATCH or other tokens on the INK network
          </Text>
          <Text fontSize="sm" textAlign="center" color="orange.500">
            Note: You will need to connect your wallet again in the SuperSwap
            interface
          </Text>
        </Container>
      </Box>

      <Container maxW="container.xl" py={8}>
        <Flex
          gap={6}
          justify="center"
          align="stretch"
          direction={{ base: "column", lg: "row" }}
        >
          <Box
            flex="1"
            maxW="600px"
            bg={colorMode === "dark" ? "gray.800" : "white"}
            borderRadius="xl"
            overflow="hidden"
            boxShadow="xl"
            border="1px solid"
            borderColor={colorMode === "dark" ? "gray.700" : "gray.200"}
          >
            {widgetUrl && (
              <iframe
                src={widgetUrl}
                width="100%"
                height="800px"
                style={{
                  border: 0,
                  margin: "0 auto",
                  display: "block",
                  borderRadius: "10px",
                }}
              />
            )}
          </Box>

          <Box
            flex="1"
            maxW="600px"
            bg={colorMode === "dark" ? "gray.800" : "white"}
            borderRadius="xl"
            overflow="hidden"
            boxShadow="xl"
            border="1px solid"
            borderColor={colorMode === "dark" ? "gray.700" : "gray.200"}
            height="800px"
            position="relative"
          >
            <iframe
              id="dextools-widget"
              title="DEXTools Trading Chart"
              width="100%"
              height="800px"
              src="https://www.dextools.io/widget-chart/en/ink/pe-light/0x7db9f3b03423eefa7929c1c27cf1cfe1f63a43c5?theme=dark&chartType=2&chartResolution=30&drawingToolbars=false"
              style={{
                border: 0,
                borderRadius: "10px",
              }}
            />
          </Box>
        </Flex>
      </Container>
    </Box>
  );
}
