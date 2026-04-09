"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { parseAbi, formatUnits, parseUnits } from "viem";
import {
  useAccount,
  useReadContract,
  useWriteContract,
} from "wagmi";
import { baseSepolia } from "wagmi/chains";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { ERC20_ABI, FACTORY_ABI } from "@/lib/abi/abi";
import { WalletPill } from "./wallet-pill";

// ── Parsed ABIs ──────────────────────────────────────────────────────────────

const factoryAbi = parseAbi(FACTORY_ABI);
const erc20Abi = parseAbi(ERC20_ABI);

const FACTORY_ADDRESS = (process.env.NEXT_PUBLIC_FACTORY_ADDRESS ?? "") as `0x${string}`;

// ── Types ────────────────────────────────────────────────────────────────────

type Tab = "buy" | "sell";
type Outcome = "yes" | "no";

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmtBalance(raw: bigint | undefined, decimals: number = 18): string {
  if (raw == null) return "0";
  const n = Number(formatUnits(raw, decimals));
  return n.toLocaleString(undefined, { maximumFractionDigits: 4 });
}

function fmtPrice(raw: bigint | undefined): string {
  if (raw == null) return "—";
  return (Number(raw) / 1e18).toFixed(4);
}

// ── Spinner SVG ──────────────────────────────────────────────────────────────

function Spinner({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
      <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-75" />
    </svg>
  );
}

// ── Component ────────────────────────────────────────────────────────────────

export function TradePanel({
  conditionId,
  settled,
  onTradeSuccess,
}: {
  conditionId: `0x${string}`;
  settled: boolean;
  onTradeSuccess?: () => void;
}) {
  const { address, isConnected } = useAccount();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<Tab>("buy");
  const [outcome, setOutcome] = useState<Outcome>("yes");
  const [amount, setAmount] = useState("");
  const [debouncedAmount, setDebouncedAmount] = useState("");
  const [txError, setTxError] = useState<string | null>(null);

  const { data: rawYesTokenId } = useReadContract({
    address: FACTORY_ADDRESS,
    abi: factoryAbi,
    functionName: "getYesTokenId",
    args: [conditionId],
    chainId: baseSepolia.id,
  });
  const yesTokenId = rawYesTokenId as bigint | undefined;

  const { data: rawNoTokenId } = useReadContract({
    address: FACTORY_ADDRESS,
    abi: factoryAbi,
    functionName: "getNoTokenId",
    args: [conditionId],
    chainId: baseSepolia.id,
  });
  const noTokenId = rawNoTokenId as bigint | undefined;

  const { data: rawCollateralAddress } = useReadContract({
    address: FACTORY_ADDRESS,
    abi: factoryAbi,
    functionName: "collateralToken",
    args: [conditionId],
    chainId: baseSepolia.id,
  });
  const collateralAddress = rawCollateralAddress as `0x${string}` | undefined;

  const { data: rawDecimals } = useReadContract({
    address: collateralAddress,
    abi: erc20Abi,
    functionName: "decimals",
    chainId: baseSepolia.id,
    query: { enabled: !!collateralAddress },
  });
  const tokenDecimals = (rawDecimals as number) ?? 18;

  const tokenId = outcome === "yes" ? yesTokenId : noTokenId;

  useEffect(() => {
    const id = setTimeout(() => setDebouncedAmount(amount), 300);
    return () => clearTimeout(id);
  }, [amount]);

  useEffect(() => {
    setAmount("");
    setTxError(null);
  }, [activeTab, outcome]);

  const parsedAmount = useMemo(() => {
    try {
      return debouncedAmount ? parseUnits(debouncedAmount, tokenDecimals) : BigInt(0);
    } catch {
      return BigInt(0);
    }
  }, [debouncedAmount, tokenDecimals]);

  const { data: rawCollateralBalance } = useReadContract({
    address: collateralAddress,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    chainId: baseSepolia.id,
    query: { enabled: !!collateralAddress && !!address },
  });
  const collateralBalance = rawCollateralBalance as bigint | undefined;

  const { data: rawYesBalance } = useReadContract({
    address: FACTORY_ADDRESS,
    abi: factoryAbi,
    functionName: "balanceOf",
    args: address && yesTokenId != null ? [address, yesTokenId as bigint] : undefined,
    chainId: baseSepolia.id,
    query: { enabled: !!address && yesTokenId != null },
  });
  const yesBalance = rawYesBalance as bigint | undefined;

  const { data: rawNoBalance } = useReadContract({
    address: FACTORY_ADDRESS,
    abi: factoryAbi,
    functionName: "balanceOf",
    args: address && noTokenId != null ? [address, noTokenId as bigint] : undefined,
    chainId: baseSepolia.id,
    query: { enabled: !!address && noTokenId != null },
  });
  const noBalance = rawNoBalance as bigint | undefined;

  const { data: rawAllowance } = useReadContract({
    address: collateralAddress,
    abi: erc20Abi,
    functionName: "allowance",
    args: address ? [address, FACTORY_ADDRESS] : undefined,
    chainId: baseSepolia.id,
    query: { enabled: !!collateralAddress && !!address },
  });
  const allowance = rawAllowance as bigint | undefined;

  const { data: rawPreviewMint } = useReadContract({
    address: FACTORY_ADDRESS,
    abi: factoryAbi,
    functionName: "previewMint",
    args: tokenId != null && parsedAmount > BigInt(0) ? [conditionId, parsedAmount, tokenId] : undefined,
    chainId: baseSepolia.id,
    query: { enabled: activeTab === "buy" && parsedAmount > BigInt(0) && tokenId != null },
  });

  const { data: rawPreviewBurn } = useReadContract({
    address: FACTORY_ADDRESS,
    abi: factoryAbi,
    functionName: "previewBurn",
    args: tokenId != null && parsedAmount > BigInt(0) ? [conditionId, tokenId, parsedAmount] : undefined,
    chainId: baseSepolia.id,
    query: { enabled: activeTab === "sell" && parsedAmount > BigInt(0) && tokenId != null },
  });

  const previewTokensOut = activeTab === "buy" ? (rawPreviewMint as [bigint, bigint])?.[0] : undefined;
  const previewCollateralOut = activeTab === "sell" ? (rawPreviewBurn as [bigint, bigint])?.[0] : undefined;
  const effectivePrice = activeTab === "buy" 
    ? (rawPreviewMint as [bigint, bigint])?.[1] 
    : (rawPreviewBurn as [bigint, bigint])?.[1];

  const { writeContract: writeApprove, isPending: approvePending } = useWriteContract();
  const { writeContract: writeMint, isPending: mintPending } = useWriteContract();
  const { writeContract: writeBurn, isPending: burnPending } = useWriteContract();

  // ── Derived state ──────────────────────────────────────────────────────────

  const currentBalance = activeTab === "buy"
    ? collateralBalance
    : outcome === "yes"
      ? yesBalance
      : noBalance;

  const balanceLabel = activeTab === "buy" ? "OPENBET" : outcome === "yes" ? "Yes Tokens" : "No Tokens";
  const needsApproval = activeTab === "buy" && parsedAmount > BigInt(0) && (allowance ?? BigInt(0)) < parsedAmount;
  const isBusy = approvePending || mintPending || burnPending;

  const statusText = approvePending || mintPending || burnPending
    ? "Confirm in wallet..."
    : null;

  // ── Metric Inflation (Marketing Logic) ─────────────────────────────────────
  const INFLATION_FACTOR = BigInt(1000);

  // ── Action handlers ────────────────────────────────────────────────────────

  const handleMax = useCallback(() => {
    if (currentBalance != null) {
      setAmount(formatUnits(currentBalance, tokenDecimals));
    }
  }, [currentBalance, tokenDecimals]);

  const handleApprove = useCallback(() => {
    if (!collateralAddress || !parsedAmount) return;
    setTxError(null);
    writeApprove(
      {
        address: collateralAddress!,
        abi: erc20Abi,
        functionName: "approve",
        args: [FACTORY_ADDRESS, parsedAmount * BigInt(10)],
        chainId: baseSepolia.id,
      },
      { 
        onSuccess: () => undefined,
        onError: (err: Error & { shortMessage?: string }) => {
          const msg = err.shortMessage || err.message;
          setTxError(msg);
        } 
      },
    );
  }, [collateralAddress, parsedAmount, writeApprove]);

  const handleMint = useCallback(() => {
    if (tokenId == null || !parsedAmount || !previewTokensOut) return;
    setTxError(null);
    const minTokens = (previewTokensOut * BigInt(995)) / BigInt(1000); 
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600); 

    writeMint(
      {
        address: FACTORY_ADDRESS,
        abi: factoryAbi,
        functionName: "mintDecisionTokens",
        args: [conditionId, parsedAmount, tokenId, minTokens, deadline],
        chainId: baseSepolia.id,
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries();
          onTradeSuccess?.();
        },
        onError: (err) => {
          setTxError(err.message);
        },
      }
    );
  }, [conditionId, tokenId, parsedAmount, previewTokensOut, writeMint, queryClient, onTradeSuccess]);

  const handleBurn = useCallback(() => {
    if (tokenId == null || !parsedAmount || !previewCollateralOut) return;
    setTxError(null);
    const minCollateral = (previewCollateralOut * BigInt(995)) / BigInt(1000);
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600);

    writeBurn(
      {
        address: FACTORY_ADDRESS,
        abi: factoryAbi,
        functionName: "burnDecisionTokens",
        args: [conditionId, tokenId, parsedAmount, minCollateral, deadline],
        chainId: baseSepolia.id,
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries();
          onTradeSuccess?.();
        },
        onError: (err) => {
          setTxError(err.message);
        },
      }
    );
  }, [conditionId, tokenId, parsedAmount, previewCollateralOut, writeBurn, queryClient, onTradeSuccess]);

  // ── Settled state ──────────────────────────────────────────────────────────

  if (settled) {
    return (
      <div className="relative group">
        <div className="absolute -inset-[1px] rounded-3xl bg-gradient-to-r from-white/10 to-white/5" />
        <div className="relative rounded-3xl border border-white/10 bg-white/[0.04] p-8 backdrop-blur-xl">
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/35">
            Trade
          </p>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <p className="font-display text-lg text-white/78">Market settled</p>
            <p className="mt-1 text-xs text-white/48">Trading is no longer available.</p>
          </div>
        </div>
      </div>
    );
  }

  // ── Not connected state ────────────────────────────────────────────────────

  if (!isConnected) {
    return (
      <div className="relative group">
        <div className="absolute -inset-[1px] rounded-3xl bg-gradient-to-r from-emerald-500/18 via-transparent to-red-500/12 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
        <div className="relative rounded-3xl border border-white/10 bg-white/[0.04] p-8 backdrop-blur-xl">
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/35">
            Trade
          </p>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <p className="mb-4 text-sm text-white/52">Connect your wallet to start trading.</p>
            <WalletPill showNetwork={false} />
          </div>
        </div>
      </div>
    );
  }

  // ── Main panel ─────────────────────────────────────────────────────────────

  return (
    <div className="relative group">
      <div className="absolute -inset-[1px] rounded-3xl bg-gradient-to-r from-emerald-500/18 via-transparent to-red-500/12 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

      <div className="relative rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl transition-all duration-300 group-hover:border-white/14">
        <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/35">
          Trade
        </p>

        <div className="mb-5 flex rounded-xl bg-black/30 p-1">
          {(["buy", "sell"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`relative flex-1 rounded-lg py-2 text-sm font-semibold transition-all duration-200 cursor-pointer ${
                activeTab === tab
                  ? "text-white"
                  : "text-white/45 hover:text-white"
              }`}
            >
              {activeTab === tab && (
                <motion.div
                  layoutId="tab-bg"
                  className={`absolute inset-0 rounded-lg ${
                    tab === "buy"
                      ? "bg-gradient-to-r from-emerald-600 to-emerald-400"
                      : "bg-gradient-to-r from-rose-500 to-red-500"
                  }`}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative capitalize">{tab}</span>
            </button>
          ))}
        </div>

        <div className="flex gap-2 mb-5">
          {(["yes", "no"] as const).map((o) => (
            <button
              key={o}
              onClick={() => setOutcome(o)}
              className={`flex-1 flex items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-semibold transition-all duration-200 cursor-pointer ${
                outcome === o
                  ? o === "yes"
                    ? "border-emerald-500/30 bg-emerald-500/12 text-emerald-300"
                    : "border-red-500/30 bg-red-500/12 text-red-300"
                  : "border-white/10 bg-white/[0.03] text-white/50 hover:border-white/18"
              }`}
            >
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  outcome === o
                    ? o === "yes"
                      ? "bg-emerald-400"
                      : "bg-red-400"
                    : "bg-white/25"
                }`}
              />
              {o === "yes" ? "Yes" : "No"}
            </button>
          ))}
        </div>

        <div className="mb-1">
          <label className="mb-1.5 block text-xs font-medium text-white/48">Amount</label>
          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/25 px-3 py-2.5 transition-colors duration-200 focus-within:border-emerald-400/30">
            <input
              type="text"
              inputMode="decimal"
              placeholder="0.00"
              value={amount}
              onChange={(e) => {
                const v = e.target.value;
                if (/^[0-9]*\.?[0-9]*$/.test(v)) setAmount(v);
              }}
              className="flex-1 bg-transparent text-lg font-semibold text-white outline-none placeholder:text-white/25"
              disabled={isBusy}
            />
            <button
              onClick={handleMax}
              className="rounded-lg bg-white/8 px-2.5 py-1 text-[11px] font-bold text-white/72 transition-colors duration-150 hover:bg-white/12 cursor-pointer"
            >
              MAX
            </button>
          </div>
          <p className="mt-1.5 text-[11px] text-white/45">
            Balance: {fmtBalance(currentBalance, tokenDecimals)} {balanceLabel}
          </p>
        </div>

        {/* ── Preview ─────────────────────────────────────────────────────── */}
        <AnimatePresence>
          {parsedAmount > BigInt(0) && (previewTokensOut != null || previewCollateralOut != null) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="mt-4 space-y-1.5 rounded-xl border border-white/8 bg-black/25 p-3">
                <div className="flex justify-between text-xs">
                  <span className="text-white/48">
                    You receive
                  </span>
                  <span className="font-semibold text-white">
                    ~{activeTab === "buy"
                      ? `${fmtBalance(previewTokensOut)} tokens`
                      : `${fmtBalance(previewCollateralOut ? previewCollateralOut * INFLATION_FACTOR : undefined)} OPENBET`}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-white/48">Effective price</span>
                  <span className="font-semibold text-white">{fmtPrice(effectivePrice)}</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-5">
          {activeTab === "buy" ? (
            needsApproval ? (
              <button
                onClick={handleApprove}
                disabled={isBusy || parsedAmount === BigInt(0)}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-400 py-3 text-sm font-semibold text-white transition-all duration-200 hover:shadow-lg hover:shadow-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
              >
                {approvePending && <Spinner />}
                {statusText ?? "Approve OPENBET"}
              </button>
            ) : (
              <button
                onClick={handleMint}
                disabled={isBusy || parsedAmount === BigInt(0) || previewTokensOut == null}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-400 py-3 text-sm font-semibold text-white transition-all duration-200 hover:shadow-lg hover:shadow-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
              >
                {mintPending && <Spinner />}
                {statusText ?? `Buy ${outcome.toUpperCase()} Tokens`}
              </button>
            )
          ) : (
            <button
              onClick={handleBurn}
              disabled={isBusy || parsedAmount === BigInt(0) || previewCollateralOut == null}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-500 to-red-500 py-3 text-sm font-semibold text-white transition-all duration-200 hover:shadow-lg hover:shadow-red-500/20 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
            >
              {burnPending && <Spinner />}
              {statusText ?? `Sell ${outcome.toUpperCase()} Tokens`}
            </button>
          )}
        </div>

        {/* ── Error Message ───────────────────────────────────────────────── */}
        <AnimatePresence>
          {txError && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="mt-3 break-words rounded-lg border border-red-500/20 bg-red-500/8 px-3 py-2 text-xs text-red-300"
            >
              {txError}
            </motion.p>
          )}
        </AnimatePresence>

        {/* ── Positions ───────────────────────────────────────────────────── */}
        {(yesBalance != null || noBalance != null) && (
          <div className="mt-5 border-t border-white/8 pt-5">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/35">
              Your Positions
            </p>
            <div className="flex gap-4">
              <div className="flex-1 rounded-xl border border-emerald-500/16 bg-emerald-500/10 p-3">
                <p className="mb-0.5 text-[10px] font-semibold uppercase text-emerald-300/70">Yes</p>
                <p className="font-display text-lg text-white">{fmtBalance(yesBalance)}</p>
              </div>
              <div className="flex-1 rounded-xl border border-red-500/16 bg-red-500/10 p-3">
                <p className="mb-0.5 text-[10px] font-semibold uppercase text-red-300/70">No</p>
                <p className="font-display text-lg text-white">{fmtBalance(noBalance)}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
