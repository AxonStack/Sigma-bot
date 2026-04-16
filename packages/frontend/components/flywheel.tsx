"use client";

import { ScrollReveal } from "./scroll-reveal";

const tokenMetrics = [
  { label: "Network", value: "Base Mainnet" },
  { label: "Token", value: "OpenBet (OBT)" },
  { label: "Contract", value: "0x2e694845eae92ef1551f87b9614ea1560d3e0b07" },
];

export function Flywheel() {
  return (
    <section id="tokenomics" className="px-4 py-14 sm:px-8 sm:py-20 md:py-24">
      <div className="mx-auto max-w-6xl rounded-[28px] border border-white/10 bg-white/[0.03] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.36)] backdrop-blur-xl sm:rounded-[36px] sm:p-8 md:p-10">
        <ScrollReveal>
          <div className="max-w-3xl">
            <p className="text-[11px] uppercase tracking-[0.28em] text-white/38">Tokenomics</p>
            <h2 className="mt-4 font-display text-[2.45rem] leading-[0.98] tracking-[-0.05em] text-white sm:text-5xl">
              OpenBet tokenomics tied directly to market usage.
            </h2>
            <p className="mt-5 text-[15px] leading-7 text-white/62 sm:text-base sm:leading-8">
              OpenBet is the native token of the OpenBet prediction market platform on Base, where users
              create and trade binary markets around verifiable real-world events. Markets are launched
              onchain fast and settle against pre-declared resolution sources.
            </p>
            <p className="mt-4 text-[15px] leading-7 text-white/62 sm:text-base sm:leading-8">
              The token is designed as part of protocol activity, not a standalone layer. As trading
              volume grows, buyback mechanisms are intended to route demand back into the token layer and
              reduce circulating supply over time.
            </p>
          </div>
        </ScrollReveal>

        <div className="mt-10 grid gap-6 border-t border-white/10 pt-6 md:grid-cols-3">
          {tokenMetrics.map((metric, index) => (
            <ScrollReveal key={metric.label} delay={index * 0.08}>
              <div className="relative">
                <p className="text-[11px] uppercase tracking-[0.24em] text-white/38">{metric.label}</p>
                <p
                  className={`mt-3 font-semibold text-white ${
                    metric.label === "Contract"
                      ? "break-all text-sm leading-6 sm:text-base"
                      : "text-xl"
                  }`}
                >
                  {metric.value}
                </p>
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
