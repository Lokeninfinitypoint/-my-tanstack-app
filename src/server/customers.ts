import * as Sentry from '@sentry/tanstackstart-react'
import { createServerFn } from '@tanstack/react-start'
import { count, desc, eq, sql, sum } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '#/db/index'
import { customers, invoices, usageEvents } from '#/db/schema'
import { PLAN_PRICE_CENTS, PLAN_TIERS, type PlanTier } from '#/lib/plans'

export type CustomerRow = {
  id: string
  email: string
  name: string
  company: string | null
  country: string | null
  mrrCents: number
  seats: number
  planTier: PlanTier
  healthScore: number
  active: boolean
  signedUpAt: string | null
}

const FALLBACK_CUSTOMERS: Array<CustomerRow> = [
  {
    id: 'seed-1',
    email: 'ada@lovelace.io',
    name: 'Ada Lovelace',
    company: 'Analytical Engines',
    country: 'GB',
    mrrCents: 4900,
    seats: 5,
    planTier: 'pro',
    healthScore: 92,
    active: true,
    signedUpAt: new Date('2024-01-15').toISOString(),
  },
  {
    id: 'seed-2',
    email: 'grace@hopper.dev',
    name: 'Grace Hopper',
    company: 'Navy Yard',
    country: 'US',
    mrrCents: 19900,
    seats: 25,
    planTier: 'enterprise',
    healthScore: 88,
    active: true,
    signedUpAt: new Date('2023-08-02').toISOString(),
  },
  {
    id: 'seed-3',
    email: 'linus@kernel.org',
    name: 'Linus Torvalds',
    company: 'Linux Foundation',
    country: 'FI',
    mrrCents: 1900,
    seats: 3,
    planTier: 'starter',
    healthScore: 71,
    active: true,
    signedUpAt: new Date('2024-03-09').toISOString(),
  },
  {
    id: 'seed-4',
    email: 'guido@python.org',
    name: 'Guido van Rossum',
    company: 'Dropbox',
    country: 'NL',
    mrrCents: 0,
    seats: 1,
    planTier: 'free',
    healthScore: 44,
    active: true,
    signedUpAt: new Date('2025-01-04').toISOString(),
  },
  {
    id: 'seed-5',
    email: 'alan@turing.ai',
    name: 'Alan Turing',
    company: 'Bletchley Park',
    country: 'GB',
    mrrCents: 4900,
    seats: 8,
    planTier: 'pro',
    healthScore: 61,
    active: true,
    signedUpAt: new Date('2023-11-22').toISOString(),
  },
  {
    id: 'seed-6',
    email: 'tim@w3.org',
    name: 'Tim Berners-Lee',
    company: 'CERN',
    country: 'GB',
    mrrCents: 19900,
    seats: 40,
    planTier: 'enterprise',
    healthScore: 77,
    active: true,
    signedUpAt: new Date('2022-05-12').toISOString(),
  },
  {
    id: 'seed-7',
    email: 'yukihiro@ruby.org',
    name: 'Yukihiro Matsumoto',
    company: 'Ruby Association',
    country: 'JP',
    mrrCents: 1900,
    seats: 2,
    planTier: 'starter',
    healthScore: 55,
    active: true,
    signedUpAt: new Date('2024-06-30').toISOString(),
  },
  {
    id: 'seed-8',
    email: 'margaret@nasa.gov',
    name: 'Margaret Hamilton',
    company: 'NASA',
    country: 'US',
    mrrCents: 0,
    seats: 1,
    planTier: 'free',
    healthScore: 30,
    active: false,
    signedUpAt: new Date('2025-02-18').toISOString(),
  },
]

function rowToCustomer(row: typeof customers.$inferSelect): CustomerRow {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    company: row.company,
    country: row.country,
    mrrCents: row.mrrCents,
    seats: row.seats,
    planTier: row.planTier,
    healthScore: row.healthScore,
    active: row.active,
    signedUpAt: row.signedUpAt ? row.signedUpAt.toISOString() : null,
  }
}

export const listCustomers = createServerFn({ method: 'GET' }).handler(async () => {
  return Sentry.startSpan({ name: 'db.listCustomers' }, async () => {
    if (!process.env.DATABASE_URL) return FALLBACK_CUSTOMERS
    try {
      const rows = await db.select().from(customers).orderBy(desc(customers.mrrCents))
      return rows.map(rowToCustomer)
    } catch (err) {
      Sentry.captureException(err)
      return FALLBACK_CUSTOMERS
    }
  })
})

type TierAggregate = { tier: PlanTier; count: number; mrrCents: number }
type TrendPoint = { week: string; mrrCents: number; signups: number }

export const dashboardMetrics = createServerFn({ method: 'GET' }).handler(async () => {
  return Sentry.startSpan({ name: 'db.dashboardMetrics' }, async () => {
    if (!process.env.DATABASE_URL) return computeMetricsInMemory(FALLBACK_CUSTOMERS)

    try {
      const [totals] = await db
        .select({
          mrrCents: sum(customers.mrrCents).mapWith(Number),
          active: sum(sql<number>`case when ${customers.active} then 1 else 0 end`).mapWith(Number),
          paying: sum(sql<number>`case when ${customers.mrrCents} > 0 then 1 else 0 end`).mapWith(
            Number,
          ),
        })
        .from(customers)

      const tierRows = await db
        .select({
          tier: customers.planTier,
          count: count(customers.id),
          mrrCents: sum(customers.mrrCents).mapWith(Number),
        })
        .from(customers)
        .groupBy(customers.planTier)

      const tierMap = new Map(tierRows.map((r) => [r.tier, r]))
      const byTier: Array<TierAggregate> = PLAN_TIERS.map((tier) => ({
        tier,
        count: Number(tierMap.get(tier)?.count ?? 0),
        mrrCents: Number(tierMap.get(tier)?.mrrCents ?? 0),
      }))

      const mrr = Number(totals?.mrrCents ?? 0)
      const paying = Number(totals?.paying ?? 0)
      const active = Number(totals?.active ?? 0)
      const arpu = paying === 0 ? 0 : Math.round(mrr / paying)

      return {
        mrrCents: mrr,
        arpuCents: arpu,
        activeCustomers: active,
        payingCustomers: paying,
        byTier,
        trend: synthesizeTrend(mrr),
      }
    } catch (err) {
      Sentry.captureException(err)
      return computeMetricsInMemory(FALLBACK_CUSTOMERS)
    }
  })
})

function computeMetricsInMemory(list: Array<CustomerRow>) {
  const mrr = list.reduce((acc, c) => acc + c.mrrCents, 0)
  const active = list.filter((c) => c.active).length
  const paying = list.filter((c) => c.mrrCents > 0).length
  const arpu = paying === 0 ? 0 : Math.round(mrr / paying)
  const byTier: Array<TierAggregate> = PLAN_TIERS.map((tier) => ({
    tier,
    count: list.filter((c) => c.planTier === tier).length,
    mrrCents: list.filter((c) => c.planTier === tier).reduce((acc, c) => acc + c.mrrCents, 0),
  }))
  return {
    mrrCents: mrr,
    arpuCents: arpu,
    activeCustomers: active,
    payingCustomers: paying,
    byTier,
    trend: synthesizeTrend(mrr),
  }
}

// Placeholder trend: real app aggregates from usage_events grouped by week.
function synthesizeTrend(mrr: number): Array<TrendPoint> {
  const now = Date.now()
  const weekMs = 7 * 24 * 60 * 60 * 1000
  return Array.from({ length: 12 }, (_, i) => {
    const weekStart = new Date(now - (11 - i) * weekMs)
    const base = Math.round(mrr / 12) || 1200
    return {
      week: weekStart.toISOString().slice(0, 10),
      mrrCents: base + Math.round(Math.sin(i / 2) * 1800 + i * 180),
      signups: 3 + Math.round(Math.abs(Math.cos(i / 1.7)) * 6),
    }
  })
}

export const listInvoices = createServerFn({ method: 'GET' }).handler(async () => {
  return Sentry.startSpan({ name: 'db.listInvoices' }, async () => {
    if (!process.env.DATABASE_URL) {
      return FALLBACK_CUSTOMERS.filter((c) => c.mrrCents > 0).map((c, i) => ({
        id: `inv-${i + 1}`,
        customerId: c.id,
        customerName: c.name,
        number: `INV-2026-${String(i + 1).padStart(4, '0')}`,
        amountCents: c.mrrCents,
        currency: 'USD',
        status: (i % 3 === 0 ? 'open' : 'paid') as 'open' | 'paid',
        issuedAt: new Date(Date.now() - i * 7 * 24 * 60 * 60 * 1000).toISOString(),
      }))
    }
    try {
      const rows = await db
        .select({
          id: invoices.id,
          customerId: invoices.customerId,
          customerName: customers.name,
          number: invoices.number,
          amountCents: invoices.amountCents,
          currency: invoices.currency,
          status: invoices.status,
          issuedAt: invoices.issuedAt,
        })
        .from(invoices)
        .leftJoin(customers, eq(invoices.customerId, customers.id))
        .orderBy(desc(invoices.issuedAt))
      return rows.map((r) => ({
        ...r,
        issuedAt: r.issuedAt?.toISOString() ?? null,
      }))
    } catch (err) {
      Sentry.captureException(err)
      return []
    }
  })
})

const createCustomerSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(120),
  company: z.string().max(160).optional(),
  country: z.string().length(2).optional(),
  planTier: z.enum(PLAN_TIERS).default('free'),
  seats: z.number().int().min(1).max(10000).default(1),
})

export type CreateCustomerResult =
  | { ok: true; id: string }
  | { ok: false; reason: string; code?: 'duplicate_email' | 'no_database' | 'unknown' }

export const createCustomer = createServerFn({ method: 'POST' })
  .inputValidator((data: z.input<typeof createCustomerSchema>) => createCustomerSchema.parse(data))
  .handler(async ({ data }): Promise<CreateCustomerResult> => {
    return Sentry.startSpan({ name: 'db.createCustomer' }, async () => {
      if (!process.env.DATABASE_URL) {
        return { ok: false, reason: 'DATABASE_URL is not set', code: 'no_database' }
      }
      try {
        const id = await db.transaction(async (tx) => {
          const [row] = await tx
            .insert(customers)
            .values({
              email: data.email,
              name: data.name,
              company: data.company,
              country: data.country,
              planTier: data.planTier,
              seats: data.seats,
              mrrCents: PLAN_PRICE_CENTS[data.planTier],
            })
            .returning({ id: customers.id })
          await tx.insert(usageEvents).values({
            customerId: row.id,
            metric: 'signup',
            value: '1',
          })
          return row.id
        })
        return { ok: true, id }
      } catch (err) {
        // Postgres 23505 is unique_violation. pg errors carry `code`;
        // check loosely so we work with both pg and Neon drivers.
        const code = (err as { code?: string })?.code
        if (code === '23505') {
          return {
            ok: false,
            reason: 'A customer with that email already exists.',
            code: 'duplicate_email',
          }
        }
        Sentry.captureException(err)
        return {
          ok: false,
          reason: 'Could not create customer. Please try again.',
          code: 'unknown',
        }
      }
    })
  })
