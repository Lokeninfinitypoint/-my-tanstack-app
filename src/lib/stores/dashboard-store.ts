import { Store } from '@tanstack/store'

export type DashboardPrefs = {
  density: 'comfortable' | 'compact'
  accent: 'lagoon' | 'palm' | 'sand'
  commandPaletteOpen: boolean
}

export const dashboardStore = new Store<DashboardPrefs>({
  density: 'comfortable',
  accent: 'lagoon',
  commandPaletteOpen: false,
})

export const setDensity = (density: DashboardPrefs['density']) =>
  dashboardStore.setState((s) => ({ ...s, density }))

export const setAccent = (accent: DashboardPrefs['accent']) =>
  dashboardStore.setState((s) => ({ ...s, accent }))

export const toggleCommandPalette = () =>
  dashboardStore.setState((s) => ({ ...s, commandPaletteOpen: !s.commandPaletteOpen }))
