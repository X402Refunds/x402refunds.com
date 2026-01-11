import { redirect } from "next/navigation";

// Backwards-compatible alias. Canonical page is /request-refund.
export default function FileDisputeRedirectPage() {
  redirect("/request-refund");
}

