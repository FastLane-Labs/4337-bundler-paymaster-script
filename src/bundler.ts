import { Client, Hex, http } from "viem";
import { CHAIN, SHBUNDLER_URL } from "./constants";
import { 
  createBundlerClient, 
  BundlerClient,
  SmartAccount,
} from "viem/account-abstraction";
import { ShBundler, GasPriceResult, GasPriceRequest } from "./types";
import { smartAccount, publicClient, userClient } from "./user";

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

const shBundler = initShBundler(smartAccount, publicClient);


export { shBundler };