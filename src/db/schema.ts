import {
  boolean,
  integer,
  numeric,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core'

// Legacy todos table kept for existing demo route
export const todos = pgTable('todos', {
  id: serial().primaryKey(),
  title: text().notNull(),
  createdAt: timestamp('created_at').defaultNow(),
})

export const planTier = pgEnum('plan_tier', ['free', 'starter', 'pro', 'enterprise'])
export const subscriptionStatus = pgEnum('subscription_status', [
  'trialing',
  'active',
  'past_due',
  'canceled',
])
export const invoiceStatus = pgEnum('invoice_status', ['draft', 'open', 'paid', 'void'])

export const plans = pgTable('plans', {
  id: uuid().primaryKey().defaultRandom(),
  tier: planTier().notNull().unique(),
  name: varchar({ length: 64 }).notNull(),
  monthlyPriceCents: integer('monthly_price_cents').notNull(),
  seatIncluded: integer('seat_included').notNull().default(1),
  createdAt: timestamp('created_at').defaultNow(),
})

export const customers = pgTable('customers', {
  id: uuid().primaryKey().defaultRandom(),
  email: varchar({ length: 320 }).notNull().unique(),
  name: varchar({ length: 120 }).notNull(),
  company: varchar({ length: 160 }),
  country: varchar({ length: 2 }),
  mrrCents: integer('mrr_cents').notNull().default(0),
  seats: integer().notNull().default(1),
  planTier: planTier('plan_tier').notNull().default('free'),
  healthScore: integer('health_score').notNull().default(50),
  active: boolean().notNull().default(true),
  signedUpAt: timestamp('signed_up_at').defaultNow(),
})

export const subscriptions = pgTable('subscriptions', {
  id: uuid().primaryKey().defaultRandom(),
  customerId: uuid('customer_id')
    .notNull()
    .references(() => customers.id, { onDelete: 'cascade' }),
  status: subscriptionStatus().notNull().default('trialing'),
  planTier: planTier('plan_tier').notNull().default('free'),
  currentPeriodEnd: timestamp('current_period_end'),
  // Billing provider IDs are intentionally nullable. A SaaS would wire Stripe
  // (or LemonSqueezy/Paddle) and persist the external subscription id here.
  providerSubscriptionId: varchar('provider_subscription_id', { length: 128 }),
  createdAt: timestamp('created_at').defaultNow(),
})

export const invoices = pgTable('invoices', {
  id: uuid().primaryKey().defaultRandom(),
  customerId: uuid('customer_id')
    .notNull()
    .references(() => customers.id, { onDelete: 'cascade' }),
  number: varchar({ length: 32 }).notNull().unique(),
  amountCents: integer('amount_cents').notNull(),
  currency: varchar({ length: 3 }).notNull().default('USD'),
  status: invoiceStatus().notNull().default('draft'),
  issuedAt: timestamp('issued_at').defaultNow(),
})

export const usageEvents = pgTable('usage_events', {
  id: serial().primaryKey(),
  customerId: uuid('customer_id')
    .notNull()
    .references(() => customers.id, { onDelete: 'cascade' }),
  metric: varchar({ length: 64 }).notNull(),
  value: numeric({ precision: 12, scale: 2 }).notNull(),
  recordedAt: timestamp('recorded_at').defaultNow(),
})

export type Customer = typeof customers.$inferSelect
export type NewCustomer = typeof customers.$inferInsert
export type Invoice = typeof invoices.$inferSelect
export type Subscription = typeof subscriptions.$inferSelect
export type UsageEvent = typeof usageEvents.$inferSelect
