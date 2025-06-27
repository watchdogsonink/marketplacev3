"use client";

import { Link } from "@chakra-ui/next-js";
import {
  Box,
  Button,
  Flex,
  Heading,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Avatar,
  Text,
  IconButton,
  Tooltip,
  HStack,
  Tag,
  Container,
} from "@chakra-ui/react";
import { FaRegMoon, FaStore, FaEthereum, FaBars } from "react-icons/fa";
import { IoSunny } from "react-icons/io5";
import { useWallet } from "@/hooks/useWallet";
import { motion } from "framer-motion";
import { shortenAddress } from "@/utils/shortenAddress";
import { useProfile } from "@/hooks/useProfile";
import { useColorMode } from "@chakra-ui/react";
import { FaSackXmark } from "react-icons/fa6";
import { FaUserCircle } from "react-icons/fa";
import { useZNS } from "@/hooks/useZNS";
import { useENS } from "@/hooks/useENS";
import { BiSolidDog } from "react-icons/bi";
import { FaRoad } from "react-icons/fa";
import { FaSignOutAlt } from "react-icons/fa";

const MotionFlex = motion(Flex);

export function Navbar() {
  const { account, connectWallet, disconnectWallet } = useWallet();
  const { data } = useProfile(
    account || "0x0000000000000000000000000000000000000000"
  );
  const { colorMode, toggleColorMode } = useColorMode();
  const { ensName, ensAvatar } = useENS(account);
  const { znsName, znsAvatar } = useZNS(account);

  const displayName = znsName || ensName || shortenAddress(account || "");
  const displayAvatar =
    znsAvatar ||
    ensAvatar ||
    data?.avatar ||
    `https://api.dicebear.com/9.x/pixel-art/svg?seed=${account}`;

  return (
    <>
      {/* <RiskWarningModal /> */}
      <MotionFlex
        px={{ base: "4", md: "8", lg: "12" }}
        py="4"
        bg={colorMode === "dark" ? "gray.900" : "white"}
        borderBottom="1px"
        borderColor={colorMode === "dark" ? "gray.700" : "gray.200"}
        position="fixed"
        top="0"
        left="0"
        right="0"
        zIndex="1000"
        backdropFilter="blur(10px)"
        backgroundColor={
          colorMode === "dark"
            ? "rgba(26, 32, 44, 0.8)"
            : "rgba(255, 255, 255, 0.8)"
        }
      >
        <Flex
          w="full"
          align="center"
          justify="space-between"
          maxW="7xl"
          mx="auto"
        >
          <HStack spacing="8">
            <Link
              href="/"
              _hover={{ textDecoration: "none" }}
              onClick={(e) => {
                if (!e.ctrlKey && !e.metaKey) {
                  e.preventDefault();
                  window.location.href = "/";
                }
              }}
            >
              <HStack>
                <Heading
                  size="md"
                  bgGradient="linear(to-r, #7928CA, rgb(235, 165, 231))"
                  bgClip="text"
                  _hover={{
                    bgGradient: "linear(to-r, rgb(235, 165, 231), #7928CA)",
                    transform: "scale(1.05)",
                  }}
                  transition="all 0.3s"
                  cursor="pointer"
                >
                  WATCHDOGS NFT Marketplace
                </Heading>
                <Tag
                  size="sm"
                  variant="solid"
                  colorScheme="purple"
                  borderRadius="full"
                  ml={0}
                  px={2}
                  py={1}
                  fontWeight="bold"
                  display={{ base: "none", md: "inline-flex" }}
                  bg="purple.500"
                  border="none"
                  position="relative"
                  left="3px"
                  color="white"
                >
                  Alpha
                </Tag>
              </HStack>
            </Link>
            {/* Desktop Navigation */}
            <HStack spacing="4" display={{ base: "none", md: "flex" }}>
              <Link
                href="/roadmap"
                _hover={{ textDecoration: "none" }}
                onClick={(e) => {
                  if (!e.ctrlKey && !e.metaKey) {
                    e.preventDefault();
                    window.location.href = "/roadmap";
                  }
                }}
              >
                <Button variant="ghost" leftIcon={<FaRoad size={20} />}>
                  Roadmap
                </Button>
              </Link>
              <Link
                href="/swap"
                _hover={{ textDecoration: "none" }}
                onClick={(e) => {
                  if (!e.ctrlKey && !e.metaKey) {
                    e.preventDefault();
                    window.location.href = "/swap";
                  }
                }}
              >
                <Button variant="ghost" leftIcon={<BiSolidDog size={21} />}>
                  Buy $WATCH
                </Button>
              </Link>
              <Link
                href="/staking"
                _hover={{ textDecoration: "none" }}
                onClick={(e) => {
                  if (!e.ctrlKey && !e.metaKey) {
                    e.preventDefault();
                    window.location.href = "/staking";
                  }
                }}
              >
                <Button variant="ghost" leftIcon={<FaSackXmark />}>
                  Staking
                </Button>
              </Link>
            </HStack>
          </HStack>

          <HStack spacing="4">
            <Tooltip label={colorMode === "light" ? "Dark mode" : "Light mode"}>
              <IconButton
                aria-label="Toggle theme"
                icon={colorMode === "light" ? <FaRegMoon /> : <IoSunny />}
                onClick={toggleColorMode}
                variant="ghost"
                _hover={{
                  transform: "rotate(360deg)",
                  transition: "all 0.5s",
                }}
              />
            </Tooltip>

            {account ? (
              <Menu>
                <MenuButton
                  as={Button}
                  variant="ghost"
                  _hover={{
                    bg: colorMode === "dark" ? "gray.700" : "gray.100",
                  }}
                >
                  <HStack>
                    <Avatar size="sm" src={displayAvatar} />
                    <Text display={{ base: "none", md: "block" }}>
                      {displayName}
                    </Text>
                  </HStack>
                </MenuButton>
                <MenuList>
                  <MenuItem
                    as={Link}
                    href={`/profile/${account}`}
                    _hover={{ textDecoration: "none" }}
                    icon={<FaUserCircle />}
                    onClick={(e) => {
                      if (!e.ctrlKey && !e.metaKey) {
                        e.preventDefault();
                        window.location.href = `/profile/${account}`;
                      }
                    }}
                  >
                    <HStack>
                      <Text>My Collections</Text>
                    </HStack>
                  </MenuItem>
                  <MenuItem
                    as={Link}
                    href="/stats"
                    _hover={{ textDecoration: "none" }}
                    icon={<FaStore />}
                    onClick={(e) => {
                      if (!e.ctrlKey && !e.metaKey) {
                        e.preventDefault();
                        window.location.href = "/stats";
                      }
                    }}
                  >
                    <HStack>
                      <Text>Stats</Text>
                    </HStack>
                  </MenuItem>
                  <MenuItem
                    onClick={disconnectWallet}
                    _hover={{
                      bg: colorMode === "dark" ? "red.800" : "red.100",
                      color: colorMode === "dark" ? "red.200" : "red.600",
                    }}
                  >
                    <HStack>
                      <FaSignOutAlt />
                      <Text>Disconnect</Text>
                    </HStack>
                  </MenuItem>
                </MenuList>
              </Menu>
            ) : (
              <Button
                onClick={connectWallet}
                bgGradient="linear(to-r, #7928CA, rgb(235, 165, 231))"
                color="white"
                _hover={{
                  bgGradient: "linear(to-r, rgb(235, 165, 231), #7928CA)",
                  transform: "scale(1.05)",
                }}
                transition="all 0.3s"
              >
                Connect Wallet
              </Button>
            )}
            {/* Mobile Menu */}
            <Menu>
              <MenuButton
                as={IconButton}
                icon={<FaBars />}
                variant="ghost"
                display={{ base: "flex", md: "none" }}
                aria-label="Open menu"
              />
              <MenuList>
                <MenuItem as={Link} href="/roadmap" icon={<FaRoad />}>
                  Roadmap
                </MenuItem>
                <MenuItem as={Link} href="/swap" icon={<BiSolidDog />}>
                  Buy $WATCH
                </MenuItem>
                <MenuItem as={Link} href="/staking" icon={<FaSackXmark />}>
                  Staking
                </MenuItem>
              </MenuList>
            </Menu>
          </HStack>
        </Flex>
      </MotionFlex>
    </>
  );
}
