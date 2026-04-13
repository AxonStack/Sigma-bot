"use client";

import { useEffect, useState } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import { ProfileNameModal } from "./profile-name-modal";
import { getUserProfile, PROFILE_UPDATED_EVENT, type UserProfile } from "@/lib/profile-store";

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
  const { address, isConnected } = useAccount();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      if (!isConnected || !address) {
        setProfile(null);
        setProfileLoading(false);
        return;
      }

      setProfileLoading(true);
      const nextProfile = await getUserProfile(address);
      if (!cancelled) {
        setProfile(nextProfile);
        setProfileLoading(false);
      }
    }

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, [address, isConnected]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleProfileUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<UserProfile>;
      const nextProfile = customEvent.detail;

      if (!nextProfile?.address || !address) return;
      if (nextProfile.address.toLowerCase() === address.toLowerCase()) {
        setProfile(nextProfile);
      }
    };

    window.addEventListener(PROFILE_UPDATED_EVENT, handleProfileUpdate as EventListener);
    return () => {
      window.removeEventListener(PROFILE_UPDATED_EVENT, handleProfileUpdate as EventListener);
    };
  }, [address]);

  return (
    <>
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

          const profileLabel = profileLoading ? "Loading name..." : profile?.name ?? "Set name";
          const accountLabel = profile?.name ?? account?.displayName ?? "Wallet connected";
          const showFullProfileButton = fullWidth;

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
                    <button
                      type="button"
                      onClick={openChainModal}
                      className={cn("wallet-network-pill", fullWidth && "w-full justify-between")}
                    >
                      <span
                        className="wallet-network-dot"
                        style={{ backgroundColor: chain.iconBackground ?? "#53ff84" }}
                      />
                      <span>{chain.name}</span>
                    </button>
                  )}

                  {showFullProfileButton ? (
                    <button
                      type="button"
                      onClick={() => setProfileModalOpen(true)}
                      className={cn("wallet-network-pill", fullWidth && "w-full justify-between")}
                    >
                      <span className="wallet-network-dot" />
                      <span className="max-w-[10rem] truncate">{profileLabel}</span>
                    </button>
                  ) : null}

                  <div className={cn("flex items-center gap-2", fullWidth && "w-full")}>
                    {!showFullProfileButton ? (
                      <button
                        type="button"
                        onClick={() => setProfileModalOpen(true)}
                        className="wallet-icon-pill"
                        aria-label={profile?.name ? "Change display name" : "Set display name"}
                        title={profile?.name ? "Change display name" : "Set display name"}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                          <path d="M12 20h9" />
                          <path d="M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4z" />
                        </svg>
                      </button>
                    ) : null}

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
                        <div className="min-w-0 text-right">
                          <div className="wallet-account-name">{accountLabel}</div>
                          {profile?.name ? (
                            <div className="wallet-account-subtext">{account.displayName}</div>
                          ) : null}
                        </div>
                        <span className="text-white/30">▾</span>
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        }}
      </ConnectButton.Custom>

      <ProfileNameModal
        isOpen={profileModalOpen}
        address={address}
        currentName={profile?.name}
        onClose={() => setProfileModalOpen(false)}
        onSaved={(nextProfile) => setProfile(nextProfile)}
      />
    </>
  );
}
