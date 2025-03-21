import { smartAccount, publicClient, userClient, shBundler } from "./user";
import { initContract } from "./contracts";
import { depositAndBondEOAToShmonad } from "./deposit";
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

const bondAmount = 2000000000000000000n;

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

if (smartAccountBondedAmount < bondAmount) {
  const amountToDeposit = bondAmount - smartAccountBondedAmount;

  const shMONToBond = (await shMonadContract.read.previewDeposit([
    amountToDeposit,
  ])) as bigint;

  console.log("Depositing and bonding smart account to shmonad", shMONToBond);

  await depositAndBondEOAToShmonad(
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

// send user operation with shBundler
const userOpHash = await shBundler.sendUserOperation({
  account: smartAccount,
  calls: [
    {
      to: userClient.account.address,
      value: 1000000000000000n,
    },
  ],
  paymasterContext: {
    mode: "user",
    paymaster: PAYMASTER,
    sponsor: smartAccount.address,
  },
});

console.log("User Operation Hash:", userOpHash);

const userOpReceipt = await shBundler.waitForUserOperationReceipt({
  hash: userOpHash,
});
console.log("User Operation Receipt:", userOpReceipt);

process.exit(0);
