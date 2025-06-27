import { useMarketplaceListings } from "./useMarketplaceListings";

export function useIsNftListed(nftAddress: string, tokenId: bigint | number | string) {
    const { listings, loading, error } = useMarketplaceListings();

    // Check if any listing matches the NFT's contract address and tokenId
    const isListed = listings.some((listing) => {
        return (
            listing.assetContractAddress.toLowerCase() === nftAddress.toLowerCase() &&
            listing.tokenId.toString() === tokenId.toString()
        );
    });

    return { isListed, loading, error };
}
