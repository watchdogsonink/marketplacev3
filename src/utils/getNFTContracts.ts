import NFTABI from "@/abis/NFTABI.json";
import { ethers } from "ethers";
import { client } from "@/consts/client";

// Function creates an NFT contract instance for the given dynamic address.
export function getNFTContract(contractAddress: string) {
  return new ethers.Contract(contractAddress, NFTABI, client);
}
