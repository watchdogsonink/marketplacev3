import { Box, SimpleGrid, Text, Flex, useColorMode } from "@chakra-ui/react";
import { Link } from "@chakra-ui/next-js";
import { motion } from "framer-motion";
import { MediaRenderer } from "thirdweb/react";
import { client } from "@/consts/client";

type NFTCardProps = {
  nft: {
    id: string | number;
    domain?: string;
    metadata: {
      name: string;
      image: string;
      image_url: string;
      attributes?: Array<{
        trait_type: string;
        value: string;
      }>;
    };
    collection?: {
      title: string;
      chain: {
        id: number;
      };
      address: string;
    };
  };
  chainId?: number;
  contractAddress?: string;
};

const ZNS_CONTRACT_ADDRESS =
  "0xfb2cd41a8aec89efbb19575c6c48d872ce97a0a5".toLowerCase();

export function NFTGrid({ nfts }: { nfts: NFTCardProps["nft"][] }) {
  const { colorMode } = useColorMode();

  return (
    <SimpleGrid columns={{ base: 2, sm: 2, md: 4, lg: 5 }} spacing={6}>
      {nfts.map((nft) => {
        const isZNS =
          nft.collection?.address?.toLowerCase() === ZNS_CONTRACT_ADDRESS;
        const displayName = isZNS
          ? nft?.metadata?.name
          : nft?.metadata?.name || `#${nft?.id?.toString()}`;

        return (
          <motion.div
            key={`${nft.collection?.address || ""}-${nft?.id?.toString()}`}
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            <Link
              href={`/collection/57073/${
                nft.collection?.address
              }/token/${nft?.id?.toString()}`}
              _hover={{ textDecoration: "none" }}
            >
              <Box
                bg={colorMode === "dark" ? "gray.800" : "white"}
                rounded="xl"
                overflow="hidden"
                shadow="sm"
                borderWidth="1px"
                borderColor={colorMode === "dark" ? "gray.700" : "gray.200"}
                transition="all 0.2s"
                _hover={{
                  shadow: "md",
                  borderColor: "brand.500",
                }}
              >
                <Box position="relative" paddingBottom="100%">
                  <MediaRenderer
                    client={client as any}
                    src={nft?.metadata?.image_url || nft.metadata?.image}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                </Box>
                <Box p={4}>
                  <Text fontWeight="bold" noOfLines={1}>
                    {displayName}
                  </Text>
                  <Text fontSize="sm" color="gray.500" mb={2}>
                    Token ID: #{nft?.id?.toString()}
                  </Text>
                  {nft.collection?.title && (
                    <Flex justify="space-between" align="center" mt={1}>
                      <Text fontSize="sm" color="gray.500">
                        {nft?.collection?.title}
                      </Text>
                    </Flex>
                  )}
                </Box>
              </Box>
            </Link>
          </motion.div>
        );
      })}
    </SimpleGrid>
  );
}
