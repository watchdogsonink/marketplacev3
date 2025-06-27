import { create } from "zustand";

type ProfileData = {
  totalNFTs: number;
  totalValue: number;
  avatar?: string;
};

type ProfileStore = {
  profiles: Record<string, ProfileData>;
  updateProfile: (address: string, data: ProfileData) => void;
};

export const useProfileStore = create<ProfileStore>((set) => ({
  profiles: {},
  updateProfile: (address, data) =>
    set((state) => ({
      profiles: {
        ...state.profiles,
        [address.toLowerCase()]: data,
      },
    })),
}));
