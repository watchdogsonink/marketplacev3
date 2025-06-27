"use client";

import {
  Box,
  Container,
  Heading,
  Text,
  HStack,
  Avatar,
  Button,
  IconButton,
  Center,
  AvatarBadge,
  useColorMode,
  useColorModeValue,
  Flex,
  useToast,
  InputGroup,
  Input,
  InputRightElement,
  Collapse,
  useDisclosure,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
} from "@chakra-ui/react";
import { useProfile } from "@/hooks/useProfile";
import { UserNFTs } from "@/components/profile-page/UserNFTs";
import {
  FaEthereum,
  FaCopy,
  FaShareAlt,
  FaCamera,
  FaTelegram,
} from "react-icons/fa";
import { useWallet } from "@/hooks/useWallet";
import { shortenAddress } from "thirdweb/utils";
import { useRef, useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { NFT_CONTRACTS } from "@/consts/nft_contracts";
import { MdKeyboardDoubleArrowRight } from "react-icons/md";
import { Link } from "@chakra-ui/next-js";
import { RiTwitterXFill } from "react-icons/ri";

const MotionBox = motion(Box);

export default function ProfilePage({
  params,
}: {
  params: { address: string };
}) {
  const { data, updateAvatar } = useProfile(params.address);
  const { account } = useWallet();
  const { colorMode } = useColorMode();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isOwnProfile = account?.toLowerCase() === params.address.toLowerCase();
  const [totalNFTs, setTotalNFTs] = useState(0);
  const [isLoadingNFTs, setIsLoadingNFTs] = useState(true);
  const toast = useToast();
  const { isOpen, onToggle } = useDisclosure();

  const bgGradient = useColorModeValue(
    "linear(to-br, purple.100, blue.50)",
    "linear(to-br, purple.900, gray.900)"
  );

  const handleAvatarChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result as string;
          updateAvatar(base64);
        };
        reader.readAsDataURL(file);
      }
    },
    [updateAvatar]
  );

  useEffect(() => {
    async function fetchTotalNFTs() {
      try {
        let allItems: any[] = [];
        let hasMorePages = true;
        let nextPageParams = null;

        while (hasMorePages) {
          let url = `https://explorer.inkonchain.com/api/v2/addresses/${params.address}/nft?type=ERC-721%2CERC-404%2CERC-1155&limit=50`;

          if (nextPageParams) {
            url += `&items_count=${nextPageParams.items_count}`;
            url += `&token_contract_address_hash=${nextPageParams.token_contract_address_hash}`;
            url += `&token_id=${nextPageParams.token_id}`;
            url += `&token_type=${nextPageParams.token_type}`;
          }

          const response = await fetch(url, {
            headers: {
              accept: "application/json",
            },
          });

          const data = await response.json();

          if (data.items && data.items.length) {
            allItems = [...allItems, ...data.items];

            if (data.next_page_params) {
              nextPageParams = data.next_page_params;
            } else {
              hasMorePages = false;
            }
          } else {
            hasMorePages = false;
          }
        }

        const ourContractAddresses = new Set(
          NFT_CONTRACTS.map((contract) => contract.address.toLowerCase())
        );

        const filteredItems = allItems.filter((item) =>
          ourContractAddresses.has(item.token.address.toLowerCase())
        );

        setTotalNFTs(filteredItems.length);
        setIsLoadingNFTs(false);
      } catch (error) {
        console.error("Error fetching total NFTs:", error);
        setTotalNFTs(0);
        setIsLoadingNFTs(false);
      }
    }

    fetchTotalNFTs();
  }, [params.address]);

  const handleShare = (platform: "twitter" | "telegram" | "copy") => {
    const url = window.location.href;
    const shareText = `Check out my profile on WatchDogs Marketplace on INK Network! 🐕`;

    switch (platform) {
      case "twitter":
        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
          shareText
        )}&url=${encodeURIComponent(url)}`;
        window.open(twitterUrl, "_blank");
        break;

      case "telegram":
        const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(
          url
        )}&text=${encodeURIComponent(shareText)}`;
        window.open(telegramUrl, "_blank");
        break;

      case "copy":
        navigator.clipboard.writeText(url);
        toast({
          title: "Link copied to clipboard",
          status: "success",
          duration: 2000,
          isClosable: true,
        });
        break;
    }
  };

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(params.address);
    toast({
      title: "Address copied to clipboard",
      status: "success",
      duration: 2000,
      isClosable: true,
    });
  };

  return (
    <Box as="main">
      {/* Hero Section with Avatar and Info */}
      <Box bgGradient={bgGradient} py={12} px={4} mb={8}>
        <Container maxW="container.lg">
          <Flex direction="column" align="center" gap={6}>
            {/* Avatar Section */}
            <Box position="relative">
              <Avatar
                size="2xl"
                src={
                  data.avatar ||
                  `https://api.dicebear.com/9.x/pixel-art/svg?seed=${account}`
                }
                bg={colorMode === "dark" ? "gray.700" : "gray.100"}
                position="relative"
              >
                {isOwnProfile && (
                  <AvatarBadge
                    boxSize="8"
                    bg="green.500"
                    borderColor={colorMode === "dark" ? "gray.800" : "white"}
                  />
                )}
                {isOwnProfile && (
                  <Box
                    position="absolute"
                    inset="0"
                    rounded="full"
                    bg="blackAlpha.600"
                    opacity="0"
                    transition="opacity 0.2s"
                    _hover={{ opacity: 1 }}
                    cursor="pointer"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Center height="100%">
                      <FaCamera color="white" size="24px" />
                    </Center>
                  </Box>
                )}
              </Avatar>
              <input
                type="file"
                ref={fileInputRef}
                hidden
                accept="image/*"
                onChange={handleAvatarChange}
              />
            </Box>

            {/* Info Section */}
            <Box textAlign="center">
              <Heading
                size="lg"
                mb={3}
                bgGradient="linear(to-r, brand.500, ink.accent)"
                bgClip="text"
              >
                {isOwnProfile ? "Your Collections" : "NFT Collections"}
              </Heading>
              <HStack justify="center" spacing="3" mb={4}>
                <Text color="gray.500">{shortenAddress(params.address)}</Text>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleCopyAddress}
                  leftIcon={<FaCopy />}
                >
                  Copy
                </Button>
                <Menu>
                  <MenuButton
                    as={Button}
                    size="sm"
                    variant="ghost"
                    leftIcon={<FaShareAlt />}
                  >
                    Share
                  </MenuButton>
                  <MenuList>
                    <MenuItem
                      icon={<RiTwitterXFill />}
                      onClick={() => handleShare("twitter")}
                    >
                      Share on X
                    </MenuItem>
                    <MenuItem
                      icon={<FaTelegram />}
                      onClick={() => handleShare("telegram")}
                    >
                      Share on Telegram
                    </MenuItem>
                    <MenuItem
                      icon={<FaCopy />}
                      onClick={() => handleShare("copy")}
                    >
                      Copy Link
                    </MenuItem>
                  </MenuList>
                </Menu>
              </HStack>
              <HStack spacing="6" justify="center">
                <Box>
                  <Text color="gray.500">Total NFTs</Text>
                  <Text fontSize="2xl">{totalNFTs}</Text>
                </Box>
                {/*<Box>*/}
                {/*  <Text color="gray.500">Total Value</Text>*/}
                {/*  <HStack justify="center">*/}
                {/*    <FaEthereum />*/}
                {/*    <Text fontSize="2xl">{data.totalValue.toFixed(8)}</Text>*/}
                {/*  </HStack>*/}
                {/*</Box>*/}
              </HStack>
            </Box>
          </Flex>
        </Container>
      </Box>

      {/* NFTs Section */}
      <Container maxW="container.xl">
        {isLoadingNFTs ? (
          <Center minH="200px">
            <Text color="gray.500">Loading NFTs...</Text>
          </Center>
        ) : totalNFTs === 0 ? (
          <Box maxW="400px" mx="auto">
            <Box
              bg={colorMode === "dark" ? "gray.800" : "white"}
              rounded="xl"
              overflow="hidden"
              shadow="sm"
              borderWidth="1px"
              borderColor={colorMode === "dark" ? "gray.700" : "gray.200"}
              p={8}
            >
              <Flex
                direction="column"
                align="center"
                justify="center"
                textAlign="center"
                gap={4}
              >
                <Text fontSize="lg" color="gray.500">
                  {isOwnProfile
                    ? "You don't have any NFTs yet"
                    : "This wallet doesn't have any NFTs yet"}
                </Text>
                <Link href="/">
                  <Button
                    colorScheme="brand"
                    size="lg"
                    leftIcon={<MdKeyboardDoubleArrowRight />}
                  >
                    Explore Collections
                  </Button>
                </Link>
              </Flex>
            </Box>
          </Box>
        ) : (
          <UserNFTs address={params.address} />
        )}
      </Container>
    </Box>
  );
}
