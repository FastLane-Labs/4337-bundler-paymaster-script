import { 
    Address, 
    Hex, 
    keccak256, 
    encodeAbiParameters,
    parseAbiParameters
  } from 'viem';
  import { PackedUserOperation } from 'viem/account-abstraction';
  
  /**
   * Gets the hash of the user operation.
   * @param userOp The user operation
   * @param validUntil The end timestamp of the user operation
   * @param validAfter The start timestamp of the user operation
   * @param paymasterAddress The address of the paymaster contract
   * @param chainId The chain ID
   * @returns The hash of the user operation
   */
  export function getHash(
    userOp: PackedUserOperation,
    validUntil: bigint,
    validAfter: bigint,
    paymasterAddress: Address,
    chainId: bigint
  ): Hex {
    // Encode the parameters according to the Solidity abi.encode format
    return keccak256(
      encodeAbiParameters(
        parseAbiParameters('address, uint256, bytes32, bytes32, bytes32, uint256, address, uint48, uint48'),
        [
          userOp.sender,
          userOp.nonce,
          keccak256(userOp.initCode || '0x'),
          keccak256(userOp.callData),
          userOp.gasFees,
          chainId,
          paymasterAddress,
          Number(validUntil),
          Number(validAfter)
        ]
      )
    );
  }