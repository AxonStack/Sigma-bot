"use client";

import { ScrollReveal } from "./scroll-reveal";

const tokenMetrics = [
  { label: "Protocol layer", value: "OpenBet token" },
  { label: "Value path", value: "Activity to liquidity" },
  { label: "Design goal", value: "Lower idle float" },
];

export function Flywheel() {
  return (
    <section id="tokenomics" className="px-6 py-20 sm:px-8 md:py-24">
      <div className="mx-auto max-w-6xl rounded-[36px] border border-white/10 bg-white/[0.03] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.36)] backdrop-blur-xl sm:p-8 md:p-10">
        <ScrollReveal>
          <div className="max-w-3xl">
            <p className="text-[11px] uppercase tracking-[0.28em] text-white/38">Tokenomics</p>
            <h2 className="mt-4 font-display text-4xl tracking-[-0.04em] text-white sm:text-5xl">
              Minimal on the surface. Reinforcing underneath.
            </h2>
            <p className="mt-5 text-base leading-8 text-white/62">
              OpenBet is designed so market activity supports the token layer instead of sitting beside
              it. New demand, buyback pressure, and tighter circulating supply are meant to compound as
              the platform opens more markets.
            </p>
          </div>
        </ScrollReveal>

        <div className="mt-10 grid gap-6 border-t border-white/10 pt-6 md:grid-cols-3">
          {tokenMetrics.map((metric, index) => (
            <ScrollReveal key={metric.label} delay={index * 0.08}>
              <div className="relative">
                <p className="text-[11px] uppercase tracking-[0.24em] text-white/38">{metric.label}</p>
                <p className="mt-3 text-xl font-semibold text-white">{metric.value}</p>
                {index < tokenMetrics.length - 1 && (
                  <div className="absolute right-0 top-0 hidden h-full w-px bg-white/8 md:block" />
                )}
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
