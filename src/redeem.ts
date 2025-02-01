import { encodeFunctionData, Hex } from "viem";
import { deployerClient, publicClient, userClient } from "./user";
import shmonadAbi from "./abi/shmonad.json";
import paymasterAbi from "./abi/paymaster.json";
import { ShBundler } from "./types";

async function unbondSmartAccountFromShmonad(
  shBundler: ShBundler,
  policyId: bigint,
  depositAmount: bigint,
  shmonad: Hex
) {
  const data = encodeFunctionData({
    abi: shmonadAbi,
    functionName: "unbond",
    args: [policyId, depositAmount],
  });

  const hash = await shBundler.sendUserOperation({
    calls: [
      {
        to: shmonad,
        value: 0n,
        data,
      },
    ],
    ...(await shBundler.getUserOperationGasPrice()).slow,
  });

  console.log("Hash:", hash);
  await shBundler.waitForUserOperationReceipt({ hash });
}

async function redeemToSmartAccount(
  shBundler: ShBundler,
  policyId: bigint,
  withdrawAmount: bigint,
  shmonad: Hex
) {
  const data = encodeFunctionData({
    abi: shmonadAbi,
    functionName: "redeem",
    args: [policyId, withdrawAmount],
  });

  const hash = await shBundler.sendUserOperation({
    calls: [
      {
        to: shmonad,
        value: 0n,
        data,
      },
    ],
    ...(await shBundler.getUserOperationGasPrice()).slow,
  });

  console.log("Hash:", hash);
  await shBundler.waitForUserOperationReceipt({ hash });
}

async function withdrawToSmartAccount(
  shBundler: ShBundler,
  withdrawAmount: bigint,
  shmonad: Hex
) {
  const data = encodeFunctionData({
    abi: shmonadAbi,
    functionName: "withdraw",
    args: [withdrawAmount],
  });

  const hash = await shBundler.sendUserOperation({
    calls: [
      {
        to: shmonad,
        value: 0n,
        data,
      },
    ],
    ...(await shBundler.getUserOperationGasPrice()).slow,
  });

  console.log("Hash:", hash);
  await shBundler.waitForUserOperationReceipt({ hash });
}

async function transfer(
  shBundler: ShBundler,
  amount: bigint,
  to: Hex
) {

  const hash = await shBundler.sendUserOperation({
    calls: [
      {
        to: to,
        value: amount,
      },
    ],
    ...(await shBundler.getUserOperationGasPrice()).slow,
  });

  console.log("Hash:", hash);
  await shBundler.waitForUserOperationReceipt({ hash });
}

async function withdrawFromPaymasterToEOA(withdrawAmount: bigint, paymaster: Hex) {
  const data = encodeFunctionData({
    abi: paymasterAbi,
    functionName: "withdrawTo",
    args: [userClient.account.address, withdrawAmount],
  });

  const hash = await deployerClient.sendTransaction({
    to: paymaster,
    value: 0n,
    data,
    gas: 1000000n,
  });

  console.log("Hash:", hash);
  await publicClient.waitForTransactionReceipt({ hash });
}

async function unbondEOAToShmonad(
  policyId: bigint,
  depositAmount: bigint,
  shmonad: Hex
) {
  const data = encodeFunctionData({
    abi: shmonadAbi,
    functionName: "unbond",
    args: [policyId, depositAmount],
  });

  const hash = await userClient.sendTransaction({
    to: shmonad,
    value: 0n,
    data,
  });

  console.log("Hash:", hash);
  await publicClient.waitForTransactionReceipt({ hash });
}

async function redeemToEOA(
  policyId: bigint,
  withdrawAmount: bigint,
  shmonad: Hex
) {
  const data = encodeFunctionData({
    abi: shmonadAbi,
    functionName: "redeem",
    args: [policyId, withdrawAmount],
  });

  const hash = await userClient.sendTransaction({
    to: shmonad,
    value: 0n,
    data,
  });

  console.log("Hash:", hash);
  await publicClient.waitForTransactionReceipt({ hash });
}

async function withdrawToEOA(
  withdrawAmount: bigint,
  shmonad: Hex
) {
  const data = encodeFunctionData({
    abi: shmonadAbi,
    functionName: "withdraw",
    args: [withdrawAmount],
  });

  const hash = await userClient.sendTransaction({
    to: shmonad,
    value: 0n,
    data,
  });

  console.log("Hash:", hash);
  await publicClient.waitForTransactionReceipt({ hash });
}

export {
  unbondSmartAccountFromShmonad,
  withdrawToEOA,
  unbondEOAToShmonad,
  redeemToEOA,
  withdrawFromPaymasterToEOA,
  redeemToSmartAccount,
  withdrawToSmartAccount,
  transfer,
};
