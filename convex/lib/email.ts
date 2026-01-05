export type SendEmailParams = {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  replyTo?: string;
};

export type SendEmailResult =
  | { ok: true; provider: "resend"; id?: string }
  | { ok: false; code: string; message: string };

function isLikelyEmailAddress(value: string): boolean {
  const s = value.trim();
  if (s.length < 3 || s.length > 320) return false;
  // Intentionally simple—just enough to avoid obvious garbage.
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

async function sendEmailViaResend(params: SendEmailParams): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!apiKey) return { ok: false, code: "EMAIL_NOT_CONFIGURED", message: "RESEND_API_KEY is not set" };
  if (!from) return { ok: false, code: "EMAIL_NOT_CONFIGURED", message: "EMAIL_FROM is not set" };

  const to = params.to.trim();
  if (!isLikelyEmailAddress(to)) return { ok: false, code: "INVALID_TO", message: "Invalid email recipient" };

  const replyTo = params.replyTo?.trim();
  if (replyTo && !isLikelyEmailAddress(replyTo)) {
    return { ok: false, code: "INVALID_REPLY_TO", message: "Invalid replyTo email address" };
  }

  const subject = (params.subject || "").trim();
  if (!subject) return { ok: false, code: "INVALID_SUBJECT", message: "subject is required" };

  const payload: Record<string, any> = {
    from,
    to: [to],
    subject,
  };

  if (replyTo) payload.reply_to = replyTo;
  if (typeof params.html === "string" && params.html.trim()) payload.html = params.html;
  if (typeof params.text === "string" && params.text.trim()) payload.text = params.text;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10_000),
    });

    const body = await res.json().catch(() => ({} as any));
    if (!res.ok) {
      const msg =
        typeof body?.message === "string"
          ? body.message
          : `Resend error: ${res.status} ${res.statusText}`;
      return { ok: false, code: "EMAIL_SEND_FAILED", message: msg };
    }

    return { ok: true, provider: "resend", id: typeof body?.id === "string" ? body.id : undefined };
  } catch (e: any) {
    return { ok: false, code: "EMAIL_SEND_FAILED", message: e?.message || String(e) };
  }
}

/**
 * Provider-agnostic email entrypoint. Currently backed by Resend.
 * Kept as a single boundary so we can swap providers without refactors.
 */
export async function sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
  return await sendEmailViaResend(params);
}

