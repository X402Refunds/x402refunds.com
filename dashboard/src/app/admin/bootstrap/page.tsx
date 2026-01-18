"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CopyableField } from "@/components/case-detail/CopyableField";

type CreateOrganizationResponse =
  | { ok: true; organizationId: string; apiKeys: { production: string; development: string } }
  | { ok: false; error: { message?: string } };

type GrantCreditsResponse =
  | { ok: true }
  | { ok: false; error: { message?: string } };

export default function AdminBootstrapPage() {
  const [adminToken, setAdminToken] = useState("");

  const [orgName, setOrgName] = useState("");
  const [orgDomain, setOrgDomain] = useState("");
  const [billingEmail, setBillingEmail] = useState("");
  const [initialCreditUsdc, setInitialCreditUsdc] = useState<string>("25");

  const [createStatus, setCreateStatus] = useState<"idle" | "working" | "done" | "error">("idle");
  const [createErr, setCreateErr] = useState<string | null>(null);
  const [createOut, setCreateOut] = useState<CreateOrganizationResponse | null>(null);

  const createdOrgId = useMemo(() => {
    if (!createOut || !createOut.ok) return null;
    return createOut.organizationId;
  }, [createOut]);
  const createdProdKey = useMemo(() => {
    if (!createOut || !createOut.ok) return null;
    return createOut.apiKeys.production;
  }, [createOut]);
  const createdDevKey = useMemo(() => {
    if (!createOut || !createOut.ok) return null;
    return createOut.apiKeys.development;
  }, [createOut]);

  const [grantOrgId, setGrantOrgId] = useState("");
  const [grantAmountUsdc, setGrantAmountUsdc] = useState<string>("10");
  const [grantNote, setGrantNote] = useState<string>("manual admin grant");
  const [grantStatus, setGrantStatus] = useState<"idle" | "working" | "done" | "error">("idle");
  const [grantErr, setGrantErr] = useState<string | null>(null);

  async function createOrg() {
    setCreateStatus("working");
    setCreateErr(null);
    setCreateOut(null);

    try {
      const initial =
        initialCreditUsdc.trim() === "" ? undefined : Number(initialCreditUsdc);
      if (initialCreditUsdc.trim() !== "" && (!Number.isFinite(initial!) || initial! <= 0)) {
        throw new Error("initialCreditUsdc must be a positive number (or blank)");
      }

      const res = await fetch("/api/admin/create-organization", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminToken,
          name: orgName,
          domain: orgDomain || undefined,
          billingEmail: billingEmail || undefined,
          initialCreditUsdc: initial,
        }),
      });

      const data = (await res.json().catch(() => ({}))) as CreateOrganizationResponse;
      if (!res.ok || !data.ok) {
        const msg =
          data && typeof data === "object" && "error" in data
            ? ((data as unknown as { error?: { message?: string } }).error?.message ?? "")
            : "";
        throw new Error(msg || `Failed (${res.status})`);
      }

      setCreateOut(data);
      setCreateStatus("done");

      // Convenience: seed the grant form with the created org.
      setGrantOrgId(data.organizationId);
    } catch (e: unknown) {
      setCreateStatus("error");
      setCreateErr(e instanceof Error ? e.message : String(e));
    }
  }

  async function grantCredits() {
    setGrantStatus("working");
    setGrantErr(null);
    try {
      const amount = Number(grantAmountUsdc);
      if (!grantOrgId.trim()) throw new Error("organizationId is required");
      if (!Number.isFinite(amount) || amount <= 0) throw new Error("amountUsdc must be > 0");

      const res = await fetch("/api/admin/grant-organization-credits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminToken,
          organizationId: grantOrgId.trim(),
          amountUsdc: amount,
          note: grantNote || undefined,
        }),
      });

      const data = (await res.json().catch(() => ({}))) as GrantCreditsResponse;
      if (!res.ok || !data.ok) {
        const msg =
          data && typeof data === "object" && "error" in data
            ? ((data as unknown as { error?: { message?: string } }).error?.message ?? "")
            : "";
        throw new Error(msg || `Failed (${res.status})`);
      }

      setGrantStatus("done");
    } catch (e: unknown) {
      setGrantStatus("error");
      setGrantErr(e instanceof Error ? e.message : String(e));
    }
  }

  const createBadge =
    createStatus === "done" ? "default" : createStatus === "error" ? "destructive" : "secondary";
  const grantBadge =
    grantStatus === "done" ? "default" : grantStatus === "error" ? "destructive" : "secondary";

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-foreground">Admin bootstrap</h1>
        <p className="text-sm text-muted-foreground">
          Create organizations and grant refund credits without Clerk sign-in.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Admin token</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Label htmlFor="token">ADMIN_SETUP_TOKEN</Label>
          <Input
            id="token"
            type="password"
            value={adminToken}
            onChange={(e) => setAdminToken(e.target.value)}
            placeholder="paste token"
            autoComplete="off"
          />
          <div className="text-xs text-muted-foreground">
            This must match <code className="font-mono">ADMIN_SETUP_TOKEN</code> configured in both Convex and the dashboard runtime.
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Create organization</CardTitle>
          <Badge variant={createBadge}>
            {createStatus === "idle" ? "Ready" : createStatus === "working" ? "Working" : createStatus === "done" ? "Done" : "Error"}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="orgName">Name</Label>
              <Input id="orgName" value={orgName} onChange={(e) => setOrgName(e.target.value)} placeholder="Acme Inc" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="orgDomain">Domain (optional)</Label>
              <Input id="orgDomain" value={orgDomain} onChange={(e) => setOrgDomain(e.target.value)} placeholder="acme.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="billingEmail">Billing email (optional)</Label>
              <Input
                id="billingEmail"
                value={billingEmail}
                onChange={(e) => setBillingEmail(e.target.value)}
                placeholder="billing@acme.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="initial">Initial credits (USDC)</Label>
              <Input
                id="initial"
                value={initialCreditUsdc}
                onChange={(e) => setInitialCreditUsdc(e.target.value)}
                placeholder="25"
              />
            </div>
          </div>

          <Button disabled={createStatus === "working"} onClick={createOrg}>
            Create org
          </Button>

          {createErr && <div className="text-sm text-destructive">{createErr}</div>}

          {(createdOrgId || createdProdKey || createdDevKey) && (
            <div className="space-y-3 rounded-lg border border-border bg-card p-4">
              {createdOrgId && (
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Organization ID</div>
                  <CopyableField value={createdOrgId} truncate={false} label="Copied organization ID" />
                </div>
              )}
              {createdProdKey && (
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Production API key</div>
                  <CopyableField value={createdProdKey} truncate={false} label="Copied production key" />
                </div>
              )}
              {createdDevKey && (
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Development API key</div>
                  <CopyableField value={createdDevKey} truncate={false} label="Copied development key" />
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Grant refund credits (off-chain)</CardTitle>
          <Badge variant={grantBadge}>
            {grantStatus === "idle" ? "Ready" : grantStatus === "working" ? "Working" : grantStatus === "done" ? "Done" : "Error"}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="grantOrg">Organization ID</Label>
            <Input
              id="grantOrg"
              value={grantOrgId}
              onChange={(e) => setGrantOrgId(e.target.value)}
              placeholder={createdOrgId || "k123..."}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="grantAmount">Amount (USDC)</Label>
              <Input id="grantAmount" value={grantAmountUsdc} onChange={(e) => setGrantAmountUsdc(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="grantNote">Note (optional)</Label>
              <Input id="grantNote" value={grantNote} onChange={(e) => setGrantNote(e.target.value)} />
            </div>
          </div>

          <Button disabled={grantStatus === "working"} onClick={grantCredits}>
            Grant credits
          </Button>

          {grantErr && <div className="text-sm text-destructive">{grantErr}</div>}
          {grantStatus === "done" && <div className="text-sm text-muted-foreground">Granted.</div>}
        </CardContent>
      </Card>
    </div>
  );
}

