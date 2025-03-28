import { 
    Address, 
    Hex, 
    keccak256, 
    encodeAbiParameters,
    parseAbiParameters
  } from 'viem';
  import { PackedUserOperation } from 'viem/account-abstraction';
import { userClient } from './user';

/**
 * Fetches a signature from the sponsor wallet for a user operation.
 * @param userOp The user operation to sign
 * @param validUntil The end timestamp of the user operation
 * @param validAfter The start timestamp of the user operation
 * @param paymasterAddress The address of the paymaster contract
 * @param chainId The chain ID
 */
export async function fetchSignature(
  userOp: PackedUserOperation, 
  validUntil: bigint, 
  validAfter: bigint, 
  paymasterAddress: Address, 
  chainId: bigint
): Promise<Hex> {
  const hash = await getHash(
    userOp,
    validUntil,
    validAfter,
    paymasterAddress,
    chainId
  )


  // Sign hash with sponsor wallet
  const sponsorSignature = await userClient.signMessage({
    account: userClient.account,
    message: { raw: hash },
  });

  return sponsorSignature;
}
  
  /**
   * Gets the hash of the user operation.
   * @param userOp The user operation
   * @param validUntil The end timestamp of the user operation
   * @param validAfter The start timestamp of the user operation
   * @param paymasterAddress The address of the paymaster contract
   * @param chainId The chain ID
   * @returns The hash of the user operation
   */
  function getHash(
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