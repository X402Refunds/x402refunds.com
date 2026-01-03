"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CopyableField } from "@/components/case-detail/CopyableField";
import { normalizeMerchantToCaip10Base } from "@/lib/caip10";

const API_BASE = "https://api.x402disputes.com";

type DisputeRow = {
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
  const [rows, setRows] = useState<DisputeRow[]>([]);

  const merchantNormalized = useMemo(() => normalizeMerchantToCaip10Base(merchant), [merchant]);
  const merchantCaip10 = merchantNormalized.caip10;

  const fetchUrl = useMemo(() => {
    const m = merchantCaip10?.trim() ?? "";
    if (!m) return null;
    return `${API_BASE}/v1/disputes?merchant=${encodeURIComponent(m)}&limit=50`;
  }, [merchantCaip10]);

  useEffect(() => {
    setRows([]);
    setError(null);
  }, [merchant]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-foreground">Disputes</h1>
        <p className="text-sm text-muted-foreground">
          Public dispute registry. Search by merchant wallet address (defaults to Base).
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
              placeholder="0x..."
              value={merchant}
              onChange={(e) => setMerchant(e.target.value)}
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
                try {
                  const res = await fetch(fetchUrl, { method: "GET" });
                  const data = await res.json().catch(() => ({}));
                  if (!res.ok || !data?.ok) {
                    throw new Error(data?.message || `Failed: ${res.status}`);
                  }
                  setRows(Array.isArray(data.disputes) ? data.disputes : []);
                } catch (e: unknown) {
                  setError(e instanceof Error ? e.message : String(e));
                } finally {
                  setLoading(false);
                }
              }}
            >
              {loading ? "Loading…" : "Fetch disputes"}
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
            <CopyableField value={fetchUrl} label="API" truncate={false} />
          )}

          {error && <div className="text-sm text-destructive">{error}</div>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Results</CardTitle>
          <Badge variant="secondary">{rows.length}</Badge>
        </CardHeader>
        <CardContent className="space-y-3">
          {rows.length === 0 ? (
            <div className="text-sm text-muted-foreground">No disputes loaded.</div>
          ) : (
            <div className="space-y-2">
              {rows.map((r) => {
                const poolStatus = r?.metadata?.poolStatus || r?.metadata?.pool_status;
                return (
                  <div key={r._id} className="rounded-lg border border-border bg-card p-4 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="font-mono text-xs">{r._id}</div>
                      <div className="flex gap-2 items-center">
                        {poolStatus ? <Badge>{String(poolStatus)}</Badge> : <Badge variant="secondary">{r.status || "UNKNOWN"}</Badge>}
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Buyer: <span className="font-mono text-foreground">{r.plaintiff || "unknown"}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Merchant: <span className="font-mono text-foreground">{r.defendant || "unknown"}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Amount: <span className="text-foreground">{typeof r.amount === "number" ? r.amount : "n/a"} {r.currency || ""}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

