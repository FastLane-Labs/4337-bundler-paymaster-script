import shmonadAbi from "./abi/shmonad.json";
import paymasterAbi from "./abi/paymaster.json";
import { getContract } from "viem";
import { publicClient, smartAccount } from "./user";
import { PAYMASTER, SHMONAD } from "./constants";

const shMonadContract = getContract({
  address: SHMONAD,
  abi: shmonadAbi,
  client: {
    public: publicClient,
    account: smartAccount,
  },
});

const paymasterContract = getContract({
  address: PAYMASTER,
  abi: paymasterAbi,
  client: {
    public: publicClient,
    account: smartAccount,
  },
});

export { shMonadContract, paymasterContract };