import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { AutoField, InputGroupWrapper } from '../src/auto-field/auto-field'

vi.mock('../src/form-field-controller-context', () => ({
  useFieldController: () => ({
    field: { name: 'items.0.name', value: 'x', onChange: vi.fn(), onBlur: vi.fn(), ref: vi.fn() },
    type: {}
  })
}))

vi.mock('../src/auto-field/type-manager', () => ({
  useAutoFieldTypeManager: () => ({
    findRenderer: () => null
  })
}))

vi.mock('../src/utils/zod-type-utils', () => ({
  zodTypeAtPath: () => ({})
}))

vi.mock('../src/auto-field/default-renderers', () => ({
  defaultAutoFieldRenderers: [],
  FallbackFieldRenderer: React.forwardRef<HTMLInputElement, any>((props, ref) => (
    <input data-testid="fallback-renderer" ref={ref} value={props.field.value} readOnly />
  ))
}))

vi.mock('../src/components/ui/input-group', () => ({
  InputGroup: ({ children }: React.PropsWithChildren) => <div data-testid="input-group">{children}</div>
}))

describe('AutoField extra branches', () => {
  it('InputGroupWrapper returns children directly when no adornments', () => {
    render(
      <InputGroupWrapper>
        <input data-testid="plain" />
      </InputGroupWrapper>
    )
    expect(screen.getByTestId('plain')).toBeInTheDocument()
  })

  it('InputGroupWrapper uses input group with adornments', () => {
    render(
      <InputGroupWrapper startElement="$">
        <input data-testid="wrapped" />
      </InputGroupWrapper>
    )
    expect(screen.getByTestId('input-group')).toBeInTheDocument()
    expect(screen.getByTestId('wrapped')).toBeInTheDocument()
  })

  it('renders fallback renderer when manager and defaults do not match', () => {
    render(<AutoField />)
    expect(screen.getByTestId('fallback-renderer')).toBeInTheDocument()
  })

  it('supports asChild rendering', () => {
    render(
      <AutoField asChild>
        <input data-testid="as-child-input" />
      </AutoField>
    )
    expect(screen.getByTestId('as-child-input')).toBeInTheDocument()
  })

  it('returns null when asChild child is not a valid React element', () => {
    const { container } = render(<AutoField asChild>{'not-an-element' as any}</AutoField>)
    expect(container.firstChild).toBeNull()
  })
})
