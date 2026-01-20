"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Section, SectionHeading } from "@/components/layout";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";

const API_BASE = "https://api.x402refunds.com";

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
    <pre className="overflow-x-auto rounded-md border border-border bg-muted/30 p-3 text-xs leading-5">
      <code className="font-mono">{s}</code>
    </pre>
  );
}

export default function RequestRefundPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const didPrefill = useRef(false);
  const [uploadedEvidenceUrls, setUploadedEvidenceUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [fileResult, setFileResult] = useState<{ caseId: string; trackingUrl: string; created?: boolean; duplicate?: boolean } | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    getValues,
    control,
    watch,
    formState: { errors, isSubmitting: formSubmitting },
  } = useForm<FormInput>({
    resolver: zodResolver(formSchema),
    defaultValues: {
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

  const descriptionValue = watch("description") ?? "";
  const isBusy = uploading || submitting || formSubmitting;

  // Merchant-friendly deep link prefills:
  // /request-refund?sellerEndpointUrl=https://...&transactionHash=0x...
  // Also accepts merchantApiUrl/txHash aliases for convenience.
  useEffect(() => {
    if (didPrefill.current) return;
    didPrefill.current = true;
    try {
      const url = new URL(window.location.href);
      const sellerEndpointUrl =
        url.searchParams.get("sellerEndpointUrl") ||
        url.searchParams.get("merchantApiUrl") ||
        url.searchParams.get("url") ||
        "";
      const txHash =
        url.searchParams.get("transactionHash") ||
        url.searchParams.get("txHash") ||
        "";
      const description =
        url.searchParams.get("description") ||
        "";

      const current = getValues();
      reset({
        ...current,
        merchantApiUrl: current.merchantApiUrl?.trim() ? current.merchantApiUrl : sellerEndpointUrl,
        txHash: current.txHash?.trim() ? current.txHash : txHash,
        description: current.description?.trim() ? current.description : description,
      });
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submitRefundRequest = handleSubmit(async (values) => {
    setApiError(null);
    setFileResult(null);
    setSubmitting(true);
    try {
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

      const res = await fetch(`${API_BASE}/v1/refunds`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          blockchain: "base",
          transactionHash: values.txHash.trim(),
          sellerEndpointUrl: values.merchantApiUrl.trim(),
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

      const obj = data && typeof data === "object" ? (data as Record<string, unknown>) : null;
      const ok = obj?.ok === true;

      if (!res.ok || !ok) {
        const msgFromTopLevel = typeof obj?.message === "string" ? obj.message : null;
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
          ? "Network error. If you received an email, the refund request may have been filed already. Check your inbox/spam and avoid submitting duplicates."
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
    <div className="flex min-h-screen flex-col">
      <Navigation currentPage="home" />

      <main className="flex-1 bg-background">
        <Section spacing="tight" containerClassName="max-w-4xl">
          <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <SectionHeading
                title={
                  <span className="inline-flex items-center gap-3">
                    Request a refund
                    <Badge variant="secondary" className="hidden sm:inline-flex">Base (USDC)</Badge>
                  </span>
                }
                description={
                  <span>
                    Paste the exact paid API URL and your Base transaction hash. Please submit once to avoid duplicates.
                  </span>
                }
                size="md"
                align="left"
              />
              <div className="flex items-center gap-2">
                <Button variant="outline" asChild>
                  <Link href="/docs">Docs</Link>
                </Button>
              </div>
            </div>

            {fileResult?.caseId ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between gap-2">
                    <span>{fileResult.created === false ? "Already filed" : "Refund request filed"}</span>
                    <Badge>{fileResult.created === false ? "Existing" : "Success"}</Badge>
                  </CardTitle>
                  <CardDescription>
                    Keep this case ID handy. If you submitted twice, you may see “Existing”.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-lg border border-border bg-muted/20 p-4">
                    <div className="text-xs text-muted-foreground">Case ID</div>
                    <div className="mt-1 font-mono text-sm text-foreground">{fileResult.caseId}</div>
                  </div>

                  {fileResult.trackingUrl ? (
                    <div className="space-y-2">
                      <div className="text-xs text-muted-foreground">Tracking</div>
                      <a className="break-all text-sm underline underline-offset-4" href={fileResult.trackingUrl}>
                        {fileResult.trackingUrl}
                      </a>
                    </div>
                  ) : null}

                  <div className="flex flex-col gap-2 sm:flex-row">
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
              <form className="space-y-6" onSubmit={submitRefundRequest}>
                <Alert>
                  <AlertTitle>Tip</AlertTitle>
                  <AlertDescription>
                    Use the <span className="font-medium text-foreground">exact</span> paid endpoint URL (including path).
                    If the transaction includes multiple USDC recipients, consider adding the recipient address via MCP instead.
                  </AlertDescription>
                </Alert>

                <Card>
                  <CardHeader>
                    <CardTitle>Details</CardTitle>
                    <CardDescription>What you paid for, and the Base transaction hash.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-6 md:grid-cols-2">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="merchantApiUrl">API URL you paid for</Label>
                          <div className="text-xs text-muted-foreground">Paste the exact URL you called when the payment happened.</div>
                          <Input id="merchantApiUrl" placeholder="https://api.merchant.com/v1/..." {...register("merchantApiUrl")} />
                          {errors.merchantApiUrl ? (
                            <div className="text-xs text-destructive">{errors.merchantApiUrl.message}</div>
                          ) : null}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="txHash">Transaction hash</Label>
                          <Input id="txHash" placeholder="0x... (Base tx hash)" {...register("txHash")} />
                          {errors.txHash ? <div className="text-xs text-destructive">{errors.txHash.message}</div> : null}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <Label htmlFor="description">What happened?</Label>
                          <div className="text-xs text-muted-foreground">
                            {Math.min(descriptionValue.length, 500)}/500
                          </div>
                        </div>
                        <Textarea
                          id="description"
                          placeholder="What you expected vs what happened (10–500 chars)"
                          {...register("description")}
                        />
                        {errors.description ? <div className="text-xs text-destructive">{errors.description.message}</div> : null}
                        <div className="text-xs text-muted-foreground">
                          Keep it concrete (timeouts, wrong output, empty response, 5xx after payment).
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Evidence (optional)</CardTitle>
                    <CardDescription>Upload screenshots/logs (PNG/JPG, up to 10MB each). We store them as URLs on the case.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <input
                      ref={fileInputRef}
                      className="hidden"
                      type="file"
                      accept="image/png,image/jpeg"
                      multiple
                      onChange={(e) => void uploadEvidenceFiles(e.target.files)}
                      disabled={isBusy}
                    />

                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => fileInputRef.current?.click()}
                      onDragEnter={(e) => {
                        e.preventDefault();
                        setDragActive(true);
                      }}
                      onDragLeave={(e) => {
                        e.preventDefault();
                        setDragActive(false);
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setDragActive(true);
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        setDragActive(false);
                        void uploadEvidenceFiles(e.dataTransfer.files);
                      }}
                      className={[
                        "w-full rounded-lg border-2 border-dashed px-6 py-10 text-center transition-colors disabled:opacity-60",
                        dragActive ? "border-foreground/40 bg-muted/30" : "border-border bg-card/30 hover:bg-muted/20",
                      ].join(" ")}
                    >
                      <div className="mx-auto flex max-w-sm flex-col items-center gap-2">
                        <div className="text-sm font-medium text-foreground">
                          {uploading ? "Uploading…" : dragActive ? "Drop files to upload" : "Click or drag files here"}
                        </div>
                        <div className="text-xs text-muted-foreground">PNG, JPG up to 10MB</div>
                      </div>
                    </button>

                    {uploadedEvidenceUrls.length > 0 ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-3">
                          <div className="text-sm font-medium">Uploaded</div>
                          <Button type="button" variant="outline" size="sm" onClick={() => setUploadedEvidenceUrls([])}>
                            Clear
                          </Button>
                        </div>
                        <div className="space-y-2">
                          {uploadedEvidenceUrls.map((u, idx) => (
                            <div key={`${u}-${idx}`} className="flex items-start gap-2 rounded-md border border-border bg-muted/20 p-3">
                              <Badge variant="secondary" className="mt-0.5">{idx + 1}</Badge>
                              <a className="break-all text-xs underline underline-offset-4" href={u}>
                                {u}
                              </a>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </CardContent>
                </Card>

                <div className="rounded-xl border bg-card shadow-sm">
                  <Accordion
                    type="single"
                    collapsible
                    value={advancedOpen ? "advanced" : undefined}
                    onValueChange={(v) => setAdvancedOpen(v === "advanced")}
                    className="px-6"
                  >
                    <AccordionItem value="advanced" className="border-b-0">
                      <AccordionTrigger className="py-6 text-base">
                        Advanced (optional)
                      </AccordionTrigger>
                      <AccordionContent className="pb-6">
                        <div className="space-y-4">
                          <div className="text-sm text-muted-foreground">
                            Not required, but request/response details can strengthen the evidence.
                            Provide JSON for headers/bodies.
                          </div>

                          <div className="grid gap-6 md:grid-cols-2">
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <Label>Request method</Label>
                                <Controller
                                  control={control}
                                  name="requestMethod"
                                  render={({ field }) => (
                                    <Select value={field.value} onValueChange={field.onChange}>
                                      <SelectTrigger className="w-full">
                                        <SelectValue placeholder="POST" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {(["GET", "POST", "PUT", "PATCH", "DELETE"] as const).map((m) => (
                                          <SelectItem key={m} value={m}>
                                            {m}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  )}
                                />
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
                            </div>

                            <div className="space-y-4">
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
                            </div>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>

                {apiError ? (
                  <Alert variant="destructive">
                    <AlertTitle>Request failed</AlertTitle>
                    <AlertDescription>{apiError}</AlertDescription>
                  </Alert>
                ) : null}

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-xs text-muted-foreground">
                    Filing is permissionless. Avoid submitting duplicates.
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button type="submit" disabled={isBusy}>
                      {submitting ? "Submitting…" : "Submit refund request"}
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
                      disabled={isBusy}
                    >
                      Reset
                    </Button>
                  </div>
                </div>

                {uploadedEvidenceUrls.length > 0 ? (
                  <div className="text-xs text-muted-foreground">
                    Uploaded URLs preview:
                    <div className="mt-2">
                      <JsonPreview value={uploadedEvidenceUrls} />
                    </div>
                  </div>
                ) : null}
              </form>
            )}
          </div>
        </Section>
      </main>

      <Footer />
    </div>
  );
}

