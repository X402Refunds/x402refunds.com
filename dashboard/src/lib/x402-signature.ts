/**
 * X-402 Payment Signature Creation Utility
 * 
 * Creates EIP-712 payment signatures that can be verified and settled by facilitators.
 * This allows users to authorize payments by signing messages (no gas fees!)
 * instead of sending transactions directly.
 * 
 * Based on @coinbase/x402 browser wallet example pattern.
 */

import type { WalletClient } from 'viem';

export interface PaymentRequirements {
  scheme: string;
  network: string;
  maxAmountRequired: string;
  asset: string;
  payTo: string;
  resource: string;
  description: string;
  mimeType?: string;
  maxTimeoutSeconds?: number;
}

// X402 "exact" EVM payload shape (EIP-3009 TransferWithAuthorization)
// See Coinbase x402 spec + PayAI echo-merchant implementation.
export interface X402PaymentPayload {
  x402Version: number;
  scheme: string;
  network: string;
  payload: {
    signature: string;
    authorization: {
      from: string;
      to: string;
      value: string;
      validAfter: string;
      validBefore: string;
      nonce: string; // bytes32 hex string
    };
  };
}

/**
 * Create X-402 payment signature using EIP-712 typed data
 * 
 * User signs a structured message (no transaction, no gas!)
 * Facilitator later executes the actual on-chain transaction
 */
export async function createX402PaymentSignature(
  walletClient: WalletClient,
  requirements: PaymentRequirements,
  userAddress: string
): Promise<string> {
  // x402 exact scheme on EVM uses EIP-3009 transferWithAuthorization.
  // That means the signature is over the USDC contract's EIP-712 domain,
  // and the message shape is TransferWithAuthorization with a bytes32 nonce.
  const chainId = requirements.network === 'base' ? 8453 : 8453;

  // USDC EIP-712 domain (EIP-3009)
  const domain = {
    name: 'USD Coin',
    version: '2',
    chainId,
    verifyingContract: requirements.asset as `0x${string}`,
  } as const;

  const types = {
    TransferWithAuthorization: [
      { name: 'from', type: 'address' },
      { name: 'to', type: 'address' },
      { name: 'value', type: 'uint256' },
      { name: 'validAfter', type: 'uint256' },
      { name: 'validBefore', type: 'uint256' },
      { name: 'nonce', type: 'bytes32' },
    ],
  } as const;

  const now = Math.floor(Date.now() / 1000);

  // bytes32 nonce
  const nonceBytes = new Uint8Array(32);
  crypto.getRandomValues(nonceBytes);
  const nonceHex = `0x${Array.from(nonceBytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')}` as `0x${string}`;

  const message = {
    from: userAddress as `0x${string}`,
    to: requirements.payTo as `0x${string}`,
    value: BigInt(requirements.maxAmountRequired),
    validAfter: BigInt(now),
    validBefore: BigInt(now + 300),
    nonce: nonceHex,
  } as const;

  console.log('Creating X-402 EIP-3009 signature...');
  console.log('  From:', userAddress);
  console.log('  To:', requirements.payTo);
  console.log('  Amount:', requirements.maxAmountRequired);
  console.log('  Asset:', requirements.asset);

  const signature = await walletClient.signTypedData({
    account: userAddress as `0x${string}`,
    domain,
    types,
    primaryType: 'TransferWithAuthorization',
    message,
  });

  console.log('✅ Signature created:', signature.substring(0, 20) + '...');

  // Create X-PAYMENT payload (base64 JSON)
  const payload: X402PaymentPayload = {
    x402Version: 1,
    scheme: requirements.scheme,
    network: requirements.network,
    payload: {
      signature,
      authorization: {
        from: userAddress,
        to: requirements.payTo,
        value: requirements.maxAmountRequired,
        validAfter: message.validAfter.toString(),
        validBefore: message.validBefore.toString(),
        nonce: message.nonce,
      },
    },
  };

  // Encode as base64 for X-PAYMENT header
  const encoded = btoa(JSON.stringify(payload));
  console.log('✅ X-PAYMENT payload created (base64 encoded)');

  return encoded;
}

/**
 * Parse 402 Payment Required response to extract payment requirements
 */
export function parsePaymentRequirements(response402: { accepts?: PaymentRequirements[] }): PaymentRequirements {
  if (!response402.accepts || response402.accepts.length === 0) {
    throw new Error('No payment requirements found in 402 response');
  }

  // Prefer USDC on Base
  const preferred = response402.accepts.find(
    (req: PaymentRequirements) =>
      req.network === 'base' && req.asset.includes('833589fCD6eDb6')
  );

  return preferred || response402.accepts[0];
}

