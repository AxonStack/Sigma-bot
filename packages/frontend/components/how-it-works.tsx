"use client";

import { ScrollReveal } from "./scroll-reveal";

const steps = [
  {
    number: "01",
    title: "Write the question",
    description: "Start with a clean yes-or-no market prompt and a clear end condition.",
  },
  {
    number: "02",
    title: "Open the market",
    description: "OpenBet structures the market on Base and makes it tradable without a cold start.",
  },
  {
    number: "03",
    title: "Trade and settle",
    description: "Participants trade immediately, and the market resolves against its published rules.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="px-4 py-14 sm:px-8 sm:py-20 md:py-24">
      <div className="mx-auto max-w-6xl">
        <ScrollReveal>
          <div className="max-w-2xl">
            <p className="text-[11px] uppercase tracking-[0.28em] text-white/38">How it works</p>
            <h2 className="mt-4 font-display text-[2.45rem] leading-[0.98] tracking-[-0.05em] text-white sm:text-5xl">
              A faster path from idea to live market.
            </h2>
            <p className="mt-4 max-w-xl text-[15px] leading-7 text-white/62 sm:text-base sm:leading-8">
              The product stays simple on purpose: cleaner creation, instant access to liquidity, and
              a resolution path that is easy to read before anyone trades.
            </p>
          </div>
        </ScrollReveal>

        <div className="mt-10 grid gap-8 border-t border-white/10 pt-8 md:grid-cols-3 md:gap-8">
          {steps.map((step, index) => (
            <ScrollReveal key={step.number} delay={index * 0.08}>
              <article className="relative pr-4">
                <div className="text-sm font-semibold tracking-[0.28em] text-[#84ffab]">
                  {step.number}
                </div>
                <h3 className="mt-4 font-display text-2xl tracking-[-0.03em] text-white">
                  {step.title}
                </h3>
                <p className="mt-4 max-w-sm text-[15px] leading-7 text-white/58">
                  {step.description}
                </p>
                {index < steps.length - 1 && (
                  <div className="absolute right-0 top-0 hidden h-full w-px bg-white/8 md:block" />
                )}
              </article>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
