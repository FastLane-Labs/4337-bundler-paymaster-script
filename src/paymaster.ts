import express from 'express';
import { Request, Response } from 'express';
import { toPackedUserOperation, UserOperation } from 'viem/account-abstraction';
import { createWalletClient, http, type Hex, type Address, createPublicClient, Client } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { ADDRESS_HUB } from './constants';
import paymasterAbi from './abi/paymaster.json';
import addressHubAbi from './abi/addresshub.json';
import shmonadAbi from './abi/shmonad.json';
import { monadTestnet } from 'viem/chains';
import corsMiddleware from 'cors';
// Use a backend-specific RPC URL (not prefixed with NEXT_PUBLIC_)
const BACKEND_RPC_URL = process.env.RPC_URL;
const MIN_BONDED_BALANCE = 100000000000000000n;

// Create backend-specific public client
const backendPublicClient = createPublicClient({
  chain: monadTestnet,
  transport: http(BACKEND_RPC_URL)
});

// Create a sponsor wallet client using the private key
const SPONSOR_PRIVATE_KEY = process.env.PRIVATE_KEY;
if (!SPONSOR_PRIVATE_KEY) {
  console.error('SPONSOR_WALLET_PRIVATE_KEY environment variable is not set');
  console.error('This is required for the paymaster to work properly');
}

const sponsorAccount = SPONSOR_PRIVATE_KEY 
  ? privateKeyToAccount(SPONSOR_PRIVATE_KEY as Hex) 
  : undefined;

const sponsorWallet = sponsorAccount 
  ? createWalletClient({
      account: sponsorAccount,
      chain: monadTestnet,
      transport: http(BACKEND_RPC_URL)
    })
  : undefined;

// Add Express app setup at the top level:
const app = express();

// Add these lines before other middleware
app.use(corsMiddleware({
  origin: '*', // Be more restrictive in production
  methods: ['POST'],
  allowedHeaders: ['Content-Type']
}));
app.use(express.json());

/**
 * Helper: Read paymaster address directly from the contract
 */
async function getPaymasterAddress(): Promise<Address | null> {
  if (!ADDRESS_HUB) {
    console.error('ADDRESS_HUB is not defined. Please check your environment variables.');
    return null;
  }

  try {
    const paymasterAddress = await backendPublicClient.readContract({
      address: ADDRESS_HUB,
      abi: addressHubAbi,
      functionName: 'paymaster4337',
      args: []
    }) as Address;
    
    if (!paymasterAddress || paymasterAddress === '0x0000000000000000000000000000000000000000') {
      console.error('Invalid paymaster address read from contract');
      return null;
    }
    
    return paymasterAddress;
  } catch (error) {
    console.error('Error reading paymaster address:', error);
    return null;
  }
}

async function getBondedBalance(smartAccountAddress: Address): Promise<bigint> {
    const paymasterAddress = await getPaymasterAddress();
    if (!paymasterAddress) {
        throw new Error("Failed to get paymaster address");
    }

    const policyId = (await backendPublicClient.readContract({
        address: paymasterAddress,
        abi: paymasterAbi,
        functionName: 'POLICY_ID',
        args: []
      })) as bigint;

    const shMonadAddress = await backendPublicClient.readContract({
        address: ADDRESS_HUB,
        abi: addressHubAbi,
        functionName: 'shMonad',
        args: []
    }) as Address;
    
    return await backendPublicClient.readContract({
        address: shMonadAddress,
        abi: shmonadAbi,
        functionName: 'balanceOfBonded',
        args: [policyId, smartAccountAddress]
    }) as bigint;
}

/**
 * Helper: Generate and sign paymaster data for a user operation
 */
async function signUserOperationWithSponsor(
  userOperation: UserOperation,
  validUntil: bigint,
  validAfter: bigint
): Promise<{ 
  signature: Hex, 
  paymasterAddress: Address,
  paymasterData: Hex
} | null> {
  try {
    // Get paymaster address
    const paymasterAddress = await getPaymasterAddress();
    if (!paymasterAddress) {
      console.error('No paymaster address available for signing');
      return null;
    }
    
    // Validate sponsor wallet
    if (!sponsorWallet || !sponsorAccount) {
      console.error('No sponsor wallet available');
      return null;
    }
    
    // Get hash to sign directly from the contract
    const hash = await backendPublicClient.readContract({
      address: paymasterAddress,
      abi: paymasterAbi,
      functionName: 'getHash',
      args: [
        toPackedUserOperation(userOperation),
        validUntil,
        validAfter
      ]
    }) as Hex;
    
    if (!hash) {
      throw new Error(`Invalid hash returned from paymaster contract ${paymasterAddress}`);
    }
    
    // Sign hash with sponsor wallet
    const signature = await sponsorWallet.signMessage({
      account: sponsorAccount,
      message: { raw: hash },
    });
    
    console.info('Generated signature for user operation', { 
      sender: userOperation.sender,
      signature: signature.substring(0, 10) + '...'
    });

    // Create paymaster data with the signature
    const paymasterData = paymasterMode(
      "sponsor",
      validUntil,
      validAfter,
      signature as Hex,
      sponsorWallet
    ) as Hex;
    
    return { 
      signature: signature as Hex, 
      paymasterAddress,
      paymasterData
    };
  } catch (error) {
    console.error('Failed to sign user operation with sponsor:', error);
    return null;
  }
}

/**
 * Helper: Classify and format error for consistent response
 */
function formatPaymasterError(error: any, id: any): any {
  const errorMsg = error?.message || 'Unknown error';
  
  if (errorMsg.includes('insufficient') && errorMsg.includes('balance')) {
    return {
      jsonrpc: '2.0',
      id,
      error: { 
        code: -32010, 
        message: 'Paymaster has insufficient balance',
        data: errorMsg
      }
    };
  }
  
  if (errorMsg.includes('policy') || errorMsg.includes('limit')) {
    return {
      jsonrpc: '2.0',
      id,
      error: { 
        code: -32011, 
        message: 'Policy limit exceeded',
        data: errorMsg
      }
    };
  }
  
  // Default error
  return {
    jsonrpc: '2.0',
    id,
    error: { 
      code: -32603, 
      message: 'Paymaster internal error',
      data: errorMsg
    }
  };
}

// Replace the handler function:
// export default async function handler(req: NextApiRequest, res: NextApiResponse) {
async function handlePaymasterRequest(req: Request, res: Response) {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { jsonrpc, id, method, params } = req.body;

    // Validate the JSON-RPC request
    if (jsonrpc !== '2.0' || !id || !method) {
      return res.status(400).json({
        jsonrpc: '2.0',
        id: id || null,
        error: { code: -32600, message: 'Invalid request' }
      });
    }

    // Handle different RPC methods
    switch (method) {
      case 'pm_getPaymasterData':
        return handleGetPaymasterData(req, res);
      
      case 'pm_getPaymasterStubData':
        return handleGetPaymasterStubData(req, res);
      
      default:
        return res.status(400).json({
          jsonrpc: '2.0',
          id,
          error: { code: -32601, message: 'Method not found' }
        });
    }
  } catch (error) {
    console.error('RPC handler error:', error);
    return res.status(500).json({
      jsonrpc: '2.0',
      id: req.body?.id || null,
      error: { code: -32603, message: 'Internal error', data: (error as Error).message }
    });
  }
}

/**
 * Handle pm_getPaymasterData method
 */
async function handleGetPaymasterData(req: Request, res: Response) {
  const { id, params } = req.body;
  
  try {
    // Extract parameters
    const [userOperation, entryPointAddress, chainId, context] = params;
    
    // QUICK VALIDATION - must respond fast to avoid timeouts
    if (!userOperation || !userOperation.sender || !entryPointAddress || !chainId || !context.mode || !context.address) {
      return res.status(400).json({
        jsonrpc: '2.0',
        id,
        error: { 
          code: -32602, 
          message: 'Invalid params',
          data: 'Required parameters: userOperation, entryPointAddress, chainId, context' 
        }
      });
    }
    
    if (context.mode === 'sponsor') {
        return await handlePaymasterWithSponsor(userOperation, id, res, context.address)
    } else if (context.mode === 'user') {
        return await handlePaymasterWithoutSponsor(id, res, context.address) 
    } else {
        return res.status(400).json({
            jsonrpc: '2.0',
            id,
            error: { code: -32602, message: 'Invalid context' }
        });
    }
      
    
  } catch (error) {
    console.error('Error in getPaymasterData:', error);
    
    // Format the error for consistent response
    const errorResponse = formatPaymasterError(error, id);
    return res.status(500).json(errorResponse);
  }
}

/**
 * Handle pm_getPaymasterStubData method
 */
async function handleGetPaymasterStubData(req: Request, res: Response) {
  const { id, params } = req.body;
  
  try {
    // Extract parameters
    const [userOperation, entryPointAddress, chainId, context] = params;
    
    // Validate required parameters
    if (!userOperation || !userOperation.sender || !entryPointAddress || !chainId || !context.mode || !context.address) {
      return res.status(400).json({
        jsonrpc: '2.0',
        id,
        error: { 
          code: -32602, 
          message: 'Invalid params',
          data: 'Required parameters: userOperation, entryPointAddress, chainId, context' 
        }
      });
    }

    if (context.mode === 'sponsor') {
        return {
            paymasterVerificationGasLimit: '75000',
            paymasterPostOpGasLimit: '120000',
            ...(await handlePaymasterWithSponsor(userOperation, id, res, context.address))
        }
    } else if (context.mode === 'user') {
        return {
            paymasterVerificationGasLimit: '75000',
            paymasterPostOpGasLimit: '120000',
            ...(await handlePaymasterWithoutSponsor(id, res, context.address))
        }
    } else {
        return res.status(400).json({
            jsonrpc: '2.0',
            id,
            error: { code: -32602, message: 'Invalid context' }
        });
    }
  } catch (error) {
    console.error('Error in getPaymasterStubData:', error);
    
    // Format the error for consistent response
    const errorResponse = formatPaymasterError(error, id);
    return res.status(500).json(errorResponse);
  }
}

async function handlePaymasterWithSponsor(userOperation: UserOperation, id: any, res: Response, payorAddress: Address) {
    const bondedBalance = await getBondedBalance(payorAddress);
    if (bondedBalance < MIN_BONDED_BALANCE) {
        return res.status(400).json({
            jsonrpc: '2.0',
            id,
            error: { code: -32602, message: 'Insufficient bonded balance. Visit shmonad.xyz to bond more MON.' }
        });
    }
    // Set validity window (valid for 1 hour)
    const currentTime = BigInt(Math.floor(Date.now() / 1000));
    const validUntil = currentTime + BigInt(3600);
    const validAfter = BigInt(0);
    
    // Generate and sign the paymaster data
    const signResult = await signUserOperationWithSponsor(
      userOperation as UserOperation, 
      validUntil,
      validAfter
    );
    
    if (!signResult) {
      return res.status(500).json({
        jsonrpc: '2.0',
        id,
        error: { 
          code: -32603, 
          message: 'Failed to sign user operation',
          data: 'Error generating paymaster signature'
        }
      });
    }
    
    return res.status(200).json({
        jsonrpc: '2.0',
        id,
        result: {
          paymaster: signResult.paymasterAddress,
          paymasterData: signResult.paymasterData,
          sponsor: {
            name: 'Fastlane Paymaster'
          },
          isFinal: true // This is the final data with real signature
        }
    });
}

async function handlePaymasterWithoutSponsor(id: any, res: Response, payorAddress: Address) {
    const bondedBalance = await getBondedBalance(payorAddress);
    if (bondedBalance < MIN_BONDED_BALANCE) {
        return res.status(400).json({
            jsonrpc: '2.0',
            id,
            error: { code: -32602, message: 'Insufficient bonded balance. Visit shmonad.xyz to bond more MON.' }
        });
    }
    return res.status(200).json({
        jsonrpc: '2.0',
        id,
        result: {
          paymaster: await getPaymasterAddress(),
          paymasterData: paymasterMode('user'),
          sponsor: {
            name: 'Fastlane Paymaster'
          },
          isFinal: true // This is the final data with real signature
        }
    });
}

function paymasterMode(
    mode: "user" | "sponsor",
    validUntil?: bigint,
    validAfter?: bigint,
    sponsorSignature?: Hex,
    userClient?: Client
  ) {
    if (mode === "user") {
      return "0x00" as Hex;
    } else {
      if (userClient === undefined) {
        throw new Error("userClient is undefined");
      }
      if (validUntil === undefined) {
        throw new Error("validUntil is undefined");
      }
      if (validAfter === undefined) {
        throw new Error("validAfter is undefined");
      }
      if (sponsorSignature === undefined) {
        throw new Error("sponsorSignature is undefined");
      }
  
      const accountAddress = userClient.account?.address;
      if (!accountAddress) {
        throw new Error("userClient.account is undefined");
      }
      return `0x01${accountAddress.slice(2)}${validUntil
        .toString(16)
        .padStart(12, "0")}${validAfter
        .toString(16)
        .padStart(12, "0")}${sponsorSignature.slice(2)}`;
    }
  }

// Add route handler and server startup:
app.post('/', handlePaymasterRequest as any);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Export the app for testing
export { app }; 