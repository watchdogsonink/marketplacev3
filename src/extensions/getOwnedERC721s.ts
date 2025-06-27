import { ADDRESS_ZERO, type NFT, type BaseTransactionOptions } from "thirdweb";
import { isERC721 } from "thirdweb/extensions/erc721";
import { detectMethod, toFunctionSelector } from "thirdweb/utils";
import { resolveContractAbi } from "thirdweb/contract";

// ZNS contract address
const ZNS_CONTRACT_ADDRESS =
  "0xfb2cd41a8aec89efbb19575c6c48d872ce97a0a5".toLowerCase();

export type GetERC721sParams = {
  owner: string;
  // (optional) If pass `100` then the code will limit the RPC requests to 100 requests per second
  requestPerSec?: number;
};

/**
 * thirdweb SDK's `getOwnedNFTs` extension only works if your contract has the extension `IERC721Enumerable > tokenOfOwnerByIndex`
 * This custom extension works for the contracts that don't have such method
 * It also allow you to set a limit on how many RPC requests should per called per second
 * @param options
 * @returns A list of NFTs (type: NFT[])
 *
 * @example
 * // Usage with React
 * const { data, error } = useReadContract(getOwnedERC721s, {
 *	 contract,
 *	 owner: "0x...",
 *	 requestPerSec: 99, // limit RPC reqs to 99 reqs per sec to avoid missing/corrupted data
 * });
 *
 * // Usage with TypeScript
 * const nfts = await getOwnedERC721s({
 *   contract,
 *   owner: "0x...",
 *   requestPerSec: 99,
 * });
 */
export async function getOwnedERC721s(
  options: BaseTransactionOptions<GetERC721sParams>
): Promise<NFT[]> {
  const { contract, owner, requestPerSec } = options;
  const abi = await resolveContractAbi(contract);

  // Special handling for ZNS contract
  if (contract.address.toLowerCase() === ZNS_CONTRACT_ADDRESS) {
    try {
      // Fetch user's domains from ZNS API
      const response = await fetch(
        `https://zns.bio/api/resolveAddress?chain=57073&address=${owner}`
      );
      const data = await response.json();

      if (data.code === 200 && data.userOwnedDomains) {
        // Fetch ZNS metadata from local file
        const metadataResponse = await fetch(
          "/collections_metadata/0xfb2cd41a8aec89efbb19575c6c48d872ce97a0a5.json"
        );
        const metadataJson = await metadataResponse.json();

        // Map domains to NFT objects - using domain names from API
        const nfts = data.userOwnedDomains
          .map((domain: string) => {
            // Find the corresponding record in metadata
            const metadataEntry = metadataJson.find(
              (item: any) => item.metadata.name === `${domain}.ink`
            );

            // If we found a record in metadata, use the ID from metadata
            const id = metadataEntry ? metadataEntry.id : undefined;

            if (!metadataEntry) {
              console.warn(
                `No metadata found for domain ${domain}.ink - displaying without ID`
              );
            }

            return {
              metadata: {
                name: `${domain}.ink`,
                description: "ZNS Domain Names on Ink",
                image: "/zns/zns.webp",
                attributes: [
                  {
                    trait_type: "Domain",
                    value: `${domain}.ink`,
                  },
                ],
              },
              owner: {
                hash: owner,
                ens_domain_name: null,
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
              supply: 1n,
              type: "ERC721",
              id: id,
              domain: domain,
              collection: {
                address: ZNS_CONTRACT_ADDRESS,
                title: "ZNS Domain Names",
                chain: {
                  id: 57073,
                },
              },
            };
          })
          .filter(Boolean);

        return nfts;
      }
      return [];
    } catch (error) {
      console.error("Error fetching ZNS domains:", error);
      return [];
    }
  }

  // Regular ERC721 handling
  // @ts-ignore
  const selectors = abi
    .filter((f) => f.type === "function")
    .map((f) => toFunctionSelector(f));

  const [is721, has_tokenOfOwnerByIndex] = await Promise.all([
    isERC721({ contract }),
    detectMethod({
      method:
        "function tokenOfOwnerByIndex(address owner, uint256 index) external view returns (uint256)",
      availableSelectors: selectors,
    }),
  ]);

  if (!is721) {
    throw new Error("Contract is not an ERC721 contract");
  }

  if (has_tokenOfOwnerByIndex) {
    const { getOwnedNFTs } = await import("thirdweb/extensions/erc721");
    return getOwnedNFTs(options);
  }

  const { nextTokenIdToMint, startTokenId, totalSupply, ownerOf, getNFT } =
    await import("thirdweb/extensions/erc721");

  const [startTokenId_, maxSupply] = await Promise.allSettled([
    startTokenId(options),
    nextTokenIdToMint(options),
    totalSupply(options),
  ]).then(([_startTokenId, _next, _total]) => {
    // default to 0 if startTokenId is not available
    const startTokenId__ =
      _startTokenId.status === "fulfilled" ? _startTokenId.value : 0n;
    let maxSupply_: bigint;
    // prioritize totalSupply to save on resources
    // since totalSupply should always be less than nextTokenIdToMint
    if (_total.status === "fulfilled") {
      maxSupply_ = _total.value;
    }
    // otherwise use nextTokenIdToMint
    else if (_next.status === "fulfilled") {
      // because we always default the startTokenId to 0 we can safely just always subtract here
      maxSupply_ = _next.value - startTokenId__;
    } else {
      throw new Error(
        "Contract requires either `nextTokenIdToMint` or `totalSupply` function available to determine the next token ID to mint"
      );
    }
    return [startTokenId__, maxSupply_] as const;
  });

  const allTokenIds = Array.from(
    { length: Number(maxSupply - startTokenId_ + 1n) },
    (_, i) => startTokenId_ + BigInt(i)
  );

  if (requestPerSec) {
    let owners: string[] = [];

    const tokenIdsArrays: bigint[][] = [];

    for (let i = 0; i < allTokenIds.length; i += requestPerSec) {
      const chunk = allTokenIds.slice(i, i + requestPerSec);
      tokenIdsArrays.push(chunk);
    }

    for (let i = 0; i < tokenIdsArrays.length; i++) {
      const data = await Promise.all(
        tokenIdsArrays[i].map((tokenId) =>
          ownerOf({ contract, tokenId }).catch(() => ADDRESS_ZERO)
        )
      );
      owners = owners.concat(data);
    }

    const ownedTokenIds = allTokenIds.filter(
      (tokenId, index) => owners[index].toLowerCase() === owner.toLowerCase()
    );

    let ownedNFTs: NFT[] = [];

    const ownedTokenIdsArrays: bigint[][] = [];

    for (let i = 0; i < ownedTokenIds.length; i += requestPerSec) {
      const chunk = ownedTokenIds.slice(i, i + requestPerSec);
      ownedTokenIdsArrays.push(chunk);
    }

    for (let i = 0; i < ownedTokenIdsArrays.length; i++) {
      const data = await Promise.all(
        ownedTokenIdsArrays[i].map((tokenId) =>
          getNFT({
            ...options,
            tokenId,
          }).then((nft) => ({
            ...nft,
            owner,
          }))
        )
      );
      ownedNFTs = ownedNFTs.concat(data);
    }

    return ownedNFTs;
    // biome-ignore lint/style/noUselessElse: Code is cleaner this way
  } else {
    const owners = await Promise.all(
      allTokenIds.map((tokenId) =>
        ownerOf({ contract, tokenId }).catch(() => ADDRESS_ZERO)
      )
    );

    const ownedTokenIds = allTokenIds.filter(
      (tokenId, index) => owners[index].toLowerCase() === owner.toLowerCase()
    );

    const promises: ReturnType<typeof getNFT>[] = ownedTokenIds.map((tokenId) =>
      getNFT({
        ...options,
        tokenId,
      }).then((nft) => ({
        ...nft,
        owner,
      }))
    );

    return await Promise.all(promises);
  }
}
