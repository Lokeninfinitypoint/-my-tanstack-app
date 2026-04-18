import { Link, Outlet, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard')({
  component: DashboardLayout,
})

type NavItem = { to: string; label: string; exact?: boolean }

const NAV: Array<NavItem> = [
  { to: '/dashboard', label: 'Overview', exact: true },
  { to: '/dashboard/customers', label: 'Customers' },
  { to: '/dashboard/billing', label: 'Billing' },
  { to: '/dashboard/search', label: 'Web Search' },
  { to: '/dashboard/ai', label: 'AI Console' },
  { to: '/dashboard/settings', label: 'Settings' },
]

function DashboardLayout() {
  return (
    <div className="page-wrap grid gap-6 px-4 py-8 lg:grid-cols-[220px_minmax(0,1fr)]">
      <aside className="island-shell h-fit rounded-2xl p-4 lg:sticky lg:top-20">
        <p className="island-kicker mb-3">Workspace</p>
        <nav className="flex flex-col gap-1 text-sm">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.exact ?? false }}
              className="rounded-lg px-3 py-2 text-[var(--sea-ink-soft)] no-underline transition hover:bg-[var(--link-bg-hover)] hover:text-[var(--sea-ink)]"
              activeProps={{
                className:
                  'rounded-lg px-3 py-2 bg-[var(--link-bg-hover)] text-[var(--sea-ink)] font-semibold no-underline',
              }}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <p className="island-kicker mt-6 mb-2">Shortcuts</p>
        <ul className="m-0 list-none space-y-1 pl-0 text-xs text-[var(--sea-ink-soft)]">
          <li>
            <kbd className="rounded bg-[var(--chip-bg)] px-1.5 py-0.5">g</kbd>{' '}
            <kbd className="rounded bg-[var(--chip-bg)] px-1.5 py-0.5">o</kbd> Overview
          </li>
          <li>
            <kbd className="rounded bg-[var(--chip-bg)] px-1.5 py-0.5">g</kbd>{' '}
            <kbd className="rounded bg-[var(--chip-bg)] px-1.5 py-0.5">c</kbd> Customers
          </li>
          <li>
            <kbd className="rounded bg-[var(--chip-bg)] px-1.5 py-0.5">g</kbd>{' '}
            <kbd className="rounded bg-[var(--chip-bg)] px-1.5 py-0.5">b</kbd> Billing
          </li>
        </ul>
      </aside>
      <section className="min-w-0">
        <Outlet />
      </section>
    </div>
  )
}
