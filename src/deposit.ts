import { encodeFunctionData, Hex } from "viem";
import { publicClient, userClient } from "./user";
import shmonadAbi from "./abi/shmonad.json";
import paymasterAbi from "./abi/paymaster.json";
import { ShBundler } from "./types";

async function depositAndBondSmartAccountToShmonad(
  shBundler: ShBundler,
  policyId: bigint,
  bondRecipient: Hex,
  depositAmount: bigint,
  shmonad: Hex
) {
  const data = encodeFunctionData({
    abi: shmonadAbi,
    functionName: "depositAndBond",
    args: [policyId, bondRecipient, depositAmount],
  });

  const hash = await shBundler.sendUserOperation({
    calls: [
      {
        to: shmonad,
        value: depositAmount,
        data,
      },
    ],
    ...(await shBundler.getUserOperationGasPrice()).slow,
  });

  console.log("Hash:", hash);
  await shBundler.waitForUserOperationReceipt({ hash });
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
  depositAmount: bigint,
  shmonad: Hex
) {
  const data = encodeFunctionData({
    abi: shmonadAbi,
    functionName: "depositAndBond",
    args: [policyId, bondRecipient, depositAmount],
  });

  const hash = await userClient.sendTransaction({
    to: shmonad,
    value: depositAmount,
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
