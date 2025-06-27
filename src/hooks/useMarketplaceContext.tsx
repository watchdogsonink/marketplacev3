"use client";
import {
  createContext,
  type ReactNode,
  useContext,
  useCallback,
  useEffect,
  useState,
} from "react";
import { Box, Spinner } from "@chakra-ui/react";
import { NFT_CONTRACTS } from "@/consts/nft_contracts";

interface LocalNftItem {
  id: string;
  image_url?: string;
  token: {
    name: string;
  };
  metadata?: {
    name?: string;
    description?: string;
    image?: string;
    [key: string]: any;
  };
}

// A shape for the entire JSON file: { items: LocalNftItem[] }
interface LocalJsonFile {
  items: LocalNftItem[];
}

export type TMarketplaceContext = {
  nftContract: string; // The contract address
  allNfts: LocalNftItem[]; // Locally fetched NFTs
  collectionName: string; // Title from local JSON (optional)
  isLoading: boolean;
  error: string | null;
  refreshNfts: () => void;
  marketplaceContract?: any; // Add missing properties
  refetchAllListings?: () => void;
  listingsInSelectedCollection?: any[];
  allValidListings: {
    id: string;
    assetContractAddress: string;
    asset: {
      id: string;
      metadata: {
        image: string;
        name?: string;
      };
    };
    currencyValuePerToken: {
      displayValue: string;
      symbol: string;
    };
  }[];
  contractMetadata?: {
    name?: string;
  };
};

const MarketplaceContext = createContext<TMarketplaceContext | undefined>(
  undefined
);

export default function MarketplaceProvider({
  chainId,
  contractAddress,
  children,
}: {
  chainId: string;
  contractAddress: string;
  children: ReactNode;
}) {
  const [nftContract, setNftContract] = useState<string>(""); // store contract address
  const [allNfts, setAllNfts] = useState<LocalNftItem[]>([]);
  const [collectionName, setCollectionName] = useState<string>("Unknown");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Keep the contract address in state
  useEffect(() => {
    setNftContract(contractAddress);
  }, [contractAddress]);

  // Build the path to /collections_metadata/<lowercase_address>.json
  const filePath = `/collections_metadata/${contractAddress.toLowerCase()}.json`;
  // console.log({filePath})

  // Fetch local JSON on mount or whenever contractAddress changes
  const fetchLocalJson = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(filePath);
      if (!response.ok) {
        // throw new Error(`Could not load local metadata for ${contractAddress}`);
      }
      const data = await response?.json();
      // console.log("Fetched data:", data);

      // Check if data is an array or an object with items
      const items = Array.isArray(data) ? data : data.items || [];
      setAllNfts(items);

      // Safely set collection name
      const nftConfig = NFT_CONTRACTS.find(
        (item) => item.address.toLowerCase() === contractAddress.toLowerCase()
      );
      // console.log({nftConfig})
      const name =
        items[0]?.token?.name ||
        items[0]?.metadata?.name ||
        nftConfig?.title ||
        "Unknown2";
      setCollectionName(name);
    } catch (err: any) {
      console.error("Error loading local JSON:", err);
      setAllNfts([]);
    } finally {
      setIsLoading(false);
    }
  }, [filePath, contractAddress]);

  // Trigger JSON fetch on first render + whenever filePath changes
  useEffect(() => {
    void fetchLocalJson();
  }, [fetchLocalJson]);

  // Provide a refresh function
  const refreshNfts = useCallback(() => {
    void fetchLocalJson();
  }, [fetchLocalJson]);

  return (
    <MarketplaceContext.Provider
      value={{
        nftContract,
        allNfts,
        collectionName,
        isLoading,
        error,
        refreshNfts,
        marketplaceContract: undefined,
        refetchAllListings: undefined,
        listingsInSelectedCollection: undefined,
        allValidListings: [],
        contractMetadata: undefined,
      }}
    >
      {children}
      {isLoading && (
        <Box
          position="fixed"
          bottom="10px"
          right="10px"
          backgroundColor="rgba(0, 0, 0, 0.7)"
          padding="10px"
          borderRadius="md"
          zIndex={1000}
        >
          <Spinner size="lg" color="purple" />
        </Box>
      )}
    </MarketplaceContext.Provider>
  );
}

export function useMarketplaceContext() {
  const context = useContext(MarketplaceContext);
  if (!context) {
    throw new Error(
      "useMarketplaceContext must be used inside MarketplaceProvider"
    );
  }
  return context;
}
