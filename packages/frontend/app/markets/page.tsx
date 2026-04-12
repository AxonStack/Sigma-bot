"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { useAccount } from "wagmi";
import { Navbar } from "@/components/navbar";
import { MARKETS_API } from "@/lib/config";
import {
  getMarketRequestsForCreator,
  MARKET_REQUESTS_UPDATED_EVENT,
  type MarketRequestEntry,
} from "@/lib/market-request-store";
import { CreateMarketModal } from "@/components/create-market-modal";

type Market = {
  createdAt: string;
  market_address: string;
  market_endTime: string;
  creator: string;
  question: string;
  yes_odds?: number;
  no_odds?: number;
};

type RequestPresentation = {
  badge: string;
  tone: string;
  copy: string;
};

function conditionIdFromAddress(marketAddress: string): string {
  return marketAddress.startsWith("0x") ? marketAddress.slice(2) : marketAddress;
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

function formatTimeLeft(
  market: Market
): { primary: string; secondary: string; under48h: boolean } | null {
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

function getRequestPresentation(entry: MarketRequestEntry, now: number): RequestPresentation {
  if (entry.status === "pending") {
    return {
      badge: "Pending",
      tone: "border-white/20 bg-white/5 text-white/50",
      copy: "Your queston is in the queue for agent review.",
    };
  }

  if (entry.status === "reviewing" || (now < entry.reviewEndsAt && entry.status !== "deployed" && entry.status !== "rejected")) {
    return {
      badge: "AI reviewing",
      tone: "border-amber-400/20 bg-amber-400/10 text-amber-200",
      copy: "An agent is reviewing your market request.",
    };
  }

  if (entry.status === "deployed") {
    return {
      badge: "Successfully deployed",
      tone: "border-emerald-400/20 bg-emerald-400/10 text-emerald-200",
      copy: "Your market passed review and was deployed.",
    };
  }

  if (entry.status === "failed") {
    return {
      badge: "Internal Error",
      tone: "border-red-500/30 bg-red-400/10 text-red-100",
      copy: entry.resolutionMessage || "An internal error occurred during processing.",
    };
  }

  return {
    badge: "Rejected",
    tone: "border-red-400/20 bg-red-400/10 text-red-200",
    copy: entry.resolutionMessage || "This market request was rejected during review.",
  };
}

export default function MarketsPage() {
  return (
    <Suspense fallback={<MarketsPageFallback />}>
      <MarketsPageContent />
    </Suspense>
  );
}

function MarketsPageFallback() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#040704] text-white">
      <div className="absolute inset-0 bg-grid opacity-[0.05]" />
      <div
        className="pointer-events-none absolute right-0 top-0 h-[500px] w-[500px] rounded-full opacity-25 blur-3xl blob-slow"
        style={{ background: "rgba(15, 230, 78, 0.14)" }}
      />
      <div
        className="pointer-events-none absolute bottom-0 left-0 h-[420px] w-[420px] rounded-full opacity-20 blur-3xl blob-slow"
        style={{ background: "rgba(74, 222, 128, 0.12)" }}
      />

      <Navbar />

      <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-24 sm:px-6 md:pt-28">
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-8 text-center backdrop-blur-xl">
          <p className="text-sm font-semibold text-white">Loading markets...</p>
        </div>
      </div>
    </main>
  );
}

function MarketsPageContent() {
  const searchParams = useSearchParams();
  const { address } = useAccount();
  const [markets, setMarkets] = useState<Market[]>([]);
  const [requestEntries, setRequestEntries] = useState<MarketRequestEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<"list" | "grid">("grid");
  const [page, setPage] = useState(1);
  const [now, setNow] = useState(0);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const scope = searchParams.get("scope");
  const isMyMarketsView = scope === "mine";

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

  useEffect(() => {
    if (!isMyMarketsView || !address) return;

    const syncRequests = async () => {
      const requests = await getMarketRequestsForCreator(address);
      setRequestEntries(requests);
      setNow(Date.now());
    };

    syncRequests();

    const intervalId = window.setInterval(() => {
      syncRequests();
    }, 15000);

    window.addEventListener(MARKET_REQUESTS_UPDATED_EVENT, syncRequests);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener(MARKET_REQUESTS_UPDATED_EVENT, syncRequests);
    };
  }, [address, isMyMarketsView]);

  const filteredMarkets = useMemo(() => {
    if (!isMyMarketsView) return markets;
    if (!address) return [];

    return markets.filter(
      (market) => market.creator?.toLowerCase() === address.toLowerCase(),
    );
  }, [address, isMyMarketsView, markets]);

  const liveCount = filteredMarkets.filter((market) => {
    const tl = formatTimeLeft(market);
    return tl && tl.primary !== "Ended";
  }).length;

  const totalPages = Math.max(1, Math.ceil(filteredMarkets.length / PAGE_SIZE));
  const effectivePage = Math.min(page, totalPages);
  const paginatedMarkets = filteredMarkets.slice((effectivePage - 1) * PAGE_SIZE, effectivePage * PAGE_SIZE);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#040704] text-white">
      <div className="absolute inset-0 bg-grid opacity-[0.05]" />
      <div
        className="pointer-events-none absolute right-0 top-0 h-[500px] w-[500px] rounded-full opacity-25 blur-3xl blob-slow"
        style={{ background: "rgba(15, 230, 78, 0.14)" }}
      />
      <div
        className="pointer-events-none absolute bottom-0 left-0 h-[420px] w-[420px] rounded-full opacity-20 blur-3xl blob-slow"
        style={{ background: "rgba(74, 222, 128, 0.12)" }}
      />

      <Navbar />

      <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-24 sm:px-6 md:pt-28">
        <div className="mb-8">
          <p className="text-[11px] uppercase tracking-[0.28em] text-white/38">
            {isMyMarketsView ? "Creator board" : "OpenBet board"}
          </p>
          <div className="mt-3 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="font-display text-3xl tracking-tight text-white md:text-4xl">
                {isMyMarketsView ? "My markets" : "Live markets"}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-white/56">
                {isMyMarketsView
                  ? address
                    ? "Markets created by your connected wallet are shown here."
                    : "Connect your wallet to see the markets you created."
                  : "The market board now follows the landing-page shell: dark base, quieter cards, green for yes, red for no."}
              </p>
              <div className="mt-5 flex items-center gap-3">
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="rounded-full bg-emerald-300 px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-[#041006] transition-all hover:scale-105 active:scale-95"
                >
                  Create Market
                </button>
              </div>
            </div>

            {!loading && !error && filteredMarkets.length > 0 && (
              <div className="flex flex-wrap items-center gap-4 text-xs tabular-nums">
                <span className="text-white/55">{filteredMarkets.length} total</span>
                <span className="flex items-center gap-1.5 font-medium text-white">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
                  </span>
                  {liveCount} live
                </span>

                <div className="ml-1 flex items-center overflow-hidden rounded-lg border border-white/10 bg-white/[0.04]">
                  <button
                    onClick={() => setView("list")}
                    className={[
                      "p-1.5 transition-colors duration-100",
                      view === "list" ? "bg-emerald-300 text-[#041006]" : "text-white/55 hover:text-white",
                    ].join(" ")}
                    aria-label="List view"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setView("grid")}
                    className={[
                      "p-1.5 transition-colors duration-100",
                      view === "grid" ? "bg-emerald-300 text-[#041006]" : "text-white/55 hover:text-white",
                    ].join(" ")}
                    aria-label="Grid view"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-24">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent" />
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-red-500/20 bg-white/[0.04] p-5 text-center backdrop-blur-xl">
            <p className="text-sm font-semibold text-white">Could not load markets</p>
            <p className="mt-1 text-xs text-white/55">{error}</p>
          </div>
        )}

        {!loading && !error && isMyMarketsView && !address && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-8 text-center backdrop-blur-xl">
            <p className="text-sm font-semibold text-white">Connect your wallet</p>
            <p className="mt-1 text-xs text-white/55">
              Connect the wallet you used to create markets, then open My Markets again.
            </p>
          </div>
        )}

        {!loading && !error && isMyMarketsView && !!address && requestEntries.length > 0 && (
          <div className="mb-8">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.28em] text-white/38">
                  Submission activity
                </p>
                <p className="mt-2 text-sm text-white/56">
                  Requests in review, rejected requests, and recently deployed markets appear here.
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {requestEntries.map((entry) => {
                const presentation = getRequestPresentation(entry, now);
                const reviewComplete = now >= entry.reviewEndsAt;
                const showOpenMarket = reviewComplete && entry.status === "deployed" && !!entry.conditionId;
                const showErrorInfo = reviewComplete && (entry.status === "rejected" || entry.status === "failed") && !!entry.resolutionMessage;
                const openMarketHref =
                  showOpenMarket && entry.conditionId
                    ? `/market/${conditionIdFromAddress(entry.conditionId)}`
                    : null;

                return (
                  <div
                    key={entry.id}
                    className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-[0_18px_60px_rgba(0,0,0,0.24)] backdrop-blur-xl"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="line-clamp-2 text-sm font-semibold leading-6 text-white">
                          {entry.question || entry.prompt}
                        </p>
                        <p className="mt-2 text-xs text-white/42">
                          Submitted {new Date(entry.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${presentation.tone}`}
                      >
                        {presentation.badge}
                      </span>
                    </div>

                    <div className="mt-4 flex items-start gap-2">
                      <p className="text-sm leading-6 text-white/60">
                        {reviewComplete && entry.status === "rejected"
                          ? "Failed to create the market."
                          : presentation.copy}
                      </p>

                      {showErrorInfo ? (
                        <div className="group relative mt-0.5 shrink-0">
                          <button
                            type="button"
                            aria-label="Why it was rejected"
                            className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-white/12 text-[11px] font-semibold text-white/48 transition-colors duration-200 hover:text-white"
                          >
                            i
                          </button>
                          <div className="pointer-events-none absolute left-1/2 top-7 z-10 w-64 -translate-x-1/2 rounded-xl border border-white/10 bg-[#0b100d] px-3 py-2 text-left text-xs leading-5 text-white/72 opacity-0 shadow-[0_16px_40px_rgba(0,0,0,0.35)] transition-opacity duration-150 group-hover:opacity-100">
                            {entry.resolutionMessage}
                          </div>
                        </div>
                      ) : null}
                    </div>

                    {entry.queueInfo && (entry.status === "pending" || entry.status === "reviewing") ? (
                      <div className="mt-4 flex flex-col gap-2">
                        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-white/30">
                          <span>Queue Position</span>
                          <span className="text-white/60">{entry.queueInfo.current} / {entry.queueInfo.total}</span>
                        </div>
                        <div className="h-1 w-full overflow-hidden rounded-full bg-white/5">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${(entry.queueInfo.current / entry.queueInfo.total) * 100}%` }}
                            className="h-full bg-emerald-400/40"
                          />
                        </div>
                      </div>
                    ) : null}

                    {!reviewComplete && entry.status !== "deployed" && entry.status !== "rejected" ? (
                      <p className="mt-3 text-xs text-white/40">
                        Estimated review complete by {new Date(entry.reviewEndsAt).toLocaleTimeString()}
                      </p>
                    ) : null}

                    {openMarketHref ? (
                      <div className="mt-4">
                        <Link
                          href={openMarketHref}
                          className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300 transition-colors duration-200 hover:text-emerald-200"
                        >
                          Open market
                        </Link>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {!loading && !error && filteredMarkets.length === 0 && (!isMyMarketsView || !!address) && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-8 text-center backdrop-blur-xl">
            <p className="text-sm font-semibold text-white">
              {isMyMarketsView ? "No markets launched by you yet" : "No markets yet"}
            </p>
            <p className="mt-1 text-xs text-white/55">
              {isMyMarketsView
                ? "Once one of your reviewed requests is deployed, it will appear here."
                : "Markets will appear here once created."}
            </p>
          </div>
        )}

        {!loading && !error && filteredMarkets.length > 0 && (
          <>
            {view === "list" && (
              <>
                <div className="hidden grid-cols-[1fr_72px_72px_92px_28px] items-center gap-3 px-5 pb-2 md:grid">
                  <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/35">Market</span>
                  <span className="text-center text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-300/70">Yes</span>
                  <span className="text-center text-[10px] font-bold uppercase tracking-[0.14em] text-red-300/70">No</span>
                  <span className="text-right text-[10px] font-bold uppercase tracking-[0.14em] text-white/35">Expires</span>
                  <span />
                </div>

                <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] shadow-[0_18px_60px_rgba(0,0,0,0.28)] backdrop-blur-xl">
                  {paginatedMarkets.map((market, i) => {
                    const yesPercent = typeof market.yes_odds === "number" ? market.yes_odds : 50;
                    const noPercent = typeof market.no_odds === "number" ? market.no_odds : 50;
                    const hasOdds = market.yes_odds != null || market.no_odds != null;
                    const isBalanced = hasOdds && yesPercent >= 45 && yesPercent <= 55;
                    const timeLeft = formatTimeLeft(market);
                    const isEnded = timeLeft?.primary === "Ended";

                    return (
                      <motion.div
                        key={market.market_address}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.15, delay: i * 0.02 }}
                        className={i > 0 ? "border-t border-white/8" : ""}
                      >
                        <Link
                          href={`/market/${conditionIdFromAddress(market.market_address)}`}
                          className={[
                            "block border-l-[3px] border-l-transparent px-5 py-3.5 transition-all duration-100 group cursor-pointer",
                            "md:grid md:grid-cols-[1fr_72px_72px_92px_28px] md:items-center md:gap-3",
                            "hover:border-l-emerald-400 hover:bg-white/[0.03]",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/30 focus-visible:ring-inset",
                            isEnded ? "opacity-50 hover:opacity-70" : "",
                          ].join(" ")}
                        >
                          <div className="min-w-0 pr-2">
                            <div className="flex items-start gap-2">
                              <p
                                className={[
                                  "line-clamp-2 text-[13px] font-medium leading-[1.45] text-white transition-colors duration-100",
                                  "group-hover:text-white/80",
                                  isEnded ? "line-through decoration-white/20" : "",
                                ].join(" ")}
                              >
                                {market.question}
                              </p>
                              {isBalanced && !isEnded && (
                                <span className="mt-0.5 shrink-0 rounded bg-white/8 px-1.5 py-0.5 text-[9px] font-bold uppercase leading-none tracking-wider text-white/72">
                                  Tight
                                </span>
                              )}
                            </div>

                            <div className="mt-2.5 flex items-center gap-2 md:hidden">
                              {hasOdds ? (
                                <>
                                  <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-bold leading-none tabular-nums ${isEnded ? "bg-white/[0.05] text-white/40" : "bg-emerald-500/12 text-emerald-300"}`}>
                                    Yes {yesPercent}%
                                  </span>
                                  <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-bold leading-none tabular-nums ${isEnded ? "bg-white/[0.05] text-white/40" : "bg-red-500/12 text-red-300"}`}>
                                    No {noPercent}%
                                  </span>
                                </>
                              ) : (
                                <span className="text-[11px] text-white/35">No odds</span>
                              )}

                              {timeLeft && (
                                <span className={`ml-auto text-[11px] font-semibold tabular-nums ${isEnded ? "text-white/35" : timeLeft.under48h ? "text-amber-300" : "text-white/60"}`}>
                                  {isEnded ? "Closed" : timeLeft.primary}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="hidden justify-center md:flex">
                            {hasOdds ? (
                              <span className={`inline-flex min-w-[52px] items-center justify-center rounded-md px-2 py-1 text-[15px] font-bold leading-none tabular-nums ${isEnded ? "bg-white/[0.05] text-white/40" : "bg-emerald-500/12 text-emerald-300 group-hover:bg-emerald-500/18"}`}>
                                {yesPercent}%
                              </span>
                            ) : (
                              <span className="text-xs text-white/35">—</span>
                            )}
                          </div>

                          <div className="hidden justify-center md:flex">
                            {hasOdds ? (
                              <span className={`inline-flex min-w-[52px] items-center justify-center rounded-md px-2 py-1 text-[15px] font-bold leading-none tabular-nums ${isEnded ? "bg-white/[0.05] text-white/40" : "bg-red-500/12 text-red-300 group-hover:bg-red-500/18"}`}>
                                {noPercent}%
                              </span>
                            ) : (
                              <span className="text-xs text-white/35">—</span>
                            )}
                          </div>

                          <div className="hidden text-right md:block">
                            {timeLeft ? (
                              <>
                                <p className={`text-xs font-semibold leading-none tabular-nums ${isEnded ? "text-white/35" : timeLeft.under48h ? "text-amber-300" : "text-white"}`}>
                                  {isEnded ? "Closed" : timeLeft.primary}
                                </p>
                                <p className="mt-1 text-[10px] leading-none tabular-nums text-white/35">
                                  {timeLeft.secondary}
                                </p>
                              </>
                            ) : (
                              <span className="text-[10px] text-white/35">—</span>
                            )}
                          </div>

                          <div className="hidden justify-end md:flex">
                            <svg className="h-3.5 w-3.5 text-white/28 transition-all duration-100 group-hover:translate-x-0.5 group-hover:text-emerald-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
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

            {view === "grid" && (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {paginatedMarkets.map((market, i) => {
                  const yesPercent = typeof market.yes_odds === "number" ? market.yes_odds : 50;
                  const noPercent = typeof market.no_odds === "number" ? market.no_odds : 50;
                  const hasOdds = market.yes_odds != null || market.no_odds != null;
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
                          "group flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-xl",
                          "shadow-[0_18px_60px_rgba(0,0,0,0.28)] transition-all duration-150",
                          "hover:-translate-y-0.5 hover:border-white/16 hover:shadow-[0_18px_50px_rgba(0,0,0,0.34)]",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/30",
                          isEnded ? "opacity-50 hover:opacity-70" : "",
                        ].join(" ")}
                      >
                        <div className="flex items-center justify-between border-b border-white/8 bg-white/[0.03] px-4 py-2">
                          {timeLeft ? (
                            <span className={`flex items-center gap-1.5 text-[11px] font-semibold tabular-nums ${isEnded ? "text-white/35" : timeLeft.under48h ? "text-amber-300" : "text-white/55"}`}>
                              {!isEnded && (
                                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z" />
                                </svg>
                              )}
                              {isEnded ? "Closed" : timeLeft.primary}
                            </span>
                          ) : (
                            <span />
                          )}

                          {!isEnded && (
                            <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-300">
                              <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                              Live
                            </span>
                          )}
                        </div>

                        <div className="px-4 pb-2 pt-4">
                          <p className={`line-clamp-2 text-[13px] font-medium leading-[1.5] text-white transition-colors duration-100 group-hover:text-white/80 ${isEnded ? "line-through decoration-white/20" : ""}`}>
                            {market.question}
                          </p>
                        </div>

                        <div className="flex-1" />

                        {hasOdds ? (
                          <div className="px-4 pb-4">
                            <div className="grid grid-cols-2 gap-2">
                              <div className={`flex flex-col items-center rounded-lg py-2.5 ${isEnded ? "bg-white/[0.04]" : "bg-emerald-500/10 group-hover:bg-emerald-500/14"}`}>
                                <span className="mb-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-300/70">
                                  Yes
                                </span>
                                <span className="font-display text-lg leading-none text-emerald-300">
                                  {yesPercent}%
                                </span>
                              </div>
                              <div className={`flex flex-col items-center rounded-lg py-2.5 ${isEnded ? "bg-white/[0.04]" : "bg-red-500/10 group-hover:bg-red-500/14"}`}>
                                <span className="mb-0.5 text-[10px] font-semibold uppercase tracking-wider text-red-300/70">
                                  No
                                </span>
                                <span className="font-display text-lg leading-none text-red-300">
                                  {noPercent}%
                                </span>
                              </div>
                            </div>
                            <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/10">
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${yesPercent}%`,
                                  background: "linear-gradient(90deg,#16a34a,#34d399)",
                                }}
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="px-4 pb-4">
                            <span className="text-[11px] text-white/35">No pricing available</span>
                          </div>
                        )}

                        <div className="flex items-center justify-between border-t border-white/8 px-4 py-2.5 text-[11px] text-white/40">
                          <span>{timeLeft?.secondary ?? "No end date"}</span>
                          <span className="transition-colors duration-100 group-hover:text-emerald-300">
                            Open →
                          </span>
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-3">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={effectivePage === 1}
                  className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white/70 transition disabled:opacity-40"
                >
                  Previous
                </button>
                <span className="text-sm text-white/55">
                  Page {effectivePage} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={effectivePage === totalPages}
                  className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white/70 transition disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
      <CreateMarketModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />
    </main>
  );
}
