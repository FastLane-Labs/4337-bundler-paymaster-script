import { createPublicClient, createWalletClient, http, webSocket } from "viem";
import { CHAIN, RPC_URL, EOA, SHBUNDLER_URL, DEPLOYER_EOA } from "./constants";
import { toSafeSmartAccount } from "permissionless/accounts";
import { entryPoint07Address } from "viem/account-abstraction";
// user client
const userClient = createWalletClient({
  chain: CHAIN,
  transport: http(RPC_URL),
  account: EOA,
});

// deployer eoa client
const deployerClient = createWalletClient({
  chain: CHAIN,
  transport: http(RPC_URL),
  account: DEPLOYER_EOA,
});

// public client
const publicClient = createPublicClient({
  transport: http(RPC_URL),
  chain: CHAIN,
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
  safe4337ModuleAddress: "0x75cf11467937ce3F2f357CE24ffc3DBF8fD5c226",
  safeProxyFactoryAddress: "0xd9d2Ba03a7754250FDD71333F444636471CACBC4",
  safeSingletonAddress: "0x639245e8476E03e789a244f279b5843b9633b2E7",
  safeModuleSetupAddress: "0x2dd68b007B46fBe91B9A7c3EDa5A7a1063cB5b47",
  multiSendAddress: "0x7B21BBDBdE8D01Df591fdc2dc0bE9956Dde1e16C",
  multiSendCallOnlyAddress: "0x32228dDEA8b9A2bd7f2d71A958fF241D79ca5eEC",
});

export { userClient, publicClient, deployerClient, smartAccount };