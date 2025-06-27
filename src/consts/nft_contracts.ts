import { Chain } from "thirdweb";
import { ink } from "./chains";
import type { Chain as ChainType } from "./chains";

export type NFTContract = {
  address: string;
  chain: ChainType;
  type: "ERC721" | "ERC1155";
  title: string;
  description: string;
  thumbnailUrl: string;
  backgroundUrl?: string;
  mintable?: boolean;
  available?: boolean;
  mintPrice?: string;
  socials?: {
    website?: string;
    twitter?: string;
    discord?: string;
    telegram?: string;
    feeCreator?: string;
    feeMarketplace?: string;
  };
};

export const NFT_CONTRACTS: NFTContract[] = [
  {
    address: "0x8CC920B0a07Bf092f493E17C1B8856384fFaC448",
    chain: ink,
    type: "ERC721",
    title: "Purple Mural 2",
    description:
      "222 supply of a masterpiece. If you missed Purple Mural, don't miss Purple Mural 2!",
    thumbnailUrl: "/purplemural2/purplemural2.webp",
    backgroundUrl: "/purplemural2/banner_purplemural2.webp",
    mintable: false,
    available: true,
    socials: {
      twitter: "https://x.com/rektink",
      website: "https://www.rektink.com/",
      discord: "",
      telegram: "https://t.me/rektink",
      feeCreator: "0%",
      feeMarketplace: "1%",
    },
  },
  {
    address: "0x70181d7071a289fd6bc46DD8334Ff5cd5b385266",
    chain: ink,
    type: "ERC721",
    title: "Purple Mural",
    description:
      "A legendary moment in early ink history; when 222 community members, builders, and Kraken team members came together to form the iconic Purple Mural",
    thumbnailUrl: "/purplemural/purplemural.webp",
    backgroundUrl: "/purplemural/banner_purplemural.webp",
    mintable: false,
    available: true,
    socials: {
      twitter: "https://x.com/InkPurpleWave",
      website: "https://purples.ink/",
      discord: "",
      telegram: "https://t.me/InkChainPurple",
      feeCreator: "1%",
      feeMarketplace: "1%",
    },
  },
  {
    address: "0x58da2f96c473e9cb89f0de7c6f1faede70d47c93",
    chain: ink,
    type: "ERC721",
    title: "WatchDogs",
    description: "133 WatchDogs NFTs on Ink",
    thumbnailUrl:
      "https://yellow-glamorous-orca-875.mypinata.cloud/ipfs/bafkreibfrhznmqwlpr4sqsrce5vlcu3fniorfp6u6jfngq3aw2x2ioitq4",
    mintable: false,
    available: true,
    mintPrice: "0.0015",
    socials: {
      twitter: "https://x.com/WatchDogsOnInk",
      website: "https://watchdogs.ink/",
      discord: "",
      telegram: "https://t.me/WatchDogsOnInk",
      feeCreator: "0%",
      feeMarketplace: "1%",
    },
  },

  {
    address: "0xfb2cd41a8aec89efbb19575c6c48d872ce97a0a5",
    chain: ink,
    type: "ERC721",
    title: "ZNS Domain Names",
    description:
      "Decentralized naming solutions for the #Web3, Personalized for blockchain interactions with #AI",
    thumbnailUrl: "/zns/zns.webp",
    backgroundUrl: "/zns/banner_zns.webp",
    mintable: false,
    available: true,
    socials: {
      twitter: "https://x.com/ZNSConnect",
      website: "https://www.znsconnect.io/",
      discord: "https://discord.com/invite/skbA5Ucmmc",
      telegram: "https://t.me/znsconnect",
      feeCreator: "1%",
      feeMarketplace: "1%",
    },
  },
  {
    address: "0x25Aa78Ab6785A4b0aeFF5c170998992Fd958d43d",
    chain: ink,
    type: "ERC721",
    title: "Rekt Ink",
    description:
      "The first NFT project on Ink for the culture—a collection of 4444 fully animated Rekt NFTs!",
    thumbnailUrl:
      "https://yellow-glamorous-orca-875.mypinata.cloud/ipfs/bafybeifdrua7pwwogp4exwfllksi2nob7kvjetvbcsnur7fecyfftlywd4",
    backgroundUrl: "/rekt/banner_rekt.webp",
    mintable: false,
    available: true,
    socials: {
      twitter: "https://x.com/rektink",
      website: "https://www.rektink.com/",
      discord: "https://discord.gg/eXz6hBpQPC",
      telegram: "https://t.me/rektink",
      feeCreator: "1%",
      feeMarketplace: "1%",
    },
  },
  {
    address: "0x1f2E2f537a4B190557230F1deC012712f6E56e10",
    chain: ink,
    type: "ERC721",
    title: "Ink Dinos",
    description:
      "Ink Dinos are fully onchain dinos on the ink blockchain. All dino art and metadata is stored 100% onchain. Ink Dinos are cc0. rawr.",
    thumbnailUrl: "/dinos/dinos.webp",
    backgroundUrl: "",
    mintable: false,
    available: true,
    socials: {
      twitter: "https://x.com/AspynPalatnick",
      website: "",
      discord: "",
      telegram: "",
      feeCreator: "0%",
      feeMarketplace: "1%",
    },
  },

  {
    address: "0x6F002AEaA51b1A0aA0794170EB370cFf95cDd058",
    chain: ink,
    type: "ERC721",
    title: "Ink Punks PFP",
    description: "5,000 collectible characters on InkOnChain",
    thumbnailUrl: "/inkpunks/inkpunks.webp",
    backgroundUrl: "/inkpunks/banner_inkpunks.webp",
    mintable: false,
    available: true,
    socials: {
      twitter: "https://x.com/InkPunksPFPs",
      website: "",
      discord: "",
      telegram: "",
      feeCreator: "1%",
      feeMarketplace: "1%",
    },
  },

  {
    address: "0x70e8f7e35331Cd387375d192258Fc68C6Fcf4292",
    chain: ink,
    type: "ERC721",
    title: "InkHeadz NFTs",
    description:
      "A Collection of 4444 Hand-crafted Headz NFTs. Deployed on InkChain",
    thumbnailUrl: "/headz/headz.webp",
    backgroundUrl: "/headz/banner_headz.webp",
    mintable: false,
    available: true,
    socials: {
      twitter: "https://x.com/InkHeadzNFT",
      website: "https://inkheadznft.typedream.app/",
      discord: "",
      telegram: "",
      feeCreator: "1%",
      feeMarketplace: "1%",
    },
  },
  {
    address: "0x92ef0458124A92fdD6B8dbbc8cea33DA992971FD",
    chain: ink,
    type: "ERC721",
    title: "Squid Punks",
    description:
      "A rare collection of 200 Squid Punks, born from the depths of InkChain",
    thumbnailUrl: "/squidpunks/squidpunks.webp",
    backgroundUrl: "/squidpunks/banner_squidpunks.webp",
    mintable: false,
    available: true,
    socials: {
      twitter: "https://x.com/squidswap_ink",
      website: "https://squidswap.ink/",
      discord: "",
      telegram: "https://t.me/squidswap_portal",
      feeCreator: "1%",
      feeMarketplace: "1%",
    },
  },

  {
    address: "0x5e169972aEE4dF2A772e87c06be6D704b4BfD571",
    chain: ink,
    type: "ERC721",
    title: "SQUI Nations NFT",
    description: "A rare collection of 40 SQUI Nations",
    thumbnailUrl: "/squin/squin.webp ",
    backgroundUrl: "",
    mintable: false,
    available: true,
    socials: {
      twitter: "https://x.com/SquionINK",
      website: "",
      discord: "",
      telegram: "",
      feeCreator: "1%",
      feeMarketplace: "1%",
    },
  },
];
