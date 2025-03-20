import { createPublicClient, createWalletClient, http } from "viem";
import {
  CHAIN,
  RPC_URL,
  EOA,
  SAFE4337_MODULE_ADDRESS,
  SAFE_PROXY_FACTORY_ADDRESS,
  SAFE_SINGLETON_ADDRESS,
  SAFE_MODULE_SETUP_ADDRESS,
  MULTI_SEND_ADDRESS,
  MULTI_SEND_CALL_ONLY_ADDRESS,
  PAYMASTER_URL,
  SHBUNDLER_URL,
} from "./constants";
import { toSafeSmartAccount } from "permissionless/accounts";
import { createBundlerClient, entryPoint07Address } from "viem/account-abstraction";
import { createPaymasterClient } from "viem/account-abstraction";
import { createSmartAccountClient } from "permissionless";
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
  version: "1.4.1",
  safe4337ModuleAddress: SAFE4337_MODULE_ADDRESS,
  safeProxyFactoryAddress: SAFE_PROXY_FACTORY_ADDRESS,
  safeSingletonAddress: SAFE_SINGLETON_ADDRESS,
  safeModuleSetupAddress: SAFE_MODULE_SETUP_ADDRESS,
  multiSendAddress: MULTI_SEND_ADDRESS,
  multiSendCallOnlyAddress: MULTI_SEND_CALL_ONLY_ADDRESS,
});

const smartAccountClient = createSmartAccountClient({
  client: publicClient,
  bundlerTransport: http(SHBUNDLER_URL),
  chain: CHAIN,
});

const shBundler = createBundlerClient({
  transport: http(SHBUNDLER_URL),
  name: "shBundler",
  client: publicClient,
  chain: CHAIN,
  paymaster: paymasterClient,
})

export { userClient, publicClient, smartAccount, paymasterClient, smartAccountClient, shBundler };
