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

    const organizationId = typeof body.organizationId === "string" ? body.organizationId : "";
    const amountUsdc = typeof body.amountUsdc === "number" ? body.amountUsdc : NaN;
    const note = typeof body.note === "string" ? body.note : undefined;

    if (!organizationId) throw new Error("organizationId is required");
    if (!Number.isFinite(amountUsdc) || amountUsdc <= 0) throw new Error("amountUsdc must be > 0");

    const convex = new ConvexHttpClient(getConvexCloudUrl(), {
      skipConvexDeploymentUrlCheck: true,
    });
    const runMutation = convex.mutation.bind(convex) as unknown as (fn: unknown, args: unknown) => Promise<unknown>;
    await runMutation("admin:adminGrantOrganizationCredits", {
      adminToken,
      organizationId,
      amountUsdc,
      note,
    });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    const status = message === "UNAUTHORIZED" ? 401 : message.includes("not configured") ? 500 : 400;
    return NextResponse.json({ ok: false, error: { message } }, { status });
  }
}

