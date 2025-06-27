import { useState, useEffect, useCallback } from "react";

type ProfileData = {
  totalNFTs: number;
  totalValue: number;
  avatar?: string;
};

const defaultData: ProfileData = {
  totalNFTs: 0,
  totalValue: 0,
};

const STORAGE_KEY = "user_profile_";

export function useProfile(address: string) {
  // Function to get data from localStorage
  const getStoredData = useCallback(() => {
    if (typeof window !== "undefined" && address) {
      const stored = localStorage.getItem(STORAGE_KEY + address.toLowerCase());
      return stored ? JSON.parse(stored) : defaultData;
    }
    return defaultData;
  }, [address]);

  const [data, setData] = useState<ProfileData>(getStoredData);

  // Update data when address changes
  useEffect(() => {
    setData(getStoredData());
  }, [address, getStoredData]);

  // Function to save data
  const saveData = useCallback(
    (newData: ProfileData) => {
      if (typeof window !== "undefined" && address) {
        localStorage.setItem(
          STORAGE_KEY + address.toLowerCase(),
          JSON.stringify(newData)
        );
      }
    },
    [address]
  );

  const updateAvatar = useCallback(
    (avatarUrl: string) => {
      const newData = { ...data, avatar: avatarUrl };
      setData(newData);
      saveData(newData);
    },
    [data, saveData]
  );

  const updateStats = useCallback(
    (nftsCount: number, value: number) => {
      const newData = {
        ...data,
        totalNFTs: nftsCount,
        totalValue: value,
      };
      setData(newData);
      saveData(newData);
    },
    [data, saveData]
  );

  return {
    data,
    updateAvatar,
    updateStats,
  };
}
