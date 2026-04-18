// Single source of truth for plan pricing used in-app.
// Mirrors the `plans` table seeded in db/init.sql. If you change these,
// update the seed too (or, better, derive at runtime from the plans table).
export const PLAN_TIERS = ['free', 'starter', 'pro', 'enterprise'] as const
export type PlanTier = (typeof PLAN_TIERS)[number]

export const PLAN_PRICE_CENTS: Record<PlanTier, number> = {
  free: 0,
  starter: 1900,
  pro: 4900,
  enterprise: 19900,
}

export const PLAN_LABEL: Record<PlanTier, string> = {
  free: 'Free',
  starter: 'Starter',
  pro: 'Pro',
  enterprise: 'Enterprise',
}
