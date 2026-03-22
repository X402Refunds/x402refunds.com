"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { normalizeMerchantToCaip10Base } from "@/lib/caip10";

const API_BASE = "https://api.x402refunds.com";

type RefundRequestRow = {
  _id: string;
  plaintiff?: string; // buyer (legacy field)
  defendant?: string; // merchant (legacy field, CAIP-10)
  status?: string;
  filedAt?: number;
  amount?: number;
  currency?: string;
  metadata?: { poolStatus?: unknown; pool_status?: unknown } | null;
};

export default function DisputesPage() {
  const [merchant, setMerchant] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<RefundRequestRow[]>([]);

  const merchantNormalized = useMemo(() => normalizeMerchantToCaip10Base(merchant), [merchant]);
  const merchantCaip10 = merchantNormalized.caip10;

  const fetchUrl = useMemo(() => {
    const m = merchantCaip10?.trim() ?? "";
    if (!m) return null;
    return `${API_BASE}/v1/refunds?merchant=${encodeURIComponent(m)}&limit=50`;
  }, [merchantCaip10]);

  useEffect(() => {
    setRows([]);
    setError(null);
  }, [merchant]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-foreground">Refund requests</h1>
        <p className="text-sm text-muted-foreground">
          Public refund-request registry. Search by merchant identity (Base or Solana).
        </p>
      </div>

      <Card className="border-border/60 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle>Merchant</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="merchant">Merchant wallet address</Label>
            <Input
              id="merchant"
              placeholder="0x... or solana:<chainRef>:<base58>"
              value={merchant}
              onChange={(e) => setMerchant(e.target.value)}
            />
            {merchant.trim() && merchantNormalized.error && (
              <div className="text-xs text-destructive">{merchantNormalized.error}</div>
            )}
            {merchantCaip10 && (
              <div className="text-xs text-muted-foreground">
                Normalized identity: <code className="font-mono text-foreground">{merchantCaip10}</code>
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
                try {
                  const res = await fetch(fetchUrl, { method: "GET" });
                  const data = await res.json().catch(() => ({}));
                  if (!res.ok || !data?.ok) {
                    throw new Error(data?.message || `Failed: ${res.status}`);
                  }
                  setRows(Array.isArray(data.refundRequests) ? data.refundRequests : []);
                } catch (e: unknown) {
                  setError(e instanceof Error ? e.message : String(e));
                } finally {
                  setLoading(false);
                }
              }}
            >
              {loading ? "Loading…" : "Fetch refund requests"}
            </Button>

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

          {fetchUrl && (
            <div className="text-xs text-muted-foreground">
              API: <code className="break-all font-mono text-foreground">{fetchUrl}</code>
            </div>
          )}

          {error && <div className="text-sm text-destructive">{error}</div>}

          <div className="space-y-4 border-t border-border/60 pt-6">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-medium text-foreground">Results</div>
              <Badge variant="secondary">{rows.length}</Badge>
            </div>

            {rows.length === 0 ? (
              <div className="text-sm text-muted-foreground">No refund requests loaded.</div>
            ) : (
              <div className="divide-y divide-border/60">
                {rows.map((r) => {
                  const poolStatus = r?.metadata?.poolStatus || r?.metadata?.pool_status;
                  return (
                    <div key={r._id} className="space-y-2 py-4 first:pt-0 last:pb-0">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="font-mono text-xs text-foreground">{r._id}</div>
                        <div className="flex gap-2 items-center">
                          {poolStatus ? <Badge>{String(poolStatus)}</Badge> : <Badge variant="secondary">{r.status || "UNKNOWN"}</Badge>}
                        </div>
                      </div>
                      <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-3">
                        <div>
                          Buyer: <span className="font-mono text-foreground">{r.plaintiff || "unknown"}</span>
                        </div>
                        <div>
                          Merchant: <span className="font-mono text-foreground">{r.defendant || "unknown"}</span>
                        </div>
                        <div>
                          Amount:{" "}
                          <span className="text-foreground">
                            {typeof r.amount === "number" ? r.amount : "n/a"} {r.currency || ""}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

