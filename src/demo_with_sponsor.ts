import { smartAccount, publicClient, userClient } from "./user";
import { shBundler } from "./bundler";
import { PolicyBond } from "./types";
import { initContract, paymasterMode } from "./contracts";
import { depositAndBondEOAToShmonad, depositToEntrypoint } from "./deposit";
import { ADDRESS_HUB, PAYMASTER_POINTER, SHMONAD_POINTER } from "./constants";
import addressHubAbi from "./abi/addresshub.json";
import paymasterAbi from "./abi/paymaster.json";
import shmonadAbi from "./abi/shmonad.json";
import { Hex } from "viem";
import { toPackedUserOperation } from "viem/account-abstraction";

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
const depositAmount = 2000000000000000000n;

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
  console.log("Depositing and bonding sponsor to shmonad", amountToDeposit);
  await depositAndBondEOAToShmonad(policyId, userClient.account.address, amountToDeposit, SHMONAD);
}

// paymaster
const paymasterDeposit = await paymasterContract.read.getDeposit([]);
console.log("paymaster entrypoint deposit", paymasterDeposit);

if ((paymasterDeposit as bigint) < depositAmount) {
  const amountToDeposit = depositAmount - (paymasterDeposit as bigint);
  console.log("Depositing to entrypoint", amountToDeposit);
  await depositToEntrypoint(amountToDeposit, PAYMASTER);
}

// send user operation with shBundler
const userOperation = await shBundler.prepareUserOperation({
  account: smartAccount,
  calls: [
    {
      to: userClient.account.address,
      value: 1000000000000000n
    },
  ],
  ...(await shBundler.getUserOperationGasPrice()).slow,
});

const validAfter = 0n;
const validUntil = BigInt(Date.now() + 1000 * 60 * 60 * 24) + BigInt(100);

const hash = await paymasterContract.read.getHash([
  toPackedUserOperation(userOperation),
  validUntil,
  validAfter,
]);

const sponsorSignature = await userClient.signMessage({
  message: { raw: hash as Hex },
});

userOperation.paymasterData = paymasterMode(
  "sponsor",
  validUntil,
  validAfter,
  sponsorSignature,
  userClient
) as Hex;

userOperation.paymaster = PAYMASTER;
userOperation.paymasterVerificationGasLimit = 500000n;
userOperation.paymasterPostOpGasLimit = 500000n;

const signature = await smartAccount.signUserOperation(userOperation);
userOperation.signature = signature as Hex;

const userOpHash = await shBundler.sendUserOperation(userOperation);
console.log("User Operation Hash:", userOpHash);

const userOpReceipt = await shBundler.waitForUserOperationReceipt({
  hash: userOpHash,
});
console.log("User Operation Receipt:", userOpReceipt);

process.exit(0);
