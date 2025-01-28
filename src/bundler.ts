import { Client, http } from "viem";
import { CHAIN, SHBUNDLER_URL, PIMLICO_URL } from "./constants";
import { 
  createBundlerClient, 
  BundlerClient,
  SmartAccount,
  createPaymasterClient,
} from "viem/account-abstraction";
import { ShBundler, GasPriceResult, GasPriceRequest } from "./types";

import { smartAccount, publicClient } from "./user";

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
    // paymaster: paymasterClient,
})

export { initShBundler, pimlicoClient };