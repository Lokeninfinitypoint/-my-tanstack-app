import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { dashboardMetrics } from '#/server/customers'

const metricsQuery = {
  queryKey: ['dashboard', 'metrics'] as const,
  queryFn: () => dashboardMetrics(),
  staleTime: 30_000,
}

export const Route = createFileRoute('/dashboard/')({
  loader: ({ context }) => context.queryClient.ensureQueryData(metricsQuery),
  component: Overview,
})

function formatCents(cents: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(cents / 100)
}

function Overview() {
  const { data } = useSuspenseQuery(metricsQuery)
  const cards = [
    { label: 'MRR', value: formatCents(data.mrrCents) },
    { label: 'ARPU', value: formatCents(data.arpuCents) },
    { label: 'Active customers', value: String(data.activeCustomers) },
    { label: 'Paying customers', value: String(data.payingCustomers) },
  ]

  return (
    <div className="flex flex-col gap-6">
      <header className="island-shell rounded-2xl p-6">
        <p className="island-kicker">Dashboard</p>
        <h1 className="m-0 text-3xl font-semibold text-[var(--sea-ink)]">Overview</h1>
        <p className="mt-2 max-w-2xl text-sm text-[var(--sea-ink-soft)]">
          Charts are fed by TanStack Query loaders on top of Drizzle/Neon data. Swap the `trend`
          source for a real time-series query in `src/server/customers.ts` when you wire production
          usage events.
        </p>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <article key={c.label} className="island-shell feature-card rounded-2xl p-5">
            <p className="island-kicker">{c.label}</p>
            <p className="mt-1 text-2xl font-semibold text-[var(--sea-ink)]">{c.value}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="island-shell rounded-2xl p-5">
          <p className="island-kicker mb-3">MRR (last 12 weeks)</p>
          <div style={{ width: '100%', height: 240 }}>
            <ResponsiveContainer>
              <AreaChart data={data.trend}>
                <defs>
                  <linearGradient id="mrrFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4fb8b2" stopOpacity={0.6} />
                    <stop offset="100%" stopColor="#4fb8b2" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeOpacity={0.08} />
                <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${Math.round(v / 100)}`} />
                <Tooltip formatter={(v: number) => formatCents(v)} />
                <Area
                  type="monotone"
                  dataKey="mrrCents"
                  stroke="#328f97"
                  strokeWidth={2}
                  fill="url(#mrrFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="island-shell rounded-2xl p-5">
          <p className="island-kicker mb-3">Customers by plan</p>
          <div style={{ width: '100%', height: 240 }}>
            <ResponsiveContainer>
              <BarChart data={data.byTier}>
                <CartesianGrid strokeOpacity={0.08} />
                <XAxis dataKey="tier" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#2f6a4a" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>
      </section>
    </div>
  )
}
