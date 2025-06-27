import { useMarketplaceContext } from "@/hooks/useMarketplaceContext";
import { Link } from "@chakra-ui/next-js";
import {
  AccordionButton,
  Text,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Box,
  Flex,
} from "@chakra-ui/react";
import { shortenAddress } from "@/utils/shortenAddress";
import { NFT_CONTRACTS } from "@/consts/nft_contracts";

type Props = {
  nft: {
    id: bigint;
    type: string;
    token: {
      address: string;
      type: string;
    };
    metadata: {
      name?: string;
      description?: string;
      image?: string;
      [key: string]: any;
    };
  };
};

export function NftDetails(props: Props) {
  const { nft } = props;

  // Debugging logs
  console.log("Full NFT object:", nft);
  console.log("NFT Contract Address:", nft?.token?.address);
  console.log("NFT_CONTRACTS array:", NFT_CONTRACTS);

  // find contract config
  const contractConfig = NFT_CONTRACTS.find(
    (c) => c.address.toLowerCase() === String(nft?.token?.address).toLowerCase()
  );

  // Rest of debugging logs
  console.log("Found Contract Config:", contractConfig);
  console.log("Contract Socials:", contractConfig?.socials);
  console.log("Creator Fee:", contractConfig?.socials?.feeCreator);
  console.log("Marketplace Fee:", contractConfig?.socials?.feeMarketplace);

  const contractUrl = `https://explorer.inkonchain.com/address/${nft?.token?.address}`;
  const tokenUrl = `https://explorer.inkonchain.com/token/${
    nft?.token?.address
  }/instance/${nft?.id?.toString()}`;

  return (
    <AccordionItem>
      <Text>
        <AccordionButton>
          <Box as="span" flex="1" textAlign="left">
            Details
          </Box>
          <AccordionIcon />
        </AccordionButton>
      </Text>
      <AccordionPanel pb={4}>
        {nft?.token?.address && (
          <Flex direction="row" justifyContent="space-between" mb="1">
            <Text>Contract address</Text>
            <Link color="purple" href={contractUrl} target="_blank">
              {shortenAddress(String(nft.token.address))}
            </Link>
          </Flex>
        )}
        {nft?.id && (
          <Flex direction="row" justifyContent="space-between" mb="1">
            <Text>Token ID</Text>
            <Link color="purple" href={tokenUrl} target="_blank">
              {nft.id.toString()}
            </Link>
          </Flex>
        )}
        {nft?.token?.type && (
          <Flex direction="row" justifyContent="space-between" mb="1">
            <Text>Token Standard</Text>
            <Text>{nft.token.type}</Text>
          </Flex>
        )}
        <Flex direction="row" justifyContent="space-between" mb="1">
          <Text>Chain</Text>
          <Text>{"INK"}</Text>
        </Flex>
        {contractConfig?.socials?.feeCreator && (
          <Flex direction="row" justifyContent="space-between" mb="1">
            <Text>Creator Fee</Text>
            <Flex align="center" gap={2}>
              <Text>{contractConfig.socials.feeCreator}</Text>
            </Flex>
          </Flex>
        )}
        {contractConfig?.socials?.feeMarketplace && (
          <Flex direction="row" justifyContent="space-between" mb="1">
            <Text>Marketplace Fee</Text>
            <Flex align="center" gap={2}>
              <Text>{contractConfig.socials.feeMarketplace}</Text>
            </Flex>
          </Flex>
        )}
      </AccordionPanel>
    </AccordionItem>
  );
}
