import { getTableName } from 'drizzle-orm'
import { describe, expect, it } from 'vitest'
import {
  customers,
  invoiceStatus,
  invoices,
  planTier,
  plans,
  subscriptionStatus,
  subscriptions,
  todos,
  usageEvents,
} from '../db/schema'

/**
 * Drizzle schema tests verify the table definitions, enum values, column names,
 * and exported TypeScript types. These are structural/contract tests that catch
 * accidental renames or removals of columns that client code depends on.
 */

describe('planTier enum', () => {
  it('is defined', () => {
    expect(planTier).toBeDefined()
  })

  it('has the correct enum values', () => {
    expect(planTier.enumValues).toEqual(['free', 'starter', 'pro', 'enterprise'])
  })

  it('has exactly four values', () => {
    expect(planTier.enumValues).toHaveLength(4)
  })

  it('includes the "pro" tier', () => {
    expect(planTier.enumValues).toContain('pro')
  })

  it('includes the "enterprise" tier', () => {
    expect(planTier.enumValues).toContain('enterprise')
  })
})

describe('subscriptionStatus enum', () => {
  it('is defined', () => {
    expect(subscriptionStatus).toBeDefined()
  })

  it('has the correct enum values', () => {
    expect(subscriptionStatus.enumValues).toEqual([
      'trialing',
      'active',
      'past_due',
      'canceled',
    ])
  })

  it('includes "past_due" (Stripe semantics)', () => {
    expect(subscriptionStatus.enumValues).toContain('past_due')
  })
})

describe('invoiceStatus enum', () => {
  it('is defined', () => {
    expect(invoiceStatus).toBeDefined()
  })

  it('has the correct enum values', () => {
    expect(invoiceStatus.enumValues).toEqual(['draft', 'open', 'paid', 'void'])
  })

  it('has exactly four values', () => {
    expect(invoiceStatus.enumValues).toHaveLength(4)
  })
})

describe('todos table', () => {
  it('is defined', () => {
    expect(todos).toBeDefined()
  })

  it('has the correct table name', () => {
    expect(getTableName(todos)).toBe('todos')
  })

  it('has an id column', () => {
    expect(todos.id).toBeDefined()
  })

  it('has a title column', () => {
    expect(todos.title).toBeDefined()
  })

  it('has a createdAt column', () => {
    expect(todos.createdAt).toBeDefined()
  })
})

describe('plans table', () => {
  it('is defined', () => {
    expect(plans).toBeDefined()
  })

  it('has the correct table name', () => {
    expect(getTableName(plans)).toBe('plans')
  })

  it('has an id column', () => {
    expect(plans.id).toBeDefined()
  })

  it('has a tier column', () => {
    expect(plans.tier).toBeDefined()
  })

  it('has a name column', () => {
    expect(plans.name).toBeDefined()
  })

  it('has a monthlyPriceCents column', () => {
    expect(plans.monthlyPriceCents).toBeDefined()
  })

  it('has a seatIncluded column', () => {
    expect(plans.seatIncluded).toBeDefined()
  })

  it('has a createdAt column', () => {
    expect(plans.createdAt).toBeDefined()
  })
})

describe('customers table', () => {
  it('is defined', () => {
    expect(customers).toBeDefined()
  })

  it('has the correct table name', () => {
    expect(getTableName(customers)).toBe('customers')
  })

  it('has an id column', () => {
    expect(customers.id).toBeDefined()
  })

  it('has an email column', () => {
    expect(customers.email).toBeDefined()
  })

  it('has a name column', () => {
    expect(customers.name).toBeDefined()
  })

  it('has a company column (nullable)', () => {
    expect(customers.company).toBeDefined()
  })

  it('has a country column (nullable)', () => {
    expect(customers.country).toBeDefined()
  })

  it('has a mrrCents column', () => {
    expect(customers.mrrCents).toBeDefined()
  })

  it('has a seats column', () => {
    expect(customers.seats).toBeDefined()
  })

  it('has a planTier column', () => {
    expect(customers.planTier).toBeDefined()
  })

  it('has a healthScore column', () => {
    expect(customers.healthScore).toBeDefined()
  })

  it('has an active column', () => {
    expect(customers.active).toBeDefined()
  })

  it('has a signedUpAt column', () => {
    expect(customers.signedUpAt).toBeDefined()
  })
})

describe('subscriptions table', () => {
  it('is defined', () => {
    expect(subscriptions).toBeDefined()
  })

  it('has the correct table name', () => {
    expect(getTableName(subscriptions)).toBe('subscriptions')
  })

  it('has an id column', () => {
    expect(subscriptions.id).toBeDefined()
  })

  it('has a customerId column (FK to customers)', () => {
    expect(subscriptions.customerId).toBeDefined()
  })

  it('has a status column', () => {
    expect(subscriptions.status).toBeDefined()
  })

  it('has a planTier column', () => {
    expect(subscriptions.planTier).toBeDefined()
  })

  it('has a providerSubscriptionId column (nullable, for Stripe etc.)', () => {
    expect(subscriptions.providerSubscriptionId).toBeDefined()
  })

  it('has a currentPeriodEnd column', () => {
    expect(subscriptions.currentPeriodEnd).toBeDefined()
  })

  it('has a createdAt column', () => {
    expect(subscriptions.createdAt).toBeDefined()
  })
})

describe('invoices table', () => {
  it('is defined', () => {
    expect(invoices).toBeDefined()
  })

  it('has the correct table name', () => {
    expect(getTableName(invoices)).toBe('invoices')
  })

  it('has an id column', () => {
    expect(invoices.id).toBeDefined()
  })

  it('has a customerId column (FK to customers)', () => {
    expect(invoices.customerId).toBeDefined()
  })

  it('has a number column (unique invoice number)', () => {
    expect(invoices.number).toBeDefined()
  })

  it('has an amountCents column', () => {
    expect(invoices.amountCents).toBeDefined()
  })

  it('has a currency column', () => {
    expect(invoices.currency).toBeDefined()
  })

  it('has a status column', () => {
    expect(invoices.status).toBeDefined()
  })

  it('has an issuedAt column', () => {
    expect(invoices.issuedAt).toBeDefined()
  })
})

describe('usageEvents table', () => {
  it('is defined', () => {
    expect(usageEvents).toBeDefined()
  })

  it('has the correct table name', () => {
    expect(getTableName(usageEvents)).toBe('usage_events')
  })

  it('has an id column (serial primary key)', () => {
    expect(usageEvents.id).toBeDefined()
  })

  it('has a customerId column (FK to customers)', () => {
    expect(usageEvents.customerId).toBeDefined()
  })

  it('has a metric column', () => {
    expect(usageEvents.metric).toBeDefined()
  })

  it('has a value column (numeric precision)', () => {
    expect(usageEvents.value).toBeDefined()
  })

  it('has a recordedAt column', () => {
    expect(usageEvents.recordedAt).toBeDefined()
  })
})