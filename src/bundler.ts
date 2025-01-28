import { Client, Hex, http } from "viem";
import { CHAIN, SHBUNDLER_URL, PIMLICO_URL, PAYMASTER } from "./constants";
import { 
  createBundlerClient, 
  BundlerClient,
  SmartAccount,
  createPaymasterClient,
  toPackedUserOperation,
} from "viem/account-abstraction";
import { ShBundler, GasPriceResult, GasPriceRequest } from "./types";

import { smartAccount, publicClient, userClient } from "./user";
import { paymasterContract } from "./contracts";

function createShBundler(client: BundlerClient): ShBundler {
    return {
        ...client,
        getUserOperationGasPrice: async (): Promise<GasPriceResult> => {
            return await client.request<GasPriceRequest>({ 
                method: 'gas_getUserOperationGasPrice',
                params: [], 
            });
        }
    };
}

function initShBundler(smartAccount: SmartAccount, publicClient: Client): ShBundler {
    return createShBundler(
        createBundlerClient({
            transport: http(SHBUNDLER_URL), 
            name: "shBundler",
            account: smartAccount,
            client: publicClient,
            chain: CHAIN,
        })
    );
}

const paymasterClient = createPaymasterClient({ 
    transport: http('https://public.pimlico.io/v2/10143/rpc'), 
})

const pimlicoClient = createBundlerClient({
    transport: http(PIMLICO_URL), 
    name: "Pimlico",
    account: smartAccount,
    client: publicClient,
    chain: CHAIN,
    paymaster: paymasterClient,
})

const shBundler = initShBundler(smartAccount, publicClient);

function paymasterMode(mode: 'user' | 'sponsor', validUntil: bigint, validAfter: bigint, sponsorSignature: Hex) {
    if (mode === 'user') {
        return '0x00' as Hex
    } else {
        return `0x01${userClient.account.address.slice(2)}${validUntil.toString(16).padStart(12, '0')}${validAfter.toString(16).padStart(12, '0')}${sponsorSignature.slice(2)}`
    }
}

async function sendUserOperation(bundler: BundlerClient, transferAmount: bigint, mode: 'user' | 'sponsor'): Promise<Hex> {
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

    const packedUserOperation = toPackedUserOperation(userOperation);

    const hash = await paymasterContract.read.getHash([
        packedUserOperation,
        validUntil,
        validAfter
    ]);

    const sponsorSignature = await userClient.signMessage({
        message: { raw: hash },
    });

    userOperation.paymasterData = paymasterMode(mode, validUntil, validAfter, sponsorSignature)
    userOperation.paymaster = PAYMASTER as Hex
    userOperation.paymasterVerificationGasLimit = 500000n
    userOperation.paymasterPostOpGasLimit = 500000n

    const signature = await smartAccount.signUserOperation(userOperation);
    userOperation.signature = signature as Hex

    return await bundler.sendUserOperation(userOperation);
}

export { pimlicoClient, shBundler, sendUserOperation };