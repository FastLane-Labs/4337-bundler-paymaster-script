import { encodeFunctionData, Hex, WalletClient } from "viem";
import shmonadAbi from "./abi/shmonad.json";
import paymasterAbi from "./abi/paymaster.json";
import { BundlerClient } from "viem/_types/account-abstraction";

async function depositAndBondSmartAccountToShmonad(
    bundler: BundlerClient, 
    policyId: bigint, 
    depositAmount: bigint,
    shmonad: Hex
) {
    const data = encodeFunctionData({
        abi: shmonadAbi,
        functionName: "depositAndBond",
        args: [policyId, depositAmount],
    });

    const hash = await bundler.sendUserOperation({
        calls: [
            {
                to: shmonad,
                value: depositAmount,
                data,
            }
        ],
        maxFeePerGas: 77500000000n,
        maxPriorityFeePerGas: 2500000000n,
    })

    console.log("Hash:", hash);
}

async function depositToEntrypoint(
    bundler: BundlerClient, 
    depositAmount: bigint,
    paymaster: Hex
) {
    const depositEntryPointData = encodeFunctionData({
        abi: paymasterAbi,
        functionName: "deposit",
        args: [],
    });

    const hash = await bundler.sendUserOperation({
        calls: [
            {
                to: paymaster,
                value: depositAmount,
                data: depositEntryPointData,
            }
        ],
        maxFeePerGas: 77500000000n,
        maxPriorityFeePerGas: 2500000000n,
    })

    console.log("Hash:", hash);
}    // bond to shmonad if smart account is not bonded

async function depositAndBondEOAToShmonad(
    client: WalletClient, 
    policyId: bigint, 
    depositAmount: bigint,
    shmonad: Hex
) {
    const data = encodeFunctionData({
        abi: shmonadAbi,
        functionName: "depositAndBond",
        args: [policyId, depositAmount],
    });

    const hash = await client.sendTransaction({
        to: shmonad,
        value: depositAmount,
        data,
        maxFeePerGas: 77500000000n,
        maxPriorityFeePerGas: 2500000000n,
    })

    console.log("Hash:", hash);
}


export { depositAndBondSmartAccountToShmonad, depositToEntrypoint, depositAndBondEOAToShmonad };