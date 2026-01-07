import { describe, expect, it } from "vitest";
import { baseAddressToCaip10 } from "../../dashboard/src/lib/caip10";

describe("baseAddressToCaip10 (frontend mapping)", () => {
  it("lowercases and prefixes eip155:8453", () => {
    expect(baseAddressToCaip10("0x00000000000000000000000000000000000000AA")).toBe(
      "eip155:8453:0x00000000000000000000000000000000000000aa",
    );
  });

  it("rejects invalid addresses", () => {
    expect(() => baseAddressToCaip10("not-an-address")).toThrow();
    expect(() => baseAddressToCaip10("0x123")).toThrow();
  });
});

