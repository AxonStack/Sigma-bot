"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { TrendingUp, TrendingDown, Clock, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface FakeTrade {
  id: string;
  user: string;
  type: "buy" | "sell";
  outcome: "yes" | "no";
  amount: string;
  time: string;
}

const ADJECTIVES = ["Sigma", "Alpha", "Whale", "Chad", "Trader", "Nova", "Apex"];
const NOUNS = ["User", "Bot", "Player", "Investor", "Giga", "Pulse"];

function generateFakeUser() {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const num = Math.floor(Math.random() * 999);
  return `${adj}${noun}${num}`;
}

function generateFakeTrade(): FakeTrade {
  const isYes = Math.random() > 0.4;
  const amount = (Math.random() * 5000 + 500).toFixed(0);
  
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
  const [trades, setTrades] = useState<FakeTrade[]>([]);

  useEffect(() => {
    // Initial trades
    const initial = Array.from({ length: 5 }, () => generateFakeTrade());
    setTrades(initial);

    // Simulation loop
    const interval = setInterval(() => {
      const newTrade = generateFakeTrade();
      setTrades((prev) => [newTrade, ...prev].slice(0, 15));

      // Trigger toast
      toast.success(
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${newTrade.outcome === 'yes' ? 'bg-base-blue/10 text-base-blue' : 'bg-coral/10 text-coral'}`}>
            {newTrade.outcome === 'yes' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
          </div>
          <div>
            <p className="text-sm font-semibold">{newTrade.user} bought {newTrade.amount} $SIGMA</p>
            <p className="text-[10px] text-slate-light">Outcome: {newTrade.outcome.toUpperCase()}</p>
          </div>
        </div>,
        { duration: 4000 }
      );
    }, Math.random() * 15000 + 10000); // Every 10-25 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="mt-8 pt-8 border-t border-navy/[0.06]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[11px] font-semibold tracking-[0.2em] uppercase text-slate-light">
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
              className="flex items-center justify-between p-3 rounded-xl glass-light border border-navy/[0.03] text-xs hover:border-navy/[0.08] transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-navy/[0.05] flex items-center justify-center text-slate">
                  <User size={14} />
                </div>
                <div>
                  <p className="font-semibold text-navy">{trade.user}</p>
                  <div className="flex items-center gap-1 text-[10px] text-slate-light">
                    <Clock size={10} />
                    {trade.time}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className={`font-bold ${trade.outcome === 'yes' ? 'text-base-blue' : 'text-coral'}`}>
                  +{trade.amount} $SIGMA
                </p>
                <p className="text-[10px] text-slate-light uppercase">On {trade.outcome}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
