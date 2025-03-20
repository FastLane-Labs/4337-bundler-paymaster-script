import { smartAccount, publicClient, userClient, smartAccountClient, shBundler } from "./user";
import { initContract } from "./contracts";
import { depositAndBondEOAToShmonad } from "./deposit";
import { ADDRESS_HUB, CHAIN_ID } from "./constants";
import addressHubAbi from "./abi/addresshub.json";
import paymasterAbi from "./abi/paymaster.json";
import shmonadAbi from "./abi/shmonad.json";
import { Hex } from "viem";
import { toPackedUserOperation } from "viem/account-abstraction";
import { getHash } from "./paymasterBackend";

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
const depositAmount = 2500000000000000000n;

// sponsor
const sponsorBalance = await publicClient.getBalance({
  address: userClient.account.address,
});
console.log("sponsor address", userClient.account.address);
console.log("Sponsor MON Balance:", sponsorBalance);

const sponsorBondedAmount = (await shMonadContract.read.balanceOfBonded([
  policyId,
  userClient.account.address,
])) as bigint;
console.log("Sponsor shmonad bonded", sponsorBondedAmount);

if (sponsorBondedAmount < depositAmount) {
  const amountToDeposit = depositAmount - sponsorBondedAmount;

  const shMONToBond = (await shMonadContract.read.previewDeposit([
    amountToDeposit,
  ])) as bigint;
  console.log("Depositing and bonding sponsor to shmonad", shMONToBond);
  
  await depositAndBondEOAToShmonad(
    policyId,
    userClient.account.address,
    shMONToBond,
    amountToDeposit,
    SHMONAD
  );
}

// paymaster
const paymasterDeposit = await paymasterContract.read.getDeposit([]);
console.log("paymaster entrypoint deposit", paymasterDeposit);

const calls = [
  {
    to: userClient.account.address,
    value: 1000000000000000n,
  },
];

const userOp = await smartAccountClient.prepareUserOperation({
  account: smartAccount,
  calls,
});

//get this from a backend service
const currentTime = BigInt(Math.floor(Date.now() / 1000));
const validUntil = currentTime + BigInt(3600);
const validAfter = BigInt(0);
const sponsorSignature = await getHash(
  toPackedUserOperation(userOp),
  validUntil,
  validAfter,
  PAYMASTER,
  BigInt(CHAIN_ID)
)

console.log("sponsorSignature", sponsorSignature);

const userOpHash = await shBundler.sendUserOperation({
  account: smartAccount,
  calls,
  paymasterContext: {
    mode: "sponsor",
    paymaster: PAYMASTER,
    sponsor: userClient.account.address,
    sponsorSignature: sponsorSignature,
    validUntil,
    validAfter
  }
});

const userOpReceipt = await shBundler.waitForUserOperationReceipt({
  hash: userOpHash,
});
console.log("User Operation Receipt:", userOpReceipt);

process.exit(0);
