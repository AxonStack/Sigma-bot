"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { saveUserProfile, type UserProfile } from "@/lib/profile-store";

function truncateAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function ProfileNameModal({
  isOpen,
  address,
  currentName,
  onClose,
  onSaved,
}: {
  isOpen: boolean;
  address: string | undefined;
  currentName: string | undefined;
  onClose: () => void;
  onSaved: (profile: UserProfile) => void;
}) {
  const [name, setName] = useState(currentName ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setName(currentName ?? "");
      setError(null);
      setLoading(false);
    }
  }, [currentName, isOpen]);

  if (!isOpen || !address) return null;

  const walletAddress = address;

  async function handleSave() {
    const trimmedName = name.trim();

    if (trimmedName.length < 2 || trimmedName.length > 24) {
      setError("Name must be between 2 and 24 characters.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const profile = await saveUserProfile(walletAddress, trimmedName);
      onSaved(profile);
      onClose();
    } catch (err: unknown) {
      if (typeof err === "object" && err && "response" in err) {
        const responseError = err as { response?: { data?: { message?: string | string[] } } };
        const message = responseError.response?.data?.message;
        setError(Array.isArray(message) ? message.join(" ") : message || "Could not save name.");
      } else {
        setError("Could not save name.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] bg-[#030503]/12 backdrop-blur-xl">
      <div className="flex h-full items-start justify-center px-5 pb-6 pt-24 sm:px-6 sm:pt-28">
        <motion.div
          initial={{ opacity: 0, scale: 0.97, y: 28 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: 28 }}
          className="w-full max-w-xl rounded-[2.15rem] border border-white/10 bg-[#0b120d] p-7 shadow-[0_36px_120px_rgba(0,0,0,0.72)] sm:p-8"
        >
        <div className="flex items-start justify-between gap-4">
          <div className="max-w-[28rem]">
            <div className="inline-flex items-center rounded-full border border-emerald-300/15 bg-[#112117] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-emerald-200/78">
              Wallet profile
            </div>
            <h2 className="mt-4 font-display text-[2rem] leading-none text-white sm:text-[2.15rem]">
              {currentName ? "Change Name" : "Set Your Name"}
            </h2>
            <p className="mt-3 text-sm leading-6 text-white/56 sm:text-[15px]">
              This name is stored against {truncateAddress(address)} and can be reused in leaderboard-style views.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-white/8 bg-[#151c17] text-white/48 transition-colors hover:border-white/14 hover:bg-[#1a231d] hover:text-white"
            aria-label="Close name modal"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mt-7 rounded-[1.75rem] border border-white/8 bg-[#101712] p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <label className="block text-[11px] uppercase tracking-[0.24em] text-white/38">
              Display name
            </label>
            <span className="rounded-full border border-white/8 bg-[#151c17] px-2.5 py-1 text-[10px] font-medium text-white/42">
              Max 24 chars
            </span>
          </div>
          <div className="rounded-[1.5rem] border border-white/10 bg-[#121914] p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Enter a display name"
              maxLength={24}
              className="w-full rounded-[1.1rem] border border-transparent bg-transparent px-4 py-4 text-[1.1rem] text-white outline-none transition-colors placeholder:text-white/24 focus:border-emerald-400/20"
            />
          </div>
          <p className="mt-4 max-w-[32rem] text-sm leading-6 text-white/42">
            2-24 characters. Letters, numbers, spaces, underscores, and hyphens only.
          </p>
          {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
        </div>

        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onClose}
            className="button-secondary min-h-[3.7rem] flex-1 rounded-full px-6 text-base font-semibold"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={loading}
            className="button-primary min-h-[3.7rem] flex-1 rounded-full px-6 text-base font-semibold"
          >
            {loading ? "Saving..." : currentName ? "Save change" : "Save name"}
          </button>
        </div>

        <div className="mt-5 text-xs uppercase tracking-[0.2em] text-white/24">
          Connected wallet: {truncateAddress(address)}
        </div>
        </motion.div>
      </div>
    </div>
  );
}
