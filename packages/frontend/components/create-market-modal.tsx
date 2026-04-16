"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAccount, useWalletClient } from "wagmi";
import { encodeFunctionData, parseUnits } from "viem";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { base } from "wagmi/chains";
import {
  createMarketRequestEntry,
} from "@/lib/market-request-store";
import { simplifyError } from "@/lib/errors";

function cleanEnv(value: string | undefined): string {
  return (value ?? "").trim();
}

const BACKEND_URL = cleanEnv(
  process.env.NEXT_PUBLIC_OPENBET_MARKET_SERVICE_URL ??
    process.env.OPENBET_MARKET_SERVICE_URL ??
    process.env.NEXT_PUBLIC_CLAWDBET_MARKET_SERVICE_URL ??
    process.env.CLAWDBET_MARKET_SERVICE_URL
);
const BACKEND_WALLET = cleanEnv(
  process.env.NEXT_PUBLIC_OPENBET_BACKEND_WALLET_ADDRESS ??
    process.env.NEXT_PUBLIC_BACKEND_WALLET_ADDRESS
);
const OPENBET_ADDRESS = cleanEnv(
  process.env.NEXT_PUBLIC_OPENBET_TOKEN_ADDRESS ??
    process.env.NEXT_PUBLIC_SIGMA_ADDRESS
) as `0x${string}`;
const USDC_ADDRESS = cleanEnv(process.env.NEXT_PUBLIC_USDC_ADDRESS) as `0x${string}`;
const GENERATION_FEE_USDC = "5"; // 5 USDC fee
const ERC20_TRANSFER_ABI = [
  {
    name: "transfer",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "recipient", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ type: "boolean" }],
  },
] as const;

interface GeneratedMarket {
  resolvable: boolean;
  reason?: string;
  question: string;
  description: string;
  endTime: number;
  resolutionSource: string;
}

const REVIEW_MINUTES_MIN = 5;
const REVIEW_MINUTES_MAX = 10;

export function CreateMarketModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const router = useRouter();
  const { address, chainId } = useAccount();
  const { data: walletClient } = useWalletClient();
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState("");
  const [generated, setGenerated] = useState<GeneratedMarket | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const resetState = () => {
    setPrompt("");
    setLoading(false);
    setPhase("");
    setGenerated(null);
    setError(null);
    setTxHash(null);
  };

  const closeAndReset = () => {
    resetState();
    onClose();
  };

  const handleGenerateAndDeploy = async () => {
    if (!prompt.trim() || !BACKEND_URL || !BACKEND_WALLET || !OPENBET_ADDRESS || !USDC_ADDRESS || !address) {
      setError("OpenBet env configuration is incomplete.");
      return;
    }

    if (chainId !== base.id) {
      setError("Switch your wallet to Base Mainnet before submitting.");
      return;
    }

    if (!walletClient) {
      setError("Wallet client unavailable. Reconnect your wallet and try again.");
      return;
    }
    
    setLoading(true);
    setError(null);
    setGenerated(null);
    setTxHash(null);
    
    try {
      // Step 1: User pays the fee first
      setPhase("Confirming fee payment in wallet...");
      const paymentTxHash = await walletClient.sendTransaction({
        account: address,
        chain: base,
        to: USDC_ADDRESS,
        data: encodeFunctionData({
          abi: ERC20_TRANSFER_ABI,
          functionName: "transfer",
          args: [
            BACKEND_WALLET as `0x${string}`,
            parseUnits(GENERATION_FEE_USDC, 6),
          ],
        }),
        gas: BigInt(70_000),
      });

      setPhase("Submitting request to agent...");
      await createMarketRequestEntry({
        creator: address,
        prompt: prompt.trim(),
        txHash: paymentTxHash,
      });

      resetState();
      onClose();
      router.push("/markets?scope=mine");
    } catch (err: unknown) {
      setError(simplifyError(err));
    } finally {
      setLoading(false);
      setPhase("");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-navy/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-lg rounded-3xl border border-white/10 bg-[#08100b] p-8 shadow-[0_30px_90px_rgba(0,0,0,0.5)]"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-display text-white">AI Market Architect</h2>
          <button onClick={closeAndReset} className="text-white/45 hover:text-white transition-colors">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-6">
          <p className="text-white/62">Describe the market you want to build. Our AI will handle the categories, end-dates, and verification sources.</p>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., Will it be snowing in London on Christmas 2025?"
            className="w-full h-32 resize-none rounded-2xl border border-white/10 bg-[#121615] p-4 text-white outline-none transition-all placeholder:text-white/28 focus:border-white/18 focus:ring-0"
          />
          
          {!generated ? (
            <button
              onClick={handleGenerateAndDeploy}
              disabled={loading || !prompt.trim()}
              className="w-full rounded-full bg-white/12 py-4 font-semibold text-white transition-all hover:bg-emerald-500 hover:text-[#041006] disabled:opacity-50"
            >
              {loading ? phase : `Submit For Review (${GENERATION_FEE_USDC} USDC)`}
            </button>
          ) : null}

          {error && <p className="text-coral text-sm mt-2">{error}</p>}

          {/* Success / Final State Preview */}
          <AnimatePresence>
            {generated && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="space-y-6 mt-6"
              >
                <div className="rounded-2xl border border-white/10 bg-[#0d1710] p-6">
                  <h3 className="mb-2 font-semibold text-white">{generated.question}</h3>
                  <p className="mb-4 text-sm text-white/62">{generated.description}</p>
                  <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                    <div>
                      <span className="block uppercase text-white/38">Settlement Date</span>
                      <span className="text-white">{new Date(generated.endTime * 1000).toLocaleDateString()}</span>
                    </div>
                    <div>
                      <span className="block uppercase text-white/38">Oracle Source</span>
                      <span className="block truncate text-white">{generated.resolutionSource}</span>
                    </div>
                  </div>
                </div>

                {txHash ? (
                  <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4 text-center text-emerald-100 shadow-sm">
                    <p className="mb-1 text-lg font-bold">Market Successfully Deployed!</p>
                    <a href={`https://basescan.org/tx/${txHash}`} target="_blank" rel="noreferrer" className="text-sm text-emerald-300 hover:underline">
                      View Tx: {txHash.slice(0, 10)}...{txHash.slice(-8)}
                    </a>
                    <p className="mt-2 text-xs text-emerald-200/70">
                      Refreshing automatically...
                    </p>
                  </div>
                ) : loading ? (
                  <div className="text-center p-4">
                    <p className="animate-pulse font-semibold text-emerald-300">{phase}</p>
                  </div>
                ) : null}
                
                {txHash && (
                  <button 
                    onClick={() => { setGenerated(null); setPrompt(""); setTxHash(null); }}
                    className="mt-2 w-full rounded-full border border-white/12 py-2 text-sm font-medium text-white/68 transition-colors hover:border-emerald-400/30 hover:text-white"
                  >
                    Create Another Market
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
