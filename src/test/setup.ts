import '@testing-library/dom'

// Extend vitest matchers if needed - using @testing-library/dom directly
// since @testing-library/jest-dom is not in devDependencies

// Polyfill for window.matchMedia used by some components
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
})

// Polyfill ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

// Polyfill requestAnimationFrame
global.requestAnimationFrame = (cb: FrameRequestCallback) => {
  return setTimeout(cb, 0) as unknown as number
}