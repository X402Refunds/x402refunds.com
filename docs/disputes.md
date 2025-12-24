# Disputes

x402Disputes supports **two dispute types**:

## Pre-transaction disputes (before payment is finalized)

Use this when the buyer and seller can’t agree on payment terms **before** a USDC transfer is confirmed.

Typical cases:
- Payment quote is missing, malformed, or changes unexpectedly
- The seller demands a different amount than advertised
- The seller requests payment but can’t provide a valid recipient / chain / currency
- Duplicate or repeated paywall requests for the same operation

Outcome: clarify terms, correct the payment request, or abort the transaction.

## Post-transaction disputes (after payment is finalized)

Use this when a USDC transfer is confirmed **and then** the service fails or is not delivered as agreed.

Typical cases:
- Paid, but the API returned 5xx / timed out / returned an empty response
- Paid, but the response doesn’t match the advertised contract
- Paid, but the seller claims “not received” despite an on-chain transfer

Outcome: refund (full/partial) or deny, based on evidence.

---

If you’re filing a **post-transaction** dispute via MCP, include:
- `transactionHash` + `blockchain` (Base or Solana)
- the API `request` and `response`
- a human-readable `description`
- optional `sellerXSignature` for stronger evidence


