"use client";

import Link from "next/link";
import { Navbar } from "@/components/navbar";

/** Reusable page wrapper for all market-detail states (background, navbar, back link). */
export function MarketPageShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen relative overflow-hidden bg-[#040704] text-white">
      <div className="absolute inset-0 bg-grid opacity-[0.05]" />
      <div
        className="absolute top-20 -right-40 w-[480px] h-[480px] rounded-full opacity-40 blur-3xl blob-slow"
        style={{ background: "rgba(15, 230, 78, 0.14)" }}
      />
      <div
        className="absolute bottom-1/4 -left-32 w-[320px] h-[320px] rounded-full opacity-30 blur-3xl blob-slow"
        style={{ background: "rgba(74, 222, 128, 0.12)" }}
      />

      <Navbar />

      {/* Back link */}
      <div className="relative max-w-7xl mx-auto px-6 pt-20 md:pt-24">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-white/55 hover:text-white transition-colors duration-200 mb-6"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            className="transition-transform duration-200 group-hover:-translate-x-0.5"
          >
            <path
              d="M10 12L6 8L10 4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Back to home
        </Link>
      </div>

      {children}
    </main>
  );
}

/** Centered glass message card for error / loading / info states. */
export function MarketMessageCard({
  title,
  subtitle,
  variant = "default",
}: {
  title: string;
  subtitle?: string;
  variant?: "default" | "error" | "loading";
}) {
  const borderColor =
    variant === "error"
      ? "border-red-500/25"
      : variant === "loading"
        ? "border-emerald-500/25"
        : "border-white/10";

  return (
    <MarketPageShell>
      <div className="relative min-h-[50vh] flex items-center justify-center px-6 -mt-10">
        <div className={`relative p-8 rounded-2xl glass-strong ${borderColor} border max-w-md text-center`}>
          {variant === "loading" && (
            <div className="absolute -inset-[1px] rounded-2xl overflow-hidden">
              <div
                className="absolute inset-0 animate-spin-slow"
                style={{
                  background:
                    "conic-gradient(from 0deg, transparent 70%, #22c55e 85%, #34d399 95%, transparent 100%)",
                }}
              />
              <div className="absolute inset-[1px] rounded-[15px] glass-strong" />
            </div>
          )}
          <div className="relative">
            <p className="text-white font-semibold">{title}</p>
            {subtitle && (
              <p className="text-sm text-white/58 mt-2">{subtitle}</p>
            )}
          </div>
        </div>
      </div>
    </MarketPageShell>
  );
}
