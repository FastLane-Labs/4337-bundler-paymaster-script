import { Client, http, hexToBigInt } from "viem";
import { CHAIN, SHBUNDLER_URL } from "./constants";
import {
  createBundlerClient,
  BundlerClient,
  SmartAccount,
  PaymasterClient,
} from "viem/account-abstraction";
import { ShBundler, GasPriceRequest, GasPriceResult } from "./types";

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
  publicClient: Client,
  paymasterClient: PaymasterClient,
  mode: 'sponsor' | 'user'
): ShBundler {
  return createShBundler(
    createBundlerClient({
      transport: http(SHBUNDLER_URL),
      name: "shBundler",
      account: smartAccount,
      client: publicClient,
      chain: CHAIN,
      paymaster: paymasterClient,
      paymasterContext: {
        mode: mode,
        address: smartAccount.address,
      },
    })
  );
}



export { initShBundler };
