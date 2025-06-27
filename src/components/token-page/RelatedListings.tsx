import { useMarketplaceContext } from "@/hooks/useMarketplaceContext";
import { Link } from "@chakra-ui/next-js";
import {
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Box,
  Flex,
  Text,
} from "@chakra-ui/react";
import { MediaRenderer } from "@/components/shared/MediaRenderer";
import { client } from "@/consts/client";

export default function RelatedListings({
  excludedListingId,
}: {
  excludedListingId: bigint;
}) {
  const { nftContract, allValidListings } = useMarketplaceContext();
  if (!allValidListings || allValidListings.length === 0) return null;
  const listings = allValidListings.filter(
    (o) =>
      o.id.toString() !== excludedListingId.toString() &&
      o.assetContractAddress.toLowerCase() === nftContract.toLowerCase()
  );
  if (listings.length === 0) return null;
  return (
    <AccordionItem>
      <AccordionButton>
        <Box as="span" flex="1" textAlign="left">
          More from this collection
        </Box>
        <AccordionIcon />
      </AccordionButton>
      <AccordionPanel pb={4}>
        <Box
          display="flex"
          overflowX="auto"
          whiteSpace="nowrap"
          padding="4"
          width="100%"
          gap="15px"
        >
          {listings.map((item) => (
            <Box
              key={item.id.toString()}
              rounded="12px"
              as={Link}
              href={`/collection/57073/${nftContract}/token/${item.asset.id.toString()}`}
              _hover={{ textDecoration: "none" }}
              minW={250}
            >
              <Flex direction="column">
                <MediaRenderer
                  src={item.asset?.metadata.image_url || item.asset.metadata.image}
                  alt={item.asset.metadata?.name || "NFT"}
                />
                <Text>{item.asset.metadata?.name ?? "Unknown item"}</Text>
                <Text>Price</Text>
                <Text>
                  {item.currencyValuePerToken.displayValue}{" "}
                  {item.currencyValuePerToken.symbol}
                </Text>
              </Flex>
            </Box>
          ))}
        </Box>
      </AccordionPanel>
    </AccordionItem>
  );
}
