import { useState, useEffect } from "react";

const ZNS_API_BASE_URL = "https://zns.bio/api";
const INK_CHAIN_ID = 57073;

export function useZNS(address: string | null | undefined) {
  const [znsName, setZnsName] = useState<string | null>(null);
  const [znsAvatar, setZnsAvatar] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchZNSData = async () => {
      if (!address) {
        setZnsName(null);
        setZnsAvatar(null);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `${ZNS_API_BASE_URL}/resolveAddress?chain=${INK_CHAIN_ID}&address=${address}`
        );

        const data = await response.json();

        if (data.code === 200 && data.primaryDomain) {
          setZnsName(data.primaryDomain);
          // TODO: We can also save all user domains if needed
          // data.userOwnedDomains contains an array of all domains
        } else {
          setZnsName(null);
        }

        // For now we skip avatar as it's not in the API
        setZnsAvatar(null);
      } catch (err) {
        console.error("Error fetching ZNS data:", err);
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchZNSData();
  }, [address]);

  return { znsName, znsAvatar, loading, error };
}
