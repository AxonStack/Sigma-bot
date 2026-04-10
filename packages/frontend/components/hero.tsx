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
  const [createModalOpen, setCreateModalOpen] = useState(false);

  return (
    <>
      <section className="hero-noise hero-spotlight relative overflow-hidden px-4 pb-14 pt-28 sm:px-8 sm:pb-20 md:pb-28 md:pt-40">
        <div className="absolute inset-0 bg-grid opacity-[0.06]" />
        <div
          className="blob absolute -left-16 top-24 h-[300px] w-[300px] opacity-40"
          style={{ background: "rgba(11, 255, 80, 0.14)" }}
        />
        <div
          className="blob-slow absolute right-[-40px] top-10 h-[320px] w-[320px] opacity-35"
          style={{ background: "rgba(90, 255, 145, 0.12)" }}
        />
        <div
          className="absolute inset-x-0 top-0 h-[420px]"
          style={{
            background:
              "radial-gradient(circle at 50% 0%, rgba(14, 255, 85, 0.1), transparent 50%)",
          }}
        />

        <div className="relative mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.23, 1, 0.32, 1] }}
            className="mx-auto max-w-4xl text-center"
          >
            <div className="mb-6 inline-flex max-w-full items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-[10px] font-medium uppercase tracking-[0.18em] text-white/60 sm:mb-8 sm:px-4 sm:text-[11px] sm:tracking-[0.28em]">
              <span className="h-2 w-2 rounded-full bg-[#21ff66] shadow-[0_0_10px_rgba(33,255,102,0.55)]" />
              OpenBet live on Base
            </div>

            <h1 className="font-display text-[2.65rem] leading-[0.94] tracking-[-0.055em] text-white sm:text-[4.6rem] md:text-[6.3rem]">
              Markets with
              <br />
              <span className="gradient-text">less noise, more conviction.</span>
            </h1>

            <p className="mx-auto mt-6 max-w-[19rem] text-[15px] leading-7 text-white/68 sm:mt-7 sm:max-w-2xl sm:text-lg sm:leading-8">
              OpenBet turns clear questions into live prediction markets with a cleaner launch flow,
              faster liquidity, and a trading surface that feels sharper from the first second.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:mt-10 sm:gap-4 sm:flex-row">
              <button
                type="button"
                onClick={() => setCreateModalOpen(true)}
                className="button-primary w-full rounded-full px-7 py-4 text-sm font-semibold uppercase tracking-[0.18em] sm:w-auto sm:tracking-[0.2em]"
              >
                Launch a market
              </button>
              <Link
                href="/markets"
                className="button-secondary w-full rounded-full px-7 py-4 text-sm font-semibold uppercase tracking-[0.18em] sm:w-auto sm:tracking-[0.2em]"
              >
                Explore markets
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12, duration: 0.45, ease: [0.23, 1, 0.32, 1] }}
            className="mx-auto mt-10 max-w-4xl sm:mt-16"
          >
            <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-4 shadow-[0_24px_90px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:rounded-[32px] sm:p-6">
              <div className="flex items-start justify-between gap-4 border-b border-white/8 pb-4">
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] uppercase tracking-[0.28em] text-white/38">Live tape</p>
                  <p className="mt-2 max-w-[13rem] text-lg font-semibold leading-tight text-white sm:max-w-none sm:text-2xl">
                    Will ETH reclaim a yearly high before June closes?
                  </p>
                </div>
                <div className="mt-6 shrink-0 flex min-w-[7.6rem] flex-col items-center justify-center rounded-full border border-[#63ff97]/22 bg-[#1eff63]/8 px-3 py-2.5 text-center sm:mt-0 sm:min-w-[8.5rem] sm:px-4">
                  <p className="text-[9px] uppercase leading-none tracking-[0.18em] text-[#c7ffd6] sm:text-[10px] sm:tracking-[0.22em]">
                    Yes
                  </p>
                  <p className="mt-1.5 text-lg font-semibold leading-none text-white sm:text-[1.75rem]">
                    61.4%
                  </p>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
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

      <CreateMarketModal isOpen={createModalOpen} onClose={() => setCreateModalOpen(false)} />
    </>
  );
}
