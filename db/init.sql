-- Legacy todos table kept for the existing Drizzle demo
CREATE TABLE IF NOT EXISTS todos (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    is_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO todos (title, description, is_completed) VALUES
('Buy groceries', 'Milk, Bread, Eggs, and Butter', FALSE),
('Read a book', 'Finish reading "The Great Gatsby"', FALSE),
('Workout', 'Go for a 30-minute run', FALSE)
ON CONFLICT DO NOTHING;

-- SaaS enums
DO $$ BEGIN
    CREATE TYPE plan_tier AS ENUM ('free', 'starter', 'pro', 'enterprise');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE subscription_status AS ENUM ('trialing', 'active', 'past_due', 'canceled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE invoice_status AS ENUM ('draft', 'open', 'paid', 'void');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tier plan_tier NOT NULL UNIQUE,
    name VARCHAR(64) NOT NULL,
    monthly_price_cents INTEGER NOT NULL,
    seat_included INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO plans (tier, name, monthly_price_cents, seat_included) VALUES
('free', 'Free', 0, 1),
('starter', 'Starter', 1900, 3),
('pro', 'Pro', 4900, 10),
('enterprise', 'Enterprise', 19900, 50)
ON CONFLICT (tier) DO NOTHING;

CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(320) NOT NULL UNIQUE,
    name VARCHAR(120) NOT NULL,
    company VARCHAR(160),
    country VARCHAR(2),
    mrr_cents INTEGER NOT NULL DEFAULT 0,
    seats INTEGER NOT NULL DEFAULT 1,
    plan_tier plan_tier NOT NULL DEFAULT 'free',
    health_score INTEGER NOT NULL DEFAULT 50,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    signed_up_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO customers (email, name, company, country, mrr_cents, seats, plan_tier, health_score) VALUES
('ada@lovelace.io', 'Ada Lovelace', 'Analytical Engines', 'GB', 4900, 5, 'pro', 92),
('grace@hopper.dev', 'Grace Hopper', 'Navy Yard', 'US', 19900, 25, 'enterprise', 88),
('linus@kernel.org', 'Linus Torvalds', 'Linux Foundation', 'FI', 1900, 3, 'starter', 71),
('guido@python.org', 'Guido van Rossum', 'Dropbox', 'NL', 0, 1, 'free', 44),
('alan@turing.ai', 'Alan Turing', 'Bletchley Park', 'GB', 4900, 8, 'pro', 61),
('tim@w3.org', 'Tim Berners-Lee', 'CERN', 'GB', 19900, 40, 'enterprise', 77),
('yukihiro@ruby.org', 'Yukihiro Matsumoto', 'Ruby Association', 'JP', 1900, 2, 'starter', 55),
('margaret@nasa.gov', 'Margaret Hamilton', 'NASA', 'US', 0, 1, 'free', 30)
ON CONFLICT (email) DO NOTHING;

CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    status subscription_status NOT NULL DEFAULT 'trialing',
    plan_tier plan_tier NOT NULL DEFAULT 'free',
    current_period_end TIMESTAMP,
    provider_subscription_id VARCHAR(128),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    number VARCHAR(32) NOT NULL UNIQUE,
    amount_cents INTEGER NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    status invoice_status NOT NULL DEFAULT 'draft',
    issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS usage_events (
    id SERIAL PRIMARY KEY,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    metric VARCHAR(64) NOT NULL,
    value NUMERIC(12,2) NOT NULL,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
