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

const API_BASE = "https://api.x402disputes.com";

const BASE_CAIP10_RE = /^eip155:8453:0x[a-fA-F0-9]{40}$/;
const BASE_TX_RE = /^0x[a-fA-F0-9]{64}$/;

function parseEvidenceLinks(s: string): string[] {
  return s
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

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
    merchant: z.string().min(5, "Required"),
    merchantApiUrl: z.string().url("Must be a valid URL"),
    txHash: z.string().min(10, "Required"),
    description: z.string().min(10, "Min 10 chars").max(500, "Max 500 chars"),
    evidenceLinks: z.string().default(""),

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
    if (!BASE_CAIP10_RE.test(v.merchant.trim())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["merchant"],
        message: "Merchant must be Base CAIP-10: eip155:8453:0x<40hex>",
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
  const [fileResult, setFileResult] = useState<{ caseId: string; trackingUrl: string } | null>(null);
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
      merchant: "",
      merchantApiUrl: "",
      txHash: "",
      description: "",
      evidenceLinks: "",

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
      const evidenceLinks = parseEvidenceLinks(values.evidenceLinks ?? "");
      const evidenceUrls = [...uploadedEvidenceUrls, ...evidenceLinks];

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
          merchant: values.merchant,
          merchantApiUrl: values.merchantApiUrl,
          txHash: values.txHash,
          description: values.description,
          evidenceUrls,
          ...(request ? { request } : {}),
          ...(response ? { response } : {}),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        throw new Error(data?.message || data?.error?.message || `Failed (${res.status})`);
      }
      setFileResult({ caseId: String(data.caseId), trackingUrl: String(data.trackingUrl) });
    } catch (e: unknown) {
      setApiError(e instanceof Error ? e.message : String(e));
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
        const up = await fetch(`${API_BASE}/v1/evidence/upload`, {
          method: "POST",
          headers: { "Content-Type": f.type || "application/octet-stream" },
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

        {apiError ? (
          <Alert variant="destructive">
            <AlertTitle>Request failed</AlertTitle>
            <AlertDescription>{apiError}</AlertDescription>
          </Alert>
        ) : null}

        {fileResult?.caseId ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between gap-2">
                <span>Dispute filed</span>
                <Badge>Success</Badge>
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

        <form className="space-y-6" onSubmit={submitDispute}>
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="merchant">Merchant (CAIP-10)</Label>
                <Input id="merchant" placeholder="eip155:8453:0x..." {...register("merchant")} />
                {errors.merchant ? <div className="text-xs text-destructive">{errors.merchant.message}</div> : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="merchantApiUrl">Merchant API URL (https)</Label>
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
              <CardTitle>Evidence (optional)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Upload files</Label>
                <Input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={(e) => void uploadEvidenceFiles(e.target.files)}
                  disabled={uploading || submitting || formSubmitting}
                />
                <div className="text-xs text-muted-foreground">Max 10MB per file. Stored as evidence URLs.</div>
              </div>

              {uploadedEvidenceUrls.length > 0 ? (
                <div className="space-y-2">
                  <div className="text-sm font-medium">Uploaded</div>
                  <JsonPreview value={uploadedEvidenceUrls} />
                  <Button type="button" variant="outline" onClick={() => setUploadedEvidenceUrls([])}>
                    Clear uploads
                  </Button>
                </div>
              ) : null}

              <div className="space-y-2">
                <Label htmlFor="evidenceLinks">Evidence links (one per line)</Label>
                <Textarea id="evidenceLinks" placeholder="https://…\nhttps://…" {...register("evidenceLinks")} />
              </div>
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
      </main>

      <Footer />
    </div>
  );
}

