/**
 * Web Fetcher Utilities
 * 
 * Tools for fetching and validating web-based evidence
 * Used by Evidence Review Agent to check URLs, APIs, and documents
 */

import { internalAction } from "../_generated/server";
import { v } from "convex/values";

/**
 * Fetch web content from a URL
 * Truncates to maxLength to avoid token limits
 */
export const fetchWebContent = internalAction({
  args: {
    url: v.string(),
    maxLength: v.optional(v.number()),
  },
  handler: async (ctx, { url, maxLength = 50000 }) => {
    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": "Consulate-Evidence-Reviewer/1.0",
        },
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });

      if (!response.ok) {
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
          status: response.status,
        };
      }

      const contentType = response.headers.get("content-type") || "";
      const text = await response.text();

      // Truncate if needed
      const truncated = text.length > maxLength
        ? text.substring(0, maxLength) + `\n\n[Content truncated - original length: ${text.length} characters]`
        : text;

      return {
        success: true,
        content: truncated,
        contentType,
        originalLength: text.length,
        truncated: text.length > maxLength,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Failed to fetch URL",
      };
    }
  },
});

/**
 * Check API endpoint health
 * Validates that an API is responding correctly
 */
export const checkApiHealth = internalAction({
  args: {
    endpoint: v.string(),
    expectedStatus: v.optional(v.number()),
    method: v.optional(v.string()),
  },
  handler: async (ctx, { endpoint, expectedStatus = 200, method = "GET" }) => {
    try {
      const response = await fetch(endpoint, {
        method,
        headers: {
          "User-Agent": "Consulate-Evidence-Reviewer/1.0",
        },
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });

      const isHealthy = expectedStatus
        ? response.status === expectedStatus
        : response.status < 400;

      return {
        success: true,
        healthy: isHealthy,
        status: response.status,
        statusText: response.statusText,
        timestamp: Date.now(),
      };
    } catch (error: any) {
      return {
        success: false,
        healthy: false,
        error: error.message || "API check failed",
      };
    }
  },
});

/**
 * Analyze image from URL
 * Returns image metadata and basic validation
 */
export const analyzeImage = internalAction({
  args: {
    imageUrl: v.string(),
    context: v.string(), // Description of what the image should show
  },
  handler: async (ctx, { imageUrl, context }) => {
    try {
      const response = await fetch(imageUrl, {
        headers: {
          "User-Agent": "Consulate-Evidence-Reviewer/1.0",
        },
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      const contentType = response.headers.get("content-type") || "";
      const contentLength = response.headers.get("content-length");

      // Basic validation - check if it's an image
      const isImage = contentType.startsWith("image/");

      return {
        success: true,
        isImage,
        contentType,
        contentLength: contentLength ? parseInt(contentLength, 10) : null,
        url: imageUrl,
        context,
        note: isImage
          ? "Image URL is accessible and appears to be a valid image"
          : "URL accessible but may not be an image",
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Failed to analyze image",
      };
    }
  },
});




