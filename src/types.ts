import { Hex } from "viem";

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

type GasPriceRequest = {
  Method: "gas_getUserOperationGasPrice";
  Parameters: [];
  ReturnType: GasPriceResultEncoded;
};

export {
  GasPriceRequest,
  GasPrices,
  GasPricesEncoded,
};
