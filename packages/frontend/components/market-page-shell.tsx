"use client";

import Link from "next/link";
import { Navbar } from "@/components/navbar";

/** Reusable page wrapper for all market-detail states (background, navbar, back link). */
export function MarketPageShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen relative overflow-hidden">
      {/* Background layers */}
      <div className="absolute inset-0 bg-gradient-to-b from-ice-deep via-ice to-white" />
      <div className="absolute inset-0 bg-grid opacity-50" />
      <div
        className="absolute top-20 -right-40 w-[480px] h-[480px] rounded-full opacity-40 blur-3xl blob-slow"
        style={{ background: "rgba(0,82,255,0.08)" }}
      />
      <div
        className="absolute bottom-1/4 -left-32 w-[320px] h-[320px] rounded-full opacity-30 blur-3xl blob-slow"
        style={{ background: "rgba(6,182,212,0.1)" }}
      />

      <Navbar />

      {/* Back link */}
      <div className="relative max-w-7xl mx-auto px-6 pt-20 md:pt-24">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-slate hover:text-base-blue transition-colors duration-200 mb-6"
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
      ? "border-coral/20"
      : variant === "loading"
        ? "border-base-blue/20"
        : "border-navy/[0.06]";

  return (
    <MarketPageShell>
      <div className="relative min-h-[50vh] flex items-center justify-center px-6 -mt-10">
        <div
          className={`relative p-8 rounded-2xl glass ${borderColor} border max-w-md text-center`}
        >
          {variant === "loading" && (
            <div className="absolute -inset-[1px] rounded-2xl overflow-hidden">
              <div
                className="absolute inset-0 animate-spin-slow"
                style={{
                  background:
                    "conic-gradient(from 0deg, transparent 70%, #0052FF 85%, #06B6D4 95%, transparent 100%)",
                }}
              />
              <div className="absolute inset-[1px] rounded-[15px] glass" />
            </div>
          )}
          <div className="relative">
            <p className="text-navy font-semibold">{title}</p>
            {subtitle && (
              <p className="text-sm text-slate mt-2">{subtitle}</p>
            )}
          </div>
        </div>
      </div>
    </MarketPageShell>
  );
}
