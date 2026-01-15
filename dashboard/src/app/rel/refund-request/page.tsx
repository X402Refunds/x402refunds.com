import Link from "next/link";

import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Section, SectionHeading } from "@/components/layout";

export const metadata = {
  title: "Link relation: refund-request",
  description:
    'Documentation for the Link relation type "refund-request" used in X-402 refund request discovery.',
};

export default function RefundRequestRelPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navigation />
      <main className="flex-1 bg-background">
        <Section spacing="tight" containerClassName="max-w-4xl">
          <SectionHeading
            title='Link relation: "refund-request"'
            description="Used to advertise the refund-request filing URL via the HTTP Link header."
          />

          <article className="markdown">
            <p>
              This URL is used as a <strong>Link relation identifier</strong> (RFC 8288 extension
              relation) in an HTTP <code>Link</code> header. It lets clients discover where to file
              a refund request (typically an HTTPS endpoint).
            </p>

            <p>Example:</p>

            <pre>
              <code>
                {
                  'Link: <https://api.x402refunds.com/v1/refunds>; rel="https://x402refunds.com/rel/refund-request"; type="application/json"'
                }
              </code>
            </pre>

            <p>
              For the full integration guide, see <Link href="/docs">Docs</Link>.
            </p>
          </article>
        </Section>
      </main>
      <Footer />
    </div>
  );
}

