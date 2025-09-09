import { AEB, ToolCallEntry, ModelInfo, AEBSchema } from './types';
import { sha256, sha256Json, sign } from './crypto';

export class AEBBuilder {
  private entries: ToolCallEntry[] = [];
  private agentDid: string;
  private ownerDid: string;
  private privateKey: string;
  private context: Record<string, any> = {};

  constructor(agentDid: string, ownerDid: string, privateKey: string) {
    this.agentDid = agentDid;
    this.ownerDid = ownerDid;
    this.privateKey = privateKey;
  }

  /**
   * Set execution context
   */
  setContext(context: Record<string, any>): void {
    this.context = context;
  }

  /**
   * Add a tool call entry
   */
  addEntry(
    tool: string,
    input: any,
    output: any,
    model: ModelInfo,
    requestTs?: number,
    responseTs?: number
  ): void {
    const entry: ToolCallEntry = {
      tool,
      inputHash: sha256Json(input),
      outputHash: sha256Json(output),
      requestTs: requestTs || Date.now(),
      responseTs: responseTs || Date.now(),
      model,
    };

    this.entries.push(entry);
  }

  /**
   * Build and sign the AEB
   */
  async build(): Promise<AEB> {
    if (this.entries.length === 0) {
      throw new Error('No entries added to AEB');
    }

    const contextHash = sha256Json(this.context);
    
    // Create the unsigned AEB
    const unsignedAEB = {
      version: '1.0' as const,
      agentDid: this.agentDid,
      ownerDid: this.ownerDid,
      entries: this.entries,
      contextHash,
      signer: '', // Will be filled after signing
      signature: '', // Will be filled after signing
      aebHash: '', // Will be filled after hashing
    };

    // Create signing payload (everything except signature and hash)
    const signingPayload = {
      version: unsignedAEB.version,
      agentDid: unsignedAEB.agentDid,
      ownerDid: unsignedAEB.ownerDid,
      entries: unsignedAEB.entries,
      contextHash: unsignedAEB.contextHash,
    };

    // Sign the payload
    const signature = await sign(JSON.stringify(signingPayload), this.privateKey);
    
    // Get public key (derive from private key)
    const ed25519Module = await import('@noble/ed25519');
    const publicKey = await ed25519Module.getPublicKey(Buffer.from(this.privateKey, 'hex'));
    const signer = Buffer.from(publicKey).toString('hex');

    // Create the signed AEB (without hash)
    const signedAEB = {
      ...unsignedAEB,
      signer,
      signature,
    };

    // Compute final hash
    const aebHash = sha256Json(signedAEB);

    // Create final AEB
    const finalAEB: AEB = {
      ...signedAEB,
      aebHash,
    };

    // Validate against schema
    AEBSchema.parse(finalAEB);

    return finalAEB;
  }

  /**
   * Clear all entries (for reuse)
   */
  clear(): void {
    this.entries = [];
    this.context = {};
  }
}

/**
 * Verify an AEB signature and hash
 */
export async function verifyAEB(aeb: AEB): Promise<boolean> {
  try {
    // Validate schema first
    AEBSchema.parse(aeb);

    // Verify hash
    const aebWithoutHash = { ...aeb };
    delete (aebWithoutHash as any).aebHash;
    const computedHash = sha256Json(aebWithoutHash);
    
    if (computedHash !== aeb.aebHash) {
      console.error('AEB hash mismatch');
      return false;
    }

    // Verify signature
    const signingPayload = {
      version: aeb.version,
      agentDid: aeb.agentDid,
      ownerDid: aeb.ownerDid,
      entries: aeb.entries,
      contextHash: aeb.contextHash,
    };

    const { verify } = await import('./crypto');
    const isValidSignature = await verify(
      JSON.stringify(signingPayload),
      aeb.signature,
      aeb.signer
    );

    if (!isValidSignature) {
      console.error('AEB signature verification failed');
      return false;
    }

    return true;
  } catch (error) {
    console.error('AEB verification failed:', error);
    return false;
  }
}

/**
 * Create AEB from JSON
 */
export function fromJSON(json: string): AEB {
  const data = JSON.parse(json);
  return AEBSchema.parse(data);
}

/**
 * Convert AEB to JSON
 */
export function toJSON(aeb: AEB): string {
  return JSON.stringify(aeb, null, 2);
}
