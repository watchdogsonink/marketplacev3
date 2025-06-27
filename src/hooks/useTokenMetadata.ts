// /market/src/hooks/useTokenMetadata.ts
import { useState, useEffect } from "react";

interface TokenMetadata {
  name?: string;
  image?: string;
  description?: string;
  attributes?: Array<{ trait_type: string; value: string }>;
  [key: string]: any;
}

export function useTokenMetadata(tokenURI: string) {
  const [metadata, setMetadata] = useState<TokenMetadata | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tokenURI) return;
    async function fetchMetadata() {
      try {
        let data: TokenMetadata;
        // If tokenURI is already raw JSON
        if (tokenURI.trim().startsWith("{")) {
          data = JSON.parse(tokenURI);
        }
        // If tokenURI is encoded as data URI
        else if (tokenURI.startsWith("data:application/json;base64,")) {
          const base64Data = tokenURI.replace(
            "data:application/json;base64,",
            ""
          );
          const jsonString = atob(base64Data);
          data = JSON.parse(jsonString);
        }
        // If tokenURI is a URL - fetch data via fetch
        else {
          const response = await fetch(tokenURI);
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          data = await response.json();
        }
        setMetadata(data);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    fetchMetadata();
  }, [tokenURI]);

  return { metadata, loading, error };
}
