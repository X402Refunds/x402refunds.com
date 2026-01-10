export type MerchantActionErrorInput = {
  code: string;
  message?: string;
  caseId?: string | null;
};

export function buildMerchantActionErrorCopy(input: MerchantActionErrorInput): string {
  const code = String(input.code || "ERROR");
  const caseId = input.caseId ? String(input.caseId) : null;

  const lines: string[] = [];

  // Short headline
  if (code === "TOKEN_USED") {
    lines.push("This link has already been used.");
  } else if (code === "TOKEN_EXPIRED") {
    lines.push("This link has expired.");
  } else if (code === "INVALID_TOKEN") {
    lines.push("This link is invalid.");
  } else if (code === "NOT_VERIFIED") {
    lines.push("Please verify your email first.");
  } else if (code === "ALREADY_DECIDED") {
    lines.push("This dispute has already been decided.");
  } else if (code === "INSUFFICIENT_CREDITS") {
    lines.push("Refund not sent yet — insufficient refund credits.");
  } else {
    lines.push("Action failed.");
  }

  if (caseId) {
    lines.push("");
    lines.push(`Case: ${caseId}`);
  }

  lines.push("");

  // Next steps
  if (code === "TOKEN_USED") {
    lines.push("For safety, each one-click link can only be used once.");
    lines.push("");
    lines.push("If you need to take action again, use the most recent dispute email or resend a fresh email from the top-up page.");
  } else if (code === "TOKEN_EXPIRED") {
    lines.push("Please request a new dispute email and try again.");
  } else if (code === "INVALID_TOKEN") {
    lines.push("Please use the most recent dispute email.");
  } else if (code === "NOT_VERIFIED") {
    lines.push("Check your inbox for the verification email and click the verification link. Then try again.");
  } else if (code === "ALREADY_DECIDED") {
    lines.push("There’s nothing else to do here.");
  } else if (code === "INSUFFICIENT_CREDITS") {
    lines.push("Top up refund credits here:");
    lines.push("- https://x402refunds.com/topup");
    lines.push("");
    lines.push("After topping up, use the most recent dispute email again.");
  } else {
    const fallback = input.message ? String(input.message) : null;
    if (fallback) lines.push(fallback);
  }

  lines.push("");
  return lines.join("\n");
}

