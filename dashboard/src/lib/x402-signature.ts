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
  // Optional extra fields (facilitator-specific).
  extra?: Record<string, unknown>;
  // Some schemes use `amount` instead of `maxAmountRequired`.
  amount?: string;
}

// x402 v2 Payment-Required header payload (minimal fields we consume)
export interface PaymentRequiredV2 {
  x402Version: 2;
  accepts: Array<{
    scheme: "exact";
    network: string; // eip155:<chainId>
    asset: string;
    amount: string; // atomic units (microusdc)
    payTo: string;
    resource?: string;
    description?: string;
    mimeType?: string;
    maxTimeoutSeconds?: number;
    extra?: {
      name?: string;
      version?: string;
    };
  }>;
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

export function expectedEvmChainIdFromNetwork(network: string): number {
  // v2 uses CAIP-2-like network strings: eip155:8453
  const m = network.match(/^eip155:(\d+)$/);
  if (m) {
    const id = Number(m[1]);
    if (Number.isSafeInteger(id) && id > 0) return id;
  }
  // legacy fallback
  if (network === "base") return 8453;
  return 8453;
}

function assertWalletOnExpectedChain(walletClient: WalletClient, expectedChainId: number) {
  const active = (walletClient as unknown as { chain?: { id?: unknown } })?.chain?.id;
  if (typeof active === "number" && active !== expectedChainId) {
    throw new Error(
      `Provided chainId "${expectedChainId}" must match the active chainId "${active}". ` +
        `Please switch your wallet network to Base (chainId ${expectedChainId}) and try again.`,
    );
  }
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
  const chainId = expectedEvmChainIdFromNetwork(requirements.network);
  assertWalletOnExpectedChain(walletClient, chainId);

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

function chainIdFromNetwork(network: string): number {
  return expectedEvmChainIdFromNetwork(network);
}

export function parsePaymentRequiredHeaderV2(paymentRequiredB64: string): PaymentRequiredV2 {
  const decoded = JSON.parse(atob(paymentRequiredB64)) as unknown;
  if (!decoded || typeof decoded !== "object") {
    throw new Error("Invalid PAYMENT-REQUIRED payload");
  }
  const obj = decoded as Record<string, unknown>;
  const x402Version = obj["x402Version"];
  const accepts = obj["accepts"];
  if (x402Version !== 2 || !Array.isArray(accepts) || accepts.length === 0) {
    throw new Error("PAYMENT-REQUIRED must contain x402Version=2 and accepts[]");
  }
  return decoded as PaymentRequiredV2;
}

/**
 * Create x402 v2 PAYMENT-SIGNATURE payload for EVM exact scheme (EIP-3009).
 *
 * Returns a base64(JSON(...)) string suitable for the PAYMENT-SIGNATURE header.
 */
export async function createX402PaymentSignatureV2(
  walletClient: WalletClient,
  requirement: PaymentRequiredV2["accepts"][number],
  userAddress: string
): Promise<string> {
  const chainId = chainIdFromNetwork(requirement.network);

  const domain = {
    name: (requirement.extra?.name || "USD Coin") as string,
    version: (requirement.extra?.version || "2") as string,
    chainId,
    verifyingContract: requirement.asset as `0x${string}`,
  } as const;

  const types = {
    TransferWithAuthorization: [
      { name: "from", type: "address" },
      { name: "to", type: "address" },
      { name: "value", type: "uint256" },
      { name: "validAfter", type: "uint256" },
      { name: "validBefore", type: "uint256" },
      { name: "nonce", type: "bytes32" },
    ],
  } as const;

  const now = Math.floor(Date.now() / 1000);

  const nonceBytes = new Uint8Array(32);
  crypto.getRandomValues(nonceBytes);
  const nonceHex = `0x${Array.from(nonceBytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")}` as `0x${string}`;

  const message = {
    from: userAddress as `0x${string}`,
    to: requirement.payTo as `0x${string}`,
    value: BigInt(requirement.amount),
    validAfter: BigInt(now),
    validBefore: BigInt(now + 300),
    nonce: nonceHex,
  } as const;

  const signature = await walletClient.signTypedData({
    account: userAddress as `0x${string}`,
    domain,
    types,
    primaryType: "TransferWithAuthorization",
    message,
  });

  const payload = {
    x402Version: 2,
    scheme: requirement.scheme,
    network: requirement.network,
    payload: {
      signature,
      authorization: {
        from: userAddress,
        to: requirement.payTo,
        value: requirement.amount,
        validAfter: message.validAfter.toString(),
        validBefore: message.validBefore.toString(),
        nonce: message.nonce,
      },
    },
  };

  return btoa(JSON.stringify(payload));
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

export function pickPaymentRequirementByNetwork(
  response402: { accepts?: PaymentRequirements[] },
  network: "base" | "solana",
): PaymentRequirements {
  if (!response402.accepts || response402.accepts.length === 0) {
    throw new Error("No payment requirements found in 402 response")
  }
  const n = network.toLowerCase()
  const match = response402.accepts.find((r) => String(r.network || "").toLowerCase() === n)
  return match || response402.accepts[0]
}

