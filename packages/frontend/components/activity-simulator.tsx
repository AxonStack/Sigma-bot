"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface FakeTrade {
  id: string;
  user: string;
  type: "buy" | "sell";
  outcome: "yes" | "no";
  amount: string;
  time: string;
}

const ADJECTIVES = ["Velvet", "Scarlet", "Whale", "Pulse", "Trader", "Nova", "Apex"];
const NOUNS = ["User", "Bot", "Player", "Investor", "Giga", "Pulse"];

function generateFakeUser() {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const num = Math.floor(Math.random() * 999);
  return `${adj}${noun}${num}`;
}

function generateFakeTrade(): FakeTrade {
  const isYes = Math.random() > 0.4;
  const amount = (Math.random() * 150 + 50).toFixed(0);
  
  return {
    id: Math.random().toString(36).substr(2, 9),
    user: generateFakeUser(),
    type: "buy", // Mostly buys for the vibe
    outcome: isYes ? "yes" : "no",
    amount,
    time: "Just now",
  };
}

export function ActivitySimulator() {
  const [trades, setTrades] = useState<FakeTrade[]>(() =>
    Array.from({ length: 5 }, () => generateFakeTrade())
  );

  useEffect(() => {
    const interval = setInterval(() => {
      const newTrade = generateFakeTrade();
      setTrades((prev) => [newTrade, ...prev].slice(0, 15));
    }, Math.random() * 15000 + 10000); // Every 10-25 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="mt-8 border-t border-white/8 pt-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[11px] font-semibold tracking-[0.2em] uppercase text-white/35">
          Live Market Activity
        </h3>
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-bold">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          LIVE
        </div>
      </div>

      <div className="space-y-3 overflow-hidden max-h-[400px]">
        <AnimatePresence initial={false}>
          {trades.map((trade) => (
            <motion.div
              key={trade.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex items-center justify-between rounded-xl border border-white/8 bg-white/[0.04] p-3 text-xs backdrop-blur-xl transition-colors hover:border-white/14"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.08] text-[10px] font-semibold uppercase text-white/72">
                  OB
                </div>
                <div>
                  <p className="font-semibold text-white">{trade.user}</p>
                  <div className="flex items-center gap-1 text-[10px] text-white/38">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-white/30" />
                    {trade.time}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className={`font-bold ${trade.outcome === 'yes' ? 'text-emerald-300' : 'text-red-300'}`}>
                  +{trade.amount} OPENBET
                </p>
                <p className="text-[10px] text-white/38 uppercase">On {trade.outcome}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
