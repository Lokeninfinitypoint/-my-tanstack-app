import * as Sentry from '@sentry/tanstackstart-react'
import { createServerFn } from '@tanstack/react-start'
import { desc, eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '#/db/index'
import { customers, invoices, usageEvents } from '#/db/schema'

const FALLBACK_CUSTOMERS = [
  {
    id: 'seed-1',
    email: 'ada@lovelace.io',
    name: 'Ada Lovelace',
    company: 'Analytical Engines',
    country: 'GB',
    mrrCents: 4900,
    seats: 5,
    planTier: 'pro' as const,
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
    planTier: 'enterprise' as const,
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
    planTier: 'starter' as const,
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
    planTier: 'free' as const,
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
    planTier: 'pro' as const,
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
    planTier: 'enterprise' as const,
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
    planTier: 'starter' as const,
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
    planTier: 'free' as const,
    healthScore: 30,
    active: false,
    signedUpAt: new Date('2025-02-18').toISOString(),
  },
]

export type CustomerRow = (typeof FALLBACK_CUSTOMERS)[number]

export const listCustomers = createServerFn({ method: 'GET' }).handler(async () => {
  return Sentry.startSpan({ name: 'db.listCustomers' }, async () => {
    if (!process.env.DATABASE_URL) return FALLBACK_CUSTOMERS
    try {
      const rows = await db.select().from(customers).orderBy(desc(customers.mrrCents))
      return rows.map((row) => ({
        ...row,
        signedUpAt: row.signedUpAt?.toISOString() ?? null,
      })) as unknown as CustomerRow[]
    } catch (err) {
      console.warn('listCustomers fallback:', err)
      return FALLBACK_CUSTOMERS
    }
  })
})

export const dashboardMetrics = createServerFn({ method: 'GET' }).handler(async () => {
  return Sentry.startSpan({ name: 'db.dashboardMetrics' }, async () => {
    const rows = !process.env.DATABASE_URL
      ? FALLBACK_CUSTOMERS
      : await db
          .select()
          .from(customers)
          .catch(() => FALLBACK_CUSTOMERS as unknown as (typeof customers.$inferSelect)[])

    const list = rows as unknown as CustomerRow[]
    const mrr = list.reduce((acc, c) => acc + (c.mrrCents ?? 0), 0)
    const active = list.filter((c) => c.active).length
    const paying = list.filter((c) => (c.mrrCents ?? 0) > 0).length
    const arpu = paying === 0 ? 0 : Math.round(mrr / paying)

    const byTier = ['free', 'starter', 'pro', 'enterprise'].map((tier) => ({
      tier,
      count: list.filter((c) => c.planTier === tier).length,
      mrrCents: list
        .filter((c) => c.planTier === tier)
        .reduce((acc, c) => acc + (c.mrrCents ?? 0), 0),
    }))

    // 12-week synthetic cohort for charts. Real app would aggregate from usage_events.
    const now = Date.now()
    const weekMs = 7 * 24 * 60 * 60 * 1000
    const trend = Array.from({ length: 12 }, (_, i) => {
      const weekStart = new Date(now - (11 - i) * weekMs)
      const base = Math.round(mrr / 12) || 1200
      return {
        week: weekStart.toISOString().slice(0, 10),
        mrrCents: base + Math.round(Math.sin(i / 2) * 1800 + i * 180),
        signups: 3 + Math.round(Math.abs(Math.cos(i / 1.7)) * 6),
      }
    })

    return {
      mrrCents: mrr,
      arpuCents: arpu,
      activeCustomers: active,
      payingCustomers: paying,
      byTier,
      trend,
    }
  })
})

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
  })
})

const createCustomerSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(120),
  company: z.string().max(160).optional(),
  country: z.string().length(2).optional(),
  planTier: z.enum(['free', 'starter', 'pro', 'enterprise']).default('free'),
  seats: z.number().int().min(1).max(10000).default(1),
})

export const createCustomer = createServerFn({ method: 'POST' })
  .inputValidator((data: z.input<typeof createCustomerSchema>) => createCustomerSchema.parse(data))
  .handler(async ({ data }) => {
    return Sentry.startSpan({ name: 'db.createCustomer' }, async () => {
      if (!process.env.DATABASE_URL) {
        return { ok: false as const, reason: 'DATABASE_URL is not set' }
      }
      const mrrByTier = { free: 0, starter: 1900, pro: 4900, enterprise: 19900 }
      const [row] = await db
        .insert(customers)
        .values({
          email: data.email,
          name: data.name,
          company: data.company,
          country: data.country,
          planTier: data.planTier,
          seats: data.seats,
          mrrCents: mrrByTier[data.planTier],
        })
        .returning()
      await db.insert(usageEvents).values({
        customerId: row.id,
        metric: 'signup',
        value: '1',
      })
      return { ok: true as const, id: row.id }
    })
  })
