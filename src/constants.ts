import { Chain, Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import dotenv from "dotenv";

dotenv.config();

const RPC_URL = process.env.RPC_URL as string;
const SHBUNDLER_URL = process.env.SHBUNDLER_URL as string;
const PRIVATE_KEY = process.env.PRIVATE_KEY as Hex;
const ADDRESS_HUB = process.env.ADDRESS_HUB as Hex;

const SHMONAD_POINTER = 1;
const PAYMASTER_POINTER = 8;
const CHAIN_ID = 10143;

//Fastlane deployed safe smart account modules
const SAFE4337_MODULE_ADDRESS = "0x75cf11467937ce3F2f357CE24ffc3DBF8fD5c226";
const SAFE_PROXY_FACTORY_ADDRESS = "0xd9d2Ba03a7754250FDD71333F444636471CACBC4";
const SAFE_SINGLETON_ADDRESS = "0x639245e8476E03e789a244f279b5843b9633b2E7";
const SAFE_MODULE_SETUP_ADDRESS = "0x2dd68b007B46fBe91B9A7c3EDa5A7a1063cB5b47";
const MULTI_SEND_ADDRESS = "0x7B21BBDBdE8D01Df591fdc2dc0bE9956Dde1e16C";
const MULTI_SEND_CALL_ONLY_ADDRESS = "0x32228dDEA8b9A2bd7f2d71A958fF241D79ca5eEC";

const EOA = privateKeyToAccount(PRIVATE_KEY);

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
  CHAIN, 
  RPC_URL, 
  SHBUNDLER_URL, 
  PRIVATE_KEY,
  ADDRESS_HUB,
  SHMONAD_POINTER,
  PAYMASTER_POINTER,
  SAFE4337_MODULE_ADDRESS,
  SAFE_PROXY_FACTORY_ADDRESS,
  SAFE_SINGLETON_ADDRESS,
  SAFE_MODULE_SETUP_ADDRESS,
  MULTI_SEND_ADDRESS,
  MULTI_SEND_CALL_ONLY_ADDRESS,
};
