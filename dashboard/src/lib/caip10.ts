const BASE_EVM_ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/;
const SOLANA_ADDRESS_RE = /^[1-9A-HJ-NP-Za-km-z]{32,64}$/;
// Solana mainnet-beta cluster identifier (commonly used CAIP-2 chain reference).
const SOLANA_MAINNET_CHAIN_REF = "5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp";

export function baseAddressToCaip10(address: string): string {
  const raw = (address || "").trim();
  if (!BASE_EVM_ADDRESS_RE.test(raw)) {
    throw new Error("Invalid Base address");
  }
  return `eip155:8453:${raw.toLowerCase()}`;
}

function isEvmAddress(addr: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(addr);
}

export function normalizeMerchantToCaip10Base(input: string): { caip10: string | null; error?: string } {
  const raw = input.trim();
  if (!raw) return { caip10: null };

  // Allow direct CAIP-10 input (Base).
  if (raw.startsWith("eip155:8453:")) {
    const addr = raw.slice("eip155:8453:".length);
    if (!isEvmAddress(addr)) return { caip10: null, error: "Invalid EVM address" };
    return { caip10: `eip155:8453:${addr.toLowerCase()}` };
  }

  // Allow direct CAIP-10 input (Solana).
  if (raw.startsWith("solana:")) {
    const m = raw.match(/^solana:([^:]+):([1-9A-HJ-NP-Za-km-z]{32,64})$/);
    if (!m) return { caip10: null, error: "Invalid Solana CAIP-10 (expected solana:<chainRef>:<base58Address>)" };
    const chainRef = m[1];
    const addr = m[2];
    if (!chainRef || !SOLANA_ADDRESS_RE.test(addr)) return { caip10: null, error: "Invalid Solana address" };
    return { caip10: `solana:${chainRef}:${addr}` };
  }

  // For the human-friendly flow we accept a plain address and default to Base.
  // Additionally: accept a raw Solana base58 address and default it to Solana mainnet.
  if (SOLANA_ADDRESS_RE.test(raw)) return { caip10: `solana:${SOLANA_MAINNET_CHAIN_REF}:${raw}` };
  if (!isEvmAddress(raw)) return { caip10: null, error: "Enter a valid 0x address, Solana base58 address, or CAIP-10 solana:... identity" };
  return { caip10: `eip155:8453:${raw.toLowerCase()}` };
}

