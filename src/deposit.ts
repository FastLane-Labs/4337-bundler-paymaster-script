import { smartAccount, publicClient, userClient, deployerClient } from "./user";
import { initShBundler } from "./bundler";
import { shMonadContract, paymasterContract } from "./contracts";
import { PolicyBond } from "./types";
import { Address, encodeFunctionData, Hex, http } from "viem";
import shmonadAbi from "./abi/shmonad.json";
import paymasterAbi from "./abi/paymaster.json";
import { CHAIN, PAYMASTER, PIMLICO_URL, SHBUNDLER_ADDRESS, SHMONAD } from "./constants";
import { createBundlerClient, createPaymasterClient } from "viem/account-abstraction";
import { entryPoint07Address } from "viem/account-abstraction";

const policyId = await paymasterContract.read.policyID();
console.log("Policy ID:", policyId);

const smartAccountBalance = await shMonadContract.read.balanceOf([smartAccount.address]);
console.log("Smart Account Balance:", smartAccountBalance);

const smartAccountBond = await shMonadContract.read.getPolicyBond([policyId, smartAccount.address]) as PolicyBond;
console.log("Smart Account Unbonding Amount:", smartAccountBond.unbonding);
console.log("Smart Account Bonded Amount:", smartAccountBond.bonded);

const userBalance = await publicClient.getBalance({address: smartAccount.address});
console.log("User Balance:", userBalance);

const bundlerBalance = await publicClient.getBalance({address: SHBUNDLER_ADDRESS});
console.log("Bundler Balance:", bundlerBalance);

const sponsorBalance = await publicClient.getBalance({address: userClient.account.address});
console.log("Sponsor Balance:", sponsorBalance);

const sponsorBond = await shMonadContract.read.getPolicyBond([policyId, userClient.account.address]) as PolicyBond;
console.log("Sponsor Unbonding Amount:", sponsorBond.unbonding);
console.log("Sponsor Bonded Amount:", sponsorBond.bonded);

const paymasterDeposit = await paymasterContract.read.getDeposit();
console.log("paymaster deposit", paymasterDeposit)

const paymasterBond = await shMonadContract.read.getPolicyBond([policyId, PAYMASTER]) as PolicyBond;
console.log("paymaster unbonding", paymasterBond.unbonding)
console.log("paymaster shmonad balance", paymasterBond.bonded)


const paymasterClient = createPaymasterClient({ 
    transport: http('https://public.pimlico.io/v2/11155111/rpc'), 
})

const pimlicoClient = createBundlerClient({
    transport: http(PIMLICO_URL), 
    name: "Pimlico",
    account: smartAccount,
    client: publicClient,
    chain: CHAIN,
    paymaster: paymasterClient,
})


// const depositAmount = 100000000000000000n;
// const data = encodeFunctionData({
//     abi: shmonadAbi,
//     functionName: "redeemAndRebond",
//     args: [4, policyId, sponsorBond.unbonding],
// });

// const hash = await userClient.sendTransaction({
//     to: SHMONAD,
//     value: 0n,
//     data,
// })

// const hash = await pimlicoClient.sendUserOperation({
//     calls: [
//         {
//             to: SHMONAD,
//             value: 0n,
//             data,
//         }
//     ]
// })

// console.log("Hash:", hash);



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


// const depositEntryPointData = encodeFunctionData({
//     abi: paymasterAbi,
//     functionName: "deposit",
//     args: [],
// });

// const hash = await deployerClient.sendTransaction({
//     to: PAYMASTER,
//     value: 100000000000000000n,
//     data: depositEntryPointData,
// })

// console.log("Hash:", hash);