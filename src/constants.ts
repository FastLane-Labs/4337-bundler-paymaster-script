import { Chain, Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import dotenv from "dotenv";

dotenv.config();

const RPC_URL = process.env.RPC_URL as string;
const SHBUNDLER_URL = process.env.SHBUNDLER_URL as string;
const PRIVATE_KEY = process.env.PRIVATE_KEY as Hex;
const SHMONAD = process.env.SHMONAD as Hex;
const PAYMASTER = process.env.PAYMASTER as Hex;
const DEPLOYER_PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY as Hex;
const PIMLICO_URL = process.env.PIMLICO_URL as string;

const EOA = privateKeyToAccount(PRIVATE_KEY);
const DEPLOYER_EOA = privateKeyToAccount(DEPLOYER_PRIVATE_KEY);
const CHAIN_ID = process.env.CHAIN_ID as Hex;

const CHAIN: Chain = {
  id: Number(CHAIN_ID),
  name: 'Monad Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Monad',
    symbol: 'MON',
  },
  rpcUrls: {
    default: { http: [RPC_URL] },
    public: { http: [RPC_URL] },
  },
};

export { 
  EOA, 
  DEPLOYER_EOA,
  CHAIN, 
  RPC_URL, 
  SHBUNDLER_URL, 
  PRIVATE_KEY, 
  SHMONAD, 
  PAYMASTER,
  PIMLICO_URL,
};