import { publicClient, userClient, deployerClient, smartAccount } from "./user";
import { shMonadContract, paymasterContract } from "./contracts";
import { PolicyBond } from "./types";
import { Address, encodeFunctionData, Hex, http } from "viem";
import shmonadAbi from "./abi/shmonad.json";
import paymasterAbi from "./abi/paymaster.json";
import { CHAIN, PAYMASTER, SHMONAD } from "./constants";
import { pimlicoClient } from "./bundler";

const policyId = await paymasterContract.read.policyID();
console.log("Policy ID:", policyId);

const smartAccountBalance = await shMonadContract.read.balanceOf([smartAccount.address]);
console.log("smart account address", smartAccount.address);
console.log("Smart Account Balance:", smartAccountBalance);

const smartAccountBond = await shMonadContract.read.getPolicyBond([policyId, smartAccount.address]) as PolicyBond;
console.log("Smart Account Unbonding Amount:", smartAccountBond.unbonding);
console.log("Smart Account Bonded Amount:", smartAccountBond.bonded);

const userBalance = await publicClient.getBalance({address: smartAccount.address});
console.log("User Balance:", userBalance);

const sponsorBalance = await publicClient.getBalance({address: userClient.account.address});
console.log("Sponsor Balance:", sponsorBalance);

const sponsorBond = await shMonadContract.read.getPolicyBond([policyId, userClient.account.address]) as PolicyBond;
console.log("Sponsor Unbonding Amount:", sponsorBond.unbonding);
console.log("Sponsor Bonded Amount:", sponsorBond.bonded);

const paymasterDeposit = await paymasterContract.read.getDeposit();
console.log("paymaster entrypoint deposit", paymasterDeposit)

const paymasterBond = await shMonadContract.read.getPolicyBond([policyId, PAYMASTER]) as PolicyBond;
console.log("paymaster shmonad unbonding", paymasterBond.unbonding)
console.log("paymaster shmonad bonded", paymasterBond.bonded)

const depositAmount = 200000000000000000n;

// bond to shmonad if smart account is not bonded
if (smartAccountBond.bonded ===  0n) {
    
    const data = encodeFunctionData({
        abi: shmonadAbi,
        functionName: "depositAndBond",
        args: [policyId, depositAmount],
    });

    const hash = await pimlicoClient.sendUserOperation({
        calls: [
            {
                to: SHMONAD,
                value: depositAmount,
                data,
            }
        ],
        maxFeePerGas: 77500000000n,
        maxPriorityFeePerGas: 2500000000n,
    })

    console.log("Hash:", hash);
}

// deposit to entrypoint if paymaster has not deposited
if (paymasterDeposit === 0n) {
    const depositEntryPointData = encodeFunctionData({
        abi: paymasterAbi,
        functionName: "deposit",
        args: [],
    });

    const hash = await pimlicoClient.sendUserOperation({
        calls: [
            {
                to: PAYMASTER,
                value: depositAmount,
                data: depositEntryPointData,
            }
        ],
        maxFeePerGas: 77500000000n,
        maxPriorityFeePerGas: 2500000000n,
    })

    console.log("Hash:", hash);
}


// const data = encodeFunctionData({
//     abi: paymasterAbi,
//     functionName: "redeemAndWithdrawShMonad",
//     args: [paymasterBond.unbonding],
// });

// const hash = await deployerClient.sendTransaction({
//     to: PAYMASTER,
//     value: 0n,
//     data,
// })

// console.log("Hash:", hash);


