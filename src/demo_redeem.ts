import { smartAccount, publicClient, userClient } from "./user";
import { shBundler } from "./bundler";
import { PolicyBond } from "./types";
import { initContract, paymasterMode } from "./contracts";
import {
  depositAndBondSmartAccountToShmonad,
  depositToEntrypoint,
} from "./deposit";
import { ADDRESS_HUB, PAYMASTER_POINTER, SHMONAD_POINTER } from "./constants";
import addressHubAbi from "./abi/addresshub.json";
import paymasterAbi from "./abi/paymaster.json";
import shmonadAbi from "./abi/shmonad.json";
import { Hex } from "viem";
import { unbondEOAToShmonad, withdrawToEOA, unbondSmartAccountFromShmonad, transfer, redeemToSmartAccount, withdrawToSmartAccount, redeemToEOA, withdrawFromPaymasterToEOA } from "./redeem";

// initialize contracts and get addresses
const addressHubContract = await initContract(
  ADDRESS_HUB,
  addressHubAbi,
  publicClient,
  userClient
);

const PAYMASTER = (await addressHubContract.read.getAddressFromPointer([
  BigInt(PAYMASTER_POINTER),
])) as Hex;

const SHMONAD = (await addressHubContract.read.getAddressFromPointer([
  BigInt(SHMONAD_POINTER),
])) as Hex;

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
const policyId = (await paymasterContract.read.policyID([])) as bigint;

// smart account
const smartAccountBalance = await publicClient.getBalance({
  address: smartAccount.address,
});
console.log("smart account address", smartAccount.address);
console.log("Smart Account MON Balance:", smartAccountBalance);

const smartAccountShMonBalance = await shMonadContract.read.balanceOf([
  smartAccount.address,
]) as bigint;
console.log("Smart Account shMON Balance:", smartAccountShMonBalance);

const smartAccountBond = (await shMonadContract.read.getPolicyBond([
  policyId,
  smartAccount.address,
])) as PolicyBond;
console.log("Smart Account shmonad unbonding", smartAccountBond.unbonding);
console.log("Smart Account shmonad bonded", smartAccountBond.bonded);

if (smartAccountBond.bonded > 0n) {
  await unbondSmartAccountFromShmonad(shBundler,policyId, smartAccountBond.bonded, SHMONAD);
}

if (smartAccountBond.unbonding > 0n) {
    await redeemToSmartAccount(shBundler,policyId, smartAccountBond.unbonding, SHMONAD);
  }

if (smartAccountShMonBalance > 0n) {
  await withdrawToSmartAccount(shBundler, smartAccountShMonBalance, SHMONAD);
}

// await transfer(shBundler, smartAccountBalance, userClient.account.address);

// sponsor
const sponsorBalance = await publicClient.getBalance({
    address: userClient.account.address,
});
console.log("sponsor address", userClient.account.address);
console.log("Sponsor MON Balance:", sponsorBalance);

const sponsorShMonBalance = await shMonadContract.read.balanceOf([
    userClient.account.address,
]) as bigint;
console.log("Sponsor shMON Balance:", sponsorShMonBalance);

const sponsorBond = (await shMonadContract.read.getPolicyBond([
    policyId,
    userClient.account.address,
])) as PolicyBond;
console.log("Sponsor shmonad unbonding", sponsorBond.unbonding);
console.log("Sponsor shmonad bonded", sponsorBond.bonded);

if (sponsorBond.bonded > 0n) {
  await unbondEOAToShmonad(policyId, sponsorBond.bonded, SHMONAD);
}

if (sponsorBond.unbonding > 0n) {
    await redeemToEOA(policyId, sponsorBond.unbonding, SHMONAD);
  }

if (sponsorShMonBalance > 0n) {
  await withdrawToEOA(sponsorShMonBalance, SHMONAD);
}

const paymasterDeposit = await paymasterContract.read.getDeposit([]) as bigint;
console.log("paymaster entrypoint deposit", paymasterDeposit);

const paymasterBond = (await shMonadContract.read.getPolicyBond([
    policyId,
    PAYMASTER,
])) as PolicyBond;
console.log("Paymaster shmonad unbonding", paymasterBond.unbonding);
console.log("Paymaster shmonad bonded", paymasterBond.bonded);

// if (paymasterDeposit > 0n) {
//   await withdrawToEOA(paymasterDeposit, PAYMASTER);
// }

process.exit(0);
