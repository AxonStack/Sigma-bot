"use client";

import { ScrollReveal } from "./scroll-reveal";

export function Problem() {
  return (
    <section className="relative py-24 md:py-32 lg:py-40 bg-white overflow-hidden">
      {/* Subtle dot pattern */}
      <div className="absolute inset-0 bg-dots opacity-40" />

      <div className="relative max-w-7xl mx-auto px-6 lg:px-8">
        <ScrollReveal>
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-base-blue mb-4">
            The Problem
          </p>
        </ScrollReveal>

        <div className="grid md:grid-cols-2 gap-16 md:gap-20 items-start">
          {/* Left: Copy */}
          <div>
            <ScrollReveal delay={0.1}>
              <h2 className="font-display text-4xl md:text-5xl lg:text-[3.5rem] text-navy leading-[1.1] tracking-tight mb-6">
                Prediction markets are{" "}
                <span className="gradient-text-warm">gatekept.</span>
              </h2>
            </ScrollReveal>

            <ScrollReveal delay={0.2}>
              <p className="text-lg text-slate leading-relaxed mb-6">
                On Polymarket and Kalshi, you cannot create a prediction market.
                Only the platform decides what&apos;s worth trading. Your
                questions, your events, your niche interests &mdash; locked
                behind closed doors and editorial approval.
              </p>
            </ScrollReveal>

            <ScrollReveal delay={0.3}>
              <p className="text-lg text-slate leading-relaxed mb-10">
                Markets with the most potential &mdash; hyperlocal, real-time,
                community-driven &mdash; simply never exist. The cold start
                problem kills them before they begin.
              </p>
            </ScrollReveal>

            {/* Stats */}
            <ScrollReveal delay={0.35}>
              <div className="flex items-center gap-8">
                <div className="text-center">
                  <p className="text-5xl md:text-6xl font-display gradient-text-warm">
                    0
                  </p>
                  <p className="text-[11px] text-slate mt-2 font-semibold uppercase tracking-wider">
                    Markets you can
                    <br />
                    create on Polymarket
                  </p>
                </div>
                <div className="w-px h-20 bg-gradient-to-b from-transparent via-navy/15 to-transparent" />
                <div className="text-center">
                  <p className="text-5xl md:text-6xl font-display gradient-text">
                    &infin;
                  </p>
                  <p className="text-[11px] text-slate mt-2 font-semibold uppercase tracking-wider">
                    Markets you can
                    <br />
                    create with SigmaBet
                  </p>
                </div>
              </div>
            </ScrollReveal>
          </div>

          {/* Right: Visual contrast cards */}
          <ScrollReveal delay={0.2} direction="right">
            <div className="space-y-5">
              {/* Blocked state */}
              <div className="relative group">
                <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-coral/30 to-coral/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative p-6 rounded-2xl glass border border-coral/15">
                  <div className="flex items-start gap-4">
                    <div className="w-11 h-11 rounded-xl bg-coral/10 flex items-center justify-center shrink-0 mt-0.5">
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 20 20"
                        fill="none"
                      >
                        <circle
                          cx="10"
                          cy="10"
                          r="7"
                          stroke="#E8594F"
                          strokeWidth="1.5"
                        />
                        <line
                          x1="5"
                          y1="15"
                          x2="15"
                          y2="5"
                          stroke="#E8594F"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-navy text-sm mb-1">
                        Traditional Platforms
                      </p>
                      <p className="text-slate text-sm leading-relaxed">
                        &ldquo;Will XYZ happen by March?&rdquo; &mdash; Submit
                        request &rarr; Wait for editorial approval &rarr; Market
                        may never be created &rarr; No liquidity even if it is
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="px-2.5 py-1 rounded-md bg-coral/10 text-coral text-xs font-medium">
                          Permissioned
                        </span>
                        <span className="px-2.5 py-1 rounded-md bg-coral/10 text-coral text-xs font-medium">
                          Days to weeks
                        </span>
                        <span className="px-2.5 py-1 rounded-md bg-coral/10 text-coral text-xs font-medium">
                          Cold start
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* SigmaBet state */}
              <div className="relative group">
                <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-base-blue/40 via-cyan/30 to-base-blue/20 opacity-60 group-hover:opacity-100 transition-opacity duration-500 blur-[1px]" />
                <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-base-blue/30 via-cyan/20 to-base-blue/10" />
                <div className="relative p-6 rounded-2xl glass border border-base-blue/10">
                  <div className="flex items-start gap-4">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-base-blue/15 to-cyan/10 flex items-center justify-center shrink-0 mt-0.5">
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 20 20"
                        fill="none"
                      >
                        <path
                          d="M6 10l3 3 5-6"
                          stroke="#0052FF"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <circle
                          cx="10"
                          cy="10"
                          r="7"
                          stroke="#0052FF"
                          strokeWidth="1.5"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-navy text-sm mb-1">
                        SigmaBet
                      </p>
                      <p className="text-slate text-sm leading-relaxed">
                        &ldquo;Will XYZ happen by March?&rdquo; &rarr; Market
                        created instantly &rarr; Tradeable immediately in
                        $CLAWDBET &rarr; Guaranteed liquidity from day zero
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="px-2.5 py-1 rounded-md bg-gradient-to-r from-base-blue/10 to-cyan/10 text-base-blue text-xs font-medium">
                          Permissionless
                        </span>
                        <span className="px-2.5 py-1 rounded-md bg-gradient-to-r from-base-blue/10 to-cyan/10 text-base-blue text-xs font-medium">
                          Seconds
                        </span>
                        <span className="px-2.5 py-1 rounded-md bg-gradient-to-r from-base-blue/10 to-cyan/10 text-base-blue text-xs font-medium">
                          Instant liquidity
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
