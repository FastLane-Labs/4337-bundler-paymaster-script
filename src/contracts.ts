import shmonadAbi from "./abi/shmonad.json";
import paymasterAbi from "./abi/paymaster.json";
import { getContract } from "viem";
import { publicClient, userClient } from "./user";
import { PAYMASTER, SHMONAD } from "./constants";

const shMonadContract = getContract({
  address: SHMONAD,
  abi: shmonadAbi,
  client: {
    public: publicClient,
    account: userClient,
  },
});

const paymasterContract = getContract({
  address: PAYMASTER,
  abi: paymasterAbi,
  client: {
    public: publicClient,
    account: userClient,
  },
});

export { shMonadContract, paymasterContract };