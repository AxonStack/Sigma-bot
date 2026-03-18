"use client";

import { ScrollReveal } from "./scroll-reveal";

const steps = [
  {
    number: "01",
    title: "Describe Your Market",
    description:
      "Tell ClawdBet what you want to predict. Any question, any event, any outcome. Provide the question or context — the agent handles the rest.",
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <rect
          x="3"
          y="5"
          width="22"
          height="18"
          rx="3"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <path
          d="M8 11h12M8 15h8"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    number: "02",
    title: "Agent Creates Onchain",
    description:
      "ClawdBet deploys the prediction market as an onchain instrument on Base. Structured, resolved, and settled by the agent — fully autonomous.",
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <circle
          cx="14"
          cy="14"
          r="10"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <path
          d="M10 14l3 3 5-6"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    number: "03",
    title: "Trade Instantly",
    description:
      "Every market is immediately tradeable with guaranteed liquidity denominated in $CLAWDBET. No waiting for counterparties. No empty order books.",
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <path
          d="M5 20l6-6 4 4 8-10"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M16 8h7v7"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
];

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="relative py-24 md:py-32 lg:py-40 bg-ice/50 overflow-hidden"
    >
      {/* Background blob */}
      <div
        className="absolute top-20 right-0 w-[400px] h-[400px] blob-slow opacity-30"
        style={{ background: "rgba(6,182,212,0.12)" }}
      />

      <div className="relative max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center mb-16 md:mb-20">
          <ScrollReveal>
            <p className="text-xs font-semibold tracking-[0.2em] uppercase text-base-blue mb-4">
              How It Works
            </p>
          </ScrollReveal>
          <ScrollReveal delay={0.1}>
            <h2 className="font-display text-4xl md:text-5xl lg:text-6xl text-navy tracking-tight leading-[1.1]">
              Three steps.{" "}
              <span className="gradient-text">One market.</span>
            </h2>
          </ScrollReveal>
        </div>

        {/* Bento grid */}
        <div className="grid md:grid-cols-2 gap-5 lg:gap-6">
          {/* Step 01 — featured, spans full width */}
          <ScrollReveal delay={0.1} className="md:col-span-2">
            <div className="relative group">
              <div className="absolute -inset-[1px] rounded-3xl bg-gradient-to-r from-base-blue via-cyan to-base-blue opacity-0 group-hover:opacity-20 transition-opacity duration-700 blur-sm" />
              <div className="relative p-8 md:p-10 rounded-3xl glass border border-navy/[0.06] group-hover:border-base-blue/20 transition-all duration-500 group-hover:shadow-xl group-hover:shadow-base-blue/[0.06] overflow-hidden">
                {/* Watermark number */}
                <span className="absolute -top-6 -right-2 text-[180px] font-display text-base-blue/[0.04] leading-none select-none pointer-events-none">
                  01
                </span>

                <div className="relative flex flex-col md:flex-row md:items-center gap-6 md:gap-10">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-base-blue to-cyan text-white flex items-center justify-center shrink-0 shadow-lg shadow-base-blue/20">
                    {steps[0].icon}
                  </div>
                  <div className="flex-1">
                    <span className="text-[11px] font-semibold tracking-[0.2em] text-slate-light uppercase mb-2 block">
                      Step 01
                    </span>
                    <h3 className="font-display text-2xl md:text-3xl text-navy mb-2">
                      {steps[0].title}
                    </h3>
                    <p className="text-base text-slate leading-relaxed max-w-xl">
                      {steps[0].description}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </ScrollReveal>

          {/* Steps 02 & 03 — side by side */}
          {steps.slice(1).map((step, i) => (
            <ScrollReveal key={step.number} delay={0.2 + i * 0.1}>
              <div className="relative group h-full">
                <div className="absolute -inset-[1px] rounded-3xl bg-gradient-to-r from-base-blue via-cyan to-base-blue opacity-0 group-hover:opacity-20 transition-opacity duration-700 blur-sm" />
                <div className="relative p-8 md:p-10 rounded-3xl glass border border-navy/[0.06] group-hover:border-base-blue/20 transition-all duration-500 group-hover:shadow-xl group-hover:shadow-base-blue/[0.06] h-full overflow-hidden">
                  {/* Watermark number */}
                  <span className="absolute -top-4 -right-1 text-[140px] font-display text-base-blue/[0.04] leading-none select-none pointer-events-none">
                    {step.number}
                  </span>

                  <div className="relative">
                    <span className="text-[11px] font-semibold tracking-[0.2em] text-slate-light uppercase mb-5 block">
                      Step {step.number}
                    </span>
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-base-blue/10 to-cyan/5 text-base-blue flex items-center justify-center mb-5 group-hover:from-base-blue group-hover:to-cyan group-hover:text-white transition-all duration-500 group-hover:shadow-lg group-hover:shadow-base-blue/20">
                      {step.icon}
                    </div>
                    <h3 className="font-display text-xl md:text-2xl text-navy mb-3">
                      {step.title}
                    </h3>
                    <p className="text-[15px] text-slate leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>

        {/* Speed stat */}
        <div className="flex justify-center mt-12">
          <ScrollReveal delay={0.4}>
            <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full glass border border-base-blue/10 shadow-sm">
              <span className="text-sm text-slate">
                Average time from request to tradeable market:
              </span>
              <span className="text-sm font-bold gradient-text">
                &lt; 60 seconds
              </span>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
