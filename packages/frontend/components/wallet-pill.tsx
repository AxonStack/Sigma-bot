"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function WalletPill({
  fullWidth = false,
  showNetwork = true,
}: {
  fullWidth?: boolean;
  showNetwork?: boolean;
}) {
  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        mounted,
        authenticationStatus,
        openAccountModal,
        openChainModal,
        openConnectModal,
      }) => {
        const ready = mounted && authenticationStatus !== "loading";
        const connected =
          ready &&
          !!account &&
          !!chain &&
          (!authenticationStatus || authenticationStatus === "authenticated");

        return (
          <div
            aria-hidden={!ready}
            style={{
              opacity: ready ? 1 : 0,
              pointerEvents: ready ? "auto" : "none",
              userSelect: ready ? "auto" : "none",
            }}
            className={cn(fullWidth && "w-full")}
          >
            {!connected ? (
              <button
                type="button"
                onClick={openConnectModal}
                className={cn("wallet-primary-pill", fullWidth && "w-full justify-center")}
              >
                <span className="wallet-status-dot" />
                Connect wallet
              </button>
            ) : chain.unsupported ? (
              <button
                type="button"
                onClick={openChainModal}
                className={cn("wallet-warning-pill", fullWidth && "w-full justify-center")}
              >
                Wrong network
              </button>
            ) : (
              <div className={cn("flex items-center gap-2", fullWidth ? "w-full flex-col" : "justify-end")}>
                {showNetwork && (
                  <button type="button" onClick={openChainModal} className="wallet-network-pill">
                    <span
                      className="wallet-network-dot"
                      style={{ backgroundColor: chain.iconBackground ?? "#ff7bb9" }}
                    />
                    <span>{chain.name}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={openAccountModal}
                  className={cn("wallet-account-pill", fullWidth && "w-full justify-between")}
                >
                  <div className="min-w-0">
                    <div className="wallet-account-balance">
                      {account.displayBalance ?? "Wallet connected"}
                    </div>
                  </div>
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="wallet-account-name">{account.displayName}</span>
                    <span className="text-white/30">▾</span>
                  </div>
                </button>
              </div>
            )}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}
