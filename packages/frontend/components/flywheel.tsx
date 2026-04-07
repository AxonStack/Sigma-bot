"use client";

import { ScrollReveal } from "./scroll-reveal";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import Image from "next/image";

const flywheelSteps = [
  {
    label: "User Hires\nClawdBet",
    description: "Request a prediction market via moltlaunch",
  },
  {
    label: "ETH Locked\nin Escrow",
    description: "Payment secured onchain via smart contract",
  },
  {
    label: "Buyback\nExecutes",
    description: "ETH automatically buys $CLAWDBET on Uniswap",
  },
  {
    label: "Token\nBurns",
    description: "Purchased tokens burned permanently — supply decreases",
  },
];

export function Flywheel() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section
      id="tokenomics"
      className="relative py-24 md:py-32 lg:py-40 bg-white overflow-hidden"
    >
      {/* Background blobs */}
      <div
        className="absolute top-0 left-1/4 w-[400px] h-[400px] blob opacity-25"
        style={{ background: "rgba(0,82,255,0.1)" }}
      />
      <div
        className="absolute bottom-20 right-1/4 w-[300px] h-[300px] blob-slow opacity-20"
        style={{ background: "rgba(6,182,212,0.1)" }}
      />

      <div className="relative max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center mb-16 md:mb-20">
          <ScrollReveal>
            <p className="text-xs font-semibold tracking-[0.2em] uppercase text-base-blue mb-4">
              Tokenomics
            </p>
          </ScrollReveal>
          <ScrollReveal delay={0.1}>
            <h2 className="font-display text-4xl md:text-5xl lg:text-6xl text-navy tracking-tight leading-[1.1] mb-6">
              Every market fuels{" "}
              <span className="gradient-text">the flywheel.</span>
            </h2>
          </ScrollReveal>
          <ScrollReveal delay={0.2}>
            <p className="text-lg text-slate max-w-2xl mx-auto leading-relaxed">
              When anyone hires SigmaBet, the payment doesn&apos;t go to a
              wallet &mdash; it buys back and permanently burns $CLAWDBET
              supply. More markets created means less tokens in circulation.
              Forever.
            </p>
          </ScrollReveal>
        </div>

        {/* Flywheel diagram */}
        <div ref={ref} className="relative max-w-3xl mx-auto">
          {/* Desktop circular layout */}
          <div className="hidden md:block relative w-full aspect-square max-w-[560px] mx-auto">
            {/* Glow ring */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-8 rounded-full"
              style={{
                background:
                  "conic-gradient(from 0deg, rgba(0,82,255,0.08), rgba(6,182,212,0.06), rgba(232,89,79,0.04), rgba(245,166,35,0.06), rgba(0,82,255,0.08))",
              }}
            />

            {/* Dashed ring */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-10 rounded-full border-2 border-dashed border-base-blue/15"
            />

            {/* Spinning accent */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : {}}
              transition={{ delay: 0.5 }}
              className="absolute inset-6 rounded-full border border-cyan/[0.1] animate-spin-slow"
            >
              <div className="absolute -top-1 left-1/2 w-2.5 h-2.5 rounded-full bg-gradient-to-r from-base-blue to-cyan shadow-[0_0_8px_rgba(0,82,255,0.5)]" />
            </motion.div>

            {/* Center logo */}
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{
                delay: 0.3,
                duration: 0.8,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <div className="text-center">
                <div className="relative inline-block">
                  <div className="absolute -inset-3 rounded-2xl bg-gradient-to-br from-base-blue/15 to-cyan/10 blur-lg animate-pulse-ring" />
                  <div className="relative w-20 h-20 rounded-2xl bg-white flex items-center justify-center shadow-xl shadow-base-blue/15 border border-base-blue/10">
                    <Image
                      src="/logo.png"
                      alt="SigmaBet"
                      width={56}
                      height={56}
                      className="rounded-xl"
                    />
                  </div>
                </div>
                <p className="text-sm font-bold text-navy mt-3">$CLAWDBET</p>
                <p className="text-[11px] font-semibold tracking-wider uppercase gradient-text">
                  Deflationary
                </p>
              </div>
            </motion.div>

            {/* Orbiting nodes */}
            {flywheelSteps.map((step, i) => {
              const angle = i * 90 - 90;
              const rad = (angle * Math.PI) / 180;
              const radius = 44;
              const x = 50 + radius * Math.cos(rad);
              const y = 50 + radius * Math.sin(rad);

              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={isInView ? { opacity: 1, scale: 1 } : {}}
                  transition={{
                    delay: 0.4 + i * 0.15,
                    duration: 0.6,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="absolute -translate-x-1/2 -translate-y-1/2"
                  style={{ left: `${x}%`, top: `${y}%` }}
                >
                  <div className="w-[136px] text-center">
                    <div className="w-12 h-12 rounded-2xl glass border border-base-blue/15 flex items-center justify-center mx-auto mb-2 shadow-sm">
                      <span className="font-bold text-sm gradient-text">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                    </div>
                    <p className="text-[13px] font-semibold text-navy whitespace-pre-line leading-snug">
                      {step.label}
                    </p>
                  </div>
                </motion.div>
              );
            })}

            {/* SVG arc arrows */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              viewBox="0 0 100 100"
            >
              {flywheelSteps.map((_, i) => {
                const startAngle = ((i * 90 - 90 + 20) * Math.PI) / 180;
                const endAngle = ((i * 90 - 90 + 70) * Math.PI) / 180;
                const r = 44;
                const x1 = 50 + r * Math.cos(startAngle);
                const y1 = 50 + r * Math.sin(startAngle);
                const x2 = 50 + r * Math.cos(endAngle);
                const y2 = 50 + r * Math.sin(endAngle);

                return (
                  <motion.path
                    key={`arrow-${i}`}
                    d={`M ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2}`}
                    fill="none"
                    stroke="url(#grad)"
                    strokeWidth="0.35"
                    strokeDasharray="1.5 1"
                    initial={{ pathLength: 0 }}
                    animate={isInView ? { pathLength: 1 } : {}}
                    transition={{ delay: 0.8 + i * 0.1, duration: 0.8 }}
                  />
                );
              })}
              <defs>
                <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#0052FF" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="#06B6D4" stopOpacity="0.3" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          {/* Mobile vertical layout */}
          <div className="md:hidden space-y-3">
            {flywheelSteps.map((step, i) => (
              <ScrollReveal key={i} delay={i * 0.1}>
                <div className="relative">
                  <div className="flex items-start gap-4 p-5 rounded-2xl glass border border-base-blue/[0.08]">
                    <div className="w-10 h-10 rounded-xl bg-white border border-base-blue/15 flex items-center justify-center shrink-0 shadow-sm">
                      <span className="font-bold text-sm gradient-text">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-navy text-sm mb-0.5">
                        {step.label.replace("\n", " ")}
                      </p>
                      <p className="text-xs text-slate leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </div>
                  {i < flywheelSteps.length - 1 && (
                    <div className="flex justify-center py-1">
                      <svg
                        width="12"
                        height="16"
                        viewBox="0 0 12 16"
                        fill="none"
                      >
                        <path
                          d="M6 0v12m0 0l-4-4m4 4l4-4"
                          stroke="url(#arrowGrad)"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <defs>
                          <linearGradient
                            id="arrowGrad"
                            x1="6"
                            y1="0"
                            x2="6"
                            y2="16"
                          >
                            <stop offset="0%" stopColor="#0052FF" />
                            <stop offset="100%" stopColor="#06B6D4" />
                          </linearGradient>
                        </defs>
                      </svg>
                    </div>
                  )}
                </div>
              </ScrollReveal>
            ))}

            <ScrollReveal delay={0.4}>
              <div className="flex justify-center pt-2">
                <div className="flex items-center gap-2 px-4 py-2 rounded-full glass border border-base-blue/10">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 14 14"
                    fill="none"
                  >
                    <path
                      d="M1 7a6 6 0 1011.5 2.5"
                      stroke="#0052FF"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                    <path
                      d="M10 12l2.5-2.5L10 7"
                      stroke="#0052FF"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span className="text-xs font-semibold gradient-text">
                    Cycle repeats
                  </span>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>

        {/* Summary */}
        <ScrollReveal delay={0.3}>
          <div className="mt-16 md:mt-20 text-center">
            <div className="inline-flex items-center gap-3 px-6 py-3.5 rounded-full glass border border-base-blue/10 shadow-sm">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path
                  d="M9 2v14M5 6l4-4 4 4"
                  stroke="#0052FF"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="text-sm text-navy font-medium">
                More markets &rarr; More burns &rarr; Less supply &rarr;{" "}
                <span className="font-bold gradient-text">
                  Permanent value accrual
                </span>
              </span>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
