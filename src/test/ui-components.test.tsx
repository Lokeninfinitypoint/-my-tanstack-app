import { fireEvent, render, screen } from '@testing-library/react'
import * as React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { Button, buttonVariants } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Textarea } from '../components/ui/textarea'

// ---------------------------------------------------------------------------
// Button
// ---------------------------------------------------------------------------

describe('Button', () => {
  it('renders a <button> by default', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button', { name: 'Click me' })).toBeDefined()
  })

  it('sets data-slot="button"', () => {
    render(<Button>Test</Button>)
    const btn = screen.getByRole('button')
    expect(btn.getAttribute('data-slot')).toBe('button')
  })

  it('sets data-variant to the provided variant', () => {
    render(<Button variant="destructive">Delete</Button>)
    const btn = screen.getByRole('button')
    expect(btn.getAttribute('data-variant')).toBe('destructive')
  })

  it('sets data-size to the provided size', () => {
    render(<Button size="sm">Small</Button>)
    const btn = screen.getByRole('button')
    expect(btn.getAttribute('data-size')).toBe('sm')
  })

  it('defaults to variant="default" and size="default"', () => {
    render(<Button>Default</Button>)
    const btn = screen.getByRole('button')
    expect(btn.getAttribute('data-variant')).toBe('default')
    expect(btn.getAttribute('data-size')).toBe('default')
  })

  it('forwards a click handler', () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Click</Button>)
    fireEvent.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('is disabled when the disabled prop is set', () => {
    const onClick = vi.fn()
    render(<Button disabled onClick={onClick}>Disabled</Button>)
    const btn = screen.getByRole('button')
    expect((btn as HTMLButtonElement).disabled).toBe(true)
  })

  it('merges additional className', () => {
    render(<Button className="extra-class">Custom</Button>)
    const btn = screen.getByRole('button')
    expect(btn.className).toContain('extra-class')
  })

  it('renders as child element when asChild=true', () => {
    render(
      <Button asChild>
        <a href="/test">Link</a>
      </Button>,
    )
    // Should render an <a> tag, not a <button>
    const link = screen.getByRole('link', { name: 'Link' })
    expect(link).toBeDefined()
    expect(link.tagName.toLowerCase()).toBe('a')
  })

  it('all size variants produce distinct class strings', () => {
    const sizes = ['xs', 'sm', 'default', 'lg', 'icon', 'icon-xs', 'icon-sm', 'icon-lg'] as const
    const classStrings = sizes.map((size) => buttonVariants({ size }))
    const uniqueClasses = new Set(classStrings)
    expect(uniqueClasses.size).toBe(sizes.length)
  })

  it('all variant options produce distinct class strings', () => {
    const variants = ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'] as const
    const classStrings = variants.map((variant) => buttonVariants({ variant }))
    const uniqueClasses = new Set(classStrings)
    expect(uniqueClasses.size).toBe(variants.length)
  })
})

// ---------------------------------------------------------------------------
// Input
// ---------------------------------------------------------------------------

describe('Input', () => {
  it('renders an <input> element', () => {
    render(<Input />)
    expect(screen.getByRole('textbox')).toBeDefined()
  })

  it('sets data-slot="input"', () => {
    render(<Input />)
    expect(screen.getByRole('textbox').getAttribute('data-slot')).toBe('input')
  })

  it('passes the type prop to the underlying input', () => {
    render(<Input type="email" />)
    const input = document.querySelector('input')
    expect(input?.type).toBe('email')
  })

  it('forwards arbitrary props (placeholder)', () => {
    render(<Input placeholder="Enter text" />)
    expect(screen.getByPlaceholderText('Enter text')).toBeDefined()
  })

  it('merges additional className', () => {
    render(<Input className="custom-class" />)
    expect(document.querySelector('input')?.className).toContain('custom-class')
  })

  it('is disabled when disabled prop is set', () => {
    render(<Input disabled />)
    const input = document.querySelector('input') as HTMLInputElement
    expect(input.disabled).toBe(true)
  })

  it('calls onChange handler when value changes', () => {
    const onChange = vi.fn()
    render(<Input onChange={onChange} />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'hello' } })
    expect(onChange).toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// Textarea
// ---------------------------------------------------------------------------

describe('Textarea', () => {
  it('renders a <textarea> element', () => {
    render(<Textarea />)
    expect(screen.getByRole('textbox')).toBeDefined()
  })

  it('sets data-slot="textarea"', () => {
    render(<Textarea />)
    expect(screen.getByRole('textbox').getAttribute('data-slot')).toBe('textarea')
  })

  it('forwards placeholder prop', () => {
    render(<Textarea placeholder="Write something…" />)
    expect(screen.getByPlaceholderText('Write something…')).toBeDefined()
  })

  it('merges additional className', () => {
    render(<Textarea className="my-textarea" />)
    expect(document.querySelector('textarea')?.className).toContain('my-textarea')
  })

  it('is disabled when disabled prop is set', () => {
    render(<Textarea disabled />)
    const ta = document.querySelector('textarea') as HTMLTextAreaElement
    expect(ta.disabled).toBe(true)
  })

  it('calls onChange handler when value changes', () => {
    const onChange = vi.fn()
    render(<Textarea onChange={onChange} />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'test input' } })
    expect(onChange).toHaveBeenCalled()
  })

  it('accepts rows prop', () => {
    render(<Textarea rows={8} />)
    const ta = document.querySelector('textarea') as HTMLTextAreaElement
    expect(ta.rows).toBe(8)
  })
})