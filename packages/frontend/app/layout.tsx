import type { Metadata } from "next";
import "@rainbow-me/rainbowkit/styles.css";
import "./globals.css";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: "OpenBet - Live Markets on Base",
  description:
    "OpenBet turns clear yes-or-no questions into live prediction markets with instant liquidity on Base.",
  openGraph: {
    title: "OpenBet - Live Markets on Base",
    description:
      "Create, explore, and trade live prediction markets on Base with OpenBet.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
