import { fireEvent, render, screen } from '@testing-library/react'
import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import {
  BooleanFieldRenderer,
  DateFieldRenderer,
  NumberFieldRenderer,
  StringFieldRenderer
} from '../src/auto-field/default-renderers'

vi.mock('@chakra-ui/react', () => ({
  Input: React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
    (props, ref) => <input ref={ref} {...props} />
  )
}))

vi.mock('../src/components/ui/number-input', () => ({
  NumberInput: {
    Root: ({ children, onValueChange, ...props }: React.PropsWithChildren<Record<string, any>>) => (
      <div
        data-testid="number-root"
        onClick={() => onValueChange?.({ valueAsNumber: 42 })}
        {...props}
      >
        {children}
      </div>
    ),
    Field: React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
      (props, ref) => <input data-testid="number-field" ref={ref} type="number" {...props} />
    )
  }
}))

vi.mock('../src/components/ui/switch', () => ({
  Switch: React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement> & { onCheckedChange?: any }>(
    ({ onCheckedChange, ...props }, ref) => (
      <input
        data-testid="boolean-field"
        ref={ref}
        type="checkbox"
        onChange={(e) => onCheckedChange?.({ checked: e.target.checked })}
        {...props}
      />
    )
  )
}))

vi.mock('../src/auto-field/auto-field', () => ({
  InputGroupWrapper: ({ children }: React.PropsWithChildren) => <div data-testid="group">{children}</div>
}))

describe('default renderers runtime behavior', () => {
  it('renders number field and sends numeric value changes', () => {
    const onChange = vi.fn()
    const onBlur = vi.fn()
    const field = { name: 'count', value: 1, onChange, onBlur, ref: vi.fn() } as any

    render(<NumberFieldRenderer field={field} zodType={{} as any} props={{}} />)
    fireEvent.click(screen.getByTestId('number-root'))
    expect(onChange).toHaveBeenCalledWith(42)
  })

  it('renders boolean switch and maps checked state', () => {
    const onChange = vi.fn()
    const field = { name: 'active', value: false, onChange, onBlur: vi.fn(), ref: vi.fn() } as any

    render(<BooleanFieldRenderer field={field} zodType={{} as any} props={{}} />)
    fireEvent.click(screen.getByTestId('boolean-field'))
    expect(onChange).toHaveBeenCalled()
  })

  it('renders date input and normalizes date values', () => {
    const onChange = vi.fn()
    const field = {
      name: 'birthDate',
      value: new Date('2020-01-01'),
      onChange,
      onBlur: vi.fn(),
      ref: vi.fn()
    } as any

    render(<DateFieldRenderer field={field} zodType={{} as any} props={{}} />)
    const input = screen.getByDisplayValue('2020-01-01') as HTMLInputElement
    fireEvent.change(input, { target: { value: '2021-03-04' } })
    expect(onChange).toHaveBeenCalled()
  })

  it('keeps non-date values in date renderer fallback branch', () => {
    const onChange = vi.fn()
    const field = {
      name: 'birthDate',
      value: 'not-a-date',
      onChange,
      onBlur: vi.fn(),
      ref: vi.fn()
    } as any

    const { container } = render(<DateFieldRenderer field={field} zodType={{} as any} props={{}} />)
    const input = container.querySelector('input[name="birthDate"]') as HTMLInputElement
    expect(input).toBeInTheDocument()
    expect(input.getAttribute('value')).toBe('not-a-date')
  })

  it('renders string input and maps event value', () => {
    const onChange = vi.fn()
    const field = { name: 'title', value: 'hello', onChange, onBlur: vi.fn(), ref: vi.fn() } as any

    render(<StringFieldRenderer field={field} zodType={{} as any} props={{ placeholder: 'Name' }} />)
    const input = screen.getByPlaceholderText('Name')
    fireEvent.change(input, { target: { value: 'updated' } })
    expect(onChange).toHaveBeenCalledWith('updated')
  })
})
