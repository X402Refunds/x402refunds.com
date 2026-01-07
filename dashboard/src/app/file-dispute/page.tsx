"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useWatch } from "react-hook-form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";

const MCP_INVOKE_URL = "https://api.x402disputes.com/mcp/invoke";

const SOLANA_BASE58_RE = /^[1-9A-HJ-NP-Za-km-z]+$/;

function isLikelySolanaAddress(s: string) {
  const t = s.trim();
  // Typical Solana pubkeys are 32 bytes => 43-44 base58 chars, but keep it a bit looser.
  return SOLANA_BASE58_RE.test(t) && t.length >= 32 && t.length <= 64;
}

function parseJsonOrThrow(label: string, s: string) {
  const t = s.trim();
  if (!t) return {};
  try {
    return JSON.parse(t);
  } catch {
    throw new Error(`${label} must be valid JSON`);
  }
}

const formSchema = z
  .object({
    description: z.string().min(10, "Min 10 chars").max(500, "Max 500 chars"),
    blockchain: z.enum(["base", "solana"]),
    transactionHash: z.string().min(5, "Required"),
    recipientAddress: z.string().min(5, "Required"),

    requestMethod: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]),
    requestUrl: z.string().url("Must be a valid URL"),
    requestHeadersJson: z.string().default(""),
    requestBodyJson: z.string().default(""),

    responseStatus: z.coerce.number().int().min(100).max(999),
    responseHeadersJson: z.string().default(""),
    responseBodyJson: z.string().default(""),

    // Advanced
    sellerXSignature: z.string().default(""),
    callbackUrl: z.string().default(""),
    merchantOrigin: z.string().default(""),
    merchantX402MetadataUrl: z.string().default(""),
    sourceTransferLogIndex: z.string().default(""),
  })
  .superRefine((v, ctx) => {
    if (v.blockchain === "base") {
      const txOk = /^0x[a-fA-F0-9]{64}$/.test(v.transactionHash.trim());
      if (!txOk) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["transactionHash"],
          message: "Base tx hash must be 0x + 64 hex chars",
        });
      }
      const recipientOk = /^0x[a-fA-F0-9]{40}$/.test(v.recipientAddress.trim());
      if (!recipientOk) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["recipientAddress"],
          message: "Base recipientAddress must be a 0x... EVM address (40 hex chars)",
        });
      }
    } else {
      if (!isLikelySolanaAddress(v.transactionHash)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["transactionHash"],
          message: "Solana tx hash must be base58",
        });
      }
      if (!isLikelySolanaAddress(v.recipientAddress)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["recipientAddress"],
          message: "Solana recipientAddress must be base58",
        });
      }
    }

    if (v.callbackUrl?.trim()) {
      try {
        const u = new URL(v.callbackUrl.trim());
        if (u.protocol !== "https:") throw new Error("callbackUrl must be https://");
      } catch {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["callbackUrl"],
          message: "callbackUrl must be a valid https:// URL",
        });
      }
    }

    if (v.merchantOrigin?.trim()) {
      try {
        const u = new URL(v.merchantOrigin.trim());
        if (u.protocol !== "https:") throw new Error("merchantOrigin must be https://");
      } catch {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["merchantOrigin"],
          message: "merchantOrigin must be a valid https:// origin",
        });
      }
    }

    if (v.merchantX402MetadataUrl?.trim()) {
      try {
        const u = new URL(v.merchantX402MetadataUrl.trim());
        if (u.protocol !== "https:") throw new Error("merchantX402MetadataUrl must be https://");
      } catch {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["merchantX402MetadataUrl"],
          message: "merchantX402MetadataUrl must be a valid https:// URL",
        });
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

    if (v.sourceTransferLogIndex?.trim() && !/^\d+$/.test(v.sourceTransferLogIndex.trim())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["sourceTransferLogIndex"],
        message: "sourceTransferLogIndex must be a non-negative integer",
      });
    }
  });

type FormInput = z.input<typeof formSchema>;
type FormValues = z.output<typeof formSchema>;

type InvokeOk = {
  success: true;
  dryRun?: boolean;
  caseId?: string;
  trackingUrl?: string;
  paymentDisputeId?: string;
  status?: string;
  estimatedResolutionTime?: string;
  humanReviewRequired?: boolean;
  disputeFee?: number;
  wouldExecute?: unknown;
  validations?: unknown;
  blockchainExtraction?: unknown;
  evidenceStrength?: string;
  nextSteps?: unknown;
};

type InvokeErr = {
  success: false;
  error?: { code?: string; message?: string; field?: string; [k: string]: unknown };
};

function buildToolParams(values: FormInput, dryRun: boolean) {
  const request = {
    method: values.requestMethod,
    url: values.requestUrl,
    headers: parseJsonOrThrow("Request headers", values.requestHeadersJson ?? ""),
    body: parseJsonOrThrow("Request body", values.requestBodyJson ?? ""),
  };
  const response = {
    status: values.responseStatus,
    headers: parseJsonOrThrow("Response headers", values.responseHeadersJson ?? ""),
    body: parseJsonOrThrow("Response body", values.responseBodyJson ?? ""),
  };

  const params: Record<string, unknown> = {
    description: (values.description ?? "").trim(),
    blockchain: values.blockchain,
    transactionHash: (values.transactionHash ?? "").trim(),
    recipientAddress: (values.recipientAddress ?? "").trim(),
    request,
    response,
    dryRun,
  };

  if (values.sellerXSignature?.trim()) params.sellerXSignature = values.sellerXSignature.trim();
  if (values.callbackUrl?.trim()) params.callbackUrl = values.callbackUrl.trim();
  if (values.merchantOrigin?.trim()) params.merchantOrigin = values.merchantOrigin.trim();
  if (values.merchantX402MetadataUrl?.trim()) params.merchantX402MetadataUrl = values.merchantX402MetadataUrl.trim();
  if (values.sourceTransferLogIndex?.trim()) params.sourceTransferLogIndex = values.sourceTransferLogIndex.trim();

  return params;
}

async function invokeX402FileDispute(parameters: Record<string, unknown>) {
  const res = await fetch(MCP_INVOKE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tool: "x402_file_dispute", parameters }),
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const msg =
      (data && typeof data === "object" && "error" in data && typeof (data as { error?: unknown }).error === "object" && (data as { error?: { message?: unknown } }).error?.message) ||
      (data && typeof data === "object" && "error" in data && (data as { error?: unknown }).error) ||
      `Request failed (${res.status})`;
    throw new Error(typeof msg === "string" ? msg : `Request failed (${res.status})`);
  }
  return data as InvokeOk | InvokeErr;
}

function JsonPreview({ value }: { value: unknown }) {
  const s = useMemo(() => JSON.stringify(value, null, 2), [value]);
  return (
    <pre className="overflow-x-auto rounded-md border border-border bg-muted/20 p-3 text-xs leading-5">
      <code className="font-mono">{s}</code>
    </pre>
  );
}

export default function FileDisputePage() {
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [dryRun, setDryRun] = useState<InvokeOk | null>(null);
  const [dryRunFingerprint, setDryRunFingerprint] = useState<string | null>(null);
  const [fileResult, setFileResult] = useState<InvokeOk | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [validating, setValidating] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    control,
    formState: { errors, isSubmitting: formSubmitting },
  } = useForm<FormInput>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: "",
      blockchain: "base",
      transactionHash: "",
      recipientAddress: "",
      requestMethod: "POST",
      requestUrl: "",
      requestHeadersJson: "{\n  \"Content-Type\": \"application/json\"\n}",
      requestBodyJson: "{\n  \n}",
      responseStatus: 500,
      responseHeadersJson: "{\n  \"Content-Type\": \"application/json\"\n}",
      responseBodyJson: "{\n  \n}",
      sellerXSignature: "",
      callbackUrl: "",
      merchantOrigin: "",
      merchantX402MetadataUrl: "",
      sourceTransferLogIndex: "",
    },
  });

  const blockchain = watch("blockchain");
  const watchedValues = useWatch({ control });

  const currentFingerprint = useMemo(() => {
    try {
      const params = buildToolParams(watchedValues as FormInput, true);
      return JSON.stringify(params);
    } catch {
      return null;
    }
  }, [watchedValues]);

  const needsRevalidate = !!dryRunFingerprint && !!currentFingerprint && dryRunFingerprint !== currentFingerprint;

  const runDryRun = handleSubmit(async (values) => {
    setApiError(null);
    setFileResult(null);
    setDryRun(null);
    setValidating(true);
    try {
      const params = buildToolParams(values, true);
      const fp = JSON.stringify(params);
      const out = await invokeX402FileDispute(params);
      if (!out?.success) {
        setApiError(out?.error?.message || "Validation failed");
        return;
      }
      setDryRun(out);
      setDryRunFingerprint(fp);
    } catch (e: unknown) {
      setApiError(e instanceof Error ? e.message : String(e));
    } finally {
      setValidating(false);
    }
  });

  const submitDispute = handleSubmit(async (values) => {
    setApiError(null);
    setFileResult(null);
    setSubmitting(true);
    try {
      const params = buildToolParams(values, false);
      const fp = JSON.stringify({ ...params, dryRun: true });
      if (!dryRunFingerprint || dryRunFingerprint !== fp) {
        setApiError("Please run Validate (dry-run) again before filing.");
        return;
      }

      const out = await invokeX402FileDispute(params);
      if (!out?.success) {
        setApiError(out?.error?.message || "Filing failed");
        return;
      }
      setFileResult(out);
    } catch (e: unknown) {
      setApiError(e instanceof Error ? e.message : String(e));
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <div className="min-h-screen bg-background">
      <Navigation currentPage="home" />

      <main className="mx-auto max-w-4xl px-4 py-10 space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-foreground">File a Dispute (Humans only)</h1>
          <p className="text-sm text-muted-foreground">
            This page is designed for manual filing. LLMs and agent clients should use the API/MCP tool documented in{" "}
            <a href="/docs" className="underline underline-offset-4">
              /docs
            </a>
            .
          </p>
        </div>

        <Alert>
          <AlertTitle>Humans only</AlertTitle>
          <AlertDescription>
            Use this form if you are filing a dispute by hand. If you are an agent/LLM, integrate via MCP or HTTP from{" "}
            <a href="/docs" className="underline underline-offset-4">
              /docs
            </a>
            .
          </AlertDescription>
        </Alert>

        {apiError ? (
          <Alert variant="destructive">
            <AlertTitle>Request failed</AlertTitle>
            <AlertDescription>{apiError}</AlertDescription>
          </Alert>
        ) : null}

        {fileResult?.success && fileResult.caseId ? (
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
                    setDryRun(null);
                    setDryRunFingerprint(null);
                    setFileResult(null);
                    setApiError(null);
                  }}
                >
                  File another
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : null}

        <form
          className="space-y-6"
          onSubmit={(e) => {
            e.preventDefault();
          }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Transaction</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Blockchain</Label>
                  <Select
                    value={blockchain}
                    onValueChange={(v) => {
                      setValue("blockchain", v as FormValues["blockchain"], { shouldValidate: true });
                      setDryRun(null);
                      setDryRunFingerprint(null);
                      setFileResult(null);
                      setApiError(null);
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select chain" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="base">Base (USDC)</SelectItem>
                      <SelectItem value="solana">Solana (USDC)</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.blockchain ? <div className="text-xs text-destructive">{errors.blockchain.message}</div> : null}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="recipientAddress">Recipient address (merchant)</Label>
                  <Input id="recipientAddress" placeholder={blockchain === "base" ? "0x..." : "Solana base58..."} {...register("recipientAddress")} />
                  {errors.recipientAddress ? (
                    <div className="text-xs text-destructive">{errors.recipientAddress.message}</div>
                  ) : null}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="transactionHash">Transaction hash</Label>
                <Input
                  id="transactionHash"
                  placeholder={blockchain === "base" ? "0x... (66 chars)" : "Solana base58 signature..."}
                  {...register("transactionHash")}
                />
                {errors.transactionHash ? (
                  <div className="text-xs text-destructive">{errors.transactionHash.message}</div>
                ) : null}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>What went wrong</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" placeholder="What went wrong after payment was confirmed?" {...register("description")} />
              {errors.description ? <div className="text-xs text-destructive">{errors.description.message}</div> : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Request</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label>Method</Label>
                  <Select
                    value={watch("requestMethod")}
                    onValueChange={(v) => {
                      setValue("requestMethod", v as FormValues["requestMethod"], { shouldValidate: true });
                      setDryRun(null);
                      setDryRunFingerprint(null);
                      setFileResult(null);
                      setApiError(null);
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Method" />
                    </SelectTrigger>
                    <SelectContent>
                      {["GET", "POST", "PUT", "PATCH", "DELETE"].map((m) => (
                        <SelectItem key={m} value={m}>
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.requestMethod ? (
                    <div className="text-xs text-destructive">{errors.requestMethod.message}</div>
                  ) : null}
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="requestUrl">URL</Label>
                  <Input id="requestUrl" placeholder="https://api.merchant.com/v1/..." {...register("requestUrl")} />
                  {errors.requestUrl ? <div className="text-xs text-destructive">{errors.requestUrl.message}</div> : null}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="requestHeadersJson">Headers (JSON)</Label>
                  <Textarea id="requestHeadersJson" className="font-mono" {...register("requestHeadersJson")} />
                  {errors.requestHeadersJson ? (
                    <div className="text-xs text-destructive">{errors.requestHeadersJson.message}</div>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="requestBodyJson">Body (JSON)</Label>
                  <Textarea id="requestBodyJson" className="font-mono" {...register("requestBodyJson")} />
                  {errors.requestBodyJson ? (
                    <div className="text-xs text-destructive">{errors.requestBodyJson.message}</div>
                  ) : null}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Response</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="responseStatus">Status</Label>
                  <Input id="responseStatus" type="number" placeholder="500" {...register("responseStatus")} />
                  {errors.responseStatus ? (
                    <div className="text-xs text-destructive">{errors.responseStatus.message}</div>
                  ) : null}
                </div>
                <div className="sm:col-span-2 text-sm text-muted-foreground flex items-end">
                  Include the error response you received (headers + body). This is used as evidence.
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="responseHeadersJson">Headers (JSON)</Label>
                  <Textarea id="responseHeadersJson" className="font-mono" {...register("responseHeadersJson")} />
                  {errors.responseHeadersJson ? (
                    <div className="text-xs text-destructive">{errors.responseHeadersJson.message}</div>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="responseBodyJson">Body (JSON)</Label>
                  <Textarea id="responseBodyJson" className="font-mono" {...register("responseBodyJson")} />
                  {errors.responseBodyJson ? (
                    <div className="text-xs text-destructive">{errors.responseBodyJson.message}</div>
                  ) : null}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between gap-3">
                <span>Advanced (optional)</span>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setAdvancedOpen((v) => !v)}
                >
                  {advancedOpen ? "Hide" : "Show"}
                </Button>
              </CardTitle>
            </CardHeader>
            {advancedOpen ? (
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="sellerXSignature">Seller X-Signature (base64)</Label>
                    <Input id="sellerXSignature" placeholder="uHCzxGW7/..." {...register("sellerXSignature")} />
                    {errors.sellerXSignature ? (
                      <div className="text-xs text-destructive">{errors.sellerXSignature.message}</div>
                    ) : null}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="callbackUrl">Callback URL (https)</Label>
                    <Input id="callbackUrl" placeholder="https://..." {...register("callbackUrl")} />
                    {errors.callbackUrl ? (
                      <div className="text-xs text-destructive">{errors.callbackUrl.message}</div>
                    ) : null}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="merchantOrigin">Merchant origin override (https origin)</Label>
                    <Input id="merchantOrigin" placeholder="https://api.merchant.com" {...register("merchantOrigin")} />
                    {errors.merchantOrigin ? (
                      <div className="text-xs text-destructive">{errors.merchantOrigin.message}</div>
                    ) : null}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="merchantX402MetadataUrl">Merchant /.well-known/x402.json URL</Label>
                    <Input id="merchantX402MetadataUrl" placeholder="https://api.merchant.com/.well-known/x402.json" {...register("merchantX402MetadataUrl")} />
                    {errors.merchantX402MetadataUrl ? (
                      <div className="text-xs text-destructive">{errors.merchantX402MetadataUrl.message}</div>
                    ) : null}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sourceTransferLogIndex">sourceTransferLogIndex</Label>
                  <Input id="sourceTransferLogIndex" placeholder="0" {...register("sourceTransferLogIndex")} />
                  {errors.sourceTransferLogIndex ? (
                    <div className="text-xs text-destructive">{errors.sourceTransferLogIndex.message}</div>
                  ) : null}
                </div>
              </CardContent>
            ) : null}
          </Card>

          <Separator />

          {dryRun?.success ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between gap-2">
                  <span>Dry-run validation</span>
                  <Badge variant={needsRevalidate ? "destructive" : "secondary"}>
                    {needsRevalidate ? "Needs re-validate" : "Validated"}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {needsRevalidate ? (
                  <Alert variant="destructive">
                    <AlertTitle>Form changed</AlertTitle>
                    <AlertDescription>Run Validate again before filing.</AlertDescription>
                  </Alert>
                ) : null}

                {dryRun.validations ? (
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Checks</div>
                    <JsonPreview value={dryRun.validations} />
                  </div>
                ) : null}

                {dryRun.blockchainExtraction ? (
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Extracted from blockchain</div>
                    <JsonPreview value={dryRun.blockchainExtraction} />
                  </div>
                ) : null}

                {dryRun.wouldExecute ? (
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Would execute</div>
                    <JsonPreview value={dryRun.wouldExecute} />
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ) : null}

          <div className="flex flex-col sm:flex-row gap-2">
            <Button type="button" onClick={runDryRun} disabled={validating || submitting || formSubmitting}>
              {validating ? "Validating…" : "Validate (dry-run)"}
            </Button>
            <Button
              type="button"
              onClick={submitDispute}
              disabled={!dryRun?.success || needsRevalidate || validating || submitting || formSubmitting}
            >
              {submitting ? "Filing…" : "File dispute"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                reset();
                setDryRun(null);
                setDryRunFingerprint(null);
                setFileResult(null);
                setApiError(null);
              }}
              disabled={validating || submitting || formSubmitting}
            >
              Reset
            </Button>
          </div>

          <div className="text-xs text-muted-foreground">
            Note: The dispute filing endpoint is permissionless. Filing is free for the filer; the merchant pays the processing fee.
          </div>
        </form>
      </main>

      <Footer />
    </div>
  );
}

