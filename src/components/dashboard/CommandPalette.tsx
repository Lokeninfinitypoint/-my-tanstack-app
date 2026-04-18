import { useRouter } from '@tanstack/react-router'
import { useStore } from '@tanstack/react-store'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useHotkeys } from '#/lib/hotkeys'
import { dashboardStore, toggleCommandPalette } from '#/lib/stores/dashboard-store'

type Command = { id: string; label: string; to: string; hint?: string }

const COMMANDS: Array<Command> = [
  { id: 'overview', label: 'Go to Overview', to: '/dashboard', hint: 'g o' },
  { id: 'customers', label: 'Go to Customers', to: '/dashboard/customers', hint: 'g c' },
  { id: 'billing', label: 'Go to Billing', to: '/dashboard/billing', hint: 'g b' },
  { id: 'search', label: 'Go to Web Search', to: '/dashboard/search', hint: 'g s' },
  { id: 'ai', label: 'Go to AI Console', to: '/dashboard/ai', hint: 'g a' },
  { id: 'settings', label: 'Go to Settings', to: '/dashboard/settings' },
]

export function CommandPalette() {
  const router = useRouter()
  const open = useStore(dashboardStore, (s) => s.commandPaletteOpen)
  const [q, setQ] = useState('')

  useHotkeys(
    useMemo(
      () => [
        {
          keys: 'meta+k',
          run: () => toggleCommandPalette(),
          description: 'Open command palette',
        },
        {
          keys: 'ctrl+k',
          run: () => toggleCommandPalette(),
          description: 'Open command palette',
        },
        { keys: 'g o', run: () => router.navigate({ to: '/dashboard' }), description: 'Overview' },
        {
          keys: 'g c',
          run: () => router.navigate({ to: '/dashboard/customers' }),
          description: 'Customers',
        },
        {
          keys: 'g b',
          run: () => router.navigate({ to: '/dashboard/billing' }),
          description: 'Billing',
        },
        {
          keys: 'g s',
          run: () => router.navigate({ to: '/dashboard/search' }),
          description: 'Search',
        },
        { keys: 'g a', run: () => router.navigate({ to: '/dashboard/ai' }), description: 'AI' },
      ],
      [router],
    ),
  )

  const inputRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (!open) {
      setQ('')
    } else {
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [open])

  const filtered = useMemo(
    () => COMMANDS.filter((c) => c.label.toLowerCase().includes(q.toLowerCase())),
    [q],
  )

  if (!open) return null

  return (
    <div
      role="dialog"
      aria-modal
      className="fixed inset-0 z-[60] flex items-start justify-center bg-black/30 p-4 pt-24"
      onClick={toggleCommandPalette}
    >
      <div
        className="w-full max-w-xl overflow-hidden rounded-2xl border border-[var(--chip-line)] bg-[var(--surface-strong)] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          ref={inputRef}
          placeholder="Type a command…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') toggleCommandPalette()
            if (e.key === 'Enter' && filtered[0]) {
              router.navigate({ to: filtered[0].to })
              toggleCommandPalette()
            }
          }}
          className="h-12 w-full border-b border-[var(--chip-line)] bg-transparent px-4 text-sm outline-none"
        />
        <ul className="m-0 max-h-80 list-none overflow-y-auto p-2">
          {filtered.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => {
                  router.navigate({ to: c.to })
                  toggleCommandPalette()
                }}
                className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm hover:bg-[var(--link-bg-hover)]"
              >
                <span>{c.label}</span>
                {c.hint && (
                  <span className="font-mono text-xs text-[var(--sea-ink-soft)]">{c.hint}</span>
                )}
              </button>
            </li>
          ))}
          {filtered.length === 0 && (
            <li className="px-3 py-4 text-center text-xs text-[var(--sea-ink-soft)]">No matches</li>
          )}
        </ul>
      </div>
    </div>
  )
}
