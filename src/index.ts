import { smartAccount, publicClient, userClient } from "./user";
import { initShBundler } from "./bundler";
import { shMonadContract, paymasterContract } from "./contracts";
import { PolicyBond } from "./types";
import { Address, concatHex, Hex, http, parseSignature, toPrefixedMessage } from "viem";
import { CHAIN, PAYMASTER, PIMLICO_URL, PRIVATE_KEY, SHBUNDLER_ADDRESS } from "./constants";
import { createBundlerClient, createPaymasterClient, PackedUserOperation, toPackedUserOperation } from "viem/account-abstraction";
import { entryPoint07Address } from "viem/account-abstraction";
import { signMessage } from "viem/accounts";

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

const bundlerBalance = await publicClient.getBalance({address: SHBUNDLER_ADDRESS});
console.log("Bundler Balance:", bundlerBalance);

const paymasterClient = createPaymasterClient({ 
    transport: http('https://public.pimlico.io/v2/11155111/rpc'), 
})

const pimlicoClient = createBundlerClient({
    transport: http(PIMLICO_URL), 
    name: "Pimlico",
    account: smartAccount,
    client: publicClient,
    chain: CHAIN,
})

const shBundler = initShBundler(smartAccount, publicClient);
console.log("Smart Account:", shBundler.account?.address);

const transferAmount = 1000000000000000n
const gasPrice = await shBundler.getUserOperationGasPrice();
const userOperation = await pimlicoClient.prepareUserOperation({
    account: smartAccount,
    calls: [{
        to: userClient.account.address,
        value: transferAmount,
        data: "0x"
    }],
    maxFeePerGas: gasPrice.fast.maxFeePerGas,
    maxPriorityFeePerGas: gasPrice.fast.maxPriorityFeePerGas,
})

const validAfter = 0n
const validUntil = BigInt(Date.now() + 1000 * 60 * 60 * 24) + BigInt(100)

const packedUserOperation = toPackedUserOperation(userOperation);

const hash = await paymasterContract.read.getHash([
    packedUserOperation,
    validUntil,
    validAfter
  ]);

const sponsorSignature = await signMessage({
    message: { raw: hash },
    privateKey: PRIVATE_KEY,
  });

console.log("Sponsor Signature:", sponsorSignature)

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


const userOpHash = await pimlicoClient.sendUserOperation({
  ...userOperation,
})

const userOpReceipt = await pimlicoClient.waitForUserOperationReceipt({hash: userOpHash});
console.log("User Operation Receipt:", userOpReceipt);