"use client";

import { Token } from "@/components/token-page/TokenPage";
import { useEffect, useState } from "react";
import { Center, Text, Box, Spinner } from "@chakra-ui/react";

// Function to convert domain name to token ID
async function getTokenIdFromDomain(domain: string): Promise<string | null> {
  try {
    const response = await fetch(
      `https://zns.bio/api/resolveDomain?chain=57073&domain=${domain}.ink`
    );
    const data = await response.json();
    if (data.code === 200 && data.tokenId) {
      return data.tokenId.toString();
    }
    return null;
  } catch (error) {
    console.error("Error resolving domain:", error);
    return null;
  }
}

export default function ListingPage({
  params,
}: {
  params: { tokenId: string; contractAddress: string };
}) {
  const { tokenId, contractAddress } = params;
  const [realTokenId, setRealTokenId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTokenId() {
      if (!tokenId) {
        setError("Missing tokenId");
        setIsLoading(false);
        return;
      }

      // If this is a ZNS contract and tokenId looks like a domain name
      if (
        contractAddress.toLowerCase() ===
          "0xfb2cd41a8aec89efbb19575c6c48d872ce97a0a5".toLowerCase() &&
        !tokenId.match(/^\d+$/)
      ) {
        try {
          const resolvedTokenId = await getTokenIdFromDomain(tokenId);
          if (!resolvedTokenId) {
            setError("Invalid domain name");
          } else {
            setRealTokenId(resolvedTokenId);
          }
        } catch (err) {
          setError("Error resolving domain name");
        }
      } else {
        setRealTokenId(tokenId);
      }
      setIsLoading(false);
    }

    fetchTokenId();
  }, [tokenId, contractAddress]);

  if (isLoading) {
    return (
      <Center minH="60vh">
        <Spinner
          thickness="4px"
          speed="0.65s"
          emptyColor="gray.200"
          color="brand.500"
          size="xl"
        />
      </Center>
    );
  }

  if (error) {
    return (
      <Center p={8}>
        <Box textAlign="center">
          <Text color="red.500" fontSize="lg">
            {error}
          </Text>
        </Box>
      </Center>
    );
  }

  if (!realTokenId) {
    return null;
  }

  return <Token tokenId={BigInt(realTokenId)} />;
}
