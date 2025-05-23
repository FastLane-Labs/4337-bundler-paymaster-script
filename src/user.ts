import { createPublicClient, createWalletClient, hexToBigInt, http } from "viem";
import {
  CHAIN,
  RPC_URL,
  EOA,
  PAYMASTER_URL,
  SHBUNDLER_URL,
} from "./constants";
import { toSafeSmartAccount } from "permissionless/accounts";
import { BundlerClient, createBundlerClient, entryPoint07Address } from "viem/account-abstraction";
import { createPaymasterClient } from "viem/account-abstraction";
import { createSmartAccountClient } from "permissionless";
import { GasPriceRequest, GasPrices } from "./types";
// user client
const userClient = createWalletClient({
  chain: CHAIN,
  transport: http(RPC_URL),
  account: EOA,
});

// public client
const publicClient = createPublicClient({
  transport: http(RPC_URL),
  chain: CHAIN,
});

// paymaster client
const paymasterClient = createPaymasterClient({
  transport: http(PAYMASTER_URL),
});

// smart wallet
const smartAccount = await toSafeSmartAccount({
  client: publicClient,
  entryPoint: {
    address: entryPoint07Address,
    version: "0.7",
  },
  owners: [EOA],
  version: "1.4.1"
});

// Extract the shared gas estimation function
const estimateFeesPerGas = async ({ bundlerClient }: { bundlerClient: BundlerClient }): Promise<GasPrices> => {
  const resultEncoded = await bundlerClient.request<GasPriceRequest>({
    method: "gas_getUserOperationGasPrice",
    params: [],
  });

  // Returning standard, but could choose any tier
  return {
    maxFeePerGas: hexToBigInt(resultEncoded.standard.maxFeePerGas),
    maxPriorityFeePerGas: hexToBigInt(resultEncoded.standard.maxPriorityFeePerGas)
  };
};

const smartAccountClient = createSmartAccountClient({
  account: smartAccount,
  client: publicClient,
  bundlerTransport: http(SHBUNDLER_URL),
  paymaster: paymasterClient,
  chain: CHAIN,
  paymasterContext: {
    mode: "sponsor",
    sponsor: userClient.account.address,
    validUntil: BigInt(Math.floor(Date.now() / 1000) + 3600),
    validAfter: BigInt(Math.floor(Date.now() / 1000))
  }
});

const shBundler = createBundlerClient({
  account: smartAccount,
  paymaster: paymasterClient,
  transport: http(SHBUNDLER_URL),
  client: publicClient,
  chain: CHAIN,
  paymasterContext: {
    mode: "sponsor",
    sponsor: userClient.account.address,
    validUntil: BigInt(Math.floor(Date.now() / 1000) + 3600),
    validAfter: BigInt(Math.floor(Date.now() / 1000))
  }
});

export { 
  userClient, 
  publicClient, 
  smartAccount, 
  paymasterClient, 
  smartAccountClient,  
  shBundler
};
