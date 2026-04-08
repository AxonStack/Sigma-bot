"use client";

import { useState } from "react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseUnits } from "viem";
import { baseSepolia } from "wagmi/chains";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";

const BACKEND_URL = process.env.NEXT_PUBLIC_CLAWDBET_MARKET_SERVICE_URL;
const BACKEND_WALLET = process.env.NEXT_PUBLIC_BACKEND_WALLET_ADDRESS;
const SIGMA_ADDRESS = process.env.NEXT_PUBLIC_SIGMA_ADDRESS as `0x${string}`;
const USDC_ADDRESS = process.env.NEXT_PUBLIC_USDC_ADDRESS as `0x${string}`;
const GENERATION_FEE_USDC = "5"; // 5 USDC fee

interface GeneratedMarket {
  resolvable: boolean;
  reason?: string;
  question: string;
  description: string;
  endTime: number;
  resolutionSource: string;
}

export function CreateMarketModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState("");
  const [generated, setGenerated] = useState<GeneratedMarket | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const { writeContractAsync } = useWriteContract();

  const handleGenerateAndDeploy = async () => {
    if (!prompt.trim() || !BACKEND_WALLET || !SIGMA_ADDRESS) return;
    
    setLoading(true);
    setError(null);
    setGenerated(null);
    setTxHash(null);
    
    try {
      // Step 1: User pays the fee first
      setPhase("Confirming fee payment in wallet...");
      const tx = await writeContractAsync({
        address: USDC_ADDRESS,
        abi: [
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
        ],
        functionName: "transfer",
        args: [
          BACKEND_WALLET as `0x${string}`,
          parseUnits(GENERATION_FEE_USDC, 6), // USDC usually has 6 decimals
        ],
      });

      // Step 2: Generate market via AI
      setPhase("AI is architecting your market...");
      const genResponse = await axios.post(`${BACKEND_URL}/markets/generate`, {
        prompt,
      });
      
      const marketData = genResponse.data;
      if (!marketData.resolvable) {
        setError(`AI Rejected: ${marketData.reason || "Question is not objectively verifiable."} (Note: Creation fee captured)`);
        setLoading(false);
        return;
      }
      
      setGenerated(marketData);

      // Step 3: Deploy on-chain via Relayer
      setPhase("Deploying to Base Sepolia...");
      const execResponse = await axios.post(`${BACKEND_URL}/markets/execute-creation`, {
        ...marketData,
        collateralToken: SIGMA_ADDRESS,
        initialLiquidity: "100", 
        userPaymentTxHash: tx,
      });

      setTxHash(execResponse.data.txHash);
    } catch (err: any) {
      setError(err.message || "Process failed. Ensure you have USDC balance and approved the transaction.");
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
        className="w-full max-w-lg bg-white rounded-3xl p-8 shadow-2xl"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-display text-navy">AI Market Architect</h2>
          <button onClick={onClose} className="text-slate hover:text-navy transition-colors">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-6">
          <p className="text-slate">Describe the market you want to build. Our AI will handle the categories, end-dates, and verification sources.</p>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., Will it be snowing in London on Christmas 2025?"
            className="w-full h-32 p-4 rounded-2xl bg-ice border border-navy/5 focus:border-base-blue/30 focus:ring-0 outline-none transition-all resize-none text-navy"
          />
          
          {!generated ? (
            <button
              onClick={handleGenerateAndDeploy}
              disabled={loading || !prompt.trim()}
              className="w-full py-4 bg-navy text-white rounded-full font-semibold hover:bg-base-blue transition-all disabled:opacity-50"
            >
              {loading ? phase : `Generate & Deploy (${GENERATION_FEE_USDC} USDC)`}
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
                <div className="p-6 rounded-2xl bg-ice/50 border border-navy/5">
                  <h3 className="font-semibold text-navy mb-2">{generated.question}</h3>
                  <p className="text-sm text-slate mb-4">{generated.description}</p>
                  <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                    <div>
                      <span className="block text-slate/60 uppercase">Settlement Date</span>
                      <span className="text-navy">{new Date(generated.endTime * 1000).toLocaleDateString()}</span>
                    </div>
                    <div>
                      <span className="block text-slate/60 uppercase">Oracle Source</span>
                      <span className="text-navy truncate block">{generated.resolutionSource}</span>
                    </div>
                  </div>
                </div>

                {txHash ? (
                  <div className="text-center p-4 bg-green-50 text-green-700 rounded-2xl shadow-sm border border-green-200">
                    <p className="font-bold text-lg mb-1">🎉 Market Successfully Deployed!</p>
                    <a href={`https://sepolia.basescan.org/tx/${txHash}`} target="_blank" rel="noreferrer" className="text-sm text-green-600 hover:underline">
                      View Tx: {txHash.slice(0, 10)}...{txHash.slice(-8)}
                    </a>
                  </div>
                ) : loading ? (
                  <div className="text-center p-4">
                    <p className="text-base-blue font-semibold animate-pulse">{phase}</p>
                  </div>
                ) : null}
                
                {txHash && (
                  <button 
                    onClick={() => { setGenerated(null); setPrompt(""); setTxHash(null); }}
                    className="w-full text-sm text-slate hover:text-navy transition-colors font-medium border border-slate/20 rounded-full py-2 mt-2"
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
