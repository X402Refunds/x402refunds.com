import { describe, it, expect } from "vitest";
import { findLinkByRel, parseRefundContactEmailFromLinkUri, parseLinkHeader } from "../../convex/lib/linkHeader";

const REL = "https://x402refunds.com/rel/refund-contact";

describe("link header parser (unit)", () => {
  it("parses a single link with quoted rel", () => {
    const h = `</a>; rel="${REL}"`;
    expect(findLinkByRel(h, REL)).toBe("/a");
  });

  it("parses multiple links and finds matching rel", () => {
    const h = `</x>; rel="other", <mailto:refunds@merchant.com>; rel="${REL}"; type="text/plain"`;
    expect(findLinkByRel(h, REL)).toBe("mailto:refunds@merchant.com");
  });

  it("handles commas inside quoted params", () => {
    const h = `<mailto:refunds@merchant.com>; rel="${REL}"; title="a,b,c", </x>; rel="other"`;
    expect(findLinkByRel(h, REL)).toBe("mailto:refunds@merchant.com");
  });

  it("supports rel with multiple tokens (space-separated)", () => {
    const h = `<mailto:refunds@merchant.com>; rel="${REL} other-rel"`;
    expect(findLinkByRel(h, REL)).toBe("mailto:refunds@merchant.com");
  });

  it("extracts email from mailto with query", () => {
    expect(parseRefundContactEmailFromLinkUri("mailto:refunds@merchant.com?subject=hi")).toBe("refunds@merchant.com");
  });

  it("extracts email from bare email URI", () => {
    expect(parseRefundContactEmailFromLinkUri("refunds@merchant.com")).toBe("refunds@merchant.com");
  });

  it("rejects non-email targets", () => {
    expect(parseRefundContactEmailFromLinkUri("mailto:not-an-email")).toBe(null);
    expect(parseRefundContactEmailFromLinkUri("https://merchant.example/refunds")).toBe(null);
  });

  it("exposes parsed params (sanity)", () => {
    const parsed = parseLinkHeader(`<mailto:refunds@merchant.com>; rel="${REL}"; type="text/plain"`);
    expect(parsed.length).toBe(1);
    expect(parsed[0].uri).toBe("mailto:refunds@merchant.com");
    expect(parsed[0].params.rel).toContain(REL);
    expect(parsed[0].params.type).toContain("text/plain");
  });
});

