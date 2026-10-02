"use client";

import { useEffect } from "react";

import { CAMPAIGN_KEY, campaignFromSearch } from "@/lib/analytics";

/**
 * Keeps the landing page's UTM parameters for the session: Google Analytics
 * applies them once the visitor accepts (E5-04), and the contact form saves
 * them with the lead (E3-08). Renders nothing.
 */
export function CampaignCapture() {
  useEffect(() => {
    const campaign = campaignFromSearch(location.search);
    if (!campaign) return;
    try {
      sessionStorage.setItem(CAMPAIGN_KEY, JSON.stringify(campaign));
    } catch {
      // Storage blocked: the lead simply goes without its campaign.
    }
  }, []);
  return null;
}
