import { fireEvent, render, screen } from '@testing-library/react'
import * as React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Mock @tanstack/react-router before importing the component
const mockNavigate = vi.fn()
vi.mock('@tanstack/react-router', () => ({
  useRouter: () => ({ navigate: mockNavigate }),
}))

// Mock @tanstack/react-store to let us control the open state
let mockOpen = false
vi.mock('@tanstack/react-store', () => ({
  useStore: (_store: unknown, selector: (s: { commandPaletteOpen: boolean }) => boolean) =>
    selector({ commandPaletteOpen: mockOpen }),
}))

// Mock the hotkeys hook so it doesn't interact with the DOM during these tests
vi.mock('#/lib/hotkeys', () => ({
  useHotkeys: () => {},
}))

// Mock the dashboard store actions so we can control & inspect them
const mockToggle = vi.fn()
vi.mock('#/lib/stores/dashboard-store', () => ({
  dashboardStore: {},
  toggleCommandPalette: () => mockToggle(),
}))

// Import AFTER mocks are set up
import { CommandPalette } from '../components/dashboard/CommandPalette'

describe('CommandPalette', () => {
  beforeEach(() => {
    mockOpen = false
    mockNavigate.mockReset()
    mockToggle.mockReset()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('renders nothing when the palette is closed', () => {
    mockOpen = false
    const { container } = render(<CommandPalette />)
    expect(container.firstChild).toBeNull()
  })

  it('renders the dialog when the palette is open', () => {
    mockOpen = true
    render(<CommandPalette />)
    expect(screen.getByRole('dialog')).toBeDefined()
  })

  it('renders the search input with correct placeholder', () => {
    mockOpen = true
    render(<CommandPalette />)
    expect(screen.getByPlaceholderText('Type a command…')).toBeDefined()
  })

  it('renders all 6 default commands', () => {
    mockOpen = true
    render(<CommandPalette />)
    // All commands should be visible
    expect(screen.getByText('Go to Overview')).toBeDefined()
    expect(screen.getByText('Go to Customers')).toBeDefined()
    expect(screen.getByText('Go to Billing')).toBeDefined()
    expect(screen.getByText('Go to Web Search')).toBeDefined()
    expect(screen.getByText('Go to AI Console')).toBeDefined()
    expect(screen.getByText('Go to Settings')).toBeDefined()
  })

  it('filters commands based on search query', () => {
    mockOpen = true
    render(<CommandPalette />)
    const input = screen.getByPlaceholderText('Type a command…')
    fireEvent.change(input, { target: { value: 'cust' } })
    expect(screen.getByText('Go to Customers')).toBeDefined()
    // Other commands should be filtered out
    expect(screen.queryByText('Go to Overview')).toBeNull()
    expect(screen.queryByText('Go to Billing')).toBeNull()
  })

  it('shows "No matches" when query has no results', () => {
    mockOpen = true
    render(<CommandPalette />)
    const input = screen.getByPlaceholderText('Type a command…')
    fireEvent.change(input, { target: { value: 'zzzznotfound' } })
    expect(screen.getByText('No matches')).toBeDefined()
  })

  it('calls toggleCommandPalette when backdrop is clicked', () => {
    mockOpen = true
    render(<CommandPalette />)
    const dialog = screen.getByRole('dialog')
    fireEvent.click(dialog)
    expect(mockToggle).toHaveBeenCalled()
  })

  it('does not close when clicking inside the content box', () => {
    mockOpen = true
    render(<CommandPalette />)
    const input = screen.getByPlaceholderText('Type a command…')
    fireEvent.click(input)
    expect(mockToggle).not.toHaveBeenCalled()
  })

  it('calls toggleCommandPalette when Escape is pressed in input', () => {
    mockOpen = true
    render(<CommandPalette />)
    const input = screen.getByPlaceholderText('Type a command…')
    fireEvent.keyDown(input, { key: 'Escape' })
    expect(mockToggle).toHaveBeenCalled()
  })

  it('navigates and toggles on Enter when a filtered result exists', () => {
    mockOpen = true
    render(<CommandPalette />)
    const input = screen.getByPlaceholderText('Type a command…')
    // Filter to just "Overview"
    fireEvent.change(input, { target: { value: 'overview' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(mockNavigate).toHaveBeenCalledWith({ to: '/dashboard' })
    expect(mockToggle).toHaveBeenCalled()
  })

  it('does not navigate on Enter when no results match', () => {
    mockOpen = true
    render(<CommandPalette />)
    const input = screen.getByPlaceholderText('Type a command…')
    fireEvent.change(input, { target: { value: 'zzz' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('navigates to the correct route when a command button is clicked', () => {
    mockOpen = true
    render(<CommandPalette />)
    // Click the "Go to Customers" button
    fireEvent.click(screen.getByText('Go to Customers'))
    expect(mockNavigate).toHaveBeenCalledWith({ to: '/dashboard/customers' })
    expect(mockToggle).toHaveBeenCalled()
  })

  it('renders hint text for commands that have a hint', () => {
    mockOpen = true
    render(<CommandPalette />)
    // 'g o' is the hint for Overview
    expect(screen.getByText('g o')).toBeDefined()
    // 'g c' is the hint for Customers
    expect(screen.getByText('g c')).toBeDefined()
  })

  it('does not render hint text for commands without a hint (Settings)', () => {
    mockOpen = true
    render(<CommandPalette />)
    // Settings has no hint - find its button and check no kbd hint next to it
    const settingsBtn = screen.getByText('Go to Settings').closest('button')
    // The settings button should not contain a hint span (only one span child)
    const spans = settingsBtn?.querySelectorAll('span')
    // Only one span (the label) — no hint span
    expect(spans?.length).toBe(1)
  })

  it('filter is case-insensitive', () => {
    mockOpen = true
    render(<CommandPalette />)
    const input = screen.getByPlaceholderText('Type a command…')
    fireEvent.change(input, { target: { value: 'OVERVIEW' } })
    expect(screen.getByText('Go to Overview')).toBeDefined()
  })
})