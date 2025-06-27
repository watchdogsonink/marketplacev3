import { useState, useEffect } from "react";
import { ethers } from "ethers";
import NFTABI from "@/abis/NFTABI.json";

export interface NFTData {
  id: string | number | bigint;
  owner?: string;
  name?: string;
  image?: string;
  description?: string;
  [key: string]: any;
}

export interface UseReadNFTProps {
  tokenId: string | number | bigint;
  // The contract object must contain the address and chain (with rpc and id)
  contract: any;
  type: "ERC721";
}

export function useReadNFT({ tokenId, contract, type }: UseReadNFTProps) {
  const [data, setData] = useState<NFTData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  // Default image when metadata or image is missing
  const defaultImage = "https://cdn.watchdogs.ink/watchdogs.webp";

  useEffect(() => {
    async function fetchNFT() {
      setIsLoading(true);
      let metadata: any;
      try {
        try {
          // Attempt to fetch the local JSON file (in /public/collections_metadata/<address>.json)
          const lowerCaseAddr = contract.toLowerCase();
          const res = await fetch(
            `/collections_metadata/${lowerCaseAddr}.json`
          );
          if (!res.ok) {
            // If the fetch fails, or your file doesn't exist, you can handle it gracefully
            throw new Error(`Could not fetch metadata JSON for ${contract}`);
          }

          const data = await res.json(); // structure: { items: [...] }
          metadata =
            data.find((item) => item.id.toString() === tokenId.toString()) ??
            null;

          if (
            !metadata &&
            contract.toLowerCase() ===
              "0x58da2f96c473e9cb89f0de7c6f1faede70d47c93".toLowerCase()
          ) {
            metadata = {
              animation_url: null,
              external_app_url: null,
              id: "1",
              image_url: "https://cdn.watchdogs.ink/watchdogs.webp",
              is_unique: true,
              media_type: null,
              media_url: "https://cdn.watchdogs.ink/watchdogs.webp",
              metadata: {
                id: "1",
                image_url: "https://cdn.watchdogs.ink/watchdogs.webp",
                is_unique: true,
                media_url: "https://cdn.watchdogs.ink/watchdogs.webp",
                metadata: {
                  attributes: [],
                  description: "First Watchdogs NFT Collection",
                  id: 1,
                  image: "https://cdn.watchdogs.ink/watchdogs.webp",
                  name: "WatchDog",
                },
              },
              owner: {
                ens_domain_name: null,
                hash: "0x3423873BAD12cB99F490e05428Ba434dd42168a7",
                implementations: [],
                is_contract: false,
                is_scam: false,
                is_verified: false,
                metadata: null,
                name: null,
                private_tags: [],
                proxy_type: null,
                public_tags: [],
                watchlist_names: [],
              },
              thumbnails: null,
              token: {
                address: "0x58DA2f96c473e9cb89f0dE7c6F1faeDE70d47c93",
                circulating_market_cap: null,
                decimals: null,
                exchange_rate: null,
                holders: "2",
                icon_url: null,
                name: "WatchDogs",
                symbol: "WATCH",
                total_supply: "2",
                type: "ERC-721",
                volume_24h: null,
              },
            };
          }
        } catch (e) {
          console.error(`Error loading JSON for contract ${contract}`, e);
          // for all listings under this contract, fallback to null
        }

        const provider = new ethers.JsonRpcProvider(
          "process.env.ALCHEMY_KEY",
          57073
        );
        const nftContract = new ethers.Contract(contract, NFTABI, provider);

        // if(!metadata){
        //
        //
        //     // Fetch the tokenURI
        //     console.log({tokenId})
        //     let tokenURI: string = "";
        //     if (typeof nftContract.tokenURI === "function") {
        //         tokenURI = await nftContract.tokenURI(tokenId);
        //     } else if (typeof nftContract.uri === "function") {
        //         tokenURI = await nftContract.uri(tokenId);
        //     } else {
        //         throw new Error("Contract does not support tokenURI or uri");
        //     }
        //     console.log("tokenURI:", tokenURI);
        //
        //
        //
        //     // If tokenURI is raw JSON
        //     if (tokenURI.trim().startsWith("{")) {
        //         metadata = JSON.parse(tokenURI);
        //     }
        //     // If tokenURI is a base64 encoded data URI
        //     else if (tokenURI.startsWith("data:application/json;base64,")) {
        //         const base64Data = tokenURI.replace("data:application/json;base64,", "");
        //         const jsonString = atob(base64Data);
        //         metadata = JSON.parse(jsonString);
        //     }
        //     // Other data URI variant
        //     else if (tokenURI.startsWith("data:application/json,")) {
        //         const jsonData = decodeURIComponent(tokenURI.split(",")[1]);
        //         metadata = JSON.parse(jsonData);
        //     }
        //     // If tokenURI is a URL – fetch metadata from the URL
        //     else {
        //         const response = await fetch(tokenURI, { mode: "cors" });
        //         if (!response.ok) {
        //             throw new Error(`HTTP error! status: ${response.status}`);
        //         }
        //         const contentType = response.headers.get("content-type");
        //         if (contentType && contentType.indexOf("application/json") !== -1) {
        //             metadata = await response.json();
        //         } else {
        //             const text = await response.text();
        //             try {
        //                 metadata = JSON.parse(text);
        //             } catch (e) {
        //                 throw new Error("Invalid JSON format");
        //             }
        //         }
        //     }
        // }
        // Create a provider and contract instance

        // Fetch NFT owner (for ERC721)
        let owner = "";
        if (type === "ERC721") {
          try {
            owner = await nftContract.ownerOf(tokenId);
          } catch (err) {
            console.error("Error fetching owner:", err);
            owner = "Unknown";
          }
        }

        // Ensure the image field is set (otherwise use defaultImage)
        const image = metadata.image_url
          ? metadata.image_url
          : metadata.image
          ? metadata.image
          : defaultImage;

        // Set NFT data state
        setData({ ...metadata, owner, id: tokenId.toString(), image });
      } catch (err: any) {
        console.error("Error in useReadNFT:", err);
        setError(err);
      } finally {
        setIsLoading(false);
      }
    }

    if (contract && tokenId !== undefined && tokenId !== null) {
      fetchNFT();
    }
  }, [tokenId, contract, type]);

  return { data, isLoading, error };
}

export async function fetchNFTExternal(contractAddress, tokenId) {
  let metadata: any;
  // console.log({contractAddress})
  // console.log({tokenId})
  try {
    try {
      // Attempt to fetch the local JSON file (in /public/collections_metadata/<address>.json)
      const lowerCaseAddr = contractAddress.toLowerCase();
      const res = await fetch(`/collections_metadata/${lowerCaseAddr}.json`);
      if (!res.ok) {
        // If the fetch fails, or your file doesn't exist, you can handle it gracefully
        throw new Error(`Could not fetch metadata JSON for ${contractAddress}`);
      }

      const data = await res.json(); // structure: { items: [...] }
      metadata =
        data.find((item) => item.id.toString() === tokenId.toString()) ?? null;
      // console.log({metadata})
      if (
        !metadata &&
        contractAddress.toLowerCase() ===
          "0x58da2f96c473e9cb89f0de7c6f1faede70d47c93".toLowerCase()
      ) {
        metadata = {
          animation_url: null,
          external_app_url: null,
          id: "1",
          image_url: "https://cdn.watchdogs.ink/watchdogs.webp",
          is_unique: true,
          media_type: null,
          media_url: "https://cdn.watchdogs.ink/watchdogs.webp",
          metadata: {
            id: "1",
            image_url: "https://cdn.watchdogs.ink/watchdogs.webp",
            is_unique: true,
            media_url: "https://cdn.watchdogs.ink/watchdogs.webp",
            metadata: {
              attributes: [],
              description: "First Watchdogs NFT Collection",
              id: 1,
              image: "https://cdn.watchdogs.ink/watchdogs.webp",
              name: "WatchDog",
            },
          },
          owner: {
            ens_domain_name: null,
            hash: "0x3423873BAD12cB99F490e05428Ba434dd42168a7",
            implementations: [],
            is_contract: false,
            is_scam: false,
            is_verified: false,
            metadata: null,
            name: null,
            private_tags: [],
            proxy_type: null,
            public_tags: [],
            watchlist_names: [],
          },
          thumbnails: null,
          token: {
            address: "0x58DA2f96c473e9cb89f0dE7c6F1faeDE70d47c93",
            circulating_market_cap: null,
            decimals: null,
            exchange_rate: null,
            holders: "2",
            icon_url: null,
            name: "WatchDogs",
            symbol: "WATCH",
            total_supply: "2",
            type: "ERC-721",
            volume_24h: null,
          },
        };
      }
      // console.log({metadata})
    } catch (e) {
      console.error(`Error loading JSON for contract ${contractAddress}`, e);
      // for all listings under this contract, fallback to null
    }

    const provider = new ethers.JsonRpcProvider(
      "process.env.ALCHEMY_KEY",
      57073
    );
    const nftContract = new ethers.Contract(contractAddress, NFTABI, provider);

    let owner = "";
    try {
      owner = await nftContract.ownerOf(tokenId);
    } catch (err) {
      console.error("Error fetching owner:", err);
      owner = "Unknown";
    }

    // console.log({metadata})
    // Ensure the image field is set (otherwise use defaultImage)
    const image = metadata.image_url
      ? metadata.image_url
      : metadata.image
      ? metadata.image
      : "";

    return { ...metadata, owner, id: tokenId.toString(), image };
  } catch (err: any) {
    console.error("Error in useReadNFT:", err);
  }
}
