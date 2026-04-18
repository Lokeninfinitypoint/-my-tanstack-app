import * as Sentry from '@sentry/tanstackstart-react'
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

// OpenRouter is OpenAI-compatible, so the official `openai` SDK is the
// recommended client. Keep this file server-only; never expose the key.
const MODEL = process.env.OPENROUTER_MODEL ?? 'anthropic/claude-3.5-sonnet'

const chatSchema = z.object({
  prompt: z.string().min(1).max(4000),
  model: z.string().max(120).optional(),
})

export const chatWithModel = createServerFn({ method: 'POST' })
  .inputValidator((data: z.input<typeof chatSchema>) => chatSchema.parse(data))
  .handler(async ({ data }): Promise<{ model: string; reply: string; error?: string }> => {
    return Sentry.startSpan(
      { name: 'openrouter.chat', attributes: { model: data.model ?? MODEL } },
      async () => {
        const apiKey = process.env.OPENROUTER_API_KEY
        if (!apiKey) {
          return {
            model: data.model ?? MODEL,
            reply: '',
            error:
              'OPENROUTER_API_KEY is not set. Add it to .env.local to enable server-side LLM calls.',
          }
        }
        const { default: OpenAI } = await import('openai')
        const client = new OpenAI({
          apiKey,
          baseURL: 'https://openrouter.ai/api/v1',
          defaultHeaders: {
            'HTTP-Referer': process.env.APP_URL ?? 'http://localhost:3000',
            'X-Title': 'my-tanstack-app',
          },
        })
        const resp = await client.chat.completions.create({
          model: data.model ?? MODEL,
          messages: [
            {
              role: 'system',
              content: 'You are a concise SaaS analytics assistant. Keep answers under 120 words.',
            },
            { role: 'user', content: data.prompt },
          ],
          max_tokens: 400,
        })
        return {
          model: data.model ?? MODEL,
          reply: resp.choices[0]?.message?.content ?? '',
        }
      },
    )
  })
