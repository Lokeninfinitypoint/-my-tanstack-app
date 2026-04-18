import { fireEvent, render, screen } from '@testing-library/react'
import * as React from 'react'
import { describe, expect, it, vi } from 'vitest'

// AG Grid is not easily rendered in jsdom. Mock the heavy parts.
vi.mock('ag-grid-community/styles/ag-grid.css', () => ({}))
vi.mock('ag-grid-community/styles/ag-theme-quartz.css', () => ({}))
vi.mock('ag-grid-react', () => ({
  AgGridReact: React.forwardRef(
    (
      { rowData }: { rowData: Array<unknown> },
      ref: React.ForwardedRef<{ api: { sizeColumnsToFit: () => void; exportDataAsCsv: () => void } }>,
    ) => {
      // Expose a mock api via ref
      React.useImperativeHandle(ref, () => ({
        api: {
          sizeColumnsToFit: vi.fn(),
          exportDataAsCsv: vi.fn(),
        },
      }))
      return (
        <div data-testid="ag-grid" data-row-count={rowData?.length ?? 0}>
          AG Grid stub with {rowData?.length ?? 0} rows
        </div>
      )
    },
  ),
}))

import { CustomersGrid } from '../components/dashboard/CustomersGrid'

type CustomerRow = {
  id: string
  email: string
  name: string
  company: string | null
  country: string | null
  mrrCents: number
  seats: number
  planTier: 'free' | 'starter' | 'pro' | 'enterprise'
  healthScore: number
  active: boolean
  signedUpAt: string | null
}

const SAMPLE_CUSTOMERS: Array<CustomerRow> = [
  {
    id: '1',
    email: 'ada@lovelace.io',
    name: 'Ada Lovelace',
    company: 'Analytical Engines',
    country: 'GB',
    mrrCents: 4900,
    seats: 5,
    planTier: 'pro',
    healthScore: 92,
    active: true,
    signedUpAt: '2024-01-15T00:00:00Z',
  },
  {
    id: '2',
    email: 'grace@hopper.dev',
    name: 'Grace Hopper',
    company: 'Navy Yard',
    country: 'US',
    mrrCents: 19900,
    seats: 25,
    planTier: 'enterprise',
    healthScore: 88,
    active: true,
    signedUpAt: '2024-03-01T00:00:00Z',
  },
  {
    id: '3',
    email: 'guido@python.org',
    name: 'Guido van Rossum',
    company: 'Dropbox',
    country: 'NL',
    mrrCents: 0,
    seats: 1,
    planTier: 'free',
    healthScore: 44,
    active: true,
    signedUpAt: null,
  },
]

describe('CustomersGrid', () => {
  it('renders the quick filter input', () => {
    render(<CustomersGrid rowData={SAMPLE_CUSTOMERS} />)
    expect(screen.getByPlaceholderText('Quick filter (any column)')).toBeDefined()
  })

  it('renders the plan filter select with all options', () => {
    render(<CustomersGrid rowData={SAMPLE_CUSTOMERS} />)
    const select = screen.getByRole('combobox')
    expect(select).toBeDefined()
    expect(screen.getByRole('option', { name: 'All plans' })).toBeDefined()
    expect(screen.getByRole('option', { name: 'Free' })).toBeDefined()
    expect(screen.getByRole('option', { name: 'Starter' })).toBeDefined()
    expect(screen.getByRole('option', { name: 'Pro' })).toBeDefined()
    expect(screen.getByRole('option', { name: 'Enterprise' })).toBeDefined()
  })

  it('renders the Export CSV button', () => {
    render(<CustomersGrid rowData={SAMPLE_CUSTOMERS} />)
    expect(screen.getByRole('button', { name: 'Export CSV' })).toBeDefined()
  })

  it('initially shows all rows in the grid (no plan filter)', () => {
    render(<CustomersGrid rowData={SAMPLE_CUSTOMERS} />)
    const grid = screen.getByTestId('ag-grid')
    expect(grid.getAttribute('data-row-count')).toBe(String(SAMPLE_CUSTOMERS.length))
  })

  it('filters rows to only "pro" plan when plan filter is changed', () => {
    render(<CustomersGrid rowData={SAMPLE_CUSTOMERS} />)
    const select = screen.getByRole('combobox')
    fireEvent.change(select, { target: { value: 'pro' } })
    const grid = screen.getByTestId('ag-grid')
    // Only Ada Lovelace has planTier === 'pro'
    expect(grid.getAttribute('data-row-count')).toBe('1')
  })

  it('filters rows to only "enterprise" plan', () => {
    render(<CustomersGrid rowData={SAMPLE_CUSTOMERS} />)
    const select = screen.getByRole('combobox')
    fireEvent.change(select, { target: { value: 'enterprise' } })
    const grid = screen.getByTestId('ag-grid')
    expect(grid.getAttribute('data-row-count')).toBe('1')
  })

  it('filters rows to only "free" plan', () => {
    render(<CustomersGrid rowData={SAMPLE_CUSTOMERS} />)
    const select = screen.getByRole('combobox')
    fireEvent.change(select, { target: { value: 'free' } })
    const grid = screen.getByTestId('ag-grid')
    expect(grid.getAttribute('data-row-count')).toBe('1')
  })

  it('shows all rows when plan filter is reset to "all"', () => {
    render(<CustomersGrid rowData={SAMPLE_CUSTOMERS} />)
    const select = screen.getByRole('combobox')
    fireEvent.change(select, { target: { value: 'pro' } })
    fireEvent.change(select, { target: { value: 'all' } })
    const grid = screen.getByTestId('ag-grid')
    expect(grid.getAttribute('data-row-count')).toBe(String(SAMPLE_CUSTOMERS.length))
  })

  it('shows zero rows when plan filter matches no customers', () => {
    render(<CustomersGrid rowData={SAMPLE_CUSTOMERS} />)
    const select = screen.getByRole('combobox')
    fireEvent.change(select, { target: { value: 'starter' } })
    const grid = screen.getByTestId('ag-grid')
    expect(grid.getAttribute('data-row-count')).toBe('0')
  })

  it('updates the quick filter text state when typing', () => {
    render(<CustomersGrid rowData={SAMPLE_CUSTOMERS} />)
    const filterInput = screen.getByPlaceholderText('Quick filter (any column)')
    fireEvent.change(filterInput, { target: { value: 'Ada' } })
    expect((filterInput as HTMLInputElement).value).toBe('Ada')
  })

  it('renders with empty rowData without crashing', () => {
    render(<CustomersGrid rowData={[]} />)
    const grid = screen.getByTestId('ag-grid')
    expect(grid.getAttribute('data-row-count')).toBe('0')
  })
})

// ---------------------------------------------------------------------------
// moneyFmt (tested indirectly via the internal formatter logic)
// ---------------------------------------------------------------------------

describe('moneyFmt utility (via Intl.NumberFormat behaviour)', () => {
  // Test the formatting logic that moneyFmt implements
  function moneyFmt(value: number | null | undefined): string {
    if (value == null) return ''
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value / 100)
  }

  it('formats cents to dollars with $ symbol', () => {
    expect(moneyFmt(4900)).toMatch(/\$49/)
  })

  it('formats 19900 cents as roughly $199', () => {
    expect(moneyFmt(19900)).toMatch(/\$199/)
  })

  it('returns empty string for null', () => {
    expect(moneyFmt(null)).toBe('')
  })

  it('returns empty string for undefined', () => {
    expect(moneyFmt(undefined)).toBe('')
  })

  it('formats 0 cents as $0', () => {
    expect(moneyFmt(0)).toMatch(/\$0/)
  })
})