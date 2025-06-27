"use client";

import {
  Box,
  Container,
  Heading,
  VStack,
  Text,
  Card,
  CardBody,
  useColorModeValue,
  Flex,
  Circle,
  Divider,
  Badge,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import { FaCheckCircle } from "react-icons/fa";

const MotionCard = motion(Card);

const roadmapItems = [
  {
    phase: "Phase 1",
    title: "$WATCH Token Staking",
    description:
      "Introduction of $WATCH token staking system with rewards for users actively staking their tokens. Rewards come from marketplace fees.",
    completed: true,
  },
  {
    phase: "Phase 2",
    title: "Platform Features Expansion",
    description:
      "Adding new features and improvements to the NFT marketplace platform, including enhanced filtering, search, and NFT history and analytics",
    completed: true,
  },
  {
    phase: "Phase 3",
    title: "Staking & Fee Rewards",
    description:
      "Launch of staking for the $WATCH token, allowing holders to earn marketplace trading fees as rewards.",
    completed: true,
  },
  {
    phase: "Phase 4",
    title: "User Points & Leaderboard System",
    description:
      "Introduction of a points-based ranking system rewarding users for staking $WATCH tokens and holding WatchDogs NFTs. Includes public leaderboard, transparent stats, and future reward utility.",
    completed: true,
  },
  {
    phase: "Phase 5",
    title: "NFT Launchpad",
    description:
      "Launch of the NFT Launchpad platform enabling artists and creators to easily introduce new NFT collections.",
    completed: false,
  },
  {
    phase: "Phase 6",
    title: "NFT Analytics",
    description:
      "Implementation of advanced analytics tools and statistics for NFT collections, tracking prices.",
    completed: false,
  },
  {
    phase: "Phase 7",
    title: "Suprise soon",
    description:
      "We’ll surprise you soon, but here’s something we can share – our NFT will play a key role in this.",
    completed: false,
  },
];

export default function Roadmap() {
  const bgGradient = useColorModeValue(
    "linear(to-br, purple.100, blue.50)",
    "linear(to-br, purple.900, gray.900)"
  );

  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");

  return (
    <Box>
      <Box
        py={20}
        position="relative"
        _before={{
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: "url('/background.webp')",
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
            Roadmap
          </Heading>
          <Text fontSize="xl" textAlign="center" mb={12} color="gray.500">
            Our vision for the WATCHDOGS NFT Marketplace development
          </Text>
        </Container>
      </Box>

      <Container maxW="container.lg" py={16}>
        <VStack spacing={8} align="stretch">
          {roadmapItems.map((item, index) => (
            <MotionCard
              key={item.phase}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.2 }}
              bg={cardBg}
              borderColor={item.completed ? "brand.500" : borderColor}
              borderWidth="1px"
              borderRadius="xl"
              overflow="hidden"
              position="relative"
              sx={{
                transition: "all 0.3s ease-in-out",
                "&:hover": {
                  transform: "translateY(-8px) scale(1.02)",
                  boxShadow: "xl",
                  borderColor: "brand.500",
                  "& .phase-number": {
                    transform: "scale(1.1)",
                    bg: "purple.600",
                  },
                  "& .phase-title": {
                    color: "brand.500",
                  },
                },
              }}
            >
              <CardBody>
                <Flex align="center" gap={6}>
                  <Circle
                    size="50px"
                    bg={item.completed ? "green.500" : "brand.500"}
                    color="white"
                    fontWeight="bold"
                    className="phase-number"
                    transition="all 0.3s"
                  >
                    {item.completed ? <FaCheckCircle size="24px" /> : index + 1}
                  </Circle>
                  <Box flex="1">
                    <Flex justify="space-between" align="center" mb={1}>
                      <Text color="brand.500" fontWeight="bold" fontSize="sm">
                        {item.phase}
                      </Text>
                      {item.completed && (
                        <Badge
                          px={3}
                          py={1}
                          borderRadius="full"
                          variant="subtle"
                          bgGradient="linear(to-r, green.400, teal.400)"
                          color="white"
                          display="flex"
                          alignItems="center"
                          gap={2}
                        >
                          <FaCheckCircle size="12px" />
                          Completed
                        </Badge>
                      )}
                    </Flex>
                    <Heading
                      size="md"
                      mb={2}
                      className="phase-title"
                      transition="all 0.3s"
                      color={item.completed ? "gray.500" : "inherit"}
                    >
                      {item.title}
                    </Heading>
                    <Text color="gray.500">{item.description}</Text>
                  </Box>
                </Flex>
              </CardBody>
            </MotionCard>
          ))}
        </VStack>
      </Container>
    </Box>
  );
}
