import type { Metadata } from "next";
import "@rainbow-me/rainbowkit/styles.css";
import "./globals.css";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: "OpenBet - Live Markets on Base",
  description:
    "OpenBet turns clear yes-or-no questions into live prediction markets with instant liquidity on Base.",
  icons: {
    icon: "/icon.png",
    apple: "/apple-icon.png",
  },
  openGraph: {
    title: "OpenBet - Live Markets on Base",
    description:
      "Create, explore, and trade live prediction markets on Base with OpenBet.",
    type: "website",
  },
  other: {
    "base:app_id": "69e1d992f26f0c283cbfc12d",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
