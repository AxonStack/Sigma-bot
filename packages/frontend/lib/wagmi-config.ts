import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { http } from "viem";
import { baseSepolia } from "wagmi/chains";

const projectId =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID?.trim() ||
  "walletconnect-project-id-required";

if (
  process.env.NODE_ENV !== "production" &&
  !process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID?.trim()
) {
  console.warn(
    "Missing NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID. Wallet connections may not work until it is set."
  );
}

export const config = getDefaultConfig({
  appName: "OpenBet",
  projectId,
  chains: [baseSepolia],
  ssr: true,
  transports: {
    [baseSepolia.id]: http(process.env.NEXT_PUBLIC_RPC_URL ?? "https://sepolia.base.org"),
  },
});
