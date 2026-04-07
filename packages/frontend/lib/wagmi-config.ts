import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { baseSepolia } from "wagmi/chains";
import { http, createStorage, cookieStorage } from "wagmi";

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;
if (!projectId?.trim()) {
  throw new Error(
    "Missing NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID. Get a free project ID at https://cloud.walletconnect.com/ and add it to .env"
  );
}

export const config = getDefaultConfig({
  appName: "ClawdBet",
  projectId,
  chains: [baseSepolia],
  ssr: true,
  storage: createStorage({
    storage: typeof window !== 'undefined' ? window.localStorage : cookieStorage,
  }),
  transports: {
    [baseSepolia.id]: http(process.env.NEXT_PUBLIC_RPC_URL ?? "https://sepolia.base.org"),
  },
});
