import { render, screen } from '@testing-library/react'
import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { ManagedFieldset } from '../src/managed-fieldset'

vi.mock('../src/auto-field', () => ({
  AutoField: ({ children }: React.PropsWithChildren) => (
    <div data-testid="autofield-proxy">{children ?? 'auto'}</div>
  )
}))

vi.mock('../src/components/ui/fieldset', () => ({
  Fieldset: ({ children, errorText, invalid }: any) => (
    <fieldset data-testid="fieldset-proxy" data-error={String(errorText)} data-invalid={String(invalid)}>
      {children}
    </fieldset>
  )
}))

vi.mock('react-hook-form', async (importOriginal) => {
  const original = await importOriginal<any>()
  return {
    ...original,
    Controller: ({ render }: any) =>
      render({ field: { name: 'f' }, fieldState: {}, formState: {} })
  }
})

vi.mock('../src/form-field-controller-context', () => ({
  useFieldController: () => ({ fieldState: { error: { message: 'required' } } }),
  useFieldControllerWrapper: () =>
    function Wrapper({ children }: React.PropsWithChildren) {
      return <>{children}</>
    }
}))

describe('ManagedFieldset branches', () => {
  it('renders Controller branch when render prop is provided', () => {
    render(
      <ManagedFieldset
        control={{} as any}
        name={'field' as any}
        render={() => <div data-testid="render-branch" />}
      />
    )
    expect(screen.getByTestId('render-branch')).toBeInTheDocument()
  })

  it('renders AutoField when autofieldAsChild is true', () => {
    render(
      <ManagedFieldset control={{} as any} name={'field' as any} autofieldAsChild>
        <input />
      </ManagedFieldset>
    )
    expect(screen.getByTestId('autofield-proxy')).toBeInTheDocument()
  })

  it('renders plain children branch otherwise', () => {
    render(
      <ManagedFieldset control={{} as any} name={'field' as any}>
        <div data-testid="children-branch" />
      </ManagedFieldset>
    )
    expect(screen.getByTestId('children-branch')).toBeInTheDocument()
  })
})
