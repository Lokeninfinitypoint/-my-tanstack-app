import { useForm } from '@tanstack/react-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { z } from 'zod'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import { PLAN_LABEL, PLAN_TIERS, type PlanTier } from '#/lib/plans'
import { createCustomer } from '#/server/customers'

export const Route = createFileRoute('/dashboard/customers/new')({
  component: NewCustomer,
})

const schema = z.object({
  email: z.string().email('Valid email required'),
  name: z.string().min(1, 'Name is required').max(120),
  company: z.string().max(160),
  country: z.string().max(2),
  planTier: z.enum(PLAN_TIERS),
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
    onSuccess: async (result) => {
      if (result.ok) {
        await qc.invalidateQueries({ queryKey: ['dashboard'] })
        void navigate({ to: '/dashboard/customers' })
      }
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

  const serverError = mutation.data && !mutation.data.ok ? mutation.data.reason : null

  return (
    <div className="flex max-w-xl flex-col gap-4">
      <header>
        <p className="island-kicker">Customers</p>
        <h1 className="m-0 text-2xl font-semibold text-[var(--sea-ink)]">New customer</h1>
        <p className="mt-2 text-sm text-[var(--sea-ink-soft)]">
          Uses TanStack Form + Zod validation and a Drizzle-backed server function (transactional
          insert, duplicate-email handling).
        </p>
      </header>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          e.stopPropagation()
          void form.handleSubmit()
        }}
        className="island-shell flex flex-col gap-4 rounded-2xl p-5"
      >
        <form.Field name="name">
          {(field) => (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
              />
              <FieldError errors={field.state.meta.errors} />
            </div>
          )}
        </form.Field>

        <form.Field name="email">
          {(field) => (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
              />
              <FieldError errors={field.state.meta.errors} />
            </div>
          )}
        </form.Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <form.Field name="company">
            {(field) => (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
              </div>
            )}
          </form.Field>

          <form.Field name="country">
            {(field) => (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="country">Country (ISO-2)</Label>
                <Input
                  id="country"
                  maxLength={2}
                  className="uppercase"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value.toUpperCase())}
                />
                <FieldError errors={field.state.meta.errors} />
              </div>
            )}
          </form.Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <form.Field name="planTier">
            {(field) => (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="planTier">Plan</Label>
                <Select
                  value={field.state.value}
                  onValueChange={(value) => field.handleChange(value as PlanTier)}
                >
                  <SelectTrigger id="planTier" className="w-full">
                    <SelectValue placeholder="Select plan" />
                  </SelectTrigger>
                  <SelectContent>
                    {PLAN_TIERS.map((tier) => (
                      <SelectItem key={tier} value={tier}>
                        {PLAN_LABEL[tier]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </form.Field>

          <form.Field name="seats">
            {(field) => (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="seats">Seats</Label>
                <Input
                  id="seats"
                  type="number"
                  min={1}
                  value={field.state.value}
                  onChange={(e) => field.handleChange(Number(e.target.value || 1))}
                />
                <FieldError errors={field.state.meta.errors} />
              </div>
            )}
          </form.Field>
        </div>

        {serverError && (
          <p className="text-sm text-red-600" role="alert">
            {serverError}
          </p>
        )}

        <div className="mt-2 flex items-center justify-end gap-2">
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? 'Saving…' : 'Create customer'}
          </Button>
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
