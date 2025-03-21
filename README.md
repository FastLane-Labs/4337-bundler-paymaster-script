# Fastlane 4337 Infrastructure
Fastlane is deploying best-in-class 4337 infrastructure via a liquid staking token - shMonad, a 4337 compliant bundler and a paymaster leveraging shMonad.

## shMonad
To get started with shMonad, vist shmonad.xyz. 

shMonad is a liquid staking token that generates yield for users and gives apps and their end users UI super power. Users and apps can deposit MON to receive shMON which generates yield from the staking services. Additionally, anyone can bond their shMON to Fastlane services, like our 4337 paymaster. 

For users, you can now generate maximum yield on your MON via shMON AND not have to worry about keeping some MON working capital for gas. Instead, use our 4337 bundler and set the paymaster to the Fastlane paymaster and gas will be paid for with your yield-generating shMON balance.

For apps and wallets, sponsor your users' gas fees and earn yield on your MON holdings at the same time. Deposit and bond your MON to the Fastlane paymaster and provide full gasless transactions by sponsoring your user's transaction fees via the Fastlane paymaster.

## Bundler aka shBundler
shBundler is a fully compliant 4337 bundler that can be easily integrated as an user operation RPC or programmatically with viem or ethers.

RPC: https://monad-testnet.4337-shbundler-fra.fastlane-labs.xyz

Viem Example:

```typescript
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
```

## Paymaster
The Fastlane paymaster allows anyone to stake their full MON balance and not have to worry about needing MON for gas fees. Just deposit your MON for shMON and bond that shMON to the paymaster, then every time you send a 4337 user operation, you can use the Fastlane paymaster address as your paymaster and you can then use your shMON for gas fees. 

For apps and wallets that want to sponsor gas fees for their users, checkout the script for full details.

## Demo
Create a .env file:
```bash
RPC_URL=<MONAD_TESTNET_RPC_URL>
PRIVATE_KEY=<EOA_PRIVATE_KEY>
ADDRESS_HUB=0xC9f0cDE8316AbC5Efc8C3f5A6b571e815C021B51
SHBUNDLER_URL=https://monad-testnet.4337-shbundler-fra.fastlane-labs.xyz
```

install dependencies
```bash
npm install
```

### Run the paymaster
In a separate server:
```bash
npm run dev
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
