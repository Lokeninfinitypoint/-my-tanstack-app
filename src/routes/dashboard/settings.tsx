import { createFileRoute } from '@tanstack/react-router'
import { useStore } from '@tanstack/react-store'
import {
  type DashboardPrefs,
  dashboardStore,
  setAccent,
  setDensity,
} from '#/lib/stores/dashboard-store'

export const Route = createFileRoute('/dashboard/settings')({
  component: Settings,
})

function Settings() {
  const prefs = useStore(dashboardStore)

  return (
    <div className="flex flex-col gap-4">
      <header>
        <p className="island-kicker">Settings</p>
        <h1 className="m-0 text-2xl font-semibold text-[var(--sea-ink)]">Workspace</h1>
        <p className="mt-1 text-sm text-[var(--sea-ink-soft)]">
          Preferences are kept in a TanStack Store and consumed via <code>useStore</code>.
        </p>
      </header>

      <section className="island-shell rounded-2xl p-5">
        <p className="island-kicker mb-2">Density</p>
        <div className="flex gap-2">
          {(['comfortable', 'compact'] as const).map((d) => (
            <button
              type="button"
              key={d}
              onClick={() => setDensity(d)}
              className={`h-9 rounded-full border px-4 text-sm font-semibold capitalize ${
                prefs.density === d
                  ? 'border-[var(--lagoon-deep)] bg-[rgba(79,184,178,0.2)] text-[var(--sea-ink)]'
                  : 'border-[var(--chip-line)] bg-[var(--chip-bg)] text-[var(--sea-ink-soft)]'
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </section>

      <section className="island-shell rounded-2xl p-5">
        <p className="island-kicker mb-2">Accent</p>
        <div className="flex gap-2">
          {(['lagoon', 'palm', 'sand'] as const satisfies Array<DashboardPrefs['accent']>).map(
            (a) => (
              <button
                type="button"
                key={a}
                onClick={() => setAccent(a)}
                className={`h-9 rounded-full border px-4 text-sm font-semibold capitalize ${
                  prefs.accent === a
                    ? 'border-[var(--lagoon-deep)] bg-[rgba(79,184,178,0.2)] text-[var(--sea-ink)]'
                    : 'border-[var(--chip-line)] bg-[var(--chip-bg)] text-[var(--sea-ink-soft)]'
                }`}
              >
                {a}
              </button>
            ),
          )}
        </div>
      </section>

      <section className="island-shell rounded-2xl p-5">
        <p className="island-kicker mb-2">Current state</p>
        <pre className="m-0 overflow-x-auto text-xs text-[var(--sea-ink)]">
          {JSON.stringify(prefs, null, 2)}
        </pre>
      </section>
    </div>
  )
}
