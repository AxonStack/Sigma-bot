"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { CreateMarketModal } from "./create-market-modal";

const heroStats = [
  { label: "Launch time", value: "< 60 sec" },
  { label: "Network", value: "Base" },
  { label: "Liquidity", value: "Instant" },
];

export function Hero() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <section className="hero-noise hero-spotlight relative overflow-hidden px-6 pb-24 pt-36 sm:px-8 md:pb-28 md:pt-40">
      <CreateMarketModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

      <div className="absolute inset-0 bg-grid opacity-[0.06]" />
      <div
        className="blob absolute -left-16 top-24 h-[300px] w-[300px] opacity-40"
        style={{ background: "rgba(255, 40, 96, 0.32)" }}
      />
      <div
        className="blob-slow absolute right-[-40px] top-10 h-[320px] w-[320px] opacity-35"
        style={{ background: "rgba(255, 112, 176, 0.28)" }}
      />
      <div
        className="absolute inset-x-0 top-0 h-[420px]"
        style={{
          background:
            "radial-gradient(circle at 50% 0%, rgba(255, 42, 104, 0.24), transparent 50%)",
        }}
      />

      <div className="relative mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.23, 1, 0.32, 1] }}
          className="mx-auto max-w-4xl text-center"
        >
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-[11px] font-medium uppercase tracking-[0.28em] text-white/60">
            <span className="h-2 w-2 rounded-full bg-[#ff5e8f] shadow-[0_0_14px_rgba(255,94,143,0.8)]" />
            OpenBet live on Base
          </div>

          <h1 className="font-display text-[3.1rem] leading-[0.95] tracking-[-0.05em] text-white sm:text-[4.6rem] md:text-[6.3rem]">
            Markets with
            <br />
            <span className="gradient-text">less noise, more conviction.</span>
          </h1>

          <p className="mx-auto mt-7 max-w-2xl text-base leading-8 text-white/68 sm:text-lg">
            OpenBet turns clear questions into live prediction markets with a cleaner launch flow,
            faster liquidity, and a trading surface that feels sharper from the first second.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="button-primary w-full rounded-full px-7 py-4 text-sm font-semibold uppercase tracking-[0.2em] sm:w-auto"
            >
              Launch a market
            </button>
            <Link
              href="/markets"
              className="button-secondary w-full rounded-full px-7 py-4 text-sm font-semibold uppercase tracking-[0.2em] sm:w-auto"
            >
              Explore markets
            </Link>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12, duration: 0.45, ease: [0.23, 1, 0.32, 1] }}
          className="mx-auto mt-16 max-w-4xl"
        >
          <div className="rounded-[32px] border border-white/10 bg-white/[0.03] p-4 shadow-[0_24px_90px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/8 pb-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.28em] text-white/38">Live tape</p>
                <p className="mt-2 text-xl font-semibold text-white sm:text-2xl">
                  Will ETH reclaim a yearly high before June closes?
                </p>
              </div>
              <div className="rounded-full border border-[#ff7aa7]/30 bg-[#ff4677]/12 px-4 py-2 text-right">
                <p className="text-[11px] uppercase tracking-[0.26em] text-[#ffc0d4]">Yes</p>
                <p className="text-2xl font-semibold text-white">61.4%</p>
              </div>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              {heroStats.map((stat, index) => (
                <div key={stat.label} className="relative">
                  <div className="absolute inset-x-0 top-0 h-px minimal-divider" />
                  <div className="pt-4">
                    <p className="text-[11px] uppercase tracking-[0.24em] text-white/38">
                      {stat.label}
                    </p>
                    <p className="mt-2 text-lg font-semibold text-white">
                      {stat.value}
                    </p>
                  </div>
                  {index < heroStats.length - 1 && (
                    <div className="absolute right-0 top-4 hidden h-10 w-px bg-white/8 sm:block" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
