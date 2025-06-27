import type { Chain } from "thirdweb";
import { ink } from "./chains";

type MarketplaceContract = {
  address: string;
  chain: Chain;
  type: "marketplace-v3";
};

export const MARKETPLACE_CONTRACTS: MarketplaceContract[] = [
  {
    address: "0x846d9804Fa21E467119C1e3DE1294f8b060A4881",
    chain: ink,
    type: "marketplace-v3",
  },
];
