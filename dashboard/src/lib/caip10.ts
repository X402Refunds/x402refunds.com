const BASE_EVM_ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/;

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

  // For the human-friendly flow we accept a plain address and default to Base.
  if (!isEvmAddress(raw)) return { caip10: null, error: "Enter a valid 0x address" };
  return { caip10: `eip155:8453:${raw.toLowerCase()}` };
}

