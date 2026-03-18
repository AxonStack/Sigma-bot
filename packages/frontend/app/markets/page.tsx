"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Navbar } from "@/components/navbar";
import { MARKETS_API } from "@/lib/config";

type Market = {
  createdAt: string;
  market_address: string;
  market_endTime: string;
  creator: string;
  question: string;
  yes_odds?: number;
  no_odds?: number;
};

function conditionIdFromAddress(market_address: string): string {
  return market_address.startsWith("0x") ? market_address.slice(2) : market_address;
}

function extractDateFromQuestion(question: string): string | null {
  const match = question.match(/\d{4}-\d{2}-\d{2}/);
  return match ? match[0] : null;
}

function isTimeOnly(t: string): boolean {
  return /^\d{1,2}:\d{2}(:\d{2})?$/.test(t.trim());
}

function parseEndDate(market: Market): Date | null {
  const t = market.market_endTime.trim();
  if (t.includes("T") || /^\d{4}-\d{2}-\d{2}/.test(t)) {
    const d = new Date(t);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  if (isTimeOnly(t)) {
    const dateStr = extractDateFromQuestion(market.question);
    if (!dateStr) return null;
    const [h, m, s] = t.split(":").map((x) => x.padStart(2, "0"));
    const iso = `${dateStr}T${h}:${m}:${s || "00"}Z`;
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return null;
}

function formatTimeLeft(market: Market): { primary: string; secondary: string; under48h: boolean } | null {
  const d = parseEndDate(market);
  if (!d) return null;
  const now = Date.now();
  const ms = d.getTime() - now;
  const under48h = ms > 0 && ms < 48 * 60 * 60 * 1000;
  let primary: string;
  if (ms <= 0) {
    primary = "Ended";
  } else {
    const days = Math.floor(ms / (24 * 60 * 60 * 1000));
    const hours = Math.floor((ms % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    if (days >= 30) {
      const months = Math.floor(days / 30);
      const d2 = days % 30;
      primary = d2 ? `${months}mo ${d2}d` : `${months}mo`;
    } else if (days >= 1) {
      primary = hours ? `${days}d ${hours}h` : `${days}d`;
    } else {
      primary = `${hours}h`;
    }
  }
  const secondary = d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
  return { primary, secondary, under48h };
}

const PAGE_SIZE = 12;

export default function MarketsPage() {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<"list" | "grid">("grid");
  const [page, setPage] = useState(1);

  useEffect(() => {
    let cancelled = false;
    fetch(MARKETS_API)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: Market[]) => {
        if (!cancelled) setMarkets(Array.isArray(data) ? data : []);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load markets");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const liveCount = markets.filter((m) => {
    const tl = formatTimeLeft(m);
    return tl && tl.primary !== "Ended";
  }).length;

  const totalPages = Math.max(1, Math.ceil(markets.length / PAGE_SIZE));
  const effectivePage = Math.min(page, totalPages);
  const paginatedMarkets = markets.slice(
    (effectivePage - 1) * PAGE_SIZE,
    effectivePage * PAGE_SIZE
  );

  return (
    <main className="min-h-screen relative overflow-hidden">
      {/* Background layers */}
      <div className="absolute inset-0 bg-gradient-to-b from-ice-deep via-ice to-white" />
      <div className="absolute inset-0 bg-grid opacity-70" />
      <div
        className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full opacity-25 blur-3xl blob-slow pointer-events-none"
        style={{ background: "rgba(0,82,255,0.07)" }}
      />
      <div
        className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full opacity-20 blur-3xl blob-slow pointer-events-none"
        style={{ background: "rgba(6,182,212,0.08)" }}
      />

      <Navbar />

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 pt-20 md:pt-24 pb-16">
        {/* ── Header ── */}
        <div className="flex items-end justify-between mb-4">
          <h1 className="font-display text-xl md:text-2xl text-navy tracking-tight leading-none">
            Markets
          </h1>
          {!loading && !error && markets.length > 0 && (
            <div className="flex items-center gap-4 text-xs tabular-nums select-none">
              <span className="text-slate">{markets.length} total</span>
              <span className="flex items-center gap-1.5 text-navy font-medium">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                </span>
                {liveCount} live
              </span>

              {/* View toggle */}
              <div className="flex items-center rounded-lg border border-navy/[0.08] bg-white overflow-hidden ml-1">
                <button
                  onClick={() => setView("list")}
                  className={[
                    "p-1.5 transition-colors duration-100",
                    view === "list"
                      ? "bg-base-blue text-white"
                      : "text-slate hover:text-navy",
                  ].join(" ")}
                  aria-label="List view"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
                <button
                  onClick={() => setView("grid")}
                  className={[
                    "p-1.5 transition-colors duration-100",
                    view === "grid"
                      ? "bg-base-blue text-white"
                      : "text-slate hover:text-navy",
                  ].join(" ")}
                  aria-label="Grid view"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Loading ── */}
        {loading && (
          <div className="flex items-center justify-center py-24">
            <div className="w-6 h-6 rounded-full border-2 border-base-blue border-t-transparent animate-spin" />
          </div>
        )}

        {/* ── Error ── */}
        {error && (
          <div className="rounded-lg bg-white border border-coral/20 p-5 text-center">
            <p className="font-semibold text-sm text-navy">Could not load markets</p>
            <p className="text-xs text-slate mt-1">{error}</p>
          </div>
        )}

        {/* ── Empty ── */}
        {!loading && !error && markets.length === 0 && (
          <div className="rounded-lg bg-white border border-navy/[0.08] p-8 text-center">
            <p className="font-semibold text-sm text-navy">No markets yet</p>
            <p className="text-xs text-slate mt-1">Markets will appear here once created.</p>
          </div>
        )}

        {/* ── Markets ── */}
        {!loading && !error && markets.length > 0 && (
          <>
            {/* ═══ LIST VIEW ═══ */}
            {view === "list" && (
              <>
                {/* Column headers — desktop */}
                <div className="hidden md:grid grid-cols-[1fr_72px_72px_92px_28px] gap-3 items-center px-5 pb-2">
                  <span className="text-[10px] font-bold text-slate/60 uppercase tracking-[0.14em]">
                    Market
                  </span>
                  <span className="text-[10px] font-bold text-slate/60 uppercase tracking-[0.14em] text-center">
                    Yes
                  </span>
                  <span className="text-[10px] font-bold text-slate/60 uppercase tracking-[0.14em] text-center">
                    No
                  </span>
                  <span className="text-[10px] font-bold text-slate/60 uppercase tracking-[0.14em] text-right">
                    Expires
                  </span>
                  <span />
                </div>

                {/* Row container */}
                <div className="bg-white rounded-xl border border-navy/[0.08] shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
                  {paginatedMarkets.map((market, i) => {
                    const yesPercent = typeof market.yes_odds === "number" ? market.yes_odds : 50;
                    const noPercent = typeof market.no_odds === "number" ? market.no_odds : 50;
                    const hasOdds = market.yes_odds != null || market.no_odds != null;
                    const isVolatile = hasOdds && yesPercent >= 45 && yesPercent <= 55;
                    const timeLeft = formatTimeLeft(market);
                    const isEnded = timeLeft?.primary === "Ended";

                    return (
                      <motion.div
                        key={market.market_address}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.15, delay: i * 0.02 }}
                        className={i > 0 ? "border-t border-navy/[0.05]" : ""}
                      >
                        <Link
                          href={`/market/${conditionIdFromAddress(market.market_address)}`}
                          className={[
                            "block md:grid md:grid-cols-[1fr_72px_72px_92px_28px] md:gap-3 md:items-center",
                            "px-5 py-3.5",
                            "border-l-[3px] border-l-transparent",
                            "transition-all duration-100",
                            "hover:bg-ice/80 hover:border-l-base-blue",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-base-blue/30 focus-visible:ring-inset",
                            "group cursor-pointer",
                            isEnded ? "opacity-50 hover:opacity-70" : "",
                          ].join(" ")}
                        >
                          {/* Question column */}
                          <div className="min-w-0 pr-2">
                            <div className="flex items-start gap-2">
                              <p
                                className={[
                                  "text-[13px] leading-[1.45] font-medium text-navy",
                                  "group-hover:text-base-blue transition-colors duration-100",
                                  "line-clamp-2",
                                  isEnded ? "line-through decoration-navy/20" : "",
                                ].join(" ")}
                              >
                                {market.question}
                              </p>
                              {isVolatile && !isEnded && (
                                <span className="shrink-0 mt-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-gold/15 text-gold leading-none">
                                  Hot
                                </span>
                              )}
                            </div>

                            {/* Mobile: prices + time inline */}
                            <div className="flex items-center gap-2 mt-2.5 md:hidden">
                              {hasOdds ? (
                                <>
                                  <span
                                    className={[
                                      "inline-flex items-center rounded px-2 py-0.5",
                                      "text-xs font-bold tabular-nums leading-none",
                                      isEnded
                                        ? "bg-navy/[0.04] text-slate-light"
                                        : "bg-base-blue/[0.1] text-base-blue",
                                    ].join(" ")}
                                  >
                                    Yes {yesPercent}%
                                  </span>
                                  <span
                                    className={[
                                      "inline-flex items-center rounded px-2 py-0.5",
                                      "text-xs font-bold tabular-nums leading-none",
                                      isEnded
                                        ? "bg-navy/[0.04] text-slate-light"
                                        : "bg-coral/[0.08] text-coral",
                                    ].join(" ")}
                                  >
                                    No {noPercent}%
                                  </span>
                                </>
                              ) : (
                                <span className="text-[11px] text-slate-light">No odds</span>
                              )}
                              {timeLeft && (
                                <span
                                  className={[
                                    "ml-auto text-[11px] font-semibold tabular-nums",
                                    isEnded
                                      ? "text-slate-light"
                                      : timeLeft.under48h
                                        ? "text-amber-600"
                                        : "text-slate",
                                  ].join(" ")}
                                >
                                  {isEnded ? "Closed" : timeLeft.primary}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Yes price — desktop */}
                          <div className="hidden md:flex justify-center">
                            {hasOdds ? (
                              <span
                                className={[
                                  "inline-flex items-center justify-center min-w-[52px]",
                                  "rounded-md px-2 py-1",
                                  "text-[15px] font-bold tabular-nums leading-none",
                                  "transition-colors duration-100",
                                  isEnded
                                    ? "bg-navy/[0.04] text-slate-light"
                                    : "bg-base-blue/[0.08] text-base-blue group-hover:bg-base-blue/[0.16]",
                                ].join(" ")}
                              >
                                {yesPercent}%
                              </span>
                            ) : (
                              <span className="text-xs text-slate-light">—</span>
                            )}
                          </div>

                          {/* No price — desktop */}
                          <div className="hidden md:flex justify-center">
                            {hasOdds ? (
                              <span
                                className={[
                                  "inline-flex items-center justify-center min-w-[52px]",
                                  "rounded-md px-2 py-1",
                                  "text-[15px] font-bold tabular-nums leading-none",
                                  "transition-colors duration-100",
                                  isEnded
                                    ? "bg-navy/[0.04] text-slate-light"
                                    : "bg-coral/[0.06] text-coral group-hover:bg-coral/[0.13]",
                                ].join(" ")}
                              >
                                {noPercent}%
                              </span>
                            ) : (
                              <span className="text-xs text-slate-light">—</span>
                            )}
                          </div>

                          {/* Expires — desktop */}
                          <div className="hidden md:block text-right">
                            {timeLeft ? (
                              <>
                                <p
                                  className={[
                                    "text-xs font-semibold tabular-nums leading-none",
                                    isEnded
                                      ? "text-slate-light"
                                      : timeLeft.under48h
                                        ? "text-amber-600"
                                        : "text-navy",
                                  ].join(" ")}
                                >
                                  {isEnded ? "Closed" : timeLeft.primary}
                                </p>
                                <p className="mt-1 text-[10px] text-slate-light/70 leading-none tabular-nums">
                                  {timeLeft.secondary}
                                </p>
                              </>
                            ) : (
                              <span className="text-[10px] text-slate-light">—</span>
                            )}
                          </div>

                          {/* Chevron — desktop */}
                          <div className="hidden md:flex justify-end">
                            <svg
                              className="w-3.5 h-3.5 text-slate-light/40 group-hover:text-base-blue group-hover:translate-x-0.5 transition-all duration-100"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={2.5}
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </Link>
                      </motion.div>
                    );
                  })}
                </div>
              </>
            )}

            {/* ═══ GRID / CARD VIEW ═══ */}
            {view === "grid" && (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {paginatedMarkets.map((market, i) => {
                  const yesPercent = typeof market.yes_odds === "number" ? market.yes_odds : 50;
                  const noPercent = typeof market.no_odds === "number" ? market.no_odds : 50;
                  const hasOdds = market.yes_odds != null || market.no_odds != null;
                  const isVolatile = hasOdds && yesPercent >= 45 && yesPercent <= 55;
                  const timeLeft = formatTimeLeft(market);
                  const isEnded = timeLeft?.primary === "Ended";

                  return (
                    <motion.div
                      key={market.market_address}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: i * 0.03 }}
                    >
                      <Link
                        href={`/market/${conditionIdFromAddress(market.market_address)}`}
                        className={[
                          "flex flex-col rounded-xl bg-white border border-navy/[0.08] overflow-hidden",
                          "shadow-[0_1px_3px_rgba(0,0,0,0.04)]",
                          "h-full",
                          "transition-all duration-150 group cursor-pointer",
                          "hover:shadow-[0_8px_24px_rgba(0,82,255,0.1)] hover:border-base-blue/25",
                          "hover:-translate-y-0.5",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-base-blue/30",
                          isEnded ? "opacity-50 hover:opacity-70" : "",
                        ].join(" ")}
                      >
                        {/* Header strip: time + status */}
                        <div className="flex items-center justify-between px-4 py-2 bg-navy/[0.02] border-b border-navy/[0.05]">
                          {timeLeft ? (
                            <span
                              className={[
                                "text-[11px] font-semibold tabular-nums flex items-center gap-1.5",
                                isEnded
                                  ? "text-slate-light"
                                  : timeLeft.under48h
                                    ? "text-amber-600"
                                    : "text-slate",
                              ].join(" ")}
                            >
                              {!isEnded && (
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z" />
                                </svg>
                              )}
                              {isEnded ? "Closed" : timeLeft.primary}
                            </span>
                          ) : (
                            <span />
                          )}
                          <div className="flex items-center gap-2">
                            {isVolatile && !isEnded && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-gold/15 text-gold leading-none">
                                Hot
                              </span>
                            )}
                            {!isEnded && (
                              <span className="flex items-center gap-1 text-[10px] text-green-600 font-medium">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                Live
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Question */}
                        <div className="px-4 pt-3.5 pb-2">
                          <p
                            className={[
                              "text-[13px] leading-[1.5] font-medium text-navy",
                              "group-hover:text-base-blue transition-colors duration-100",
                              "line-clamp-2",
                              isEnded ? "line-through decoration-navy/20" : "",
                            ].join(" ")}
                          >
                            {market.question}
                          </p>
                        </div>

                        {/* Spacer */}
                        <div className="flex-1" />

                        {/* Yes / No action boxes + probability bar */}
                        {hasOdds && (
                          <div className="px-4 pb-4">
                            <div className="grid grid-cols-2 gap-2">
                              <div
                                className={[
                                  "flex flex-col items-center rounded-lg py-2.5 transition-colors duration-100",
                                  isEnded
                                    ? "bg-navy/[0.03]"
                                    : "bg-base-blue/[0.06] group-hover:bg-base-blue/[0.12]",
                                ].join(" ")}
                              >
                                <span className="text-[10px] font-semibold uppercase tracking-wider text-base-blue/60 mb-0.5">
                                  Yes
                                </span>
                                <span
                                  className={[
                                    "font-display text-lg font-bold tabular-nums leading-none",
                                    isEnded ? "text-slate-light" : "text-base-blue",
                                  ].join(" ")}
                                >
                                  {yesPercent}%
                                </span>
                              </div>
                              <div
                                className={[
                                  "flex flex-col items-center rounded-lg py-2.5 transition-colors duration-100",
                                  isEnded
                                    ? "bg-navy/[0.03]"
                                    : "bg-coral/[0.05] group-hover:bg-coral/[0.10]",
                                ].join(" ")}
                              >
                                <span className="text-[10px] font-semibold uppercase tracking-wider text-coral/60 mb-0.5">
                                  No
                                </span>
                                <span
                                  className={[
                                    "font-display text-lg font-bold tabular-nums leading-none",
                                    isEnded ? "text-slate-light" : "text-coral",
                                  ].join(" ")}
                                >
                                  {noPercent}%
                                </span>
                              </div>
                            </div>

                            {/* Probability bar */}
                            <div className="mt-2.5 h-1.5 rounded-full bg-navy/[0.06] overflow-hidden">
                              <motion.div
                                className="h-full rounded-full"
                                style={{
                                  background: "linear-gradient(90deg, #0052FF 0%, #3B82F6 60%, #06B6D4 100%)",
                                }}
                                initial={{ width: "0%" }}
                                animate={{ width: `${yesPercent}%` }}
                                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                              />
                            </div>
                          </div>
                        )}
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* ── Pagination ── */}
            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-center gap-3">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={effectivePage <= 1}
                  className={[
                    "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                    effectivePage <= 1
                      ? "text-slate-light cursor-not-allowed"
                      : "text-navy hover:bg-navy/[0.06]",
                  ].join(" ")}
                  aria-label="Previous page"
                >
                  Previous
                </button>
                <span className="text-sm text-slate tabular-nums">
                  Page {effectivePage} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={effectivePage >= totalPages}
                  className={[
                    "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                    effectivePage >= totalPages
                      ? "text-slate-light cursor-not-allowed"
                      : "text-navy hover:bg-navy/[0.06]",
                  ].join(" ")}
                  aria-label="Next page"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
