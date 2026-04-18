import { useMutation } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { type SerpResult, runWebSearch } from '#/server/serpapi'

export const Route = createFileRoute('/dashboard/search')({
  component: SearchPage,
})

function SearchPage() {
  const [q, setQ] = useState('TanStack Start')
  const mutation = useMutation({
    mutationFn: (query: string) => runWebSearch({ data: { q: query, num: 10 } }),
  })

  return (
    <div className="flex flex-col gap-4">
      <header>
        <p className="island-kicker">Integrations</p>
        <h1 className="m-0 text-2xl font-semibold text-[var(--sea-ink)]">Web search</h1>
        <p className="mt-1 text-sm text-[var(--sea-ink-soft)]">
          SerpAPI is called server-side from <code>src/server/serpapi.ts</code>. The result shape is
          normalized to an app-owned type before reaching the UI. Set <code>SERPAPI_API_KEY</code>{' '}
          and optionally <code>SERPAPI_ENGINE</code> (default: google).
        </p>
      </header>

      <form
        className="flex flex-wrap items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          mutation.mutate(q)
        }}
      >
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="h-10 flex-1 min-w-[260px] rounded-lg border border-[var(--chip-line)] bg-[var(--chip-bg)] px-3"
        />
        <button
          type="submit"
          disabled={mutation.isPending || q.length < 2}
          className="h-10 rounded-full border border-[var(--chip-line)] bg-[var(--chip-bg)] px-4 text-sm font-semibold text-[var(--sea-ink)] disabled:opacity-60"
        >
          {mutation.isPending ? 'Searching…' : 'Search'}
        </button>
      </form>

      {mutation.data?.error && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          {mutation.data.error}
        </div>
      )}

      {mutation.data?.results && mutation.data.results.length > 0 && (
        <ol className="flex flex-col gap-2">
          {mutation.data.results.map((r: SerpResult) => (
            <li key={`${r.position}-${r.link}`} className="island-shell rounded-xl p-4">
              <a
                href={r.link}
                target="_blank"
                rel="noreferrer"
                className="text-sm font-semibold text-[var(--lagoon-deep)]"
              >
                {r.title}
              </a>
              <p className="m-0 mt-1 text-xs text-[var(--sea-ink-soft)]">{r.link}</p>
              <p className="m-0 mt-1 text-sm text-[var(--sea-ink)]">{r.snippet}</p>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
