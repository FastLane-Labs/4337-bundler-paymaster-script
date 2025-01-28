
import { BundlerClient } from "viem/account-abstraction";

type ShBundler = BundlerClient & {
  getUserOperationGasPrice: () => Promise<GasPriceResult>
}

type GasPriceResult = {
  fast: {
    maxFeePerGas: bigint
    maxPriorityFeePerGas: bigint
  }
  standard: {
    maxFeePerGas: bigint
    maxPriorityFeePerGas: bigint
  }
  slow: {
    maxFeePerGas: bigint
    maxPriorityFeePerGas: bigint
  }
}
type GasPriceRequest = { 
  Method: 'gas_getUserOperationGasPrice', 
  Parameters: [] 
  ReturnType: GasPriceResult
}

interface PolicyBond {
  bonded: bigint;
  unbonding: bigint;
  lastAccessedBlock: bigint;
}

export { ShBundler, GasPriceRequest, GasPriceResult, PolicyBond };