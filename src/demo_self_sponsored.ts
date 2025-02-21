import { smartAccount, publicClient, userClient } from "./user";
import { shBundler } from "./bundler";
import { initContract, paymasterMode } from "./contracts";
import {
  depositAndBondSmartAccountToShmonad,
  depositToEntrypoint,
} from "./deposit";
import { ADDRESS_HUB } from "./constants";
import addressHubAbi from "./abi/addresshub.json";
import paymasterAbi from "./abi/paymaster.json";
import shmonadAbi from "./abi/shmonad.json";
import { Hex } from "viem";

// initialize contracts and get addresses
const addressHubContract = await initContract(
  ADDRESS_HUB,
  addressHubAbi,
  publicClient,
  userClient
);

const PAYMASTER = (await addressHubContract.read.paymaster4337([])) as Hex;
const SHMONAD = (await addressHubContract.read.shMonad([])) as Hex;

const paymasterContract = await initContract(
  PAYMASTER,
  paymasterAbi,
  publicClient,
  userClient
);

const shMonadContract = await initContract(
  SHMONAD,
  shmonadAbi,
  publicClient,
  userClient
);

// paymaster policy
const policyId = (await paymasterContract.read.POLICY_ID([])) as bigint;
const transferAmount = 3400000000000000000n;
const bondAmount = 3000000000000000000n;

// smart account
const smartAccountBalance = await publicClient.getBalance({
  address: smartAccount.address,
});
console.log("smart account address", smartAccount.address);
console.log("Smart Account MON Balance:", smartAccountBalance);

const smartAccountShMonBalance = await shMonadContract.read.balanceOf([
  smartAccount.address,
]);
console.log("Smart Account shMON Balance:", smartAccountShMonBalance);

const smartAccountBondedAmount = (await shMonadContract.read.balanceOfBonded([
  policyId,
  smartAccount.address,
])) as bigint;
console.log("Smart Account shmonad bonded", smartAccountBondedAmount);

if (smartAccountBalance < transferAmount) {
  const amountToTransfer = transferAmount - smartAccountBalance;
  console.log("Transferring", amountToTransfer, "to smart account");

  const hash = await userClient.sendTransaction({
    to: smartAccount.address,
    value: amountToTransfer,
    gas: 28000n,
  });

  console.log("Hash:", hash);
  await publicClient.waitForTransactionReceipt({ hash });
}

if (smartAccountBondedAmount < bondAmount) {
  const amountToDeposit = bondAmount - smartAccountBondedAmount;

  const shMONToBond = (await shMonadContract.read.previewDeposit([
    amountToDeposit,
  ])) as bigint;

  console.log("Depositing and bonding smart account to shmonad", shMONToBond);

  await depositAndBondSmartAccountToShmonad(
    shBundler,
    policyId,
    smartAccount.address,
    shMONToBond,
    amountToDeposit,
    SHMONAD
  );
}

// paymaster
const paymasterDeposit = await paymasterContract.read.getDeposit([]);
console.log("paymaster entrypoint deposit", paymasterDeposit);

const paymasterDepositAmount = 9990000000000000000n

if ((paymasterDeposit as bigint) < paymasterDepositAmount) {
  const amountToDeposit = paymasterDepositAmount - (paymasterDeposit as bigint);
  console.log("Depositing to paymaster", amountToDeposit);
  await depositToEntrypoint(amountToDeposit, PAYMASTER);
}

// send user operation with shBundler
const userOpHash = await shBundler.sendUserOperation({
  account: smartAccount,
  paymaster: PAYMASTER,
  paymasterData: paymasterMode("user") as Hex,
  paymasterPostOpGasLimit: 500000n,
  paymasterVerificationGasLimit: 500000n,
  calls: [
    {
      to: userClient.account.address,
      value: 1000000000000000n,
    },
  ],
  ...(await shBundler.getUserOperationGasPrice()).slow,
});

console.log("User Operation Hash:", userOpHash);

const userOpReceipt = await shBundler.waitForUserOperationReceipt({
  hash: userOpHash,
});
console.log("User Operation Receipt:", userOpReceipt);

process.exit(0);
