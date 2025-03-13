import { Address, Hex, PrivateKeyAccount, concat, pad, toHex } from "viem";
import { entryPoint07Address, UserOperation } from "viem/account-abstraction";
import { encodePacked } from "viem/utils";


const EIP712_SAFE_OPERATION_TYPE = {
  SafeOp: [
    { type: "address", name: "safe" },
    { type: "uint256", name: "nonce" },
    { type: "bytes", name: "initCode" },
    { type: "bytes", name: "callData" },
    { type: "uint128", name: "verificationGasLimit" },
    { type: "uint128", name: "callGasLimit" },
    { type: "uint256", name: "preVerificationGas" },
    { type: "uint128", name: "maxPriorityFeePerGas" },
    { type: "uint128", name: "maxFeePerGas" },
    { type: "bytes", name: "paymasterAndData" },
    { type: "uint48", name: "validAfter" },
    { type: "uint48", name: "validUntil" },
    { type: "address", name: "entryPoint" }
]
}

export const signUserOperation = async (
  userOperation: UserOperation,
  signer: PrivateKeyAccount,
  chainId: number,
  safe4337ModuleAddress: Address
) => {
  // Convert validAfter/validUntil to numbers
  const validAfter = 0;
  const validUntil = 0;

  const message = {
    safe: userOperation.sender,
    callData: userOperation.callData,
    nonce: userOperation.nonce,
    initCode: userOperation.initCode ?? "0x",
    maxFeePerGas: userOperation.maxFeePerGas,
    maxPriorityFeePerGas: userOperation.maxPriorityFeePerGas,
    preVerificationGas: userOperation.preVerificationGas,
    verificationGasLimit: userOperation.verificationGasLimit,
    callGasLimit: userOperation.callGasLimit,
    paymasterAndData: userOperation.paymasterAndData ?? "0x",
    validAfter: validAfter,
    validUntil: validUntil,
    entryPoint: entryPoint07Address
  };
  
  const paymasterAndData = getPaymasterAndData({
    ...userOperation,
    sender: userOperation.sender
  })
  message.paymasterAndData = paymasterAndData;
  
  const signatures = [
    {
      signer: signer.address,
      data: await signer.signTypedData({
        domain: {
          chainId,
          verifyingContract: safe4337ModuleAddress
        },
        types: EIP712_SAFE_OPERATION_TYPE,
        primaryType: 'SafeOp',
        message: message
      })
    }
  ]
  
  signatures.sort((left, right) => 
    left.signer.toLowerCase().localeCompare(right.signer.toLowerCase())
  )
  
  // Use encodePacked to properly format the signature
  const signatureBytes = concat(signatures.map((sig) => sig.data))
  return encodePacked(
    ["uint48", "uint48", "bytes"],
    [validAfter, validUntil, signatureBytes]
  )
}

  function getPaymasterAndData(unpackedUserOperation: UserOperation) {
    return unpackedUserOperation.paymaster
        ? concat([
              unpackedUserOperation.paymaster,
              pad(
                  toHex(
                      unpackedUserOperation.paymasterVerificationGasLimit ||
                          BigInt(0)
                  ),
                  {
                      size: 16
                  }
              ),
              pad(
                  toHex(
                      unpackedUserOperation.paymasterPostOpGasLimit || BigInt(0)
                  ),
                  {
                      size: 16
                  }
              ),
              unpackedUserOperation.paymasterData || ("0x" as Hex)
          ])
        : "0x"
  }