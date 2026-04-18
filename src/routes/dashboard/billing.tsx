import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useMemo, useState } from 'react'
import { useRef } from 'react'
import { listInvoices } from '#/server/customers'

const invoicesQuery = {
  queryKey: ['dashboard', 'invoices'] as const,
  queryFn: () => listInvoices(),
  staleTime: 30_000,
}

export const Route = createFileRoute('/dashboard/billing')({
  loader: ({ context }) => context.queryClient.ensureQueryData(invoicesQuery),
  component: Billing,
})

function formatCents(cents: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(cents / 100)
}

function Billing() {
  const { data } = useSuspenseQuery(invoicesQuery)
  const [status, setStatus] = useState<'all' | 'draft' | 'open' | 'paid' | 'void'>('all')
  const filtered = useMemo(
    () => (status === 'all' ? data : data.filter((i) => i.status === status)),
    [data, status],
  )

  const parentRef = useRef<HTMLDivElement>(null)
  const virtualizer = useVirtualizer({
    count: filtered.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 52,
    overscan: 8,
  })

  const total = filtered.reduce((acc, i) => acc + i.amountCents, 0)

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="island-kicker">Billing</p>
          <h1 className="m-0 text-2xl font-semibold text-[var(--sea-ink)]">Invoices</h1>
          <p className="mt-1 text-sm text-[var(--sea-ink-soft)]">
            Billing-ready schema with Stripe-compatible hooks. Invoices rendered with TanStack
            Virtual for large datasets.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as typeof status)}
            className="h-9 rounded-lg border border-[var(--chip-line)] bg-[var(--chip-bg)] px-3 text-sm"
          >
            <option value="all">All statuses</option>
            <option value="draft">Draft</option>
            <option value="open">Open</option>
            <option value="paid">Paid</option>
            <option value="void">Void</option>
          </select>
          <span className="rounded-full bg-[var(--chip-bg)] px-3 py-1 text-xs text-[var(--sea-ink)]">
            {filtered.length} invoices · {formatCents(total)}
          </span>
        </div>
      </header>

      <div className="island-shell rounded-2xl p-4">
        <div className="mb-2 grid grid-cols-[1fr_1.2fr_0.8fr_0.8fr_0.8fr] gap-3 border-b border-[var(--chip-line)] pb-2 text-xs font-semibold uppercase text-[var(--sea-ink-soft)]">
          <span>Number</span>
          <span>Customer</span>
          <span>Amount</span>
          <span>Status</span>
          <span>Issued</span>
        </div>
        <div ref={parentRef} style={{ height: 480, overflow: 'auto' }}>
          <div
            style={{
              height: virtualizer.getTotalSize(),
              width: '100%',
              position: 'relative',
            }}
          >
            {virtualizer.getVirtualItems().map((v) => {
              const inv = filtered[v.index]
              return (
                <div
                  key={v.key}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: v.size,
                    transform: `translateY(${v.start}px)`,
                  }}
                  className="grid grid-cols-[1fr_1.2fr_0.8fr_0.8fr_0.8fr] items-center gap-3 border-b border-[var(--chip-line)]/40 px-1 py-2 text-sm"
                >
                  <span className="font-mono text-xs text-[var(--sea-ink)]">{inv.number}</span>
                  <span className="text-[var(--sea-ink)]">{inv.customerName ?? '—'}</span>
                  <span className="font-semibold">
                    {formatCents(inv.amountCents, inv.currency)}
                  </span>
                  <span className="capitalize">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        inv.status === 'paid'
                          ? 'bg-emerald-100 text-emerald-800'
                          : inv.status === 'open'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-neutral-200 text-neutral-700'
                      }`}
                    >
                      {inv.status}
                    </span>
                  </span>
                  <span className="text-[var(--sea-ink-soft)]">
                    {inv.issuedAt ? new Date(inv.issuedAt).toLocaleDateString() : ''}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <aside className="island-shell rounded-2xl p-5 text-sm text-[var(--sea-ink-soft)]">
        <p className="island-kicker mb-2">Billing provider (TODO)</p>
        The <code>providerSubscriptionId</code> column on <code>subscriptions</code> is where the
        Stripe (or LemonSqueezy/Paddle) subscription id lives. Wire a server function + webhook
        handler under <code>src/routes/api/billing</code> to make this live.
      </aside>
    </div>
  )
}
