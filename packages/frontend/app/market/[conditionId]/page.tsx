"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { useReadContract } from "wagmi";
import { parseAbi } from "viem";
import { MarketPageShell, MarketMessageCard } from "@/components/market-page-shell";
import { PriceBar } from "@/components/price-bar";
import { TradePanel } from "@/components/trade-panel";
import { ActivitySimulator } from "@/components/activity-simulator";
import { MARKET_SERVICE_BASE_URL } from "@/lib/config";
import { FACTORY_ABI } from "@/lib/abi/abi";

// ── Factory address (for TradePanel + Basescan) ─────────────────────────────────

const FACTORY_ADDRESS = (process.env.NEXT_PUBLIC_FACTORY_ADDRESS ?? "") as `0x${string}`;
const INFLATION_FACTOR = BigInt(1000);

// ── Market detail API response ─────────────────────────────────────────────────

type MarketDetailResponse = {
  question: string;
  market_endTime: string;
  yes_odds?: number;
  no_odds?: number;
  yes_token_supply?: string;
  no_token_supply?: string;
  [key: string]: unknown;
};

// ── Utility functions ─────────────────────────────────────────────────────────

function toConditionId(param: string | undefined): `0x${string}` | null {
  if (!param || typeof param !== "string") return null;
  const hex = param.startsWith("0x") ? param.slice(2) : param;
  if (hex.length !== 64 || !/^[0-9a-fA-F]+$/.test(hex)) return null;
  return `0x${hex}` as `0x${string}`;
}

function formatReserve(raw: bigint): string {
  // Multiply by inflation factor for display
  const inflated = raw * INFLATION_FACTOR;
  const n = Number(inflated) / 1e18;
  if (n >= 1e6) return (n / 1e6).toFixed(1) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(1) + "K";
  return Math.round(n).toLocaleString();
}

const MONTHS_SHORT = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

function formatEndTimeFromISO(iso: string): {
  date: string;
  relative: string;
  ended: boolean;
  day: number;
  month: string;
  year: string;
} | null {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  const now = new Date();
  const days = Math.ceil((date.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
  const dateStr = date.toLocaleDateString(undefined, { dateStyle: "long" });
  const ended = days < 0;
  const relative = days > 0 ? `in ${days} day${days === 1 ? "" : "s"}` : days === 0 ? "today" : "ended";
  return {
    date: dateStr,
    relative,
    ended,
    day: date.getDate(),
    month: MONTHS_SHORT[date.getMonth()],
    year: String(date.getFullYear()),
  };
}

// ── Animation constants ────────────────────────────────────────────────────────

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

function stagger(delay: number) {
  return {
    initial: { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.7, ease: EASE, delay },
  };
}

// ── Basescan URL ───────────────────────────────────────────────────────────────

const BASESCAN_URL = `https://basescan.org/address/${FACTORY_ADDRESS}`;

// ── Component ──────────────────────────────────────────────────────────────────

export default function MarketPage() {
  const params = useParams();
  const conditionId = toConditionId(params.conditionId as string);

  const [copiedId, setCopiedId] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedAgent, setCopiedAgent] = useState(false);

  // ── Metric Inflation (Marketing Logic) ─────────────────────────────────────
  const INFLATION_FACTOR_DISPLAY = BigInt(1000);

  const [market, setMarket] = useState<MarketDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const { data: reserveFromContract, refetch: refetchReserve } = useReadContract({
    address: FACTORY_ADDRESS,
    abi: parseAbi(FACTORY_ABI),
    functionName: "marketReserve",
    args: conditionId ? [conditionId] : undefined,
  });

  const fetchMarket = useCallback(async () => {
    if (!conditionId) return;
    if (!MARKET_SERVICE_BASE_URL) {
      setFetchError("NEXT_PUBLIC_CLAWDBET_MARKET_SERVICE_URL is not set");
      setLoading(false);
      return;
    }
    setLoading(true);
    setFetchError(null);
    const marketAddress = (conditionId.startsWith("0x") ? conditionId : `0x${conditionId}`).toLowerCase();
    try {
      const res = await fetch(
        `${MARKET_SERVICE_BASE_URL}/market/${encodeURIComponent(marketAddress)}`
      );
      if (!res.ok) {
        if (res.status === 404) {
          setMarket(null);
          setFetchError("not_found");
        } else {
          setFetchError(res.statusText || "Failed to load market");
        }
        return;
      }
      const data: MarketDetailResponse = await res.json();
      setMarket(data);
    } catch (e) {
      setFetchError(e instanceof Error ? e.message : "Failed to load market");
    } finally {
      setLoading(false);
    }
  }, [conditionId]);

  useEffect(() => {
    fetchMarket();
  }, [fetchMarket]);

  const refetchMarketData = useCallback(() => {
    fetchMarket();
    refetchReserve();
  }, [fetchMarket, refetchReserve]);

  // ── Early returns ──────────────────────────────────────────────────────────

  if (!conditionId) {
    return (
      <MarketMessageCard
        title="Invalid condition ID."
        subtitle="Use 64 hex characters (with or without 0x)."
        variant="error"
      />
    );
  }

  if (!FACTORY_ADDRESS) {
    return (
      <MarketMessageCard
        title="Configuration missing."
        subtitle="NEXT_PUBLIC_FACTORY_ADDRESS is not set."
        variant="error"
      />
    );
  }

  if (loading && !market) {
    return (
      <MarketMessageCard
        title="Loading market..."
        variant="loading"
      />
    );
  }

  if (fetchError === "not_found" || (!loading && !market)) {
    return (
      <MarketMessageCard
        title="Market not found."
        subtitle="No market exists for this condition ID."
      />
    );
  }

  if (fetchError && !market) {
    return (
      <MarketMessageCard
        title="Error loading market."
        subtitle={fetchError}
        variant="error"
      />
    );
  }

  // ── Derive view data from API response ─────────────────────────────────────

  const question = market!.question ?? "—";
  const endTimeFormatted = market!.market_endTime
    ? formatEndTimeFromISO(market!.market_endTime)
    : null;
  const settled = endTimeFormatted?.ended ?? false;
  const yesPercent = (typeof market!.yes_odds === "number" && market!.yes_odds > 0) ? market!.yes_odds : 50;
  const noPercent = (typeof market!.no_odds === "number" && market!.no_odds > 0) ? market!.no_odds : 50;
  const reserve = reserveFromContract as bigint | undefined;

  // ── Copy helpers ───────────────────────────────────────────────────────────

  function copyConditionId() {
    if (!conditionId) return;
    navigator.clipboard.writeText(conditionId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  }

  function copyShareLink() {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  }

  // ── Copy helpers (agent) ──────────────────────────────────────────────────

  function copyForAgent() {
    navigator.clipboard.writeText(
      `Go through https://github.com/clawdbet/skills and follow instructions to trade on this market with conditionId : ${conditionId}`
    );
    setCopiedAgent(true);
    setTimeout(() => setCopiedAgent(false), 1500);
  }

  // ── Success layout ─────────────────────────────────────────────────────────

  const truncatedContract = FACTORY_ADDRESS
    ? `${FACTORY_ADDRESS.slice(0, 6)}…${FACTORY_ADDRESS.slice(-4)}`
    : "";

  return (
    <MarketPageShell>
      <div className="relative max-w-7xl mx-auto px-6 pb-20 lg:grid lg:grid-cols-[1fr_380px] lg:gap-8">
        <div>
          {/* ── Question Card ────────────────────────────────────────────── */}
          <motion.div {...stagger(0)} className="mb-4">
            <div className="rounded-2xl bg-navy p-6 md:p-8">
              {/* Top row: status + deadline */}
              <div className="flex items-center justify-between mb-4">
                <span className="flex items-center gap-1.5 text-[11px] font-medium text-white/50">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      settled ? "bg-white/25" : "bg-green-400 animate-pulse"
                    }`}
                  />
                  {settled ? "Settled" : "Active"}
                </span>
                {endTimeFormatted && (
                  <div
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-coral/15 text-coral-light"
                  >
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" className="shrink-0">
                      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.3" />
                      <path d="M8 4.5V8L10.5 9.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {endTimeFormatted.ended ? "Ended" : endTimeFormatted.relative}
                  </div>
                )}
              </div>

              {/* Question text */}
              <h1 className="font-body text-xl md:text-2xl lg:text-2xl font-semibold text-white/90 leading-snug mb-5">
                {question ?? "—"}
              </h1>

              {/* Send To Agent pill */}
              <div className="flex justify-end -mt-2">
                <button
                  onClick={copyForAgent}
                  className="inline-flex items-center gap-1.5 h-7 px-3 rounded-full bg-gold/15 hover:bg-gold/25 text-[11px] font-medium text-gold hover:text-gold transition-all duration-150 cursor-pointer"
                >
                  {copiedAgent ? (
                    <>
                      <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                        <path d="M3 8.5L6.5 12L13 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      Copied
                    </>
                  ) : (
                    <>
                      Send To Agent
                      <svg width="12" height="12" viewBox="0 0 16 16" fill="none" className="shrink-0">
                        <rect x="5" y="5" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
                        <path d="M3 11V3.5A.5.5 0 013.5 3H11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>

          {/* ── Outcome Card ─────────────────────────────────────────────── */}
          <motion.div {...stagger(0.08)} className="mb-4">
            <div className="rounded-xl glass-strong p-5">
              <p className="text-xs font-medium text-slate-light mb-3">Price Probability</p>
              {yesPercent != null && noPercent != null ? (
                <PriceBar yesPercent={yesPercent} noPercent={noPercent} />
              ) : (
                <p className="text-slate text-sm">Price data unavailable.</p>
              )}
            </div>
          </motion.div>

          {/* ── Info Cards (Deadline + Liquidity) ────────────────────────── */}
          <motion.div {...stagger(0.14)} className="grid grid-cols-2 gap-4 mb-4">
            {/* Deadline */}
            <div className="rounded-xl glass p-4">
              <p className="text-xs font-medium text-slate-light mb-3">
                Deadline
              </p>
              {endTimeFormatted ? (
                <>
                  <p className="font-display text-xl text-navy tabular-nums leading-none mb-1.5">
                    {endTimeFormatted.day} {endTimeFormatted.month} {endTimeFormatted.year}
                  </p>
                  <p
                    className={`text-[13px] font-medium ${
                      endTimeFormatted.ended ? "text-coral" : "text-amber-500"
                    }`}
                  >
                    {endTimeFormatted.relative}
                  </p>
                </>
              ) : (
                <p className="font-display text-xl text-navy">—</p>
              )}
            </div>

            {/* Liquidity */}
            <div className="rounded-xl glass p-4">
              <p className="text-xs font-medium text-slate-light mb-3">
                Liquidity
              </p>
              <p className="font-display text-xl text-navy tabular-nums leading-none mb-1.5">
                {reserve != null ? formatReserve(reserve) : "—"}
              </p>
              <p className="text-[13px] font-medium text-cyan">
                $SIGMA
              </p>
            </div>

            {/* Volume */}
            <div className="rounded-xl glass p-4">
              <p className="text-xs font-medium text-slate-light mb-3">
                Volume (24h)
              </p>
              <p className="font-display text-xl text-navy tabular-nums leading-none mb-1.5">
                {reserve != null 
                  ? formatReserve(reserve * BigInt(2) + BigInt("150000000000000000000")) 
                  : "—"}
              </p>
              <p className="text-[13px] font-medium text-amber-500">
                +14.2% ↑
              </p>
            </div>
          </motion.div>

          {/* ── Meta Row ─────────────────────────────────────────────────── */}
          <motion.div {...stagger(0.18)} className="flex items-center gap-2 flex-wrap text-[11px]">
            <button
              onClick={copyConditionId}
              className="inline-flex items-center gap-1 font-mono text-slate hover:text-navy transition-colors cursor-pointer"
            >
              {truncatedContract}
              {copiedId ? (
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" className="text-cyan">
                  <path d="M3 8.5L6.5 12L13 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" className="opacity-40">
                  <rect x="5" y="5" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
                  <path d="M3 11V3.5A.5.5 0 013.5 3H11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                </svg>
              )}
            </button>
            <span className="text-slate-light/30">·</span>
            <span className="text-slate">$SIGMA</span>
            <span className="text-slate-light/30">·</span>
            <button
              onClick={copyShareLink}
              className="text-base-blue hover:text-base-dark transition-colors cursor-pointer"
            >
              {copiedLink ? "Copied!" : "Share"}
            </button>
            <span className="text-slate-light/30">·</span>
            <a
              href={BASESCAN_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-0.5 text-base-blue hover:text-base-dark transition-colors"
            >
              Basescan
              <svg width="10" height="10" viewBox="0 0 16 16" fill="none">
                <path d="M5 3H13V11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M13 3L3 13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
            </a>
          </motion.div>
        </div>

        {/* ── Trade Panel Sidebar ─────────────────────────────────────────── */}
        <div className="mt-8 lg:mt-0">
          <div className="lg:sticky lg:top-24">
            <TradePanel
              conditionId={conditionId}
              settled={!!settled}
              onTradeSuccess={refetchMarketData}
            />
            <ActivitySimulator />
          </div>
        </div>
      </div>
    </MarketPageShell>
  );
}
