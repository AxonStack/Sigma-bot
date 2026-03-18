"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { parseAbi, formatUnits, parseUnits } from "viem";
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { base } from "wagmi/chains";
import { useQueryClient } from "@tanstack/react-query";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { motion, AnimatePresence } from "framer-motion";
import { ERC20_ABI, FACTORY_ABI } from "@/lib/abi/abi";

// ── Parsed ABIs ──────────────────────────────────────────────────────────────

const factoryAbi = parseAbi(FACTORY_ABI);
const erc20Abi = parseAbi(ERC20_ABI);

const FACTORY_ADDRESS = (process.env.NEXT_PUBLIC_FACTORY_ADDRESS ?? "") as `0x${string}`;
const DECIMALS = 18;

// ── Types ────────────────────────────────────────────────────────────────────

type Tab = "buy" | "sell";
type Outcome = "yes" | "no";

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmtBalance(raw: bigint | undefined): string {
  if (raw == null) return "0";
  const n = Number(formatUnits(raw, DECIMALS));
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
  /** Call after mint/burn succeeds so market page can refetch prices & reserve */
  onTradeSuccess?: () => void;
}) {
  const { address, isConnected } = useAccount();
  const queryClient = useQueryClient();

  // ── Local state ────────────────────────────────────────────────────────────

  const [activeTab, setActiveTab] = useState<Tab>("buy");
  const [outcome, setOutcome] = useState<Outcome>("yes");
  const [amount, setAmount] = useState("");
  const [debouncedAmount, setDebouncedAmount] = useState("");
  const [txError, setTxError] = useState<string | null>(null);

  // Debounce amount input (300ms)
  useEffect(() => {
    const id = setTimeout(() => setDebouncedAmount(amount), 300);
    return () => clearTimeout(id);
  }, [amount]);

  // Reset amount on tab/outcome switch
  useEffect(() => {
    setAmount("");
    setTxError(null);
  }, [activeTab, outcome]);

  const parsedAmount = useMemo(() => {
    try {
      return debouncedAmount ? parseUnits(debouncedAmount, DECIMALS) : BigInt(0);
    } catch {
      return BigInt(0);
    }
  }, [debouncedAmount]);

  // ── Contract reads ─────────────────────────────────────────────────────────

  const { data: rawYesTokenId } = useReadContract({
    address: FACTORY_ADDRESS,
    abi: factoryAbi,
    functionName: "getYesTokenId",
    args: [conditionId],
    chainId: base.id,
  });
  const yesTokenId = rawYesTokenId as bigint | undefined;

  const { data: rawNoTokenId } = useReadContract({
    address: FACTORY_ADDRESS,
    abi: factoryAbi,
    functionName: "getNoTokenId",
    args: [conditionId],
    chainId: base.id,
  });
  const noTokenId = rawNoTokenId as bigint | undefined;

  const { data: rawCollateralAddress } = useReadContract({
    address: FACTORY_ADDRESS,
    abi: factoryAbi,
    functionName: "collateralToken",
    args: [conditionId],
    chainId: base.id,
  });
  const collateralAddress = rawCollateralAddress as `0x${string}` | undefined;

  const tokenId = outcome === "yes" ? yesTokenId : noTokenId;

  // User's $CLAWDBET balance
  const { data: rawCollateralBalance } = useReadContract({
    address: collateralAddress,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    chainId: base.id,
    query: { enabled: !!collateralAddress && !!address },
  });
  const collateralBalance = rawCollateralBalance as bigint | undefined;

  // User's Yes token balance
  const { data: rawYesBalance } = useReadContract({
    address: FACTORY_ADDRESS,
    abi: factoryAbi,
    functionName: "balanceOf",
    args: address && yesTokenId != null ? [address, yesTokenId as bigint] : undefined,
    chainId: base.id,
    query: { enabled: !!address && yesTokenId != null },
  });
  const yesBalance = rawYesBalance as bigint | undefined;

  // User's No token balance
  const { data: rawNoBalance } = useReadContract({
    address: FACTORY_ADDRESS,
    abi: factoryAbi,
    functionName: "balanceOf",
    args: address && noTokenId != null ? [address, noTokenId as bigint] : undefined,
    chainId: base.id,
    query: { enabled: !!address && noTokenId != null },
  });
  const noBalance = rawNoBalance as bigint | undefined;

  // Allowance for Buy tab
  const { data: rawAllowance } = useReadContract({
    address: collateralAddress,
    abi: erc20Abi,
    functionName: "allowance",
    args: address ? [address, FACTORY_ADDRESS] : undefined,
    chainId: base.id,
    query: { enabled: !!collateralAddress && !!address },
  });
  const allowance = rawAllowance as bigint | undefined;

  // Preview Mint (Buy tab)
  const { data: previewMintData } = useReadContract({
    address: FACTORY_ADDRESS,
    abi: factoryAbi,
    functionName: "previewMint",
    args: tokenId != null ? [conditionId, parsedAmount, tokenId] : undefined,
    chainId: base.id,
    query: { enabled: activeTab === "buy" && parsedAmount > BigInt(0) && tokenId != null },
  });

  // Preview Burn (Sell tab)
  const { data: previewBurnData } = useReadContract({
    address: FACTORY_ADDRESS,
    abi: factoryAbi,
    functionName: "previewBurn",
    args: tokenId != null ? [conditionId, tokenId, parsedAmount] : undefined,
    chainId: base.id,
    query: { enabled: activeTab === "sell" && parsedAmount > BigInt(0) && tokenId != null },
  });

  // ── Preview values ─────────────────────────────────────────────────────────

  const previewTokensOut = activeTab === "buy" && previewMintData ? (previewMintData as [bigint, bigint])[0] : undefined;
  const previewCollateralOut = activeTab === "sell" && previewBurnData ? (previewBurnData as [bigint, bigint])[0] : undefined;
  const effectivePrice =
    activeTab === "buy" && previewMintData
      ? (previewMintData as [bigint, bigint])[1]
      : activeTab === "sell" && previewBurnData
        ? (previewBurnData as [bigint, bigint])[1]
        : undefined;

  // ── Write contracts ────────────────────────────────────────────────────────

  // 1) Approve
  const {
    writeContract: writeApprove,
    data: approveTxHash,
    isPending: approvePending,
    reset: resetApprove,
  } = useWriteContract();

  const { isLoading: approveConfirming, isSuccess: approveSuccess } =
    useWaitForTransactionReceipt({ hash: approveTxHash });

  // 2) Mint
  const {
    writeContract: writeMint,
    data: mintTxHash,
    isPending: mintPending,
    reset: resetMint,
  } = useWriteContract();

  const { isLoading: mintConfirming, isSuccess: mintSuccess } =
    useWaitForTransactionReceipt({ hash: mintTxHash });

  // 3) Burn
  const {
    writeContract: writeBurn,
    data: burnTxHash,
    isPending: burnPending,
    reset: resetBurn,
  } = useWriteContract();

  const { isLoading: burnConfirming, isSuccess: burnSuccess } =
    useWaitForTransactionReceipt({ hash: burnTxHash });

  // ── After approve succeeds → refetch allowance ─────────────────────────────

  useEffect(() => {
    if (approveSuccess) {
      queryClient.invalidateQueries();
      resetApprove();
    }
  }, [approveSuccess, queryClient, resetApprove]);

  // ── After mint/burn succeeds → reset form & refetch ────────────────────────

  useEffect(() => {
    if (mintSuccess) {
      setAmount("");
      setTxError(null);
      queryClient.invalidateQueries();
      onTradeSuccess?.();
      resetMint();
    }
  }, [mintSuccess, queryClient, resetMint, onTradeSuccess]);

  useEffect(() => {
    if (burnSuccess) {
      setAmount("");
      setTxError(null);
      queryClient.invalidateQueries();
      onTradeSuccess?.();
      resetBurn();
    }
  }, [burnSuccess, queryClient, resetBurn, onTradeSuccess]);

  // ── Derived state ──────────────────────────────────────────────────────────

  const needsApproval = activeTab === "buy" && parsedAmount > BigInt(0) && (allowance ?? BigInt(0)) < parsedAmount;

  const currentBalance = activeTab === "buy"
    ? collateralBalance
    : outcome === "yes"
      ? yesBalance
      : noBalance;

  const balanceLabel = activeTab === "buy" ? "$CLAWDBET" : outcome === "yes" ? "Yes Tokens" : "No Tokens";

  // ── Action handlers ────────────────────────────────────────────────────────

  const handleMax = useCallback(() => {
    if (currentBalance != null) {
      setAmount(formatUnits(currentBalance, DECIMALS));
    }
  }, [currentBalance]);

  const handleApprove = useCallback(() => {
    if (!collateralAddress || !parsedAmount) return;
    setTxError(null);
    writeApprove(
      {
        address: collateralAddress!,
        abi: erc20Abi,
        functionName: "approve",
        args: [FACTORY_ADDRESS, parsedAmount],
        chainId: base.id,
      },
      { onError: (err) => setTxError(err.message.split("\n")[0]) },
    );
  }, [collateralAddress, parsedAmount, writeApprove]);

  const handleMint = useCallback(() => {
    if (tokenId == null || !parsedAmount || !previewTokensOut) return;
    setTxError(null);
    const minTokens = (previewTokensOut * BigInt(99)) / BigInt(100); // 1% slippage
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 600); // 10 min
    writeMint(
      {
        address: FACTORY_ADDRESS,
        abi: factoryAbi,
        functionName: "mintDecisionTokens",
        args: [conditionId, parsedAmount, tokenId, minTokens, deadline],
        chainId: base.id,
      },
      { onError: (err) => setTxError(err.message.split("\n")[0]) },
    );
  }, [conditionId, tokenId, parsedAmount, previewTokensOut, writeMint]);

  const handleBurn = useCallback(() => {
    if (tokenId == null || !parsedAmount || !previewCollateralOut) return;
    setTxError(null);
    const minCollateral = (previewCollateralOut * BigInt(99)) / BigInt(100); // 1% slippage
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 600);
    writeBurn(
      {
        address: FACTORY_ADDRESS,
        abi: factoryAbi,
        functionName: "burnDecisionTokens",
        args: [conditionId, tokenId, parsedAmount, minCollateral, deadline],
        chainId: base.id,
      },
      { onError: (err) => setTxError(err.message.split("\n")[0]) },
    );
  }, [conditionId, tokenId, parsedAmount, previewCollateralOut, writeBurn]);

  // ── Transaction status helpers ─────────────────────────────────────────────

  const isBusy =
    approvePending || approveConfirming || mintPending || mintConfirming || burnPending || burnConfirming;

  const statusText = approvePending || mintPending || burnPending
    ? "Confirm in wallet..."
    : approveConfirming || mintConfirming || burnConfirming
      ? "Confirming..."
      : null;

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
            <div className="w-12 h-12 rounded-full bg-slate-light/10 flex items-center justify-center mb-3">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-slate-light">
                <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="1.5" />
                <path d="M15 9L9 15M9 9L15 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
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
                  ? tab === "buy"
                    ? "text-white"
                    : "text-white"
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
            Balance: {fmtBalance(currentBalance)} {balanceLabel}
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
                    {activeTab === "buy" ? "You receive" : "You receive"}
                  </span>
                  <span className="font-semibold text-navy">
                    ~{activeTab === "buy"
                      ? `${fmtBalance(previewTokensOut)} tokens`
                      : `${fmtBalance(previewCollateralOut)} $CLAWDBET`}
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
                {(approvePending || approveConfirming) && <Spinner />}
                {statusText ?? "Approve $CLAWDBET"}
              </button>
            ) : (
              <button
                onClick={handleMint}
                disabled={isBusy || parsedAmount === BigInt(0) || previewTokensOut == null}
                className="w-full py-3 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-base-blue to-base-light hover:shadow-lg hover:shadow-base-blue/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
              >
                {(mintPending || mintConfirming) && <Spinner />}
                {statusText ?? `Buy ${outcome === "yes" ? "Yes" : "No"} Tokens`}
              </button>
            )
          ) : (
            <button
              onClick={handleBurn}
              disabled={isBusy || parsedAmount === BigInt(0) || previewCollateralOut == null}
              className="w-full py-3 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-coral to-coral-light hover:shadow-lg hover:shadow-coral/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
            >
              {(burnPending || burnConfirming) && <Spinner />}
              {statusText ?? `Sell ${outcome === "yes" ? "Yes" : "No"} Tokens`}
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
