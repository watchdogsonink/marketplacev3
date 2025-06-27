export interface NFTMetadata {
  name?: string;
  description?: string;
  image?: string;
  image_url?: string;
  attributes?: Array<{
    trait_type: string;
    value: string | number;
  }>;
}

export interface NFTCollection {
  address: string;
  title: string;
  chain: {
    id: number;
  };
}

export interface NFTData {
  id: string | number;
  owner?: string;
  metadata?: NFTMetadata;
  collection: NFTCollection;
  image?: string;
  image_url?: string;
}
