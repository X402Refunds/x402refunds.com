"use client";

import { useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { baseAddressToCaip10 } from "@/lib/caip10";

const API_BASE = "https://api.x402disputes.com";

const BASE_EVM_ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/;
const BASE_TX_RE = /^0x[a-fA-F0-9]{64}$/;

function parseJsonOrThrow(label: string, s: string | undefined) {
  const t = (s || "").trim();
  if (!t) return undefined;
  try {
    return JSON.parse(t) as unknown;
  } catch {
    throw new Error(`${label} must be valid JSON`);
  }
}

const formSchema = z
  .object({
    merchantAddress: z.string().min(5, "Required"),
    merchantApiUrl: z.string().url("Must be a valid URL"),
    txHash: z.string().min(10, "Required"),
    description: z.string().min(10, "Min 10 chars").max(500, "Max 500 chars"),

    // Advanced (optional)
    requestMethod: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]).default("POST"),
    requestHeadersJson: z.string().default(""),
    requestBodyJson: z.string().default(""),
    responseStatus: z.coerce.number().int().min(100).max(999).optional(),
    responseHeadersJson: z.string().default(""),
    responseBodyJson: z.string().default(""),
  })
  .superRefine((v, ctx) => {
    // Base only (for now)
    if (!BASE_EVM_ADDRESS_RE.test(v.merchantAddress.trim())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["merchantAddress"],
        message: "Merchant address must be a Base address: 0x + 40 hex chars",
      });
    }
    if (!BASE_TX_RE.test(v.txHash.trim())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["txHash"],
        message: "Base tx hash must be 0x + 64 hex chars",
      });
    }

    // Require https merchantApiUrl
    try {
      const u = new URL(v.merchantApiUrl.trim());
      if (u.protocol !== "https:") throw new Error("merchantApiUrl must be https://");
    } catch {
      try {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["merchantApiUrl"],
          message: "merchantApiUrl must be a valid https:// URL",
        });
      } catch {
        // no-op
      }
    }

    for (const [field, label] of [
      ["requestHeadersJson", "Request headers"],
      ["requestBodyJson", "Request body"],
      ["responseHeadersJson", "Response headers"],
      ["responseBodyJson", "Response body"],
    ] as const) {
      const raw = v[field];
      if (!raw?.trim()) continue;
      try {
        JSON.parse(raw);
      } catch {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [field],
          message: `${label} must be valid JSON`,
        });
      }
    }
  });

type FormInput = z.input<typeof formSchema>;

function JsonPreview({ value }: { value: unknown }) {
  const s = useMemo(() => JSON.stringify(value, null, 2), [value]);
  return (
    <pre className="overflow-x-auto rounded-md border border-border bg-muted/20 p-3 text-xs leading-5">
      <code className="font-mono">{s}</code>
    </pre>
  );
}

export default function FileDisputePage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedEvidenceUrls, setUploadedEvidenceUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [fileResult, setFileResult] = useState<{ caseId: string; trackingUrl: string; created?: boolean; duplicate?: boolean } | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting: formSubmitting },
  } = useForm<FormInput>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      merchantAddress: "",
      merchantApiUrl: "",
      txHash: "",
      description: "",

      requestMethod: "POST",
      requestHeadersJson: "",
      requestBodyJson: "",
      responseStatus: undefined,
      responseHeadersJson: "",
      responseBodyJson: "",
    },
  });

  const submitDispute = handleSubmit(async (values) => {
    setApiError(null);
    setFileResult(null);
    setSubmitting(true);
    try {
      const merchantAddress = values.merchantAddress.trim();
      const merchant = baseAddressToCaip10(merchantAddress);
      const evidenceUrls = [...uploadedEvidenceUrls];

      const requestHeaders = parseJsonOrThrow("Request headers", values.requestHeadersJson);
      const requestBody = parseJsonOrThrow("Request body", values.requestBodyJson);
      const responseHeaders = parseJsonOrThrow("Response headers", values.responseHeadersJson);
      const responseBody = parseJsonOrThrow("Response body", values.responseBodyJson);

      const request =
        advancedOpen || requestHeaders || requestBody
          ? {
              method: values.requestMethod,
              url: values.merchantApiUrl,
              headers: requestHeaders ?? {},
              body: requestBody ?? {},
            }
          : undefined;

      const response =
        advancedOpen || values.responseStatus || responseHeaders || responseBody
          ? {
              status: values.responseStatus ?? 500,
              headers: responseHeaders ?? {},
              body: responseBody ?? {},
            }
          : undefined;

      const res = await fetch(`${API_BASE}/v1/disputes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          merchant,
          merchantApiUrl: values.merchantApiUrl,
          txHash: values.txHash,
          description: values.description,
          evidenceUrls,
          ...(request ? { request } : {}),
          ...(response ? { response } : {}),
        }),
      });
      const raw = await res.text().catch(() => "");
      let data: unknown = null;
      try {
        data = raw ? (JSON.parse(raw) as unknown) : null;
      } catch {
        data = null;
      }

      const obj =
        data && typeof data === "object" ? (data as Record<string, unknown>) : null;
      const ok = obj?.ok === true;

      if (!res.ok || !ok) {
        const msgFromTopLevel =
          typeof obj?.message === "string" ? obj.message : null;
        const err = obj?.error;
        const msgFromError =
          err && typeof err === "object" && typeof (err as Record<string, unknown>).message === "string"
            ? String((err as Record<string, unknown>).message)
            : null;
        const msg = msgFromTopLevel || msgFromError || raw || `Failed (${res.status})`;
        throw new Error(msg);
      }

      setFileResult({
        caseId: String(obj?.caseId || ""),
        trackingUrl: String(obj?.trackingUrl || ""),
        created: obj?.created === true,
        duplicate: obj?.duplicate === true,
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setApiError(
        msg === "Failed to fetch"
          ? "Network error. If you received an email, the dispute may have been filed already. Check your inbox/spam and avoid filing duplicates."
          : msg,
      );
    } finally {
      setSubmitting(false);
    }
  });

  const uploadEvidenceFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setApiError(null);
    setUploading(true);
    try {
      const urls: string[] = [];
      for (const f of Array.from(files)) {
        if (f.size > 10 * 1024 * 1024) throw new Error("Image too large (max 10MB)");
        const type = (f.type || "").toLowerCase();
        if (type !== "image/png" && type !== "image/jpeg") {
          throw new Error("Only PNG or JPG images are supported");
        }

        const up = await fetch(`${API_BASE}/v1/evidence/upload`, {
          method: "POST",
          headers: { "Content-Type": type },
          body: f,
        });
        const out = await up.json().catch(() => ({}));
        if (!up.ok || !out?.ok) throw new Error(out?.message || `Upload failed (${up.status})`);
        urls.push(String(out.url));
      }
      setUploadedEvidenceUrls((prev) => [...prev, ...urls]);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (e: unknown) {
      setApiError(e instanceof Error ? e.message : String(e));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation currentPage="home" />

      <main className="mx-auto max-w-4xl px-4 py-10 space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-foreground">File a Dispute</h1>
          <p className="text-sm text-muted-foreground">Base only (USDC). One submission.</p>
        </div>

        {fileResult?.caseId ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between gap-2">
                <span>{fileResult.created === false ? "Already filed" : "Dispute filed"}</span>
                <Badge>{fileResult.created === false ? "Existing" : "Success"}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm text-muted-foreground">
                Case ID: <code className="font-mono text-foreground">{fileResult.caseId}</code>
              </div>
              {fileResult.trackingUrl ? (
                <div className="text-sm">
                  Tracking:{" "}
                  <a className="underline underline-offset-4" href={fileResult.trackingUrl}>
                    {fileResult.trackingUrl}
                  </a>
                </div>
              ) : null}
              <div className="flex flex-col sm:flex-row gap-2">
                {fileResult.trackingUrl ? (
                  <Button onClick={() => window.open(fileResult.trackingUrl as string, "_self")}>Open case</Button>
                ) : null}
                <Button
                  variant="outline"
                  onClick={() => {
                    reset();
                    setFileResult(null);
                    setApiError(null);
                    setUploadedEvidenceUrls([]);
                  }}
                >
                  File another
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {fileResult?.caseId ? null : (
        <form className="space-y-6" onSubmit={submitDispute}>
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="merchantAddress">Merchant wallet address</Label>
                <div className="text-xs text-muted-foreground">Blockchain: Base</div>
                <Input id="merchantAddress" placeholder="0x..." {...register("merchantAddress")} />
                {errors.merchantAddress ? <div className="text-xs text-destructive">{errors.merchantAddress.message}</div> : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="merchantApiUrl">API URL you paid for</Label>
                <div className="text-xs text-muted-foreground">Paste the exact URL you called when the payment happened.</div>
                <Input id="merchantApiUrl" placeholder="https://api.merchant.com/v1/..." {...register("merchantApiUrl")} />
                {errors.merchantApiUrl ? <div className="text-xs text-destructive">{errors.merchantApiUrl.message}</div> : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="txHash">Transaction hash</Label>
                <Input id="txHash" placeholder="0x... (Base tx hash)" {...register("txHash")} />
                {errors.txHash ? <div className="text-xs text-destructive">{errors.txHash.message}</div> : null}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Reasoning</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Label htmlFor="description">What happened?</Label>
              <Textarea id="description" placeholder="What you expected vs what happened (10–500 chars)" {...register("description")} />
              {errors.description ? <div className="text-xs text-destructive">{errors.description.message}</div> : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Provide Evidence (optional)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <input
                ref={fileInputRef}
                className="hidden"
                type="file"
                accept="image/png,image/jpeg"
                multiple
                onChange={(e) => void uploadEvidenceFiles(e.target.files)}
                disabled={uploading || submitting || formSubmitting}
              />

              <button
                type="button"
                disabled={uploading || submitting || formSubmitting}
                onClick={() => fileInputRef.current?.click()}
                className="w-full rounded-lg border-2 border-dashed border-border bg-card/30 px-6 py-10 text-center transition-colors hover:bg-muted/30 disabled:opacity-60"
              >
                <div className="mx-auto flex max-w-sm flex-col items-center gap-2">
                  <div className="text-sm font-medium text-foreground">Click to upload</div>
                  <div className="text-xs text-muted-foreground">PNG, JPG up to 10MB</div>
                </div>
              </button>

              {uploadedEvidenceUrls.length > 0 ? (
                <div className="space-y-2">
                  <div className="text-sm font-medium">Uploaded</div>
                  <JsonPreview value={uploadedEvidenceUrls} />
                  <Button type="button" variant="outline" onClick={() => setUploadedEvidenceUrls([])}>
                    Clear uploads
                  </Button>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between gap-3">
                <span>Advanced (optional)</span>
                <Button type="button" variant="ghost" onClick={() => setAdvancedOpen((v) => !v)}>
                  {advancedOpen ? "Hide" : "Show"}
                </Button>
              </CardTitle>
            </CardHeader>
            {advancedOpen ? (
              <CardContent className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  The API does <span className="font-medium text-foreground">not require</span> request/response for this form,
                  but providing them can strengthen the evidence.
                </div>

                <div className="space-y-2">
                  <Label>Request method</Label>
                  <Input placeholder="POST" {...register("requestMethod")} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="requestHeadersJson">Request headers (JSON)</Label>
                  <Textarea id="requestHeadersJson" className="font-mono" placeholder="{ }" {...register("requestHeadersJson")} />
                  {errors.requestHeadersJson ? (
                    <div className="text-xs text-destructive">{errors.requestHeadersJson.message}</div>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="requestBodyJson">Request body (JSON)</Label>
                  <Textarea id="requestBodyJson" className="font-mono" placeholder="{ }" {...register("requestBodyJson")} />
                  {errors.requestBodyJson ? (
                    <div className="text-xs text-destructive">{errors.requestBodyJson.message}</div>
                  ) : null}
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="responseStatus">Response status (optional)</Label>
                  <Input id="responseStatus" type="number" placeholder="500" {...register("responseStatus")} />
                  {errors.responseStatus ? (
                    <div className="text-xs text-destructive">{errors.responseStatus.message}</div>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="responseHeadersJson">Response headers (JSON)</Label>
                  <Textarea id="responseHeadersJson" className="font-mono" placeholder="{ }" {...register("responseHeadersJson")} />
                  {errors.responseHeadersJson ? (
                    <div className="text-xs text-destructive">{errors.responseHeadersJson.message}</div>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="responseBodyJson">Response body (JSON)</Label>
                  <Textarea id="responseBodyJson" className="font-mono" placeholder="{ }" {...register("responseBodyJson")} />
                  {errors.responseBodyJson ? (
                    <div className="text-xs text-destructive">{errors.responseBodyJson.message}</div>
                  ) : null}
                </div>
              </CardContent>
            ) : null}
          </Card>

          <Separator />

          {apiError ? (
            <Alert variant="destructive">
              <AlertTitle>Request failed</AlertTitle>
              <AlertDescription>{apiError}</AlertDescription>
            </Alert>
          ) : null}

          <div className="flex flex-col sm:flex-row gap-2">
            <Button type="submit" disabled={uploading || submitting || formSubmitting}>
              {submitting ? "Filing…" : "File dispute"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                reset();
                setFileResult(null);
                setApiError(null);
                setUploadedEvidenceUrls([]);
                setAdvancedOpen(false);
              }}
              disabled={uploading || submitting || formSubmitting}
            >
              Reset
            </Button>
          </div>

          <div className="text-xs text-muted-foreground">
            Note: Filing is permissionless. We’ll attach any uploaded evidence as URLs on the case.
          </div>
        </form>
        )}
      </main>

      <Footer />
    </div>
  );
}

