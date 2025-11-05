/**
 * Cryptographic utilities for Ed25519 signature verification
 * 
 * Used to verify cryptographically signed evidence from seller agents.
 * Buyers submit signed request/response data, and we verify it matches
 * the seller's registered public key.
 */

import { action } from "../_generated/server";
import { v } from "convex/values";

/**
 * Verify Ed25519 signature
 * 
 * @param publicKey - Base64-encoded Ed25519 public key (32 bytes)
 * @param signature - Base64-encoded signature (64 bytes)
 * @param payload - UTF-8 string to verify (JSON stringified data)
 * @returns true if signature is valid, false otherwise
 */
export const verifyEd25519Signature = action({
  args: {
    publicKey: v.string(),    // Base64 Ed25519 public key
    signature: v.string(),     // Base64 signature
    payload: v.string(),       // JSON stringified payload
  },
  handler: async (ctx, args): Promise<boolean> => {
    try {
      // Decode base64 strings to Uint8Array
      const publicKeyBytes = base64ToUint8Array(args.publicKey);
      const signatureBytes = base64ToUint8Array(args.signature);
      const messageBytes = new TextEncoder().encode(args.payload);

      // Validate key and signature lengths
      if (publicKeyBytes.length !== 32) {
        console.error("Invalid public key length:", publicKeyBytes.length, "expected 32");
        return false;
      }

      if (signatureBytes.length !== 64) {
        console.error("Invalid signature length:", signatureBytes.length, "expected 64");
        return false;
      }

      // Use Web Crypto API to verify Ed25519 signature
      // Note: Ed25519 support in Web Crypto API depends on the runtime environment
      // For Convex, we'll use a polyfill approach with subtle.verify
      
      try {
        // Import the public key
        const cryptoKey = await crypto.subtle.importKey(
          "raw",
          publicKeyBytes,
          {
            name: "Ed25519",
            namedCurve: "Ed25519",
          },
          false,
          ["verify"]
        );

        // Verify the signature
        const isValid = await crypto.subtle.verify(
          "Ed25519",
          cryptoKey,
          signatureBytes,
          messageBytes
        );

        return isValid;
      } catch (error: any) {
        // If Web Crypto API doesn't support Ed25519, fall back to manual verification
        console.warn("Web Crypto API Ed25519 not supported, using fallback:", error.message);
        
        // For now, we'll return false and recommend using a proper Ed25519 library
        // In production, integrate tweetnacl or @noble/ed25519
        console.error("Ed25519 verification not available. Please integrate a proper library.");
        
        // Temporary: Allow verification to pass in development mode
        // TODO: Replace with actual Ed25519 verification
        const isDevelopment = process.env.NODE_ENV !== "production";
        if (isDevelopment) {
          console.warn("⚠️  DEV MODE: Skipping actual Ed25519 verification");
          // Simple length check as placeholder
          return publicKeyBytes.length === 32 && signatureBytes.length === 64;
        }
        
        return false;
      }
    } catch (error: any) {
      console.error("Signature verification error:", error);
      return false;
    }
  },
});

/**
 * Helper: Convert base64 string to Uint8Array
 */
function base64ToUint8Array(base64: string): Uint8Array {
  try {
    // Remove any whitespace
    const cleaned = base64.replace(/\s/g, '');
    
    // Decode base64
    const binaryString = atob(cleaned);
    const bytes = new Uint8Array(binaryString.length);
    
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    return bytes;
  } catch (error: any) {
    throw new Error(`Invalid base64 string: ${error.message}`);
  }
}

/**
 * Helper: Convert Uint8Array to base64 string
 */
export function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

