import { PublicKey, Transaction } from "@solana/web3.js"
import {
  createTransferCheckedInstruction,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token"

export type SolanaWindowProvider = {
  isPhantom?: boolean
  connect: (opts?: { onlyIfTrusted?: boolean }) => Promise<{ publicKey: PublicKey }>
  signTransaction: (tx: Transaction) => Promise<Transaction>
  publicKey?: PublicKey
}

export function getSolanaProvider(): SolanaWindowProvider | null {
  const w = globalThis as unknown as { solana?: unknown }
  const p = w.solana
  if (!p || typeof p !== "object") return null
  const obj = p as Record<string, unknown>
  if (typeof obj.connect !== "function" || typeof obj.signTransaction !== "function") return null
  return p as SolanaWindowProvider
}

export function getDefaultSolanaRpcUrl(): string {
  return process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com"
}

export async function createSolanaExactPaymentTransaction(params: {
  recentBlockhash: string
  payer: PublicKey
  feePayer: PublicKey
  payTo: PublicKey
  mint: PublicKey
  amountMicrousdc: bigint
  decimals?: number
}): Promise<Transaction> {
  const decimals = typeof params.decimals === "number" ? params.decimals : 6

  // Token accounts (ATAs)
  const fromAta = getAssociatedTokenAddressSync(params.mint, params.payer)
  const toAta = getAssociatedTokenAddressSync(params.mint, params.payTo)

  // NOTE: Do NOT include ATA creation here. Some facilitators disallow the Associated Token
  // Account program (AToken...), causing verification to fail. We only include the SPL transfer.
  const transferIx = createTransferCheckedInstruction(
    fromAta,
    params.mint,
    toAta,
    params.payer,
    params.amountMicrousdc,
    decimals,
  )

  const tx = new Transaction()
  tx.feePayer = params.feePayer
  tx.recentBlockhash = params.recentBlockhash
  tx.add(transferIx)
  return tx
}

export function encodePartialSolanaTransactionBase64(tx: Transaction): string {
  const bytes = tx.serialize({ requireAllSignatures: false, verifySignatures: false })
  // Browser-safe base64 encoding (avoid Node Buffer).
  let binary = ""
  const chunkSize = 0x8000
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize)
    binary += String.fromCharCode(...chunk)
  }
  return btoa(binary)
}

