import { smartAccount, publicClient, userClient } from "./user";
import { pimlicoClient, shBundler, sendUserOperation } from "./bundler";
import { shMonadContract, paymasterContract } from "./contracts";
import { PolicyBond } from "./types";
import { PAYMASTER } from "./constants";
import { 
    depositAndBondEOAToShmonad, 
    depositAndBondSmartAccountToShmonad, 
    depositToEntrypoint 
} from "./deposit";

//paymaster policy
const policyId = await paymasterContract.read.policyID() as bigint;
const depositAmount = 200000000000000000n;
const transferAmount = 1000000000000000n;
const bundler = shBundler;

//smart account
const userBalance = await publicClient.getBalance({address: smartAccount.address});
console.log("smart account address", smartAccount.address);
console.log("Smart Account MON Balance:", userBalance);

const smartAccountBalance = await shMonadContract.read.balanceOf([smartAccount.address]);
console.log("Smart Account shMON Balance:", smartAccountBalance);

const smartAccountBond = await shMonadContract.read.getPolicyBond([policyId, smartAccount.address]) as PolicyBond;
console.log("Smart Account shmonad unbonding", smartAccountBond.unbonding)
console.log("Smart Account shmonad bonded", smartAccountBond.bonded)

if (smartAccountBond.bonded === 0n) {
    console.log("Depositing and bonding smart account to shmonad");
    await depositAndBondSmartAccountToShmonad(pimlicoClient, policyId, depositAmount);
}

//sponsor
const sponsorBalance = await publicClient.getBalance({address: userClient.account.address});
console.log("Sponsor MON Balance:", sponsorBalance);

const sponsorBond = await shMonadContract.read.getPolicyBond([policyId, userClient.account.address]) as PolicyBond;
console.log("Sponsor shmonad unbonding", sponsorBond.unbonding)
console.log("Sponsor shmonad bonded", sponsorBond.bonded)

if (sponsorBond.bonded === 0n) {
    console.log("Depositing and bonding sponsor to shmonad");
    await depositAndBondEOAToShmonad(userClient, policyId, depositAmount);
}

//paymaster
const paymasterDeposit = await paymasterContract.read.getDeposit();
console.log("paymaster entrypoint deposit", paymasterDeposit)

const paymasterBond = await shMonadContract.read.getPolicyBond([policyId, PAYMASTER]) as PolicyBond;
console.log("paymaster shmonad unbonding", paymasterBond.unbonding)
console.log("paymaster shmonad bonded", paymasterBond.bonded)

if (paymasterBond.bonded === 0n) {
    console.log("Depositing and bonding paymaster to shmonad");
    await depositToEntrypoint(pimlicoClient, depositAmount);
}

//send user operation with shBundler
const userOpHash = await sendUserOperation(bundler, transferAmount, 'sponsor');
console.log("User Operation Hash:", userOpHash);

const userOpReceipt = await shBundler.waitForUserOperationReceipt({hash: userOpHash});
console.log("User Operation Receipt:", userOpReceipt);
