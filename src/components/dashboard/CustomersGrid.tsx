import type { ColDef, GridReadyEvent } from 'ag-grid-community'
import { AgGridReact } from 'ag-grid-react'
import { useMemo, useRef, useState } from 'react'
import 'ag-grid-community/styles/ag-grid.css'
import 'ag-grid-community/styles/ag-theme-quartz.css'
import type { CustomerRow } from '#/server/customers'

function moneyFmt({ value }: { value: number | null | undefined }) {
  if (value == null) return ''
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value / 100)
}

export function CustomersGrid({ rowData }: { rowData: Array<CustomerRow> }) {
  const gridRef = useRef<AgGridReact<CustomerRow>>(null)
  const [quickFilter, setQuickFilter] = useState('')
  const [planFilter, setPlanFilter] = useState<'all' | CustomerRow['planTier']>('all')

  const columnDefs = useMemo<Array<ColDef<CustomerRow>>>(
    () => [
      { headerName: 'Name', field: 'name', pinned: 'left', minWidth: 160 },
      { headerName: 'Email', field: 'email', minWidth: 220 },
      { headerName: 'Company', field: 'company', minWidth: 160 },
      { headerName: 'Country', field: 'country', width: 110 },
      {
        headerName: 'Plan',
        field: 'planTier',
        width: 130,
        cellRenderer: ({ value }: { value: string }) => (
          <span className="rounded-full bg-[var(--chip-bg)] px-2 py-0.5 text-xs font-semibold capitalize text-[var(--sea-ink)]">
            {value}
          </span>
        ),
      },
      {
        headerName: 'MRR',
        field: 'mrrCents',
        width: 120,
        type: 'numericColumn',
        valueFormatter: moneyFmt,
        sort: 'desc',
      },
      { headerName: 'Seats', field: 'seats', width: 90, type: 'numericColumn' },
      {
        headerName: 'Health',
        field: 'healthScore',
        width: 110,
        type: 'numericColumn',
        cellRenderer: ({ value }: { value: number }) => {
          const color = value >= 75 ? '#2f6a4a' : value >= 50 ? '#b8860b' : '#a33a3a'
          return <span style={{ color, fontWeight: 600 }}>{value}</span>
        },
      },
      {
        headerName: 'Active',
        field: 'active',
        width: 100,
        cellRenderer: ({ value }: { value: boolean }) => (value ? 'Yes' : 'No'),
      },
      {
        headerName: 'Signed up',
        field: 'signedUpAt',
        minWidth: 140,
        valueFormatter: ({ value }: { value: string | null }) =>
          value ? new Date(value).toLocaleDateString() : '',
      },
    ],
    [],
  )

  const defaultColDef = useMemo<ColDef>(
    () => ({
      sortable: true,
      filter: true,
      resizable: true,
      floatingFilter: true,
      flex: 1,
    }),
    [],
  )

  const filtered = useMemo(() => {
    if (planFilter === 'all') return rowData
    return rowData.filter((r) => r.planTier === planFilter)
  }, [rowData, planFilter])

  function onGridReady(e: GridReadyEvent<CustomerRow>) {
    e.api.sizeColumnsToFit()
  }

  function exportCsv() {
    gridRef.current?.api?.exportDataAsCsv({
      fileName: `customers-${new Date().toISOString().slice(0, 10)}.csv`,
    })
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="search"
          placeholder="Quick filter (any column)"
          value={quickFilter}
          onChange={(e) => setQuickFilter(e.target.value)}
          className="h-9 min-w-[220px] flex-1 rounded-lg border border-[var(--chip-line)] bg-[var(--chip-bg)] px-3 text-sm text-[var(--sea-ink)] outline-none"
        />
        <select
          value={planFilter}
          onChange={(e) => setPlanFilter(e.target.value as typeof planFilter)}
          className="h-9 rounded-lg border border-[var(--chip-line)] bg-[var(--chip-bg)] px-3 text-sm text-[var(--sea-ink)]"
        >
          <option value="all">All plans</option>
          <option value="free">Free</option>
          <option value="starter">Starter</option>
          <option value="pro">Pro</option>
          <option value="enterprise">Enterprise</option>
        </select>
        <button
          type="button"
          onClick={exportCsv}
          className="h-9 rounded-lg border border-[var(--chip-line)] bg-[var(--chip-bg)] px-3 text-sm font-semibold text-[var(--sea-ink)]"
        >
          Export CSV
        </button>
      </div>
      <div className="ag-theme-quartz" style={{ width: '100%', height: 560 }}>
        <AgGridReact<CustomerRow>
          ref={gridRef}
          rowData={filtered}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          quickFilterText={quickFilter}
          pagination
          paginationPageSize={20}
          paginationPageSizeSelector={[10, 20, 50, 100]}
          animateRows
          onGridReady={onGridReady}
        />
      </div>
    </div>
  )
}
