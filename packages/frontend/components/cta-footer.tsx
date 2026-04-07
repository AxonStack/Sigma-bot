"use client";

import { useState } from "react";
import { ScrollReveal } from "./scroll-reveal";
import { CreateMarketModal } from "./create-market-modal";
import Image from "next/image";

export function CTAFooter() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <CreateMarketModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      {/* CTA Section */}
      <section className="relative py-24 md:py-32 lg:py-40 overflow-hidden">
        {/* Mesh gradient background */}
        <div className="absolute inset-0 bg-gradient-to-b from-ice-deep via-ice to-ice-deep" />
        <div className="absolute inset-0 bg-grid opacity-40" />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] blob opacity-40"
          style={{ background: "rgba(0,82,255,0.08)" }}
        />
        <div
          className="absolute top-1/4 right-1/4 w-[300px] h-[300px] blob-slow opacity-30"
          style={{ background: "rgba(6,182,212,0.08)" }}
        />

        <div className="relative max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <ScrollReveal>
            <h2 className="font-display text-4xl md:text-5xl lg:text-7xl text-navy tracking-tight leading-[1.05] mb-6">
              Every market starts
              <br />
              <span className="gradient-text">with a question.</span>
            </h2>
          </ScrollReveal>
          <ScrollReveal delay={0.1}>
            <p className="text-lg md:text-xl text-slate max-w-xl mx-auto leading-relaxed mb-10">
              Stop waiting for someone else to create the market you want. Ask
              SigmaBet. Get your market. Start trading.
            </p>
          </ScrollReveal>
          <ScrollReveal delay={0.2}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => setIsModalOpen(true)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 bg-gradient-to-r from-base-blue to-cyan text-white text-base font-semibold rounded-full shadow-[0_0_30px_rgba(0,82,255,0.3)] hover:shadow-[0_0_50px_rgba(0,82,255,0.45)] transition-all duration-300 active:scale-[0.97]"
              >
                Create a Prediction Market
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M1 8h14m0 0l-5-5m5 5l-5 5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              <a
                href="https://flaunch.gg/base/coin/0x5178f9df8274d76841aadb13f22e0f7fa7f219a0"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 glass text-navy text-base font-semibold rounded-full border border-navy/10 hover:border-base-blue/30 hover:shadow-lg transition-all duration-300 active:scale-[0.97]"
              >
                Trade $CLAWDBET
              </a>
            </div>
          </ScrollReveal>
          <ScrollReveal delay={0.3}>
            <div className="mt-8">
              <a
                href="https://x.com/clawbetonbase"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-slate hover:text-base-blue transition-colors duration-200"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                Join the community &mdash; @clawbetonbase
              </a>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-navy text-white/60">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12 md:py-16">
          <div className="grid md:grid-cols-4 gap-10 md:gap-8 mb-12">
            {/* Brand */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-2.5 mb-4">
                <Image
                  src="/logo.png"
                  alt="SigmaBet"
                  width={28}
                  height={28}
                  className="rounded-lg"
                />
                <span className="font-display text-lg text-white">
                  SigmaBet
                </span>
              </div>
              <p className="text-sm leading-relaxed max-w-sm">
                AI-powered prediction market creation agent on Base. Any
                question becomes an instantly tradeable market with guaranteed
                $CLAWDBET liquidity.
              </p>
            </div>

            {/* Product links */}
            <div>
              <p className="text-[11px] font-semibold text-white/30 uppercase tracking-wider mb-4">
                Product
              </p>
              <div className="flex flex-col gap-3">
                <a
                  href="#how-it-works"
                  className="text-sm hover:text-white transition-colors duration-200"
                >
                  How It Works
                </a>
                <a
                  href="#tokenomics"
                  className="text-sm hover:text-white transition-colors duration-200"
                >
                  Tokenomics
                </a>
                <a
                  href="#compare"
                  className="text-sm hover:text-white transition-colors duration-200"
                >
                  Compare
                </a>
              </div>
            </div>

            {/* External links */}
            <div>
              <p className="text-[11px] font-semibold text-white/30 uppercase tracking-wider mb-4">
                Links
              </p>
              <div className="flex flex-col gap-3">
                <a
                  href="https://moltlaunch.com/agents/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm hover:text-white transition-colors duration-200"
                >
                  Hire on moltlaunch &#8599;
                </a>
                <a
                  href="https://flaunch.gg/base/coin/0x5178f9df8274d76841aadb13f22e0f7fa7f219a0"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm hover:text-white transition-colors duration-200"
                >
                  Trade on Flaunch &#8599;
                </a>
                <a
                  href="https://x.com/clawbetonbase"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm hover:text-white transition-colors duration-200"
                >
                  @clawbetonbase &#8599;
                </a>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="pt-8 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-white/30">
              &copy; 2026 SigmaBet. Built on Base.
            </p>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-md bg-white/[0.05] text-[10px] font-medium text-white/40">
                ERC-8004
              </span>
              <span className="px-2.5 py-1 rounded-md bg-white/[0.05] text-[10px] font-medium text-white/40">
                Base
              </span>
              <span className="px-2.5 py-1 rounded-md bg-white/[0.05] text-[10px] font-medium text-white/40">
                moltlaunch
              </span>
              <span className="px-2.5 py-1 rounded-md bg-white/[0.05] text-[10px] font-medium text-white/40 font-mono">
                #14493
              </span>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
