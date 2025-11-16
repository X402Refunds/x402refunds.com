import { describe, it, expect } from "vitest"

/**
 * Test base64 public key normalization logic
 * This mirrors the logic in create-agent-dialog.tsx
 */
function normalizePublicKey(input: string): string | null {
  const trimmed = input.trim()
  
  // Handle SSH .pub format: ssh-ed25519 <base64> <comment>
  if (trimmed.startsWith('ssh-ed25519')) {
    const parts = trimmed.split(/\s+/)
    if (parts.length >= 2) {
      const sshBase64 = parts[1]
      try {
        // Decode SSH format to extract raw Ed25519 key
        const decoded = atob(sshBase64)
        const bytes = new Uint8Array(decoded.length)
        for (let i = 0; i < decoded.length; i++) {
          bytes[i] = decoded.charCodeAt(i)
        }
        
        // SSH format: [4 bytes: key type len][key type][4 bytes: pubkey len][32 bytes: pubkey]
        // The last 32 bytes are the actual Ed25519 public key
        if (bytes.length >= 32) {
          const pubkeyBytes = bytes.slice(-32) // Last 32 bytes are the Ed25519 key
          return btoa(String.fromCharCode(...pubkeyBytes))
        }
      } catch (error) {
        console.error("Failed to parse SSH format:", error)
        return null
      }
    }
    return null
  }
  
  // Handle raw base64 (could be 32-byte key, SPKI format, or SSH format without prefix)
  // Try to decode and extract 32-byte Ed25519 key
  const base64Pattern = /^[A-Za-z0-9+/=]+$/
  if (base64Pattern.test(trimmed)) {
    try {
      const decoded = atob(trimmed)
      const bytes = new Uint8Array(decoded.length)
      for (let i = 0; i < decoded.length; i++) {
        bytes[i] = decoded.charCodeAt(i)
      }
      
      // If it's exactly 32 bytes, it's the raw key
      if (bytes.length === 32) {
        return trimmed // Already valid 32-byte base64
      }
      
      // If it's longer (SPKI format ~44 bytes, or SSH format ~51 bytes), extract last 32 bytes
      if (bytes.length >= 32) {
        const pubkeyBytes = bytes.slice(-32)
        return btoa(String.fromCharCode(...pubkeyBytes))
      }
      
      // Too short
      return null
    } catch (error) {
      console.error("Failed to decode base64:", error)
      return null
    }
  }
  
  return null // Invalid format
}

describe("Base64 Public Key Normalization", () => {
  it("should accept raw 32-byte base64", () => {
    // Generate a test 32-byte key
    const testBytes = new Uint8Array(32)
    for (let i = 0; i < 32; i++) {
      testBytes[i] = i
    }
    const base64 = btoa(String.fromCharCode(...testBytes))
    
    const result = normalizePublicKey(base64)
    expect(result).toBe(base64)
    expect(result?.length).toBeGreaterThanOrEqual(43)
    expect(result?.length).toBeLessThanOrEqual(44)
  })

  it("should accept SSH .pub format", () => {
    // Example SSH .pub format (from user's example)
    const sshPub = "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIOijNw8BLfSaexZbjrcyES1DgtMzMXujV1NTUEYZw8mf vk016836@broadcom.net"
    
    const result = normalizePublicKey(sshPub)
    expect(result).not.toBeNull()
    expect(result?.length).toBeGreaterThanOrEqual(43)
    expect(result?.length).toBeLessThanOrEqual(44)
    
    // Verify it decodes to 32 bytes
    if (result) {
      const decoded = atob(result)
      expect(decoded.length).toBe(32)
    }
  })

  it("should accept just the base64 part from SSH .pub", () => {
    const base64Part = "AAAAC3NzaC1lZDI1NTE5AAAAIOijNw8BLfSaexZbjrcyES1DgtMzMXujV1NTUEYZw8mf"
    
    const result = normalizePublicKey(base64Part)
    expect(result).not.toBeNull()
    
    // Should extract the 32-byte key from SSH format
    if (result) {
      const decoded = atob(result)
      expect(decoded.length).toBe(32)
    }
  })

  it("should reject invalid formats", () => {
    expect(normalizePublicKey("invalid")).toBeNull()
    expect(normalizePublicKey("12345")).toBeNull()
    expect(normalizePublicKey("")).toBeNull()
    expect(normalizePublicKey("not-base64-format-at-all")).toBeNull()
  })

  it("should handle base64 with padding", () => {
    // Create a 32-byte key and encode it
    const testBytes = new Uint8Array(32)
    for (let i = 0; i < 32; i++) {
      testBytes[i] = i % 256
    }
    const base64 = btoa(String.fromCharCode(...testBytes))
    
    const result = normalizePublicKey(base64)
    expect(result).not.toBeNull()
    expect(result).toBe(base64)
  })
})

