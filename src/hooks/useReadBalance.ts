import { useState, useEffect } from "react";
import { BigNumber } from "ethers";

interface UseReadBalanceProps {
  contract: any; // ethers.Contract instance (for ERC1155)
  owner: string;
  tokenId: string | number | bigint;
}

export function useReadBalance({
  contract,
  owner,
  tokenId,
}: UseReadBalanceProps) {
  const [data, setData] = useState<BigNumber | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchBalance() {
      setIsLoading(true);
      try {
        // assume contract has balanceOf(owner, tokenId) method
        const balance: BigNumber = await contract.balanceOf(owner, tokenId);
        setData(balance);
      } catch (err: any) {
        setError(err);
      } finally {
        setIsLoading(false);
      }
    }
    if (contract && owner && tokenId !== undefined) {
      fetchBalance();
    }
  }, [contract, owner, tokenId]);

  return { data, isLoading, error };
}
