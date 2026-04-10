"use client";

import Image from "next/image";
import Link from "next/link";
import { ScrollReveal } from "./scroll-reveal";

export function CTAFooter() {
  return (
    <>
      <section className="px-6 pb-8 pt-12 sm:px-8 md:pb-10 md:pt-20">
        <div className="mx-auto max-w-6xl border-t border-white/10 pt-10">
          <ScrollReveal>
            <div className="flex flex-col items-start justify-between gap-10 md:flex-row md:items-end">
              <div className="max-w-2xl">
                <p className="text-[11px] uppercase tracking-[0.28em] text-white/38">OpenBet</p>
                <h2 className="mt-4 font-display text-4xl tracking-[-0.04em] text-white sm:text-5xl">
                  Launch the market you actually want to trade.
                </h2>
                <p className="mt-4 text-base leading-8 text-white/58">
                  Cleaner layout, stronger contrast, and less friction at the point of action.
                </p>
              </div>

              <div className="flex w-full flex-col gap-4 sm:w-auto sm:flex-row">
                <button
                  type="button"
                  disabled
                  aria-disabled="true"
                  className="button-primary flex-col rounded-full px-7 py-3 text-sm font-semibold uppercase tracking-[0.2em]"
                >
                  <span>Launch a market</span>
                  <span className="text-[10px] tracking-[0.24em] text-current/70">
                    Coming soon
                  </span>
                </button>
                <Link
                  href="/markets"
                  className="button-secondary rounded-full px-7 py-4 text-sm font-semibold uppercase tracking-[0.2em]"
                >
                  Browse markets
                </Link>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <footer className="px-6 pb-10 sm:px-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 border-t border-white/10 py-8 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="/logo.png"
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

          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-white/56">
            <Link href="/#how-it-works" className="transition-colors duration-200 hover:text-white">
              How it works
            </Link>
            <Link href="/#tokenomics" className="transition-colors duration-200 hover:text-white">
              Tokenomics
            </Link>
            <a
              href="https://flaunch.gg/base/coin/0x5178f9df8274d76841aadb13f22e0f7fa7f219a0"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors duration-200 hover:text-white"
            >
              View token
            </a>
          </div>
        </div>
      </footer>
    </>
  );
}
