"use client";

import { motion } from "framer-motion";

const EASE = [0.22, 1, 0.36, 1] as const;

export function PriceBar({
  yesPercent,
  noPercent,
}: {
  yesPercent: number;
  noPercent: number;
}) {
  return (
    <div className="space-y-3">
      {/* Metrics row */}
      <div className="flex items-end justify-between">
        <div className="flex items-baseline gap-2">
          <span className="font-display text-[1.75rem] md:text-[2rem] text-navy tabular-nums tracking-tight leading-none">
            {yesPercent.toFixed(1)}%
          </span>
          <span className="text-xs font-medium text-base-blue uppercase tracking-wide">
            Yes
          </span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-xs font-medium text-slate uppercase tracking-wide">
            No
          </span>
          <span className="font-display text-[1.75rem] md:text-[2rem] text-slate tabular-nums tracking-tight leading-none">
            {noPercent.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Bar */}
      <div className="relative h-2 rounded-full bg-navy/[0.06] overflow-hidden">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{
            background:
              "linear-gradient(90deg, #0052FF 0%, #3B82F6 60%, #06B6D4 100%)",
          }}
          initial={{ width: "0%" }}
          animate={{ width: `${yesPercent}%` }}
          transition={{ duration: 1.2, ease: EASE }}
        />
      </div>
    </div>
  );
}
