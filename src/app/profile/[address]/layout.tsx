import MarketplaceProvider from "@/hooks/useMarketplaceContext";
import { NFT_CONTRACTS } from "@/consts/nft_contracts";
import type { ReactNode } from "react";

export default function ProfileLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: { address: string };
}) {
  // Use the first contract as default
  const defaultContract = NFT_CONTRACTS[0];

  return (
    <MarketplaceProvider
      chainId={"57073"}
      contractAddress={defaultContract.address}
    >
      {children}
    </MarketplaceProvider>
  );
}
