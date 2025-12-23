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

export interface X402PaymentPayload {
  x402Version: number;
  scheme: string;
  network: string;
  signature: string;
  authorization: {
    from: string;
    to: string;
    value: string;
    asset: string;
    resource: string;
    nonce: string;
    validAfter: string;
    validBefore: string;
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
  // EIP-712 domain for X-402 payments on Base
  const domain = {
    name: 'X-402 Payment',
    version: '1',
    chainId: 8453, // Base mainnet
  } as const;

  // EIP-712 typed data structure for payment authorization
  const types = {
    Payment: [
      { name: 'from', type: 'address' },
      { name: 'to', type: 'address' },
      { name: 'value', type: 'uint256' },
      { name: 'asset', type: 'address' },
      { name: 'resource', type: 'string' },
      { name: 'nonce', type: 'uint256' },
      { name: 'validAfter', type: 'uint256' },
      { name: 'validBefore', type: 'uint256' },
    ],
  } as const;

  // Current timestamp for validity window
  const now = Math.floor(Date.now() / 1000);

  // Payment authorization message
  const message = {
    from: userAddress as `0x${string}`,
    to: requirements.payTo as `0x${string}`,
    value: BigInt(requirements.maxAmountRequired),
    asset: requirements.asset as `0x${string}`,
    resource: requirements.resource,
    nonce: BigInt(Date.now()), // Unique nonce per payment
    validAfter: BigInt(now),
    validBefore: BigInt(now + 300), // Valid for 5 minutes
  };

  console.log('Creating X-402 payment signature...');
  console.log('  User:', userAddress);
  console.log('  To:', requirements.payTo);
  console.log('  Amount:', requirements.maxAmountRequired);
  console.log('  Asset:', requirements.asset);

  // User signs the message (Brave Wallet popup - NO GAS!)
  const signature = await walletClient.signTypedData({
    account: userAddress as `0x${string}`,
    domain,
    types,
    primaryType: 'Payment',
    message,
  });

  console.log('✅ Signature created:', signature.substring(0, 20) + '...');

  // Create X-PAYMENT payload
  const payload: X402PaymentPayload = {
    x402Version: 1,
    scheme: requirements.scheme,
    network: requirements.network,
    signature,
    authorization: {
      from: userAddress,
      to: requirements.payTo,
      value: requirements.maxAmountRequired,
      asset: requirements.asset,
      resource: requirements.resource,
      nonce: message.nonce.toString(),
      validAfter: message.validAfter.toString(),
      validBefore: message.validBefore.toString(),
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

