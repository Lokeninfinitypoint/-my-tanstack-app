import { useMutation } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { chatWithModel } from '#/server/openrouter'

export const Route = createFileRoute('/dashboard/ai')({
  component: AiConsole,
})

const MODELS = [
  'anthropic/claude-3.5-sonnet',
  'openai/gpt-4o-mini',
  'google/gemini-2.0-flash-exp:free',
  'meta-llama/llama-3.3-70b-instruct',
]

function AiConsole() {
  const [model, setModel] = useState(MODELS[0])
  const [prompt, setPrompt] = useState(
    'Suggest three KPIs a B2B SaaS should watch weekly, in one line each.',
  )
  const mutation = useMutation({
    mutationFn: () => chatWithModel({ data: { prompt, model } }),
  })

  return (
    <div className="flex flex-col gap-4">
      <header>
        <p className="island-kicker">AI</p>
        <h1 className="m-0 text-2xl font-semibold text-[var(--sea-ink)]">AI console</h1>
        <p className="mt-1 text-sm text-[var(--sea-ink-soft)]">
          Routed through <code>src/server/openrouter.ts</code>. The OpenRouter key never reaches the
          browser. Set <code>OPENROUTER_API_KEY</code> (and optionally <code>OPENROUTER_MODEL</code>
          ) in <code>.env.local</code>.
        </p>
      </header>

      <form
        className="island-shell flex flex-col gap-3 rounded-2xl p-4"
        onSubmit={(e) => {
          e.preventDefault()
          mutation.mutate()
        }}
      >
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-semibold text-[var(--sea-ink)]">Model</span>
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="h-9 rounded-lg border border-[var(--chip-line)] bg-[var(--chip-bg)] px-3"
          >
            {MODELS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-semibold text-[var(--sea-ink)]">Prompt</span>
          <textarea
            rows={4}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="rounded-lg border border-[var(--chip-line)] bg-[var(--chip-bg)] p-3"
          />
        </label>
        <div className="flex items-center justify-end">
          <button
            type="submit"
            disabled={mutation.isPending || prompt.length < 2}
            className="h-9 rounded-full border border-[var(--chip-line)] bg-[var(--chip-bg)] px-4 text-sm font-semibold text-[var(--sea-ink)] disabled:opacity-60"
          >
            {mutation.isPending ? 'Thinking…' : 'Run'}
          </button>
        </div>
      </form>

      {mutation.data?.error && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          {mutation.data.error}
        </div>
      )}

      {mutation.data?.reply && (
        <article className="island-shell rounded-2xl p-5">
          <p className="island-kicker mb-2">{mutation.data.model}</p>
          <pre className="m-0 whitespace-pre-wrap text-sm text-[var(--sea-ink)]">
            {mutation.data.reply}
          </pre>
        </article>
      )}
    </div>
  )
}
