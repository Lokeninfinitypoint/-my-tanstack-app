import { useForm } from '@tanstack/react-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { z } from 'zod'
import { createCustomer } from '#/server/customers'

export const Route = createFileRoute('/dashboard/customers/new')({
  component: NewCustomer,
})

type PlanTier = 'free' | 'starter' | 'pro' | 'enterprise'

const schema = z.object({
  email: z.string().email('Valid email required'),
  name: z.string().min(1, 'Name is required').max(120),
  company: z.string().max(160),
  country: z.string().max(2),
  planTier: z.enum(['free', 'starter', 'pro', 'enterprise']),
  seats: z.number().int().min(1).max(10000),
})
type FormValues = z.infer<typeof schema>

function NewCustomer() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const mutation = useMutation({
    mutationFn: (data: FormValues) =>
      createCustomer({
        data: {
          ...data,
          company: data.company || undefined,
          country: data.country || undefined,
        },
      }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['dashboard'] })
      void navigate({ to: '/dashboard/customers' })
    },
  })

  const defaultValues: FormValues = {
    email: '',
    name: '',
    company: '',
    country: '',
    planTier: 'starter',
    seats: 1,
  }

  const form = useForm({
    defaultValues,
    validators: { onChange: schema },
    onSubmit: async ({ value }) => {
      await mutation.mutateAsync(value)
    },
  })

  return (
    <div className="flex max-w-xl flex-col gap-4">
      <header>
        <p className="island-kicker">Customers</p>
        <h1 className="m-0 text-2xl font-semibold text-[var(--sea-ink)]">New customer</h1>
        <p className="mt-2 text-sm text-[var(--sea-ink-soft)]">
          Uses TanStack Form + Zod validation and a Drizzle-backed server function.
        </p>
      </header>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          e.stopPropagation()
          void form.handleSubmit()
        }}
        className="island-shell flex flex-col gap-3 rounded-2xl p-5"
      >
        <form.Field name="name">
          {(field) => (
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-semibold text-[var(--sea-ink)]">Name</span>
              <input
                className="h-9 rounded-lg border border-[var(--chip-line)] bg-[var(--chip-bg)] px-3"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
              />
              <FieldError errors={field.state.meta.errors} />
            </label>
          )}
        </form.Field>

        <form.Field name="email">
          {(field) => (
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-semibold text-[var(--sea-ink)]">Email</span>
              <input
                type="email"
                className="h-9 rounded-lg border border-[var(--chip-line)] bg-[var(--chip-bg)] px-3"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
              />
              <FieldError errors={field.state.meta.errors} />
            </label>
          )}
        </form.Field>

        <div className="grid gap-3 sm:grid-cols-2">
          <form.Field name="company">
            {(field) => (
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-semibold text-[var(--sea-ink)]">Company</span>
                <input
                  className="h-9 rounded-lg border border-[var(--chip-line)] bg-[var(--chip-bg)] px-3"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
              </label>
            )}
          </form.Field>

          <form.Field name="country">
            {(field) => (
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-semibold text-[var(--sea-ink)]">Country (ISO-2)</span>
                <input
                  maxLength={2}
                  className="h-9 rounded-lg border border-[var(--chip-line)] bg-[var(--chip-bg)] px-3 uppercase"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value.toUpperCase())}
                />
                <FieldError errors={field.state.meta.errors} />
              </label>
            )}
          </form.Field>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <form.Field name="planTier">
            {(field) => (
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-semibold text-[var(--sea-ink)]">Plan</span>
                <select
                  className="h-9 rounded-lg border border-[var(--chip-line)] bg-[var(--chip-bg)] px-3"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value as PlanTier)}
                >
                  <option value="free">Free</option>
                  <option value="starter">Starter</option>
                  <option value="pro">Pro</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </label>
            )}
          </form.Field>

          <form.Field name="seats">
            {(field) => (
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-semibold text-[var(--sea-ink)]">Seats</span>
                <input
                  type="number"
                  min={1}
                  className="h-9 rounded-lg border border-[var(--chip-line)] bg-[var(--chip-bg)] px-3"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(Number(e.target.value || 1))}
                />
                <FieldError errors={field.state.meta.errors} />
              </label>
            )}
          </form.Field>
        </div>

        <div className="mt-2 flex items-center justify-end gap-2">
          {mutation.data && 'reason' in mutation.data && mutation.data.reason && (
            <span className="text-xs text-[var(--sea-ink-soft)]">{mutation.data.reason}</span>
          )}
          <button
            type="submit"
            disabled={mutation.isPending}
            className="h-9 rounded-full border border-[var(--chip-line)] bg-[var(--chip-bg)] px-4 text-sm font-semibold text-[var(--sea-ink)] disabled:opacity-60"
          >
            {mutation.isPending ? 'Saving…' : 'Create customer'}
          </button>
        </div>
      </form>
    </div>
  )
}

function FieldError({ errors }: { errors: Array<unknown> }) {
  if (!errors.length) return null
  const msg = errors
    .map((e) => (typeof e === 'string' ? e : (e as { message?: string })?.message))
    .filter(Boolean)
    .join(', ')
  if (!msg) return null
  return <span className="text-xs text-red-600">{msg}</span>
}
