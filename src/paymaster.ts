import express from 'express';
import { Request, Response } from 'express';
import { type Hex, type Address } from 'viem';
import corsMiddleware from 'cors';


type PaymasterContext = {
  mode: "sponsor" | "user";
  paymaster: Address;
  sponsor: Address;
  sponsorSignature: Hex;
  validUntil: string;
  validAfter: string;
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
            paymasterPostOpGasLimit: '125000',
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
      console.log("paymasterContext", paymasterContext);

      const validUntil = BigInt(paymasterContext.validUntil);
      const validAfter = BigInt(paymasterContext.validAfter);

      const signature = `0x01${paymasterContext.sponsor.slice(2)}${validUntil
        .toString(16)
        .padStart(12, "0")}${validAfter
        .toString(16)
        .padStart(12, "0")}${paymasterContext.sponsorSignature.slice(2)}`;
  
      return signature;
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