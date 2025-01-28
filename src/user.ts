import { createPublicClient, createWalletClient, http } from "viem";
import { CHAIN, RPC_URL, EOA, SHBUNDLER_URL, DEPLOYER_EOA } from "./constants";
import { toKernelSmartAccount } from "permissionless/accounts";
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
const smartAccount = await toKernelSmartAccount({
  client: publicClient,
  entryPoint: {
    address: entryPoint07Address,
    version: "0.7",
  },
  owners: [EOA],
});

export { userClient, publicClient, smartAccount, deployerClient };