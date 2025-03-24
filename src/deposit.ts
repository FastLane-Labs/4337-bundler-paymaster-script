import { encodeFunctionData, Hex } from "viem";
import { publicClient, userClient } from "./user";
import shmonadAbi from "./abi/shmonad.json";
import paymasterAbi from "./abi/paymaster.json";
import { BundlerClient } from "viem/_types/account-abstraction";

async function depositAndBondSmartAccountToShmonad(
  bundler: BundlerClient,
  policyId: bigint,
  bondRecipient: Hex,
  shMonToBond: bigint,
  monToDeposit: bigint,
  shmonad: Hex
) {
  
  const data = encodeFunctionData({
    abi: shmonadAbi,
    functionName: "depositAndBond",
    args: [policyId, bondRecipient, shMonToBond],
  });

  const hash = await bundler.sendUserOperation({
    calls: [
      {
        to: shmonad,
        value: monToDeposit,
        data,
      },
    ],
  });

  console.log("Hash:", hash);
  await bundler.waitForUserOperationReceipt({ hash });
}

async function depositToEntrypoint(depositAmount: bigint, paymaster: Hex) {
  const data = encodeFunctionData({
    abi: paymasterAbi,
    functionName: "deposit",
    args: [],
  });

  const hash = await userClient.sendTransaction({
    to: paymaster,
    value: depositAmount,
    data,
  });

  console.log("Hash:", hash);
  await publicClient.waitForTransactionReceipt({ hash });
}

async function depositAndBondEOAToShmonad(
  policyId: bigint,
  bondRecipient: Hex,
  shMonToBond: bigint,
  monToDeposit: bigint,
  shmonad: Hex
) {
  const data = encodeFunctionData({
    abi: shmonadAbi,
    functionName: "depositAndBond",
    args: [policyId, bondRecipient, shMonToBond],
  });

  const hash = await userClient.sendTransaction({
    to: shmonad,
    value: monToDeposit,
    data,
  });

  console.log("Hash:", hash);
  await publicClient.waitForTransactionReceipt({ hash });
}

export {
  depositAndBondSmartAccountToShmonad,
  depositToEntrypoint,
  depositAndBondEOAToShmonad,
};
