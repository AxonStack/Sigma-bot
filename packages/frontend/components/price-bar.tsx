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
      <div className="flex items-end justify-between">
        <div className="flex items-baseline gap-2">
          <span className="font-display text-[1.75rem] md:text-[2rem] text-white tabular-nums tracking-tight leading-none">
            {yesPercent.toFixed(1)}%
          </span>
          <span className="text-xs font-medium text-emerald-400 uppercase tracking-wide">
            Yes
          </span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-xs font-medium text-red-300 uppercase tracking-wide">
            No
          </span>
          <span className="font-display text-[1.75rem] md:text-[2rem] text-white/72 tabular-nums tracking-tight leading-none">
            {noPercent.toFixed(1)}%
          </span>
        </div>
      </div>

      <div className="relative h-2 overflow-hidden rounded-full bg-white/10">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{
            background: "linear-gradient(90deg, #16a34a 0%, #34d399 100%)",
          }}
          initial={{ width: "0%" }}
          animate={{ width: `${yesPercent}%` }}
          transition={{ duration: 1.2, ease: EASE }}
        />
        <motion.div
          className="absolute inset-y-0 right-0 rounded-full"
          style={{
            background: "linear-gradient(90deg, #fb7185 0%, #dc2626 100%)",
          }}
          initial={{ width: "0%" }}
          animate={{ width: `${noPercent}%` }}
          transition={{ duration: 1.2, ease: EASE }}
        />
      </div>
    </div>
  );
}
