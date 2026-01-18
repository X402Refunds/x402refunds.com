import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";

export const runtime = "nodejs";

function getConvexCloudUrl(): string {
  const fallback = "https://perceptive-lyrebird-89.convex.cloud";
  const raw = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (typeof raw !== "string") return fallback;
  const trimmed = raw.trim().replace(/\/+$/, "");
  if (!trimmed.includes(".convex.cloud")) return fallback;
  return trimmed;
}

function requireAdminTokenOrThrow(provided: string) {
  const expected = process.env.ADMIN_SETUP_TOKEN;
  if (!expected || !expected.trim()) {
    throw new Error("ADMIN_SETUP_TOKEN is not configured");
  }
  if (!provided || provided.trim() !== expected.trim()) {
    throw new Error("UNAUTHORIZED");
  }
}

export async function POST(request: Request) {
  try {
    const body: Record<string, unknown> = await request.json().catch(() => ({}));
    const adminToken = typeof body.adminToken === "string" ? body.adminToken : "";
    requireAdminTokenOrThrow(adminToken);

    const name = typeof body.name === "string" ? body.name : "";
    const domain = typeof body.domain === "string" ? body.domain : undefined;
    const billingEmail = typeof body.billingEmail === "string" ? body.billingEmail : undefined;
    const initialCreditUsdc = typeof body.initialCreditUsdc === "number" ? body.initialCreditUsdc : undefined;

    const convex = new ConvexHttpClient(getConvexCloudUrl(), {
      skipConvexDeploymentUrlCheck: true,
    });
    const runMutation = convex.mutation.bind(convex) as unknown as (fn: unknown, args: unknown) => Promise<unknown>;
    const res = await runMutation("admin:adminCreateOrganization", {
      adminToken,
      name,
      domain,
      billingEmail,
      initialCreditUsdc,
    });

    const result = (res && typeof res === "object" ? (res as Record<string, unknown>) : {}) as Record<string, unknown>;
    const organizationId = typeof result.organizationId === "string" ? result.organizationId : null;
    const apiKeys = result.apiKeys && typeof result.apiKeys === "object" ? (result.apiKeys as Record<string, unknown>) : null;
    const production = apiKeys && typeof apiKeys.production === "string" ? apiKeys.production : null;
    const development = apiKeys && typeof apiKeys.development === "string" ? apiKeys.development : null;

    if (!organizationId || !production || !development) {
      throw new Error("Unexpected response from adminCreateOrganization");
    }

    return NextResponse.json(
      { ok: true, organizationId, apiKeys: { production, development } },
      { status: 200 },
    );
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    const status = message === "UNAUTHORIZED" ? 401 : message.includes("not configured") ? 500 : 400;
    return NextResponse.json({ ok: false, error: { message } }, { status });
  }
}

