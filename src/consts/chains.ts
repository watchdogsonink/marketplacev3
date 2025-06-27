import { defineChain, Chain } from "thirdweb";

export const ink = defineChain({
  chainId: 57073,
  rpc: ["process.env.ALCHEMY_KEY"],
  nativeCurrency: {
    name: "INK",
    symbol: "ETH",
    decimals: 18,
  },
  shortName: "ink",
  slug: "ink",
  chain: "INK",
  name: "INK Network",
  testnet: false,
  explorers: [
    {
      name: "INK Explorer",
      url: "https://explorer.inkonchain.com",
      standard: "EIP3091",
    },
  ],
});

export type { Chain };
