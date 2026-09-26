import { AI_CREDIT_LIMITS } from "./ai-credits";
import { PROFILE_LIMITS, type ProfilePlan } from "./profile-limits";

// These are the core features already shown on the public pricing page.
// Plan-specific access is not enabled while paid billing is closed.
const coreFeatures = {
  churchSetup: true,
  ministryProfiles: true,
  searchAndFiltering: true,
  teamConversations: true,
  profileHistory: true,
  leaderAccess: true,
};

const details = {
  starter: {
    name: "Starter",
    description: "A simple place to begin exploring Every Part with your church.",
    monthlyPrice: 0,
    annualPrice: 0,
  },
  growing: {
    name: "Growing",
    description: "For a small team beginning a shared ministry conversation.",
    monthlyPrice: 1000,
    annualPrice: 10000,
  },
  complete: {
    name: "Complete",
    description: "For churches ready for a fuller rhythm of discovery and connection.",
    monthlyPrice: 2000,
    annualPrice: 20000,
  },
  network: {
    name: "Network",
    description: "For churches and ministry networks growing across multiple contexts.",
    monthlyPrice: 3000,
    annualPrice: 30000,
  },
  unlimited: {
    name: "Unlimited",
    description: "For churches that want room for every person, without a profile cap.",
    monthlyPrice: 5000,
    annualPrice: 50000,
  },
} satisfies Record<ProfilePlan, {
  name: string;
  description: string;
  monthlyPrice: number;
  annualPrice: number;
}>;

export const planOrder: ProfilePlan[] = [
  "starter",
  "growing",
  "complete",
  "network",
  "unlimited",
];

export const planCatalog = planOrder.map((key) => ({
  key,
  ...details[key],
  profileLimit: PROFILE_LIMITS[key],
  aiCreditLimit: AI_CREDIT_LIMITS[key],
  featureFlags: coreFeatures,
  // No provider price exists until Stripe test mode is connected.
  priceId: null,
}));