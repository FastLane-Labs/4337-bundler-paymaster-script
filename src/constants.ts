import { Chain, Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import dotenv from "dotenv";

dotenv.config();

const RPC_URL = process.env.RPC_URL as string;
const SHBUNDLER_URL = process.env.SHBUNDLER_URL as string;
const PAYMASTER_URL = process.env.PAYMASTER_URL as string;
const PRIVATE_KEY = process.env.PRIVATE_KEY as Hex;
const ADDRESS_HUB = process.env.ADDRESS_HUB as Hex;

const CHAIN_ID = 10143;

const EOA = privateKeyToAccount(PRIVATE_KEY);

const CHAIN: Chain = {
  id: Number(CHAIN_ID),
  name: "Monad Testnet",
  nativeCurrency: {
    decimals: 18,
    name: "Monad",
    symbol: "MON",
  },
  rpcUrls: {
    default: { http: [RPC_URL] },
    public: { http: [RPC_URL] },
  },
};

export {
  CHAIN_ID,
  EOA,
  CHAIN,
  RPC_URL,
  SHBUNDLER_URL,
  PRIVATE_KEY,
  ADDRESS_HUB,
  PAYMASTER_URL,
};
