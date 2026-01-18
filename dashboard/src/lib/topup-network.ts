import { normalizeMerchantToCaip10Base } from "./caip10";

export type TopupPayNetwork = "base" | "solana";

export function inferTopupPayNetworkFromMerchant(input: string): {
  network: TopupPayNetwork | null;
  locked: boolean;
  merchantCaip10: string | null;
  error?: string;
} {
  const normalized = normalizeMerchantToCaip10Base(input);
  const merchantCaip10 = normalized.caip10;
  if (!merchantCaip10) {
    return { network: null, locked: false, merchantCaip10: null, error: normalized.error };
  }

  if (merchantCaip10.startsWith("solana:")) return { network: "solana", locked: true, merchantCaip10 };
  if (merchantCaip10.startsWith("eip155:")) return { network: "base", locked: true, merchantCaip10 };

  return { network: null, locked: false, merchantCaip10, error: normalized.error };
}

