"use client";

import { NFT_CONTRACTS } from "@/consts/nft_contracts";
import { Link } from "@chakra-ui/next-js";
import {
  Box,
  Card,
  CardBody,
  Heading,
  Image,
  Text,
  SimpleGrid,
  Container,
  useColorModeValue,
  AspectRatio,
  Flex,
  Button,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { MintTimer } from "@/components/mint-page/MintTimer";

const BackgroundSlider = ({ delay = 0, opacity = 0.1, top = "20%" }) => {
  const bgColor = useColorModeValue("purple.100", "purple.900");

  return (
    <Box
      position="absolute"
      top={top}
      left={0}
      right={0}
      bottom={0}
      overflow="hidden"
      zIndex={0}
      opacity={opacity}
      display="flex"
      alignItems="center"
      bg={bgColor}
    >
      <Flex
        position="absolute"
        animation={{
          base: `scroll-left 30s linear ${delay}s infinite`,
          md: `scroll-left 140s linear ${delay}s infinite`,
        }}
        width="fit-content"
        gap={4}
        right={0}
        opacity={0}
        style={{ animationFillMode: "forwards" }}
      >
        {NFT_CONTRACTS.map((contract, index) => (
          <Image
            key={index}
            src={contract.thumbnailUrl}
            alt=""
            height="200px"
            width="200px"
            objectFit="cover"
            borderRadius="xl"
          />
        ))}
      </Flex>
    </Box>
  );
};

// Main component
export default function Home() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const bgGradient = useColorModeValue(
    "linear(to-br, purple.100, blue.50)",
    "linear(to-br, purple.900, gray.900)"
  );
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");

  const mintableCollections = NFT_CONTRACTS.filter((item) => item.mintable);
  const regularCollections = NFT_CONTRACTS.filter((item) => !item.mintable);

  // Render basic structure during SSR
  if (!mounted) {
    return (
      <Box>
        <Box py={20} px={4}>
          <Container maxW="container.xl">
            {/* You can add a skeleton loader or other placeholder */}
          </Container>
        </Box>
      </Box>
    );
  }

  // Full rendering after hydration
  return (
    <Box>
      {/* Hero Section */}
      <Box
        bgGradient={bgGradient}
        py={20}
        px={4}
        textAlign="center"
        position="relative"
        overflow="hidden"
      >
        <BackgroundSlider opacity={0.1} delay={0} top="0" />
        <BackgroundSlider opacity={0.1} delay={120} top="0" />
        <Container maxW="container.xl" position="relative" zIndex={1}>
          <Heading
            size="2xl"
            mb={6}
            bgGradient="linear(to-r, brand.500, ink.accent)"
            bgClip="text"
          >
            Discover, Collect, and Sell NFTs
          </Heading>
          <Text fontSize="xl" color="gray.500" mb={8}>
            INK Network Marketplace - Your NFT Trading Hub
          </Text>
        </Container>
      </Box>

      {/* Main Content Section */}
      <Container maxW="container.xl" py={12} width={"96%"}>
        <Flex
          direction={{ base: "column", lg: "row" }}
          gap={12}
          align="flex-start"
          justify="flex-start"
        >
          {/* Mintable Collections Section */}
          {mintableCollections.length > 0 ? (
            <>
              <Box
                minW={{ lg: "280px", base: "100%" }}
                maxW={{ lg: "280px", base: "100%" }}
                mx={{ base: "auto", lg: "0" }}
              >
                <Heading
                  size="xl"
                  mb={8}
                  bgGradient="linear(to-r, brand.500, ink.accent)"
                  bgClip="text"
                  textAlign="center"
                >
                  Mint Now
                </Heading>
                <SimpleGrid
                  columns={1}
                  spacing={1}
                  alignContent={"right"}
                  width={{ base: "100%", lg: "auto" }}
                >
                  {mintableCollections.map((item) => (
                    <Link
                      key={item.address}
                      href={`/collection/57073/${item.address}`}
                      _hover={{ textDecoration: "none" }}
                      width={{ base: "100%", lg: "auto" }}
                    >
                      <Card
                        bg={cardBg}
                        border="2px"
                        borderColor="brand.500"
                        transition="all 0.3s"
                        overflow="hidden"
                        _hover={{
                          transform: "translateY(-4px)",
                          shadow: "xl",
                          borderColor: "brand.400",
                        }}
                        width={{ base: "100%", lg: "auto" }}
                      >
                        <AspectRatio ratio={1} position="relative">
                          <Box>
                            <Image
                              src={item.thumbnailUrl}
                              alt={item.title}
                              objectFit="cover"
                              width="100%"
                              height="100%"
                            />
                            <Box
                              position="absolute"
                              bottom="0"
                              left="0"
                              right="0"
                              zIndex="1"
                              p={2}
                            >
                              <MintTimer compact={true} />
                            </Box>
                          </Box>
                        </AspectRatio>
                        <CardBody>
                          <Heading size="md" mb={4}>
                            {item.title}
                          </Heading>
                          <Text color="gray.500" noOfLines={3} mb={3}>
                            {item.description}
                          </Text>
                          <Button
                            as={Link}
                            href={`/collection/57073/${item.address}/mint`}
                            w={{ base: "100%", md: "100%" }}
                            size="md"
                            colorScheme="brand"
                            bg="rgb(88, 72, 213)"
                            _hover={{
                              bg: "rgb(98, 82, 223)",
                              textDecoration: "none",
                            }}
                            height="40px"
                            borderRadius="6px"
                            fontSize="14px"
                            fontWeight="500"
                          >
                            Mint Now
                          </Button>
                        </CardBody>
                      </Card>
                    </Link>
                  ))}
                </SimpleGrid>
              </Box>

              {/* Separator */}
              <Box
                display={{ base: "none", lg: "block" }}
                width="1px"
                bg="whiteAlpha.300"
                alignSelf="stretch"
                ml={0}
                mr={0}
              />
            </>
          ) : null}

          {/* Featured Collections Section - show only if there are non-mintable collections */}
          {regularCollections.length > 0 && (
            <Box flex="1">
              <Heading
                size="xl"
                mb={8}
                bgGradient="linear(to-r, brand.500, ink.accent)"
                bgClip="text"
                textAlign="center"
              >
                Featured Collections
              </Heading>
              <SimpleGrid
                columns={{ base: 1, sm: 2, md: 3, lg: 4, xl: 4 }}
                spacing={6}
              >
                {regularCollections.map((item) => (
                  <Box key={item.address}>
                    {item.available !== false ? (
                      <Link
                        href={`/collection/57073/${item.address}`}
                        _hover={{ textDecoration: "none" }}
                      >
                        <Card
                          bg={cardBg}
                          border="1px"
                          borderColor={borderColor}
                          transition="all 0.3s"
                          overflow="hidden"
                          w="100%"
                          h="100%"
                          _hover={{
                            transform: "translateY(-4px)",
                            shadow: "xl",
                            borderColor: "brand.500",
                          }}
                        >
                          <AspectRatio ratio={1}>
                            <Image
                              src={item.thumbnailUrl}
                              alt={item.title}
                              objectFit="cover"
                              width="100%"
                              height="100%"
                            />
                          </AspectRatio>
                          <CardBody>
                            <Heading size="md" mb={4}>
                              {item.title}
                            </Heading>
                            <Text color="gray.500" noOfLines={3} mb={3}>
                              {item.description}
                            </Text>
                          </CardBody>
                        </Card>
                      </Link>
                    ) : (
                      <Card
                        bg={cardBg}
                        border="1px"
                        borderColor={borderColor}
                        opacity={0.6}
                        cursor="not-allowed"
                        w="100%"
                        h="100%"
                        position="relative"
                        overflow="hidden"
                      >
                        <Box
                          position="absolute"
                          top="50%"
                          left="50%"
                          transform="translate(-50%, -50%) rotate(30deg)"
                          bg="rgba(88, 72, 213, 0.9)"
                          color="white"
                          py={2}
                          px={8}
                          fontSize="xl"
                          fontWeight="bold"
                          zIndex={10}
                          width="150%"
                          textAlign="center"
                          boxShadow="lg"
                          letterSpacing="wider"
                        >
                          Coming Soon
                        </Box>
                        <AspectRatio ratio={1}>
                          <Image
                            src={item.thumbnailUrl}
                            alt={item.title}
                            objectFit="cover"
                            width="100%"
                            height="100%"
                          />
                        </AspectRatio>
                        <CardBody>
                          <Heading size="md" mb={4}>
                            {item.title}
                          </Heading>
                          <Text color="gray.500" noOfLines={3} mb={3}>
                            {item.description}
                          </Text>
                        </CardBody>
                      </Card>
                    )}
                  </Box>
                ))}
              </SimpleGrid>
            </Box>
          )}
        </Flex>
      </Container>
    </Box>
  );
}

const styles = `
  @media screen and (max-width: 48em) {
    @keyframes scroll-left {
      0% {
        transform: translateX(100%);
        opacity: 1;
      }
     
      100% {
        transform: translateX(-500%);
        opacity: 1;
      }
    }
  }

  @media screen and (min-width: 48em) {
    @keyframes scroll-left {
      0% {
        transform: translateX(100%);
        opacity: 1;
      }
     
      100% {
        transform: translateX(-350%);
        opacity: 1;
      }
    }
  }
`;

// Add styles to head
if (typeof document !== "undefined") {
  const styleSheet = document.createElement("style");
  styleSheet.innerText = styles;
  document.head.appendChild(styleSheet);
}
