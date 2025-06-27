"use client";

import { shortenAddress } from "@/utils/shortenAddress";
import {
  Box,
  Container,
  Stack,
  Text,
  Flex,
  Link,
  IconButton,
  Divider,
  useColorModeValue,
  HStack,
  useToast,
  Image,
  useDisclosure,
} from "@chakra-ui/react";
import {
  FaTelegram,
  FaGlobe,
  FaChartBar,
  FaCopy,
  FaShieldAlt,
} from "react-icons/fa";
import { RiTwitterXFill } from "react-icons/ri";
import { RiskWarningModal } from "./RiskWarningModal";

export function Footer() {
  const bgColor = useColorModeValue("white", "gray.900");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const logoFilter = useColorModeValue("invert(1)", "none");
  const toast = useToast();
  const contractAddress = "0x53EB0098d09B8d1008f382BbD2A5D4f649111710";
  const { isOpen, onOpen, onClose } = useDisclosure();

  const handleCopy = () => {
    navigator.clipboard.writeText(contractAddress);
    toast({
      title: "Address copied",
      status: "success",
      duration: 2000,
      isClosable: true,
    });
  };

  return (
    <>
      <Box
        bg={bgColor}
        borderTop="1px"
        borderColor={borderColor}
        mt="auto"
        py={4}
      >
        <Container maxW="container.xl">
          <Stack
            direction={{ base: "column", md: "row" }}
            spacing={8}
            justify="space-between"
            align="center"
          >
            <Text color="gray.500" fontSize="sm">
              © 2024 WATCHDOGS NFT Marketplace. All rights reserved
            </Text>

            <HStack spacing={8} marginLeft="auto">
              <Flex
                align="center"
                color="gray.500"
                _hover={{ color: "brand.500", cursor: "pointer" }}
                onClick={handleCopy}
              >
                <Text>CA: {shortenAddress(contractAddress)}</Text>
                <FaCopy style={{ marginLeft: "8px" }} />
              </Flex>
              <Stack direction="row" spacing={4}>
                <IconButton
                  as={Link}
                  href="https://dexscreener.com/ink/0x53eb0098d09b8d1008f382bbd2a5d4f649111710"
                  target="_blank"
                  aria-label="Chart"
                  icon={<FaChartBar />}
                  variant="ghost"
                  _hover={{
                    bg: "brand.500",
                    color: "white",
                    transform: "translateY(-2px)",
                  }}
                />
                <IconButton
                  as={Link}
                  href="https://inkypump.com/trade/0x53EB0098d09B8d1008f382BbD2A5D4f649111710"
                  target="_blank"
                  aria-label="InkyPump"
                  icon={
                    <Image
                      src="https://inkypump.com/logo.svg"
                      alt="InkyPump Logo"
                      width="70px"
                      height="70px"
                      style={{ filter: logoFilter }}
                    />
                  }
                  variant="ghost"
                  _hover={{
                    bg: "brand.500",
                    color: "white",
                    transform: "translateY(-2px)",
                  }}
                />
                <IconButton
                  as={Link}
                  href="https://explorer.inkonchain.com/token/0x53EB0098d09B8d1008f382BbD2A5D4f649111710"
                  target="_blank"
                  aria-label="INK Explorer"
                  icon={
                    <Image
                      src="https://explorer.inkonchain.com/assets/configs/network_logo_dark.svg"
                      alt="INK Explorer Logo"
                      width="40px"
                      height="40px"
                      style={{ filter: logoFilter }}
                    />
                  }
                  variant="ghost"
                  _hover={{
                    bg: "brand.500",
                    color: "white",
                    transform: "translateY(-2px)",
                  }}
                />
              </Stack>
            </HStack>

            <Stack direction="row" spacing={2}>
              <IconButton
                as={Link}
                href="https://x.com/WatchDogsOnInk"
                target="_blank"
                aria-label="X (Twitter)"
                icon={<RiTwitterXFill />}
                variant="ghost"
                _hover={{
                  bg: "brand.500",
                  color: "white",
                  transform: "translateY(-2px)",
                }}
              />
              <IconButton
                as={Link}
                href="https://t.me/WatchDogsOnInk"
                target="_blank"
                aria-label="Telegram"
                icon={<FaTelegram />}
                variant="ghost"
                _hover={{
                  bg: "brand.500",
                  color: "white",
                  transform: "translateY(-2px)",
                }}
              />
              <IconButton
                as={Link}
                href="https://watchdogs.ink"
                target="_blank"
                aria-label="Website"
                icon={<FaGlobe />}
                variant="ghost"
                _hover={{
                  bg: "brand.500",
                  color: "white",
                  transform: "translateY(-2px)",
                }}
              />
            </Stack>
          </Stack>

          <Divider my={4} />

          <Stack
            direction={{ base: "column", md: "row" }}
            justify="space-between"
            align="center"
            fontSize="sm"
            color="gray.500"
          >
            <Link
              onClick={onOpen}
              color="gray.500"
              fontSize="sm"
              display="flex"
              alignItems="center"
              _hover={{ color: "brand.500" }}
              cursor="pointer"
            >
              <FaShieldAlt style={{ marginRight: "6px" }} />
              Risk Disclosure & Terms
            </Link>
          </Stack>
        </Container>
      </Box>

      <RiskWarningModal isOpen={isOpen} onClose={onClose} />
    </>
  );
}
