"use client";

import axios from "axios";
import { MARKET_SERVICE_BASE_URL } from "./config";

export type UserProfile = {
  address: string;
  name: string;
  points: number;
  createdAt: string;
  updatedAt: string;
};

export const PROFILE_UPDATED_EVENT = "openbet-profile-updated";

function dispatchProfileUpdate(profile: UserProfile) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent<UserProfile>(PROFILE_UPDATED_EVENT, { detail: profile }));
  }
}

export async function getUserProfile(address: string | undefined): Promise<UserProfile | null> {
  if (!address || !MARKET_SERVICE_BASE_URL) return null;

  try {
    const response = await axios.get<UserProfile | null>(`${MARKET_SERVICE_BASE_URL}/profiles/${address}`);
    return response.data;
  } catch (error) {
    console.error("Failed to fetch user profile:", error);
    return null;
  }
}

export async function saveUserProfile(address: string, name: string): Promise<UserProfile> {
  if (!MARKET_SERVICE_BASE_URL) {
    throw new Error("Market service URL is not configured.");
  }

  const response = await axios.put<UserProfile>(`${MARKET_SERVICE_BASE_URL}/profiles/${address}`, {
    name,
  });

  dispatchProfileUpdate(response.data);
  return response.data;
}
