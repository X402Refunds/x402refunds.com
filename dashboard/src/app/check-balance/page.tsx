"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CopyableField } from "@/components/case-detail/CopyableField";
import { normalizeMerchantToCaip10Base } from "@/lib/caip10";

const API_BASE = "https://api.x402refunds.com";

export default function CheckBalancePage() {
  const [merchant, setMerchant] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableMicrousdc, setAvailableMicrousdc] = useState<number | null>(null);

  const merchantNormalized = useMemo(() => normalizeMerchantToCaip10Base(merchant), [merchant]);
  const merchantCaip10 = merchantNormalized.caip10;

  const fetchUrl = useMemo(() => {
    const m = merchantCaip10?.trim() ?? "";
    if (!m) return null;
    return `${API_BASE}/v1/merchant/balance?merchant=${encodeURIComponent(m)}`;
  }, [merchantCaip10]);

  const availableUsdc =
    typeof availableMicrousdc === "number" && Number.isFinite(availableMicrousdc)
      ? availableMicrousdc / 1_000_000
      : null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-foreground">Check balance</h1>
        <p className="text-sm text-muted-foreground">
          Check your refund credits by merchant identity (Base or Solana).
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lookup</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="merchant">Merchant wallet address</Label>
            <Input
              id="merchant"
              placeholder="0x... or solana:<chainRef>:<base58>"
              value={merchant}
              onChange={(e) => {
                setMerchant(e.target.value);
                setError(null);
                setAvailableMicrousdc(null);
              }}
            />
            {merchant.trim() && merchantNormalized.error && (
              <div className="text-xs text-destructive">{merchantNormalized.error}</div>
            )}
            {merchantCaip10 && (
              <div className="text-xs text-muted-foreground">
                Normalized identity: <code className="font-mono">{merchantCaip10}</code>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              disabled={!fetchUrl || loading}
              onClick={async () => {
                if (!fetchUrl) return;
                setLoading(true);
                setError(null);
                setAvailableMicrousdc(null);
                try {
                  const res = await fetch(fetchUrl, { method: "GET" });
                  const data = await res.json().catch(() => ({}));
                  if (!res.ok || !data?.ok) {
                    throw new Error(data?.message || `Failed: ${res.status}`);
                  }
                  const micros = Number(data.availableMicrousdc ?? 0);
                  setAvailableMicrousdc(Number.isFinite(micros) ? micros : 0);
                } catch (e: unknown) {
                  setError(e instanceof Error ? e.message : String(e));
                } finally {
                  setLoading(false);
                }
              }}
            >
              {loading ? "Checking…" : "Check balance"}
            </Button>

            {merchantCaip10 && (
              <Button
                variant="outline"
                disabled={!merchantCaip10}
                onClick={() => (window.location.href = `/topup?merchant=${encodeURIComponent(merchantCaip10)}`)}
              >
                Top up
              </Button>
            )}

            {fetchUrl && (
              <Button
                variant="outline"
                disabled={!fetchUrl}
                onClick={() => navigator.clipboard.writeText(fetchUrl)}
              >
                Copy API URL
              </Button>
            )}
          </div>

          {fetchUrl && <CopyableField value={fetchUrl} label="API" truncate={false} />}

          {error && <div className="text-sm text-destructive">{error}</div>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Results</CardTitle>
          <Badge variant="secondary">{availableUsdc === null ? "—" : "1"}</Badge>
        </CardHeader>
        <CardContent className="space-y-2">
          {availableUsdc === null ? (
            <div className="text-sm text-muted-foreground">No balance loaded.</div>
          ) : (
            <div className="text-sm text-muted-foreground">
              Available refund credits:{" "}
              <code className="font-mono text-foreground">{availableUsdc.toFixed(6)} USDC</code>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

