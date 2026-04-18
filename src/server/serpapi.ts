import * as Sentry from '@sentry/tanstackstart-react'
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

export type SerpResult = {
  position: number
  title: string
  link: string
  snippet: string
  source?: string
}

// App-owned result type decouples the UI from the provider response shape.
// Swap the engine by changing SERPAPI_ENGINE (default: 'google').
const ENGINE = process.env.SERPAPI_ENGINE ?? 'google'

const searchSchema = z.object({
  q: z.string().min(2).max(200),
  num: z.number().int().min(1).max(20).default(10),
})

export const runWebSearch = createServerFn({ method: 'POST' })
  .inputValidator((data: z.input<typeof searchSchema>) => searchSchema.parse(data))
  .handler(async ({ data }): Promise<{ results: SerpResult[]; engine: string; error?: string }> => {
    return Sentry.startSpan(
      { name: 'serpapi.search', attributes: { engine: ENGINE } },
      async () => {
        const apiKey = process.env.SERPAPI_API_KEY
        if (!apiKey) {
          return {
            engine: ENGINE,
            results: [],
            error:
              'SERPAPI_API_KEY is not set. Add it to .env.local to enable server-side SerpAPI search.',
          }
        }
        // Lazy import so the client bundle never pulls serpapi.
        const { getJson } = await import('serpapi')
        const json = (await getJson({
          engine: ENGINE,
          q: data.q,
          num: data.num,
          api_key: apiKey,
        })) as { organic_results?: Array<Record<string, unknown>> }

        const results: SerpResult[] = (json.organic_results ?? [])
          .slice(0, data.num)
          .map((r, i) => ({
            position: (r.position as number) ?? i + 1,
            title: String(r.title ?? ''),
            link: String(r.link ?? ''),
            snippet: String(r.snippet ?? ''),
            source: r.source ? String(r.source) : undefined,
          }))
        return { engine: ENGINE, results }
      },
    )
  })
