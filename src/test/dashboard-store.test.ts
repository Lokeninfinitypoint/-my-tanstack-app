import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  dashboardStore,
  setAccent,
  setDensity,
  toggleCommandPalette,
} from '../lib/stores/dashboard-store'

describe('dashboardStore', () => {
  // Reset store state between tests
  beforeEach(() => {
    dashboardStore.setState(() => ({
      density: 'comfortable',
      accent: 'lagoon',
      commandPaletteOpen: false,
    }))
  })

  afterEach(() => {
    dashboardStore.setState(() => ({
      density: 'comfortable',
      accent: 'lagoon',
      commandPaletteOpen: false,
    }))
  })

  describe('initial state', () => {
    it('has density "comfortable" by default', () => {
      expect(dashboardStore.state.density).toBe('comfortable')
    })

    it('has accent "lagoon" by default', () => {
      expect(dashboardStore.state.accent).toBe('lagoon')
    })

    it('has commandPaletteOpen false by default', () => {
      expect(dashboardStore.state.commandPaletteOpen).toBe(false)
    })
  })

  describe('setDensity', () => {
    it('sets density to "compact"', () => {
      setDensity('compact')
      expect(dashboardStore.state.density).toBe('compact')
    })

    it('sets density to "comfortable"', () => {
      setDensity('compact')
      setDensity('comfortable')
      expect(dashboardStore.state.density).toBe('comfortable')
    })

    it('does not mutate other fields when setting density', () => {
      setAccent('palm')
      setDensity('compact')
      expect(dashboardStore.state.accent).toBe('palm')
      expect(dashboardStore.state.commandPaletteOpen).toBe(false)
    })
  })

  describe('setAccent', () => {
    it('sets accent to "palm"', () => {
      setAccent('palm')
      expect(dashboardStore.state.accent).toBe('palm')
    })

    it('sets accent to "sand"', () => {
      setAccent('sand')
      expect(dashboardStore.state.accent).toBe('sand')
    })

    it('sets accent back to "lagoon"', () => {
      setAccent('palm')
      setAccent('lagoon')
      expect(dashboardStore.state.accent).toBe('lagoon')
    })

    it('does not mutate other fields when setting accent', () => {
      setDensity('compact')
      setAccent('sand')
      expect(dashboardStore.state.density).toBe('compact')
      expect(dashboardStore.state.commandPaletteOpen).toBe(false)
    })
  })

  describe('toggleCommandPalette', () => {
    it('opens the command palette when closed', () => {
      expect(dashboardStore.state.commandPaletteOpen).toBe(false)
      toggleCommandPalette()
      expect(dashboardStore.state.commandPaletteOpen).toBe(true)
    })

    it('closes the command palette when open', () => {
      toggleCommandPalette() // open
      toggleCommandPalette() // close
      expect(dashboardStore.state.commandPaletteOpen).toBe(false)
    })

    it('toggles repeatedly', () => {
      toggleCommandPalette() // true
      toggleCommandPalette() // false
      toggleCommandPalette() // true
      expect(dashboardStore.state.commandPaletteOpen).toBe(true)
    })

    it('does not mutate density or accent when toggling', () => {
      setDensity('compact')
      setAccent('sand')
      toggleCommandPalette()
      expect(dashboardStore.state.density).toBe('compact')
      expect(dashboardStore.state.accent).toBe('sand')
    })
  })
})