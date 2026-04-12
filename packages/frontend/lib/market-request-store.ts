"use client";

import axios from "axios";

export type MarketRequestStatus = "pending" | "reviewing" | "deployed" | "rejected" | "failed";

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
  refundTxHash?: string;
  queueInfo?: {
    current: number;
    total: number;
  };
};

const BACKEND_URL = process.env.NEXT_PUBLIC_CLAWDBET_MARKET_SERVICE_URL || "http://localhost:3001";
export const MARKET_REQUESTS_UPDATED_EVENT = "openbet-market-requests-updated";

function dispatchUpdate() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(MARKET_REQUESTS_UPDATED_EVENT));
  }
}

export async function getMarketRequestsForCreator(address: string | undefined): Promise<MarketRequestEntry[]> {
  if (!address) return [];
  try {
    const response = await axios.get(`${BACKEND_URL}/markets/requests/${address}`);
    return response.data;
  } catch (error) {
    console.error("Failed to fetch market requests:", error);
    return [];
  }
}

export async function createMarketRequestEntry(input: {
  creator: string;
  prompt: string;
  txHash: string;
}): Promise<MarketRequestEntry> {
  try {
    const response = await axios.post(`${BACKEND_URL}markets/request`, {
      prompt: input.prompt,
      creator: input.creator,
      txHash: input.txHash,
    });
    
    dispatchUpdate();
    return response.data;
  } catch (error) {
    console.error("Failed to create market request:", error);
    throw error;
  }
}

/** Legacy exports kept for compatibility during transition */
export const getStoredMarketRequests = () => [];
export const updateMarketRequestEntry = (id: string, updates: any) => null;
