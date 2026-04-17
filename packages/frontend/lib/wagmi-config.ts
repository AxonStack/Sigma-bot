import { http, createConfig, createStorage, cookieStorage } from "wagmi";
import { base } from "wagmi/chains";
import { baseAccount, injected } from "wagmi/connectors";
import { fallback } from "viem";

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

function getRpcUrls() {
  const configured = (process.env.NEXT_PUBLIC_RPC_URL ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  return Array.from(
    new Set([
      ...configured,
      "https://mainnet.base.org",
      "https://base-rpc.publicnode.com",
    ]),
  );
}

export const config = createConfig({
  chains: [base],
  connectors: [
    injected(),
    baseAccount({
      appName: "OpenBet",
    }),
  ],
  storage: createStorage({ storage: cookieStorage }),
  ssr: true,
  transports: {
    [base.id]: fallback(
      getRpcUrls().map((url) =>
        http(url, {
          retryCount: 2,
          retryDelay: 250,
          timeout: 8_000,
        }),
      ),
    ),
  },
});

declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}
