// /market/src/consts/client.ts
import { ethers } from "ethers";

const RPC_URL = "process.env.ALCHEMY_KEY";
const CHAIN_ID = 57073;

export const client = new ethers.JsonRpcProvider(RPC_URL, CHAIN_ID);
