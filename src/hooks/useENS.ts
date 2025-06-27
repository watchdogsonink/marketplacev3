import { useState, useEffect } from "react";
import { ethers } from "ethers";

//constant provider for Ethereum Mainnet for ENS
const ensProvider = new ethers.JsonRpcProvider(
  "https://eth-mainnet.g.alchemy.com/v2/process.env.ALCHEMY_KEY"
);

export const useENS = (address?: string | null) => {
  const [ensName, setEnsName] = useState<string | null>(null);
  const [ensAvatar, setEnsAvatar] = useState<string | null>(null);

  useEffect(() => {
    const fetchEnsName = async () => {
      if (!address) return;

      try {
        //we try to get the ENS name
        const name = await ensProvider.lookupAddress(address);
        console.log("ENS name for", address, ":", name); //debug log

        if (name) {
          setEnsName(name);

          //if we have the ENS name, we try to get the avatar
          const resolver = await ensProvider.getResolver(name);
          if (resolver) {
            const avatar = await resolver.getText("avatar");
            if (avatar) {
              setEnsAvatar(avatar);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching ENS:", error);
      }
    };

    fetchEnsName();
  }, [address]);

  return { ensName, ensAvatar };
};
