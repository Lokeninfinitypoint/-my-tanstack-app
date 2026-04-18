import { renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useHotkeys } from '../lib/hotkeys'

function fireKeydown(
  key: string,
  opts: { metaKey?: boolean; ctrlKey?: boolean; altKey?: boolean; shiftKey?: boolean } = {},
) {
  const event = new KeyboardEvent('keydown', {
    key,
    bubbles: true,
    cancelable: true,
    metaKey: opts.metaKey ?? false,
    ctrlKey: opts.ctrlKey ?? false,
    altKey: opts.altKey ?? false,
    shiftKey: opts.shiftKey ?? false,
  })
  window.dispatchEvent(event)
  return event
}

describe('useHotkeys', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('calls the matching single-key binding', () => {
    const run = vi.fn()
    renderHook(() =>
      useHotkeys([{ keys: 'escape', run, description: 'Close' }]),
    )
    fireKeydown('Escape')
    expect(run).toHaveBeenCalledOnce()
  })

  it('calls modifier+key binding (meta+k)', () => {
    const run = vi.fn()
    renderHook(() =>
      useHotkeys([{ keys: 'meta+k', run, description: 'Open palette' }]),
    )
    fireKeydown('k', { metaKey: true })
    expect(run).toHaveBeenCalledOnce()
  })

  it('calls modifier+key binding (ctrl+k)', () => {
    const run = vi.fn()
    renderHook(() =>
      useHotkeys([{ keys: 'ctrl+k', run, description: 'Open palette' }]),
    )
    fireKeydown('k', { ctrlKey: true })
    expect(run).toHaveBeenCalledOnce()
  })

  it('calls chord binding after two sequential key presses', () => {
    const run = vi.fn()
    renderHook(() =>
      useHotkeys([{ keys: 'g o', run, description: 'Go overview' }]),
    )
    fireKeydown('g')
    fireKeydown('o')
    expect(run).toHaveBeenCalledOnce()
  })

  it('does NOT call chord binding when only the first key is pressed', () => {
    const run = vi.fn()
    renderHook(() =>
      useHotkeys([{ keys: 'g c', run, description: 'Go customers' }]),
    )
    fireKeydown('g')
    expect(run).not.toHaveBeenCalled()
  })

  it('flushes buffer after 800ms timeout and does not trigger chord', () => {
    const run = vi.fn()
    renderHook(() =>
      useHotkeys([{ keys: 'g o', run, description: 'Go overview' }]),
    )
    fireKeydown('g')
    vi.advanceTimersByTime(800)
    // Buffer is now flushed; pressing 'o' alone should not trigger 'g o'
    fireKeydown('o')
    expect(run).not.toHaveBeenCalled()
  })

  it('does NOT fire binding when target is an INPUT element', () => {
    const run = vi.fn()
    renderHook(() =>
      useHotkeys([{ keys: 'escape', run, description: 'Close' }]),
    )
    const input = document.createElement('input')
    document.body.appendChild(input)
    // Dispatch from the element so event.target is correctly set to the input
    input.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
    )
    document.body.removeChild(input)
    expect(run).not.toHaveBeenCalled()
  })

  it('does NOT fire binding when target is a TEXTAREA element', () => {
    const run = vi.fn()
    renderHook(() =>
      useHotkeys([{ keys: 'escape', run, description: 'Close' }]),
    )
    const textarea = document.createElement('textarea')
    document.body.appendChild(textarea)
    // Dispatch from the element so event.target is correctly set to the textarea
    textarea.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
    )
    document.body.removeChild(textarea)
    expect(run).not.toHaveBeenCalled()
  })

  it('does NOT fire binding when target is contentEditable', () => {
    const run = vi.fn()
    renderHook(() =>
      useHotkeys([{ keys: 'escape', run, description: 'Close' }]),
    )
    const div = document.createElement('div')
    div.contentEditable = 'true'
    document.body.appendChild(div)
    // Dispatch from the element so event.target is correctly set to the div
    div.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
    )
    document.body.removeChild(div)
    expect(run).not.toHaveBeenCalled()
  })

  it('removes the event listener on unmount', () => {
    const run = vi.fn()
    const { unmount } = renderHook(() =>
      useHotkeys([{ keys: 'escape', run, description: 'Close' }]),
    )
    unmount()
    fireKeydown('Escape')
    expect(run).not.toHaveBeenCalled()
  })

  it('handles multiple bindings and fires only the matching one', () => {
    const runA = vi.fn()
    const runB = vi.fn()
    renderHook(() =>
      useHotkeys([
        { keys: 'a', run: runA, description: 'A key' },
        { keys: 'b', run: runB, description: 'B key' },
      ]),
    )
    fireKeydown('a')
    expect(runA).toHaveBeenCalledOnce()
    expect(runB).not.toHaveBeenCalled()
  })

  it('is case-insensitive for key matching', () => {
    const run = vi.fn()
    renderHook(() =>
      useHotkeys([{ keys: 'g o', run, description: 'Go overview' }]),
    )
    // The hook lowercases both binding keys and pressed keys
    fireKeydown('G') // key 'G' → lowercased to 'g'
    fireKeydown('O') // key 'O' → lowercased to 'o'
    expect(run).toHaveBeenCalledOnce()
  })

  it('does not trigger chord for a different second key', () => {
    const run = vi.fn()
    renderHook(() =>
      useHotkeys([{ keys: 'g o', run, description: 'Go overview' }]),
    )
    fireKeydown('g')
    fireKeydown('x') // wrong second key
    expect(run).not.toHaveBeenCalled()
  })

  it('resets buffer after a successful single-key match', () => {
    const runSingle = vi.fn()
    const runChord = vi.fn()
    renderHook(() =>
      useHotkeys([
        { keys: 'escape', run: runSingle, description: 'Escape' },
        { keys: 'g o', run: runChord, description: 'Go overview' },
      ]),
    )
    fireKeydown('Escape') // triggers single match, flushes buffer
    fireKeydown('o') // 'o' alone should not trigger 'g o'
    expect(runSingle).toHaveBeenCalledOnce()
    expect(runChord).not.toHaveBeenCalled()
  })
})