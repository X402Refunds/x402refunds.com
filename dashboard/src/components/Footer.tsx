"use client"

import { Github, Twitter } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="max-w-7xl mx-auto px-6 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <div className="space-y-2">
            <div className="text-base font-semibold text-slate-950">x402refunds</div>
            <div className="text-sm text-slate-600">
              Refund requests for paid APIs. Email-first, minimal setup.
            </div>
            <div className="pt-2 text-sm text-slate-600">
              101 Clay St #201, SF, CA 94501
            </div>
          </div>

          <div>
            <div className="text-sm font-semibold text-slate-950">Product</div>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li>
                <a className="hover:text-slate-900" href="/docs">Docs</a>
              </li>
              <li>
                <a className="hover:text-slate-900" href="/topup">Top up</a>
              </li>
              <li>
                <a className="hover:text-slate-900" href="/check-balance">Check balance</a>
              </li>
            </ul>
          </div>

          <div>
            <div className="text-sm font-semibold text-slate-950">Links</div>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li>
                <a
                  className="inline-flex items-center gap-2 hover:text-slate-900"
                  href="https://github.com/x402disputes"
                  target="_blank"
                  rel="noreferrer"
                >
                  <Github className="h-4 w-4" />
                  GitHub
                </a>
              </li>
              <li>
                <a
                  className="inline-flex items-center gap-2 hover:text-slate-900"
                  href="https://x.com/x402refunds"
                  target="_blank"
                  rel="noreferrer"
                >
                  <Twitter className="h-4 w-4" />
                  x402refunds
                </a>
              </li>
              <li>
                <a
                  className="inline-flex items-center gap-2 hover:text-slate-900"
                  href="https://x.com/vbkotecha"
                  target="_blank"
                  rel="noreferrer"
                >
                  <Twitter className="h-4 w-4" />
                  vbkotecha
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-slate-200 pt-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <div>&copy; 2026 x402refunds</div>
          <div className="text-slate-500">
            <a className="hover:text-slate-700" href="mailto:vivek@x402refunds.com">
              vivek@x402refunds.com
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}

