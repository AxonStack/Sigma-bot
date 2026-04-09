"use client";

import { ScrollReveal } from "./scroll-reveal";

const rails = [
  {
    title: "Source-bound resolution",
    copy: "Each board needs a visible source, a visible end state, and a fixed deadline. OpenBet makes those readable before trading starts.",
  },
  {
    title: "Launch with a footprint",
    copy: "Markets live on Base and the agent keeps an onchain identity footprint, so users are not trading against an invisible black box.",
  },
  {
    title: "Clarity over spectacle",
    copy: "The surface can look great, but the actual trust signal is precise wording and a settlement path traders can inspect.",
  },
];

const specRows = [
  { label: "Question", value: "Binary and readable" },
  { label: "Deadline", value: "Fixed before launch" },
  { label: "Source", value: "Named in the spec" },
  { label: "Settlement", value: "Onchain and inspectable" },
];

export function ResolutionLayer() {
  return (
    <section id="resolution-layer" className="section-shell bg-[#141311] py-24 text-white md:py-32 lg:py-36">
      <div className="absolute inset-0 hero-grid opacity-20" />
      <div className="grain-overlay" />
      <div className="relative mx-auto max-w-[94rem] px-6 lg:px-8 xl:px-10">
        <div className="mb-16">
          <ScrollReveal>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#e7c991]">
              Resolution Layer
            </p>
          </ScrollReveal>
          <ScrollReveal delay={0.08}>
            <h2 className="mt-4 max-w-[15ch] font-display text-4xl leading-[0.95] tracking-[-0.05em] text-white md:text-5xl lg:text-[4.1rem]">
              A sharp surface helps.
              <br />
              <span className="text-[#e7c991]">Sharper rules are what make it credible.</span>
            </h2>
          </ScrollReveal>
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.96fr_1.04fr]">
          <div className="space-y-4">
            {rails.map((rail, index) => (
              <ScrollReveal key={rail.title} delay={0.1 + index * 0.07}>
                <div className="boxed-card-dark panel-outline pressable p-7">
                  <div className="text-[10px] uppercase tracking-[0.24em] text-white/42">Rail 0{index + 1}</div>
                  <h3 className="mt-3 text-3xl font-display tracking-[-0.04em] text-white">{rail.title}</h3>
                  <p className="mt-3 text-sm leading-[1.8] text-white/66">{rail.copy}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>

          <ScrollReveal delay={0.18} direction="right">
            <div className="boxed-card overflow-hidden shadow-[0_28px_80px_rgba(20,19,17,0.08)]">
              <div className="border-b border-black/8 px-6 py-5">
                <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-black/42">
                  Market spec checklist
                </div>
                <div className="mt-3 text-3xl font-display tracking-[-0.04em] text-ink">
                  What makes an OpenBet board trustworthy
                </div>
              </div>

              {specRows.map((row, index) => (
                <div
                  key={row.label}
                  className={[
                    "grid grid-cols-[120px_1fr] gap-3 px-6 py-5 text-sm",
                    index < specRows.length - 1 ? "border-b border-black/8" : "",
                    index % 2 === 0 ? "bg-black/[0.02]" : "",
                  ].join(" ")}
                >
                  <div className="text-black/42 uppercase tracking-[0.22em] text-[10px]">{row.label}</div>
                  <div className="font-semibold text-base-dark">{row.value}</div>
                </div>
              ))}

              <div className="px-6 py-5 text-sm leading-[1.8] text-slate">
                The visual system can invite people in, but the real edge is that every board is readable, auditable,
                and settleable before volume arrives.
              </div>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
