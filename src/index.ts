import { smartAccount, publicClient, userClient } from "./user";
import { initShBundler, pimlicoClient } from "./bundler";
import { shMonadContract, paymasterContract } from "./contracts";
import { PolicyBond } from "./types";
import { toPackedUserOperation } from "viem/account-abstraction";
import { Hex } from "viem";
import { PAYMASTER } from "./constants";

//paymaster
const policyId = await paymasterContract.read.policyID();
console.log("Policy ID:", policyId);

const depositedAmount = await shMonadContract.read.balanceOf([smartAccount.address]);
console.log("shMonad Deposited Amount:", depositedAmount);

const policyBond = await shMonadContract.read.getPolicyBond([policyId, smartAccount.address]) as PolicyBond;
console.log("Policy Unbonding Amount:", policyBond.unbonding);
console.log("Policy Bonded Amount:", policyBond.bonded);

const userBalance = await publicClient.getBalance({address: smartAccount.address});
console.log("User Balance:", userBalance);

const shBundler = initShBundler(smartAccount, publicClient);
console.log("Smart Account:", shBundler.account?.address);

const bundler = pimlicoClient;

const transferAmount = 1000000000000000n
const userOperation = await bundler.prepareUserOperation({
    account: smartAccount,
    calls: [{
        to: userClient.account.address,
        value: transferAmount,
        data: "0x"
    }],
    maxFeePerGas: 77500000000n,
    maxPriorityFeePerGas: 2500000000n,
})

const validAfter = 0n
const validUntil = BigInt(Date.now() + 1000 * 60 * 60 * 24) + BigInt(100)

const packedUserOperation = toPackedUserOperation(userOperation);

const hash = await paymasterContract.read.getHash([
    packedUserOperation,
    validUntil,
    validAfter
  ]);

const sponsorSignature = await userClient.signMessage({
    message: { raw: hash },
});

userOperation.paymasterData = 
    '0x01' +
    userClient.account.address.slice(2) + 
    validUntil.toString(16).padStart(12, '0') +
    validAfter.toString(16).padStart(12, '0') + 
    sponsorSignature.slice(2)    
userOperation.paymaster = PAYMASTER as Hex
userOperation.paymasterVerificationGasLimit = 500000n
userOperation.paymasterPostOpGasLimit = 500000n

const signature = await smartAccount.signUserOperation(userOperation);
userOperation.signature = signature as Hex


const userOpHash = await bundler.sendUserOperation({
  ...userOperation,
})

console.log("User Operation Hash:", userOpHash);

// const userOpReceipt = await shBundler.waitForUserOperationReceipt({hash: userOpHash});
// console.log("User Operation Receipt:", userOpReceipt);
