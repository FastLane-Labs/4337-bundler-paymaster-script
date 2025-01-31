import { BundlerClient } from "viem/account-abstraction";
import { Hex } from "viem";

type ShBundler = BundlerClient & {
  getUserOperationGasPrice: () => Promise<GasPriceResult>;
};

type GasPricesEncoded = {
  maxFeePerGas: Hex;
  maxPriorityFeePerGas: Hex;
};

type GasPriceResultEncoded = {
  fast: GasPricesEncoded;
  standard: GasPricesEncoded;
  slow: GasPricesEncoded;
};

type GasPrices = {
  maxFeePerGas: bigint;
  maxPriorityFeePerGas: bigint;
};

type GasPriceResult = {
  fast: GasPrices;
  standard: GasPrices;
  slow: GasPrices;
};

type GasPriceRequest = {
  Method: "gas_getUserOperationGasPrice";
  Parameters: [];
  ReturnType: GasPriceResultEncoded;
};

interface PolicyBond {
  bonded: bigint;
  unbonding: bigint;
  lastAccessedBlock: bigint;
}

export {
  ShBundler,
  GasPriceRequest,
  GasPriceResult,
  GasPriceResultEncoded,
  PolicyBond,
};
