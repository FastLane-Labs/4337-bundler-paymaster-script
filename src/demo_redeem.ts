import { smartAccount, publicClient, userClient } from "./user";
import { shBundler } from "./bundler";
import { initContract } from "./contracts";
import { ADDRESS_HUB, PAYMASTER_POINTER, SHMONAD_POINTER } from "./constants";
import addressHubAbi from "./abi/addresshub.json";
import paymasterAbi from "./abi/paymaster.json";
import shmonadAbi from "./abi/shmonad.json";
import { Hex } from "viem";
import { unbondEOAToShmonad, withdrawToEOA, unbondSmartAccountFromShmonad, transfer, claimToSmartAccount, withdrawToSmartAccount, claimToEOA, withdrawFromPaymasterToEOA } from "./redeem";

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
console.log("PAYMASTER", PAYMASTER);

const SHMONAD = (await addressHubContract.read.getAddressFromPointer([
  BigInt(SHMONAD_POINTER),
])) as Hex;
console.log("SHMONAD", SHMONAD);

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

const smartAccountBond = (await shMonadContract.read.balanceOfBonded([
  policyId,
  smartAccount.address,
])) as bigint;

const smartAccountUnbonding = (await shMonadContract.read.balanceOfUnbonding([
  policyId,
  smartAccount.address,
])) as bigint;
console.log("Smart Account shmonad bonded", smartAccountBond);
console.log("Smart Account shmonad unbonding", smartAccountUnbonding);


if (smartAccountBond > 0n) {
  await unbondSmartAccountFromShmonad(shBundler, policyId, smartAccountBond, SHMONAD);
}

if (smartAccountUnbonding > 0n) {
    await claimToSmartAccount(shBundler, policyId, smartAccountUnbonding, SHMONAD);
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

const sponsorBond = (await shMonadContract.read.balanceOfBonded([
    policyId,
    userClient.account.address,
])) as bigint;

const sponsorUnbonding = (await shMonadContract.read.balanceOfUnbonding([
  policyId,
  userClient.account.address,
])) as bigint;
console.log("Sponsor shmonad bonded", sponsorBond);
console.log("Sponsor shmonad unbonding", sponsorUnbonding);

if (sponsorBond > 0n) {
  await unbondEOAToShmonad(policyId, sponsorBond, SHMONAD);
}

if (sponsorUnbonding > 0n) {
    await claimToEOA(policyId, sponsorUnbonding, SHMONAD);
  }

if (sponsorShMonBalance > 0n) {
  await withdrawToEOA(sponsorShMonBalance, SHMONAD);
}

const paymasterDeposit = await paymasterContract.read.getDeposit([]) as bigint;
console.log("paymaster entrypoint deposit", paymasterDeposit);

const paymasterBond = (await shMonadContract.read.balanceOfBonded([
    policyId,
    PAYMASTER,
])) as bigint;
console.log("Paymaster shmonad bonded", paymasterBond);

if (paymasterDeposit > 0n) {
  await withdrawFromPaymasterToEOA(paymasterDeposit, PAYMASTER);
}

process.exit(0);
