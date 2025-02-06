import { Client, http, hexToBigInt } from "viem";
import { CHAIN, SHBUNDLER_URL } from "./constants";
import {
  createBundlerClient,
  BundlerClient,
  SmartAccount,
} from "viem/account-abstraction";
import { ShBundler, GasPriceRequest, GasPriceResult } from "./types";
import { smartAccount, publicClient } from "./user";

function createShBundler(client: BundlerClient): ShBundler {
  return {
    ...client,
    getUserOperationGasPrice: async (): Promise<GasPriceResult> => {
      const resultEncoded = await client.request<GasPriceRequest>({
        method: "gas_getUserOperationGasPrice",
        params: [],
      });

      return {
        slow: {
          maxFeePerGas: hexToBigInt(resultEncoded.slow.maxFeePerGas),
          maxPriorityFeePerGas: hexToBigInt(
            resultEncoded.slow.maxPriorityFeePerGas
          ),
        },
        standard: {
          maxFeePerGas: hexToBigInt(resultEncoded.standard.maxFeePerGas),
          maxPriorityFeePerGas: hexToBigInt(
            resultEncoded.standard.maxPriorityFeePerGas
          ),
        },
        fast: {
          maxFeePerGas: hexToBigInt(resultEncoded.fast.maxFeePerGas),
          maxPriorityFeePerGas: hexToBigInt(
            resultEncoded.fast.maxPriorityFeePerGas
          ),
        },
      };
    },
  };
}

function initShBundler(
  smartAccount: SmartAccount,
  publicClient: Client
): ShBundler {
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
