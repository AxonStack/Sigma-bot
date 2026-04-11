"use client";

export type MarketRequestStatus = "reviewing" | "deployed" | "rejected";

export type MarketRequestEntry = {
  id: string;
  creator: string;
  prompt: string;
  question: string;
  createdAt: number;
  reviewEndsAt: number;
  status: MarketRequestStatus;
  resolutionMessage?: string;
  description?: string;
  endTime?: number;
  resolutionSource?: string;
  txHash?: string;
  conditionId?: string;
};

const STORAGE_KEY = "openbet.market-requests.v1";
export const MARKET_REQUESTS_UPDATED_EVENT = "openbet-market-requests-updated";

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function dispatchUpdate() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(MARKET_REQUESTS_UPDATED_EVENT));
  }
}

export function getStoredMarketRequests(): MarketRequestEntry[] {
  if (!canUseStorage()) return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function setStoredMarketRequests(entries: MarketRequestEntry[]) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  dispatchUpdate();
}

export function createMarketRequestEntry(input: {
  creator: string;
  prompt: string;
  reviewEndsAt: number;
}): MarketRequestEntry {
  const now = Date.now();
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${now}-${Math.random().toString(36).slice(2, 10)}`;

  const entry: MarketRequestEntry = {
    id,
    creator: input.creator.toLowerCase(),
    prompt: input.prompt.trim(),
    question: input.prompt.trim(),
    createdAt: now,
    reviewEndsAt: input.reviewEndsAt,
    status: "reviewing",
  };

  const allEntries = getStoredMarketRequests();
  setStoredMarketRequests([entry, ...allEntries]);
  return entry;
}

export function updateMarketRequestEntry(
  id: string,
  updates: Partial<MarketRequestEntry>,
): MarketRequestEntry | null {
  const allEntries = getStoredMarketRequests();
  const nextEntries = allEntries.map((entry) =>
    entry.id === id ? { ...entry, ...updates } : entry,
  );

  const updated = nextEntries.find((entry) => entry.id === id) ?? null;
  setStoredMarketRequests(nextEntries);
  return updated;
}

export function getMarketRequestsForCreator(address: string | undefined): MarketRequestEntry[] {
  if (!address) return [];
  const target = address.toLowerCase();
  return getStoredMarketRequests()
    .filter((entry) => entry.creator === target)
    .sort((a, b) => b.createdAt - a.createdAt);
}
