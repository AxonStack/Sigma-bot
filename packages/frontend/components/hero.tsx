"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { FACTORY_ABI } from "@/lib/abi/abi";
import { CreateMarketModal } from "./create-market-modal";

export function Hero() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <CreateMarketModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      {/* Base gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-ice-deep via-ice to-white" />

      {/* Grid pattern */}
      <div className="absolute inset-0 bg-grid opacity-60" />

      {/* Floating mesh blobs */}
      <div
        className="absolute top-16 -left-32 w-[500px] h-[500px] blob opacity-60"
        style={{ background: "rgba(0,82,255,0.12)" }}
      />
      <div
        className="absolute -top-20 right-0 w-[400px] h-[400px] blob-slow opacity-50"
        style={{ background: "rgba(6,182,212,0.1)" }}
      />
      <div
        className="absolute bottom-32 left-1/3 w-[350px] h-[350px] blob opacity-40"
        style={{
          background: "rgba(232,89,79,0.08)",
          animationDelay: "-8s",
        }}
      />
      <div
        className="absolute bottom-0 right-1/4 w-[300px] h-[300px] blob-slow opacity-30"
        style={{ background: "rgba(245,166,35,0.08)" }}
      />

      {/* Wave decoration */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg
          viewBox="0 0 1440 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full"
          preserveAspectRatio="none"
        >
          <path
            d="M0 60C240 20 480 100 720 60C960 20 1200 100 1440 60V120H0V60Z"
            fill="white"
            fillOpacity="0.5"
          />
          <path
            d="M0 80C240 40 480 120 720 80C960 40 1200 120 1440 80V120H0V80Z"
            fill="white"
          />
        </svg>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 pt-28 pb-36 text-center">
        {/* Logo with glow ring */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="mb-10"
        >
          <div className="animate-float inline-block relative">
            {/* Glow ring */}
            <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-base-blue/20 via-cyan/10 to-coral/10 blur-xl animate-pulse-ring" />
            <Image
              src="/logo.png"
              alt="SigmaBet"
              width={150}
              height={150}
              priority
              className="relative rounded-3xl shadow-2xl shadow-base-blue/20"
            />
          </div>
        </motion.div>

        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="mb-8"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass border border-base-blue/10 text-base-blue text-xs font-semibold tracking-widest uppercase shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            Live on Base &middot; Agent #14493
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: 0.3,
            duration: 0.8,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl leading-[1.05] tracking-tight text-navy mb-6"
        >
          Any Question.
          <br />
          <span className="gradient-text">Instant Market.</span>
          <br />
          Zero Cold Start.
        </motion.h1>

        {/* Subtext */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="text-lg md:text-xl text-slate max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          SigmaBet is an AI agent that creates prediction markets on demand
          &mdash; instantly tradeable with guaranteed liquidity in{" "}
          <span className="text-navy font-semibold">$CLAWDBET</span>. No
          gatekeepers. No approvals. No cold starts.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65, duration: 0.6 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 bg-gradient-to-r from-base-blue to-cyan text-white text-base font-semibold rounded-full shadow-[0_0_30px_rgba(0,82,255,0.3)] hover:shadow-[0_0_50px_rgba(0,82,255,0.45)] transition-all duration-300 active:scale-[0.97]"
          >
            Create a Prediction Market
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M1 8h14m0 0l-5-5m5 5l-5 5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <a
            href="https://flaunch.gg/base/coin/0x5178f9df8274d76841aadb13f22e0f7fa7f219a0"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 glass text-navy text-base font-semibold rounded-full border border-navy/10 hover:border-base-blue/30 hover:shadow-lg transition-all duration-300 active:scale-[0.97]"
          >
            Trade $CLAWDBET
          </a>
        </motion.div>

        {/* Community link */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.85, duration: 0.6 }}
          className="mt-6"
        >
          <a
            href="https://x.com/clawbetonbase"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-slate hover:text-base-blue transition-colors duration-200"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            Join the community &mdash; @clawbetonbase
          </a>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="absolute bottom-12 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <svg
              width="20"
              height="28"
              viewBox="0 0 20 28"
              fill="none"
              className="text-slate/40"
            >
              <rect
                x="1"
                y="1"
                width="18"
                height="26"
                rx="9"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <circle cx="10" cy="9" r="2" fill="currentColor" />
            </svg>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
