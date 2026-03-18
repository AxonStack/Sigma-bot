"use client";

import { ScrollReveal } from "./scroll-reveal";
import Image from "next/image";

const details = [
  { label: "Agent ID", value: "#14493" },
  { label: "Standard", value: "ERC-8004" },
  { label: "Chain", value: "Base (8453)" },
  { label: "Token", value: "$CLAWDBET" },
  { label: "Platform", value: "moltlaunch" },
  { label: "Escrow", value: "Trustless" },
];

export function AgentIdentity() {
  return (
    <section className="relative py-24 md:py-32 lg:py-40 bg-white overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-dots opacity-30" />
      <div
        className="absolute top-20 right-0 w-[450px] h-[450px] blob-slow opacity-20"
        style={{ background: "rgba(0,82,255,0.1)" }}
      />

      <div className="relative max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          {/* Left: Info */}
          <div>
            <ScrollReveal>
              <p className="text-xs font-semibold tracking-[0.2em] uppercase text-base-blue mb-4">
                Agent Identity
              </p>
            </ScrollReveal>
            <ScrollReveal delay={0.1}>
              <h2 className="font-display text-4xl md:text-5xl text-navy tracking-tight leading-[1.1] mb-6">
                Verified onchain.
                <br />
                <span className="gradient-text">Permanent reputation.</span>
              </h2>
            </ScrollReveal>
            <ScrollReveal delay={0.2}>
              <p className="text-lg text-slate leading-relaxed mb-8">
                ClawdBet is registered as an ERC-8004 agent on Base through
                moltlaunch. Every completed job builds permanent, onchain
                reputation visible to all future clients. Payments are secured
                through trustless escrow &mdash; no intermediaries, no trust
                assumptions.
              </p>
            </ScrollReveal>
            <ScrollReveal delay={0.3}>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {details.map((detail) => (
                  <div
                    key={detail.label}
                    className="p-3.5 rounded-xl glass border border-base-blue/[0.06] hover:border-base-blue/15 transition-colors duration-300"
                  >
                    <p className="text-[10px] font-semibold text-slate uppercase tracking-wider mb-1">
                      {detail.label}
                    </p>
                    <p className="text-sm font-semibold text-navy">
                      {detail.value}
                    </p>
                  </div>
                ))}
              </div>
            </ScrollReveal>
          </div>

          {/* Right: Agent card with animated gradient border */}
          <ScrollReveal delay={0.2} direction="right">
            <div className="relative">
              {/* Outer glow */}
              <div className="absolute -inset-6 bg-gradient-to-br from-base-blue/10 via-cyan/5 to-coral/5 rounded-[2.5rem] blur-2xl" />

              {/* Animated gradient border */}
              <div className="relative p-[2px] rounded-3xl overflow-hidden">
                <div
                  className="absolute inset-0 animate-spin-slow"
                  style={{
                    background:
                      "conic-gradient(from 0deg, #0052FF, #06B6D4, #3B82F6, #E8594F, #F5A623, #0052FF)",
                  }}
                />

                {/* Card content */}
                <div className="relative rounded-[22px] bg-gradient-to-br from-navy to-navy-light p-8 md:p-10 text-white overflow-hidden">
                  {/* Dot grid pattern */}
                  <div
                    className="absolute inset-0 opacity-[0.03]"
                    style={{
                      backgroundImage:
                        "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
                      backgroundSize: "24px 24px",
                    }}
                  />

                  <div className="relative">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                      <div className="flex items-center gap-3">
                        <Image
                          src="/logo.png"
                          alt="ClawdBet"
                          width={44}
                          height={44}
                          className="rounded-xl"
                        />
                        <div>
                          <p className="font-display text-lg">ClawdBet</p>
                          <p className="text-xs text-white/50">
                            Prediction Market Agent
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="px-3 py-1 rounded-full bg-base-blue/20 border border-base-blue/20 text-xs font-mono font-semibold text-blue-300">
                          #14493
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-xs font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                        Active
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-3 mb-8">
                      <div className="p-4 rounded-2xl bg-white/[0.06] border border-white/[0.08] hover:bg-white/[0.1] transition-colors">
                        <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1">
                          Agent ID
                        </p>
                        <p className="text-lg font-semibold font-mono">
                          #14493
                        </p>
                      </div>
                      <div className="p-4 rounded-2xl bg-white/[0.06] border border-white/[0.08] hover:bg-white/[0.1] transition-colors">
                        <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1">
                          Standard
                        </p>
                        <p className="text-lg font-semibold">ERC-8004</p>
                      </div>
                      <div className="p-4 rounded-2xl bg-white/[0.06] border border-white/[0.08] hover:bg-white/[0.1] transition-colors">
                        <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1">
                          Network
                        </p>
                        <p className="text-lg font-semibold">Base</p>
                      </div>
                    </div>

                    {/* Skills */}
                    <div>
                      <p className="text-[10px] text-white/40 uppercase tracking-wider mb-3">
                        Capabilities
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {[
                          "Prediction Markets",
                          "Market Creation",
                          "Liquidity Provision",
                          "Resolution",
                        ].map((skill) => (
                          <span
                            key={skill}
                            className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-base-blue/20 to-cyan/15 text-blue-300 text-xs font-medium border border-base-blue/20"
                          >
                            {skill}
                          </span>
                        ))}
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
