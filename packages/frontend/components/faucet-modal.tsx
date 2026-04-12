"use client";

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { FAUCET_API } from "@/lib/config";

export function FaucetModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { address } = useAccount();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ canClaim: boolean; remaining: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string[] | null>(null);
  const [countdown, setCountdown] = useState<string>("");

  useEffect(() => {
    if (isOpen && address) {
      fetchStatus();
    }
  }, [isOpen, address]);

  useEffect(() => {
    if (status && !status.canClaim && status.remaining > 0) {
      const timer = setInterval(() => {
        const now = Date.now();
        const end = Date.now() + status.remaining; // This is a bit simplified
        // Status.remaining is constant from fetch, need to adjust
      }, 1000);
      // Let's use a simpler approach for the countdown
    }
  }, [status]);

  // Better countdown effect
  useEffect(() => {
    if (!status || status.canClaim) return;

    let remainingMs = status.remaining;
    const interval = setInterval(() => {
      remainingMs -= 1000;
      if (remainingMs <= 0) {
        setStatus({ canClaim: true, remaining: 0 });
        setCountdown("");
        clearInterval(interval);
      } else {
        const hours = Math.floor(remainingMs / (1000 * 60 * 60));
        const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((remainingMs % (1000 * 60)) / 1000);
        setCountdown(`${hours}h ${minutes}m ${seconds}s`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [status]);

  const fetchStatus = async () => {
    if (!address) return;
    try {
      const res = await axios.get(`${FAUCET_API}/status/${address}`);
      setStatus(res.data);
    } catch (err) {
      console.error("Failed to fetch faucet status", err);
    }
  };

  const handleClaim = async () => {
    if (!address) return;
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await axios.post(`${FAUCET_API}/claim`, { address });
      setSuccess(res.data.txHashes);
      fetchStatus();
    } catch (err: any) {
      setError(err.response?.data?.message || "Claim failed. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-navy/60 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-md overflow-hidden rounded-[2.5rem] border border-white/10 bg-[#0a0f0c] p-1 shadow-[0_32px_128px_rgba(0,0,0,0.8)]"
      >
        {/* Glow effect */}
        <div className="absolute -top-24 -left-24 h-48 w-48 rounded-full bg-emerald-500/10 blur-[80px]" />
        <div className="absolute -bottom-24 -right-24 h-48 w-48 rounded-full bg-emerald-500/10 blur-[80px]" />

        <div className="relative rounded-[2.25rem] bg-[#0d1310] p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-display font-bold text-white tracking-tight">Testnet Faucet</h2>
              <p className="text-white/40 text-sm mt-1">Refuel your wallet for the markets.</p>
            </div>
            <button
              onClick={onClose}
              className="group flex h-10 w-10 items-center justify-center rounded-full border border-white/5 bg-white/5 transition-all hover:bg-white/10"
            >
              <svg className="h-5 w-5 text-white/40 transition-colors group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-5 text-center transition-colors hover:border-white/10">
                <span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-white/30 mb-2">Market token faucet</span>
                <span className="text-2xl font-display font-bold text-white">10.0</span>
              </div>
              <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-5 text-center transition-colors hover:border-white/10">
                <span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-white/30 mb-2">Trading token faucet</span>
                <span className="text-2xl font-display font-bold text-white">100</span>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <button
                disabled={loading || (status && !status.canClaim) || !address}
                onClick={handleClaim}
                className="relative group w-full overflow-hidden rounded-2xl bg-white py-4 font-bold text-[#050906] transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:hover:scale-100 disabled:grayscale-[0.5]"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-teal-400 opacity-0 transition-opacity group-hover:opacity-100" />
                <span className="relative">
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                       <svg className="animate-spin h-5 w-5 text-[#050906]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Sending Tokens...
                    </span>
                  ) : status && !status.canClaim ? (
                    `Next claim in ${countdown}`
                  ) : !address ? (
                    "Connect Wallet"
                  ) : (
                    "Claim Test Tokens"
                  )}
                </span>
              </button>

              <AnimatePresence>
                {success && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl border border-green-500/20 bg-green-500/10 p-4 text-center"
                  >
                    <p className="text-sm font-bold text-green-400 mb-1">Tokens Received!</p>
                    <p className="text-[10px] text-green-300/60 leading-relaxed uppercase tracking-widest">
                      10 WSUSDC & 100 SIGMA sent to your wallet.
                    </p>
                  </motion.div>
                )}

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-center"
                  >
                    <p className="text-xs text-red-300">{error}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
