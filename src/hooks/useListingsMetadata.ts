import { useState, useEffect, useMemo } from "react";
import { Listing } from "@/hooks/useMarketplaceListings";

export type ListingMetadata = {
  name?: string;
  image?: string;
  image_url?: string;
  description?: string;
};

type ListingMetadataMap = Record<string, ListingMetadata | null>;

export function useListingMetadata(listings: Listing[]) {
  const [metadataMap, setMetadataMap] = useState<ListingMetadataMap>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any>(null);

  // Memoize the listings array based on content to avoid unnecessary re-fetch
  const stableListings = useMemo(
    () => listings,
    [
      JSON.stringify(listings, (key, value) =>
        typeof value === "bigint" ? value.toString() : value
      ),
    ]
  );

  useEffect(() => {
    if (!stableListings || stableListings.length === 0) return;

    let mounted = true; // so we don't set state if unmounted
    setLoading(true);

    async function fetchAllMetadata() {
      try {
        // We'll fetch all JSON files in parallel by grouping listings by contract address.
        // Alternatively, you can do them one at a time if you prefer simpler logic.
        const listingsByAddress = groupByAddress(stableListings);

        // results: array of { listingId: string; metadata: ListingMetadata | null }
        let results: Array<{
          listingId: string;
          metadata: ListingMetadata | null;
        }> = [];

        // For each contract address, fetch the corresponding JSON *once*, then pluck out token metadata
        for (const [address, listingsOfAddress] of Object.entries(
          listingsByAddress
        )) {
          try {
            // Attempt to fetch the local JSON file (in /public/collections_metadata/<address>.json)

            const lowerCaseAddr = address.toLowerCase();
            const res = await fetch(
              `/collections_metadata/${lowerCaseAddr}.json`
            );
            if (!res.ok) {
              // If the fetch fails, or your file doesn't exist, you can handle it gracefully
              throw new Error(`Could not fetch metadata JSON for ${address}`);
            }
            const data = await res.json(); // structure: { items: [...] }

            // Build a map of tokenId => metadata
            const localMap: Record<string, any> = {};
            for (const item of data || []) {
              localMap[item.id.toString()] = {
                ...item.metadata,
                image_url: item.image_url,
              };
            }

            // Now read each listing's tokenId from that map
            for (const listing of listingsOfAddress) {
              const listingId = listing.listingId.toString();
              const tokenId = listing.tokenId.toString();
              const maybeMetadata = localMap[tokenId] ?? null;

              results.push({
                listingId,
                metadata: maybeMetadata,
              });
            }
          } catch (e) {
            // console.error(`Error loading JSON for contract ${address}`, e);
            // for all listings under this contract, fallback to null
            for (const listing of listingsOfAddress) {
              results.push({
                listingId: listing.listingId.toString(),
                metadata: null,
              });
            }
          }
        }

        // Now convert results to { [listingId]: metadata }
        const newMap: ListingMetadataMap = {};
        results.forEach((res) => {
          if (res) {
            newMap[res.listingId] = res.metadata;
          }
        });

        if (mounted) {
          setMetadataMap(newMap);
          setError(null);
        }
      } catch (e) {
        console.error(e);
        if (mounted) setError(e);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchAllMetadata();

    return () => {
      mounted = false;
    };
  }, [stableListings]);

  return { metadataMap, loading, error };
}

// Helper to group listings by their assetContract
function groupByAddress(listings: Listing[]): Record<string, Listing[]> {
  return listings.reduce<Record<string, Listing[]>>((acc, listing) => {
    const key = listing.assetContract.toLowerCase(); // normalize
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(listing);
    return acc;
  }, {});
}
