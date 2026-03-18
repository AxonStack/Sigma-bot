"use client";

const items = [
  "PERMISSIONLESS",
  "INSTANT LIQUIDITY",
  "AI-POWERED",
  "ZERO COLD START",
  "ANY QUESTION",
  "TOKEN-BACKED",
  "ON BASE",
  "ERC-8004",
  "$CLAWDBET",
  "BUYBACK & BURN",
];

export function Marquee() {
  const repeated = [...items, ...items, ...items, ...items];

  return (
    <div className="relative overflow-hidden py-4 bg-gradient-to-r from-base-blue via-cyan to-base-blue">
      <div className="flex animate-marquee whitespace-nowrap">
        {repeated.map((item, i) => (
          <span key={i} className="flex items-center">
            <span className="mx-5 text-[13px] font-bold text-white/90 uppercase tracking-[0.25em]">
              {item}
            </span>
            <span className="text-white/30 text-xs">&#9670;</span>
          </span>
        ))}
      </div>
    </div>
  );
}
