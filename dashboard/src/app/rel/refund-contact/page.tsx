import Link from "next/link";

import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Section, SectionHeading } from "@/components/layout";

export const metadata = {
  title: "Link relation: refund-contact",
  description:
    'Documentation for the Link relation type "refund-contact" used in X-402 refund request discovery.',
};

export default function RefundContactRelPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navigation />
      <main className="flex-1 bg-background">
        <Section spacing="tight" containerClassName="max-w-4xl">
          <SectionHeading
            title='Link relation: "refund-contact"'
            description="Used to advertise a refund contact email via the HTTP Link header."
          />

          <article className="markdown">
            <p>
              This URL is used as a <strong>Link relation identifier</strong> (RFC 8288 extension
              relation) in an HTTP <code>Link</code> header. It lets clients discover where to send
              refund requests (typically an email inbox) for an X-402 paywalled endpoint.
            </p>

            <p>Example:</p>

            <pre>
              <code>
                {
                  'Link: <mailto:refunds@yourdomain.com>; rel="https://x402refunds.com/rel/refund-contact"'
                }
              </code>
            </pre>

            <p>
              You’ll see this URI appear in our landing page “copy/paste” snippets. It’s not
              required to be browsed by machines for the protocol to work, but we host this page so
              humans don’t hit a 404 when they click it.
            </p>

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

