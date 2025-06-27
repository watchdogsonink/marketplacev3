import { useState, useEffect, useCallback } from "react";
import { ethers, formatUnits } from "ethers";

// RPC settings - e.g. Alchemy, INK Network:
const RPC_URL = "process.env.ALCHEMY_KEY";
const CHAIN_ID = 57073;

// marketplace address
const MARKETPLACE_ADDRESS = "0x846d9804Fa21E467119C1e3DE1294f8b060A4881";

// Minimal ABI for queries per collection
const MARKETPLACE_ABI = [
  "function totalListingsByCollection(address assetContract) view returns (uint256)",
  "function getListingsByCollection(address assetContract, uint256 startIndex, uint256 count) view returns (tuple(uint256 listingId, address listingCreator, address assetContract, uint256 tokenId, uint256 quantity, address currency, uint256 pricePerToken, uint128 startTimestamp, uint128 endTimestamp, bool reserved, uint8 tokenType, uint8 status)[])",
];

export type Listing = {
  listingId: bigint;
  listingCreator: string;
  assetContract: string;
  tokenId: bigint;
  quantity: bigint;
  currency: string;
  pricePerToken: bigint;
  startTimestamp: bigint;
  endTimestamp: bigint;
  reserved: boolean;
  tokenType: number;
  status: number;
};

export function useListingsByCollection(
  assetContract: string,
  perPage: number = 1000,
  page: number = 0
) {
  const [listings, setListings] = useState<Array<Listing>>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<any>(null);

  const fetchListings = useCallback(async () => {
    try {
      setLoading(true);
      const provider = new ethers.JsonRpcProvider(RPC_URL, CHAIN_ID);
      const contract = new ethers.Contract(
        MARKETPLACE_ADDRESS,
        MARKETPLACE_ABI,
        provider
      );
      const totalListings: bigint = await contract.totalListingsByCollection(
        assetContract
      );
      // console.log({assetContract})
      // console.log({totalListings})
      setTotal(Number(totalListings));
      const listingsData: Listing[] = await contract.getListingsByCollection(
        assetContract,
        "0",
        BigInt("10000000")
      );
      setListings(listingsData);
      setError(null);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [assetContract]);

  // Initial data fetch
  useEffect(() => {
    if (assetContract) {
      // console.log('here')
      fetchListings();
    }
  }, [assetContract, fetchListings]);

  return {
    listings,
    total,
    loading,
    error,
    refetch: fetchListings, // Export refetch function
  };
}
