"use client";

import { useState } from "react";
import Image from "next/image";
import { CreateMarketModal } from "./create-market-modal";

export function CTAFooter() {
  const [createModalOpen, setCreateModalOpen] = useState(false);

  return (
    <>
      <CreateMarketModal isOpen={createModalOpen} onClose={() => setCreateModalOpen(false)} />

      <footer className="px-6 pb-10 sm:px-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 border-t border-white/10 py-8 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="/openbet.jpg"
              alt="OpenBet"
              width={32}
              height={32}
              className="rounded-2xl border border-white/10"
            />
            <div>
              <div className="font-display text-lg font-semibold text-white">OpenBet</div>
              <div className="text-sm text-white/42">Live prediction markets on Base</div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <a
              href="https://x.com/openbettrade?s=21"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="X"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] transition-colors duration-200 hover:border-white/18 hover:bg-white/[0.08]"
            >
              <Image src="/x.svg" alt="X" width={20} height={20} />
            </a>
            <a
              href="https://t.me/+hyrhtU7FP7EyY2M1"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Telegram"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] transition-colors duration-200 hover:border-white/18 hover:bg-white/[0.08]"
            >
              <Image src="/telegram.svg" alt="Telegram" width={20} height={20} />
            </a>
          </div>
        </div>
      </footer>
    </>
  );
}
