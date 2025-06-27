import { Link } from "@chakra-ui/next-js";
import { Box, Text } from "@chakra-ui/react";
import { MediaRenderer } from "thirdweb/react";
import { client } from "@/consts/client";

type NFTMetadata = {
  name?: string;
  image?: string;
};

type NFTCardProps = {
  nft: {
    id: bigint | string | number;
    metadata: NFTMetadata;
    owner: string | null;
    tokenURI: string;
    type: "ERC721" | "ERC1155";
  };
  contractAddress: string;
  chainId: number;
};

export function NFTCard({ nft, contractAddress, chainId }: NFTCardProps) {
  return (
    <Link href={`/collection/${chainId}/${contractAddress}/token/${nft.id}`}>
      <Box borderRadius="lg" overflow="hidden">
        <MediaRenderer client={client} src={nft?.image_url || nft?.metadata?.image_url || nft?.metadata?.image} />
        <Box p="4">
          <Text>{nft?.metadata?.name || `#${nft?.id}`}</Text>
          <Text>#{nft?.id?.toString()}</Text>
        </Box>
      </Box>
    </Link>
  );
}
