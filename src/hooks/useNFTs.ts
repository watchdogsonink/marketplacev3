type NFT = {
  tokenId: string | number;
  name: string;
  image: string;
  collectionName: string;
  contractAddress: string;
  chainId: number;
  price?: string;
};

export function useNFTs(address: string) {
  // ... hook implementation
  return {
    nfts: [], // array of NFTs
    isLoading: false,
  };
}
