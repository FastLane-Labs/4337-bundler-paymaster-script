import express from 'express';
import { Request, Response } from 'express';
import { http, type Hex, type Address, createPublicClient } from 'viem';
import { ADDRESS_HUB } from './constants';
import paymasterAbi from './abi/paymaster.json';
import addressHubAbi from './abi/addresshub.json';
import shmonadAbi from './abi/shmonad.json';
import { monadTestnet } from 'viem/chains';
import corsMiddleware from 'cors';
// Use a backend-specific RPC URL (not prefixed with NEXT_PUBLIC_)
const BACKEND_RPC_URL = process.env.RPC_URL;
const MIN_BONDED_BALANCE = 100000000000000000n;

// Initialize backend client
const backendPublicClient = createPublicClient({
  chain: monadTestnet,
  transport: http(BACKEND_RPC_URL)
});


type PaymasterContext = {
  mode: "sponsor" | "user";
  paymaster: Address;
  sponsor: Address;
  sponsorSignature: Hex;
  validUntil: bigint;
  validAfter: bigint;
}

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
 * Validate JSON-RPC request and parameters
 */
async function validateRequest(req: Request) {
  const { jsonrpc, id, method, params } = req.body;

  // Validate JSON-RPC format
  if (jsonrpc !== '2.0' || !id || !method) {
    throw new Error('Invalid request format');
  }

  // Extract parameters
  const [userOperation, entryPointAddress, chainId, context] = params;

  // Validate required parameters
  if (!userOperation?.sender || !entryPointAddress || !chainId || !context) {
    throw new Error('Required parameters: userOperation, entryPointAddress, chainId, context');
  }

  // Validate bonded balance
  const bondedBalance = await getBondedBalance(context.sponsor, context.paymaster);
  if (bondedBalance < MIN_BONDED_BALANCE) {
    throw new Error('Insufficient bonded balance. Visit shmonad.xyz to bond more MON.');
  }

  return { id, method, userOperation, entryPointAddress, chainId, context };
}

function formatPaymasterError(error: any, id: any): any {
  const errorMsg = error?.message || 'Unknown error';
  
  if (errorMsg.includes('Invalid request format')) {
    return {
      jsonrpc: '2.0',
      id: id || null,
      error: { code: -32600, message: errorMsg }
    };
  }
  
  if (errorMsg.includes('Required parameters')) {
    return {
      jsonrpc: '2.0',
      id,
      error: { 
        code: -32602, 
        message: 'Invalid params',
        data: errorMsg
      }
    };
  }

  if (errorMsg.includes('Insufficient bonded balance')) {
    return {
      jsonrpc: '2.0',
      id,
      error: { 
        code: -32602,
        message: errorMsg
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
    const { id, method, context } = await validateRequest(req);

    // Handle different RPC methods
    switch (method) {
      case 'pm_getPaymasterData':
        return res.status(200).json({
          jsonrpc: '2.0',
          id,
          result: {
            paymaster: context.paymaster,
            paymasterData: paymasterMode(context),
            sponsor: {
              name: 'Fastlane Paymaster'
            },
            isFinal: true // This is the final data with real signature
          }
        });
      
      case 'pm_getPaymasterStubData':
        return res.status(200).json({
          jsonrpc: '2.0',
          id,
          result: {
            paymaster: context.paymaster,
            paymasterData: paymasterMode(context),
            paymasterVerificationGasLimit: '75000',
            paymasterPostOpGasLimit: '120000',
            sponsor: {
              name: 'Fastlane Paymaster'
            },
            isFinal: true // This is the final data with real signature
          }
        });
      
      default:
        return res.status(400).json({
          jsonrpc: '2.0',
          id,
          error: { code: -32601, message: 'Method not found' }
        });
    }
  } catch (error) {
    console.error('RPC handler error:', error);
    const errorResponse = formatPaymasterError(error, req.body?.id);
    return res.status(errorResponse.error.code === -32600 ? 400 : 500).json(errorResponse);
  }
}

function paymasterMode(
    paymasterContext: PaymasterContext
  ) {
    if (paymasterContext.mode === "user") {
      return "0x00" as Hex;
    } else {
      if (paymasterContext.sponsor === undefined) {
        throw new Error("sponsor is undefined");
      }
      if (paymasterContext.validUntil === undefined) {
        throw new Error("validUntil is undefined");
      }
      if (paymasterContext.validAfter === undefined) {
        throw new Error("validAfter is undefined");
      }
      if (paymasterContext.sponsorSignature === undefined) {
        throw new Error("sponsorSignature is undefined");
      }
  
      return `0x01${paymasterContext.sponsor.slice(2)}${paymasterContext.validUntil
        .toString(16)
        .padStart(12, "0")}${paymasterContext.validAfter
        .toString(16)
        .padStart(12, "0")}${paymasterContext.sponsorSignature.slice(2)}`;
    }
  }

async function getBondedBalance(smartAccountAddress: Address, paymasterAddress: Address): Promise<bigint> {
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

// Add route handler and server startup:
app.post('/', handlePaymasterRequest as any);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Export the app for testing
export { app }; 