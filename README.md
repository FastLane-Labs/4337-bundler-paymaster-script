# Fastlane 4337 Infrastructure
Fastlane is deploying best-in-class 4337 infrastructure via a liquid staking token - shMonad, a 4337 compliant bundler and a paymaster leveraging shMonad.

## shMonad
To get started with shMonad, vist shmonad.xyz. 

shMonad is a liquid staking token that generates yield for users and gives apps and their end users UI super power. Users and apps can deposit MON to receive shMON which generates yield from the staking services. Additionally, anyone can bond their shMON to Fastlane services, like our 4337 paymaster. 

For users, you can now generate maximum yield on your MON via shMON AND not have to worry about keeping some MON working capital for gas. Instead, use our 4337 bundler and set the paymaster to the Fastlane paymaster and gas will be paid for with your yield-generating shMON balance.

For apps and wallets, sponsor your users' gas fees and earn yield on your MON holdings at the same time. Deposit and bond your MON to the Fastlane paymaster and provide full gasless transactions by sponsoring your user's transaction fees via the Fastlane paymaster.

## Bundler aka shBundler
shBundler is a fully compliant 4337 bundler and paymaster service that can be easily integrated as an user operation RPC or programmatically with viem or ethers. You can set the Bundler and the paymaster URL to the below URL: 

BUNDLER_URL: https://monad-testnet.4337-shbundler-fra.fastlane-labs.xyz



Viem Example:

```typescript
// paymaster client
const paymasterClient = createPaymasterClient({
  transport: http(BUNDLER_URL),
});

// bundler client
const shBundler = createBundlerClient({
  transport: http(BUNDLER_URL),
  name: "shBundler",
  client: publicClient,
  chain: CHAIN,
  paymaster: paymasterClient,
  userOperation: {
    estimateFeesPerGas
  }
});
```

## Paymaster
The Fastlane paymaster allows anyone to stake their full MON balance and not have to worry about needing MON for gas fees. Just deposit your MON for shMON and bond that shMON to the paymaster, then every time you send a 4337 user operation, you can use the Fastlane paymaster address as your paymaster and you can then use your shMON for gas fees. 

For apps and wallets that want to sponsor gas fees for their users. In order to sponsor gas fees, you need use an EOA as your sponsor EOA and depositAndBond MON to the paymaster (shmonad.xyz). Then, dapps will need to use the sponsor EOA to sign and pass the signature of the getHash function on the paymaster contract. An implementation can be found here:

```typescript
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
```

## Run the Demo
Create a .env file:
```bash
RPC_URL=<MONAD_TESTNET_RPC_URL>
PRIVATE_KEY=<EOA_PRIVATE_KEY>
ADDRESS_HUB=0xC9f0cDE8316AbC5Efc8C3f5A6b571e815C021B51
SHBUNDLER_URL=https://monad-testnet.4337-shbundler-fra.fastlane-labs.xyz
PAYMASTER_URL=https://monad-testnet.4337-shbundler-fra.fastlane-labs.xyz
```

install dependencies
```bash
npm install
```

### Self Sponsored
```bash
npm run demo:self-sponsored
```

### With Sponsor
```bash
npm run demo:with-sponsor
```
## Contact
Author: Blair Marshall

Telegram: @marshabl

Email: blair@fastlane.xyz
