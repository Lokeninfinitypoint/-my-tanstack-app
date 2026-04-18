import { useEffect } from 'react'

type Binding = {
  keys: string
  run: (e: KeyboardEvent) => void
  description: string
}

// Lightweight hotkey hook. A full @tanstack/react-hotkeys package is not yet on npm,
// so we keep this focused wrapper that still supports chord sequences like 'g o'.
export function useHotkeys(bindings: Array<Binding>) {
  useEffect(() => {
    let buffer = ''
    let bufferTimer: ReturnType<typeof setTimeout> | null = null

    function flushBuffer() {
      buffer = ''
    }

    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null
      if (
        target &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
      ) {
        return
      }

      const combo: Array<string> = []
      if (e.metaKey) combo.push('meta')
      if (e.ctrlKey) combo.push('ctrl')
      if (e.altKey) combo.push('alt')
      if (e.shiftKey) combo.push('shift')
      combo.push(e.key.toLowerCase())
      const pressed = combo.join('+')

      for (const b of bindings) {
        const parts = b.keys.toLowerCase().split(' ')
        if (parts.length === 1 && parts[0] === pressed) {
          e.preventDefault()
          b.run(e)
          flushBuffer()
          return
        }
      }

      buffer = (buffer ? `${buffer} ` : '') + pressed
      if (bufferTimer) clearTimeout(bufferTimer)
      bufferTimer = setTimeout(flushBuffer, 800)

      for (const b of bindings) {
        const parts = b.keys.toLowerCase().split(' ')
        if (parts.length > 1 && buffer.endsWith(b.keys.toLowerCase())) {
          e.preventDefault()
          b.run(e)
          flushBuffer()
          return
        }
      }
    }

    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      if (bufferTimer) clearTimeout(bufferTimer)
    }
  }, [bindings])
}
