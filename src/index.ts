import { smartAccount, publicClient, userClient } from "./user";
import { shBundler } from "./bundler";
import { PolicyBond } from "./types";
import { initContract, paymasterMode } from "./contracts";
import { 
    depositAndBondEOAToShmonad, 
    depositAndBondSmartAccountToShmonad, 
    depositToEntrypoint 
} from "./deposit";
import { ADDRESS_HUB, PAYMASTER_POINTER, SHMONAD_POINTER } from "./constants";
import addressHubAbi from "./abi/addresshub.json";
import paymasterAbi from "./abi/paymaster.json";
import shmonadAbi from "./abi/shmonad.json";    
import { Hex } from "viem";
import { toPackedUserOperation } from "viem/account-abstraction";


// initialize contracts and get addresses
const addressHubContract = await initContract(ADDRESS_HUB, addressHubAbi, publicClient, userClient)
const PAYMASTER = await addressHubContract.read.getAddressFromPointer([BigInt(PAYMASTER_POINTER)]) as Hex
const SHMONAD = await addressHubContract.read.getAddressFromPointer([BigInt(SHMONAD_POINTER)]) as Hex

const paymasterContract = await initContract(PAYMASTER, paymasterAbi, publicClient, userClient);
const shMonadContract = await initContract(SHMONAD, shmonadAbi, publicClient, userClient);
//paymaster policy
const policyId = await paymasterContract.read.policyID([]) as bigint;
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
    await depositAndBondSmartAccountToShmonad(bundler, policyId, depositAmount, SHMONAD);
}

//sponsor
const sponsorBalance = await publicClient.getBalance({address: userClient.account.address});
console.log("Sponsor MON Balance:", sponsorBalance);

const sponsorBond = await shMonadContract.read.getPolicyBond([policyId, userClient.account.address]) as PolicyBond;
console.log("Sponsor shmonad unbonding", sponsorBond.unbonding)
console.log("Sponsor shmonad bonded", sponsorBond.bonded)

if (sponsorBond.bonded === 0n) {
    console.log("Depositing and bonding sponsor to shmonad");
    await depositAndBondEOAToShmonad(userClient, policyId, depositAmount, SHMONAD);
}

//paymaster
const paymasterDeposit = await paymasterContract.read.getDeposit([]);
console.log("paymaster entrypoint deposit", paymasterDeposit)

const paymasterBond = await shMonadContract.read.getPolicyBond([policyId, PAYMASTER]) as PolicyBond;
console.log("paymaster shmonad unbonding", paymasterBond.unbonding)
console.log("paymaster shmonad bonded", paymasterBond.bonded)

if (paymasterBond.bonded === 0n) {
    console.log("Depositing and bonding paymaster to shmonad");
    await depositToEntrypoint(bundler, depositAmount, PAYMASTER);
}

//send user operation with shBundler
//lots of hardcodes ... bad ... for demo purposes only
const userOperation = await bundler.prepareUserOperation({
    account: smartAccount,
    calls: [{
        to: userClient.account.address,
        value: transferAmount,
        data: "0x"
    }],
    maxFeePerGas: 77500000000n,
    maxPriorityFeePerGas: 2500000000n,
    preVerificationGas: 200000n,
    verificationGasLimit: 200000n,
    callGasLimit: 200000n,
})

const validAfter = 0n
const validUntil = BigInt(Date.now() + 1000 * 60 * 60 * 24) + BigInt(100)

const hash = await paymasterContract.read.getHash([
    toPackedUserOperation(userOperation),
    validUntil,
    validAfter
]);
const sponsorSignature = await userClient.signMessage({
    message: { raw: hash as Hex },
});

userOperation.paymasterData = paymasterMode('sponsor', validUntil, validAfter, sponsorSignature, userClient) as Hex
userOperation.paymaster = PAYMASTER
userOperation.paymasterVerificationGasLimit = 500000n
userOperation.paymasterPostOpGasLimit = 500000n

const signature = await smartAccount.signUserOperation(userOperation);
userOperation.signature = signature as Hex

const userOpHash = await shBundler.sendUserOperation(userOperation);
console.log("User Operation Hash:", userOpHash);

const userOpReceipt = await shBundler.waitForUserOperationReceipt({hash: userOpHash});
console.log("User Operation Receipt:", userOpReceipt);
