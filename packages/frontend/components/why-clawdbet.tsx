"use client";

import { ScrollReveal } from "./scroll-reveal";

const features = [
  {
    name: "Create any market",
    clawdbet: true,
    polymarket: false,
    kalshi: false,
  },
  {
    name: "Instant liquidity",
    clawdbet: true,
    polymarket: false,
    kalshi: false,
  },
  {
    name: "AI-powered creation",
    clawdbet: true,
    polymarket: false,
    kalshi: false,
  },
  {
    name: "Any topic or question",
    clawdbet: true,
    polymarket: false,
    kalshi: false,
  },
  {
    name: "Token-backed economy",
    clawdbet: true,
    polymarket: false,
    kalshi: false,
  },
  {
    name: "Onchain identity (8004)",
    clawdbet: true,
    polymarket: false,
    kalshi: false,
  },
  { name: "No KYC required", clawdbet: true, polymarket: true, kalshi: false },
  {
    name: "Permissionless access",
    clawdbet: true,
    polymarket: true,
    kalshi: false,
  },
];

function Check() {
  return (
    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-base-blue/15 to-cyan/10 flex items-center justify-center">
      <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
        <path
          d="M2.5 6.5l3 3 5-5.5"
          stroke="#0052FF"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

function Cross() {
  return (
    <div className="w-7 h-7 rounded-full bg-slate/[0.06] flex items-center justify-center">
      <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
        <path
          d="M3 3l5 5M8 3l-5 5"
          stroke="#94A3B8"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

export function WhyClawdBet() {
  return (
    <section
      id="compare"
      className="relative py-24 md:py-32 lg:py-40 bg-ice/50 overflow-hidden"
    >
      {/* Background blob */}
      <div
        className="absolute bottom-10 left-10 w-[350px] h-[350px] blob opacity-25"
        style={{ background: "rgba(0,82,255,0.1)" }}
      />

      <div className="relative max-w-4xl mx-auto px-6 lg:px-8">
        <div className="text-center mb-16 md:mb-20">
          <ScrollReveal>
            <p className="text-xs font-semibold tracking-[0.2em] uppercase text-base-blue mb-4">
              Compare
            </p>
          </ScrollReveal>
          <ScrollReveal delay={0.1}>
            <h2 className="font-display text-4xl md:text-5xl lg:text-6xl text-navy tracking-tight leading-[1.1] mb-6">
              Not an alternative.
              <br />
              <span className="gradient-text">A new primitive.</span>
            </h2>
          </ScrollReveal>
          <ScrollReveal delay={0.2}>
            <p className="text-lg text-slate max-w-xl mx-auto leading-relaxed">
              ClawdBet doesn&apos;t compete with prediction markets &mdash; it
              creates the ones that never existed.
            </p>
          </ScrollReveal>
        </div>

        {/* Comparison table */}
        <ScrollReveal delay={0.15}>
          <div className="overflow-x-auto -mx-6 px-6 md:mx-0 md:px-0">
            <div className="min-w-[520px]">
              {/* Glass table */}
              <div className="rounded-3xl glass border border-base-blue/[0.08] overflow-hidden shadow-xl shadow-base-blue/[0.04]">
                {/* Header */}
                <div className="grid grid-cols-4 gap-4 px-6 py-5 border-b border-navy/[0.06] bg-gradient-to-r from-base-blue/[0.04] via-cyan/[0.02] to-transparent">
                  <div className="col-span-1">
                    <span className="text-[11px] font-semibold text-slate uppercase tracking-wider">
                      Feature
                    </span>
                  </div>
                  <div className="text-center">
                    <span className="text-[11px] font-bold uppercase tracking-wider gradient-text">
                      ClawdBet
                    </span>
                  </div>
                  <div className="text-center">
                    <span className="text-[11px] font-semibold text-slate uppercase tracking-wider">
                      Polymarket
                    </span>
                  </div>
                  <div className="text-center">
                    <span className="text-[11px] font-semibold text-slate uppercase tracking-wider">
                      Kalshi
                    </span>
                  </div>
                </div>

                {/* Rows */}
                {features.map((feature, i) => (
                  <div
                    key={feature.name}
                    className={`grid grid-cols-4 gap-4 px-6 py-4 items-center transition-colors duration-200 hover:bg-base-blue/[0.02] ${
                      i < features.length - 1
                        ? "border-b border-navy/[0.04]"
                        : ""
                    } ${i % 2 === 1 ? "bg-white/40" : ""}`}
                  >
                    <div className="col-span-1">
                      <span className="text-sm text-navy font-medium">
                        {feature.name}
                      </span>
                    </div>
                    <div className="flex justify-center">
                      {feature.clawdbet ? <Check /> : <Cross />}
                    </div>
                    <div className="flex justify-center">
                      {feature.polymarket ? <Check /> : <Cross />}
                    </div>
                    <div className="flex justify-center">
                      {feature.kalshi ? <Check /> : <Cross />}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
