"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { parseAbi, formatUnits, parseUnits } from "viem";
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { baseSepolia } from "wagmi/chains";
import { useQueryClient } from "@tanstack/react-query";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { ERC20_ABI, FACTORY_ABI } from "@/lib/abi/abi";

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

  const balanceLabel = activeTab === "buy" ? "$SIGMA" : outcome === "yes" ? "Yes Tokens" : "No Tokens";
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
        onSuccess: () => toast.info("Approving $SIGMA..."),
        onError: (err) => {
          const msg = (err as any).shortMessage || err.message;
          setTxError(msg);
          toast.error("Approval failed: " + msg);
        } 
      },
    );
  }, [collateralAddress, parsedAmount, writeApprove]);

  const handleMint = useCallback(() => {
    if (tokenId == null || !parsedAmount || !previewTokensOut) return;
    setTxError(null);
    const minTokens = (previewTokensOut * BigInt(995)) / BigInt(1000); 
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600); 
    
    toast.promise(
      new Promise((resolve, reject) => {
        writeMint(
          {
            address: FACTORY_ADDRESS,
            abi: factoryAbi,
            functionName: "mintDecisionTokens",
            args: [conditionId, parsedAmount, tokenId, minTokens, deadline],
            chainId: baseSepolia.id,
          },
          {
            onSuccess: (hash) => {
              queryClient.invalidateQueries();
              onTradeSuccess?.();
              resolve(hash);
            },
            onError: (err) => {
              setTxError(err.message);
              reject(err);
            },
          }
        );
      }),
      {
        loading: `Buying ${outcome.toUpperCase()} tokens...`,
        success: "Buy successful!",
        error: "Buy failed",
      }
    );
  }, [conditionId, tokenId, parsedAmount, previewTokensOut, writeMint, outcome, queryClient, onTradeSuccess]);

  const handleBurn = useCallback(() => {
    if (tokenId == null || !parsedAmount || !previewCollateralOut) return;
    setTxError(null);
    const minCollateral = (previewCollateralOut * BigInt(995)) / BigInt(1000);
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600);
    
    toast.promise(
      new Promise((resolve, reject) => {
        writeBurn(
          {
            address: FACTORY_ADDRESS,
            abi: factoryAbi,
            functionName: "burnDecisionTokens",
            args: [conditionId, tokenId, parsedAmount, minCollateral, deadline],
            chainId: baseSepolia.id,
          },
          {
            onSuccess: (hash) => {
              queryClient.invalidateQueries();
              onTradeSuccess?.();
              resolve(hash);
            },
            onError: (err) => {
              setTxError(err.message);
              reject(err);
            },
          }
        );
      }),
      {
        loading: `Selling ${outcome.toUpperCase()} tokens...`,
        success: "Sell successful!",
        error: "Sell failed",
      }
    );
  }, [conditionId, tokenId, parsedAmount, previewCollateralOut, writeBurn, outcome, queryClient, onTradeSuccess]);

  // ── Settled state ──────────────────────────────────────────────────────────

  if (settled) {
    return (
      <div className="relative group">
        <div className="absolute -inset-[1px] rounded-3xl bg-gradient-to-r from-slate-light/20 to-slate-light/10" />
        <div className="relative p-8 rounded-3xl glass-strong border border-navy/[0.06]">
          <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-slate-light mb-4">
            Trade
          </p>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <p className="font-display text-lg text-slate-light">Market Settled</p>
            <p className="text-xs text-slate mt-1">Trading is no longer available.</p>
          </div>
        </div>
      </div>
    );
  }

  // ── Not connected state ────────────────────────────────────────────────────

  if (!isConnected) {
    return (
      <div className="relative group">
        <div className="absolute -inset-[1px] rounded-3xl bg-gradient-to-r from-base-blue/20 via-cyan/10 to-base-blue/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="relative p-8 rounded-3xl glass-strong border border-navy/[0.06]">
          <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-slate-light mb-4">
            Trade
          </p>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-sm text-slate mb-4">Connect your wallet to start trading.</p>
            <ConnectButton />
          </div>
        </div>
      </div>
    );
  }

  // ── Main panel ─────────────────────────────────────────────────────────────

  return (
    <div className="relative group">
      {/* Hover glow */}
      <div className="absolute -inset-[1px] rounded-3xl bg-gradient-to-r from-base-blue/20 via-cyan/10 to-base-blue/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className="relative p-6 rounded-3xl glass-strong border border-navy/[0.06] group-hover:border-base-blue/15 transition-all duration-300">
        {/* Header */}
        <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-slate-light mb-4">
          Trade
        </p>

        {/* ── Tab Toggle ──────────────────────────────────────────────────── */}
        <div className="flex rounded-xl bg-navy/[0.04] p-1 mb-5">
          {(["buy", "sell"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`relative flex-1 py-2 text-sm font-semibold rounded-lg transition-all duration-200 cursor-pointer ${
                activeTab === tab
                  ? "text-white"
                  : "text-slate hover:text-navy"
              }`}
            >
              {activeTab === tab && (
                <motion.div
                  layoutId="tab-bg"
                  className={`absolute inset-0 rounded-lg ${
                    tab === "buy"
                      ? "bg-gradient-to-r from-base-blue to-base-light"
                      : "bg-gradient-to-r from-coral to-coral-light"
                  }`}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative capitalize">{tab}</span>
            </button>
          ))}
        </div>

        {/* ── Outcome Selector ────────────────────────────────────────────── */}
        <div className="flex gap-2 mb-5">
          {(["yes", "no"] as const).map((o) => (
            <button
              key={o}
              onClick={() => setOutcome(o)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-semibold transition-all duration-200 cursor-pointer ${
                outcome === o
                  ? o === "yes"
                    ? "border-base-blue/30 bg-base-blue/10 text-base-blue"
                    : "border-coral/30 bg-coral/10 text-coral"
                  : "border-navy/[0.08] bg-white/50 text-slate hover:border-navy/[0.15]"
              }`}
            >
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  outcome === o
                    ? o === "yes"
                      ? "bg-base-blue"
                      : "bg-coral"
                    : "bg-slate-light/40"
                }`}
              />
              {o === "yes" ? "Yes" : "No"}
            </button>
          ))}
        </div>

        {/* ── Amount Input ────────────────────────────────────────────────── */}
        <div className="mb-1">
          <label className="text-xs font-medium text-slate mb-1.5 block">Amount</label>
          <div className="flex items-center gap-2 rounded-xl border border-navy/[0.08] bg-white/60 px-3 py-2.5 focus-within:border-base-blue/30 transition-colors duration-200">
            <input
              type="text"
              inputMode="decimal"
              placeholder="0.00"
              value={amount}
              onChange={(e) => {
                const v = e.target.value;
                if (/^[0-9]*\.?[0-9]*$/.test(v)) setAmount(v);
              }}
              className="flex-1 bg-transparent text-navy font-semibold text-lg outline-none placeholder:text-slate-light/50"
              disabled={isBusy}
            />
            <button
              onClick={handleMax}
              className="px-2.5 py-1 rounded-lg bg-base-blue/10 text-[11px] font-bold text-base-blue hover:bg-base-blue/20 transition-colors duration-150 cursor-pointer"
            >
              MAX
            </button>
          </div>
          <p className="text-[11px] text-slate mt-1.5">
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
              <div className="mt-4 p-3 rounded-xl bg-navy/[0.03] border border-navy/[0.05] space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate">
                    You receive
                  </span>
                  <span className="font-semibold text-navy">
                    ~{activeTab === "buy"
                      ? `${fmtBalance(previewTokensOut)} tokens`
                      : `${fmtBalance(previewCollateralOut ? previewCollateralOut * INFLATION_FACTOR : undefined)} $SIGMA`}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate">Effective price</span>
                  <span className="font-semibold text-navy">{fmtPrice(effectivePrice)}</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Action Button ───────────────────────────────────────────────── */}
        <div className="mt-5">
          {activeTab === "buy" ? (
            needsApproval ? (
              <button
                onClick={handleApprove}
                disabled={isBusy || parsedAmount === BigInt(0)}
                className="w-full py-3 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-base-blue to-base-light hover:shadow-lg hover:shadow-base-blue/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
              >
                {approvePending && <Spinner />}
                {statusText ?? "Approve $SIGMA"}
              </button>
            ) : (
              <button
                onClick={handleMint}
                disabled={isBusy || parsedAmount === BigInt(0) || previewTokensOut == null}
                className="w-full py-3 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-base-blue to-base-light hover:shadow-lg hover:shadow-base-blue/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
              >
                {mintPending && <Spinner />}
                {statusText ?? `Buy ${outcome.toUpperCase()} Tokens`}
              </button>
            )
          ) : (
            <button
              onClick={handleBurn}
              disabled={isBusy || parsedAmount === BigInt(0) || previewCollateralOut == null}
              className="w-full py-3 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-coral to-coral-light hover:shadow-lg hover:shadow-coral/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
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
              className="mt-3 text-xs text-coral bg-coral/5 border border-coral/10 rounded-lg px-3 py-2 break-words"
            >
              {txError}
            </motion.p>
          )}
        </AnimatePresence>

        {/* ── Positions ───────────────────────────────────────────────────── */}
        {(yesBalance != null || noBalance != null) && (
          <div className="mt-5 pt-5 border-t border-navy/[0.06]">
            <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-slate-light mb-3">
              Your Positions
            </p>
            <div className="flex gap-4">
              <div className="flex-1 p-3 rounded-xl bg-base-blue/[0.04] border border-base-blue/10">
                <p className="text-[10px] font-semibold uppercase text-base-blue/60 mb-0.5">Yes</p>
                <p className="font-display text-lg text-navy">{fmtBalance(yesBalance)}</p>
              </div>
              <div className="flex-1 p-3 rounded-xl bg-coral/[0.04] border border-coral/10">
                <p className="text-[10px] font-semibold uppercase text-coral/60 mb-0.5">No</p>
                <p className="font-display text-lg text-navy">{fmtBalance(noBalance)}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
