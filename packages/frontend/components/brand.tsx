import { useId } from "react";

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function BrandMark({
  className,
  frameClassName,
}: {
  className?: string;
  frameClassName?: string;
}) {
  const id = useId().replace(/:/g, "");
  const glowId = `openbet-glow-${id}`;
  const strokeId = `openbet-stroke-${id}`;

  return (
    <div
      className={cn(
        "relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-[1rem] border border-black/8 bg-[#141311] shadow-[0_18px_40px_rgba(20,19,17,0.16)]",
        frameClassName,
      )}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(199,157,91,0.22),_transparent_58%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(160deg,rgba(255,255,255,0.08),transparent_38%,rgba(17,105,93,0.18))]" />
      <svg
        viewBox="0 0 64 64"
        fill="none"
        aria-hidden="true"
        className={cn("relative h-7 w-7", className)}
      >
        <defs>
          <linearGradient id={strokeId} x1="12" y1="12" x2="54" y2="52" gradientUnits="userSpaceOnUse">
            <stop stopColor="#F5E7C8" />
            <stop offset="0.5" stopColor="#C79D5B" />
            <stop offset="1" stopColor="#2F8B7D" />
          </linearGradient>
          <filter id={glowId} x="0" y="0" width="64" height="64" filterUnits="userSpaceOnUse">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <g filter={`url(#${glowId})`}>
          <path
            d="M14 32c0-10.4 7.8-18 18.6-18h9.2"
            stroke={`url(#${strokeId})`}
            strokeLinecap="round"
            strokeWidth="5"
          />
          <path
            d="M50 32c0 10.4-7.8 18-18.6 18h-9.2"
            stroke={`url(#${strokeId})`}
            strokeLinecap="round"
            strokeWidth="5"
          />
          <path
            d="M20 43.5 30.5 21 39 32l9-11"
            stroke={`url(#${strokeId})`}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="4.2"
          />
        </g>
      </svg>
    </div>
  );
}

export function BrandLockup({
  tone = "dark",
  withTagline = false,
  compact = false,
}: {
  tone?: "dark" | "light";
  withTagline?: boolean;
  compact?: boolean;
}) {
  const titleClass = tone === "light" ? "text-white" : "text-ink";
  const subtitleClass = tone === "light" ? "text-white/55" : "text-ink-muted";

  return (
    <div className="flex items-center gap-3">
      <BrandMark
        frameClassName={
          tone === "light"
            ? "border-black/8 bg-[#141311]"
            : "border-black/8 bg-[#141311]"
        }
      />
      <div className="leading-none">
        <div
          className={cn(
            "font-display text-[1.08rem] tracking-[-0.04em]",
            compact && "text-base",
            titleClass,
          )}
        >
          OpenBet
        </div>
        {withTagline && (
          <div
            className={cn(
              "mt-1 text-[0.65rem] uppercase tracking-[0.28em]",
              subtitleClass,
            )}
          >
            Open conviction boards
          </div>
        )}
      </div>
    </div>
  );
}
