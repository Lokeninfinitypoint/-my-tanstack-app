import { useSuspenseQuery } from '@tanstack/react-query'
import { Link, createFileRoute } from '@tanstack/react-router'
import { CustomersGrid } from '#/components/dashboard/CustomersGrid'
import { listCustomers } from '#/server/customers'

const customersQuery = {
  queryKey: ['dashboard', 'customers'] as const,
  queryFn: () => listCustomers(),
  staleTime: 30_000,
}

export const Route = createFileRoute('/dashboard/customers')({
  loader: ({ context }) => context.queryClient.ensureQueryData(customersQuery),
  component: CustomersPage,
})

function CustomersPage() {
  const { data } = useSuspenseQuery(customersQuery)
  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="island-kicker">Customers</p>
          <h1 className="m-0 text-2xl font-semibold text-[var(--sea-ink)]">
            {data.length} accounts
          </h1>
        </div>
        <Link
          to="/dashboard/customers/new"
          className="h-9 rounded-full border border-[var(--chip-line)] bg-[var(--chip-bg)] px-4 text-sm font-semibold text-[var(--sea-ink)] no-underline inline-flex items-center"
        >
          + New customer
        </Link>
      </header>
      <div className="island-shell rounded-2xl p-4">
        <CustomersGrid rowData={data} />
      </div>
    </div>
  )
}
