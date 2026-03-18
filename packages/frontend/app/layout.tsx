import type { Metadata } from "next";
import { Oswald, Source_Sans_3, Great_Vibes } from "next/font/google";
import "@rainbow-me/rainbowkit/styles.css";
import "./globals.css";
import { Providers } from "@/components/providers";

const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-source-sans",
  display: "swap",
});

const oswald = Oswald({
  subsets: ["latin"],
  variable: "--font-oswald",
  display: "swap",
});

const greatVibes = Great_Vibes({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-great-vibes",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ClawdBet — Instant Prediction Markets by AI",
  description:
    "Create any prediction market instantly with guaranteed liquidity. ClawdBet is an AI agent on Base that turns any question into a tradeable market backed by $CLAWDBET.",
  openGraph: {
    title: "ClawdBet — Instant Prediction Markets by AI",
    description:
      "Create any prediction market instantly with guaranteed liquidity in $CLAWDBET.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${sourceSans.variable} ${oswald.variable} ${greatVibes.variable}`}
    >
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
