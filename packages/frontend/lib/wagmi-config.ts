import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { base } from "wagmi/chains";
import { http } from "wagmi";

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;
if (!projectId?.trim()) {
  throw new Error(
    "Missing NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID. Get a free project ID at https://cloud.walletconnect.com/ and add it to .env"
  );
}

export const config = getDefaultConfig({
  appName: "ClawdBet",
  projectId,
  chains: [base],
  ssr: true,
  transports: {
    [base.id]: http("https://mainnet.base.org"),
  },
});
