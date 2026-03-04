import { render, screen } from '@testing-library/react'
import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import { createSubForm, removeArrayIndices, useFinalFormController, useFormPart } from '../src/sub-form'

const managedFieldSpy = vi.fn()

vi.mock('../src/managed-field', () => ({
  ManagedField: (props: any) => {
    managedFieldSpy(props)
    return <div data-testid="managed-field-proxy" />
  }
}))

vi.mock('../src/form-field-controller-context', () => ({
  useFieldController: () => ({ field: { name: 'ctx.name' }, fieldState: {}, formState: {} })
}))

describe('sub-form helpers', () => {
  it('removes array indices from field path', () => {
    expect(removeArrayIndices('items.0.price.12.value')).toBe('items.price.value')
  })

  it('throws when useFormPart is used without provider', () => {
    const Consumer = () => {
      useFormPart()
      return null
    }
    expect(() => render(<Consumer />)).toThrow('useFormPart must be used within a FormPartProvider')
  })

  it('createSubForm Provider and Field compose nested names', () => {
    const sub = createSubForm(z.object({ value: z.string() }))

    render(
      <sub.Provider name={'item' as any} control={{} as any}>
        <sub.Field name={'value' as any} label="Value" />
      </sub.Provider>
    )

    expect(screen.getByTestId('managed-field-proxy')).toBeInTheDocument()
    expect(managedFieldSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'item.value'
      })
    )
  })

  it('useFinalFormController returns merged context inside provider', () => {
    const sub = createSubForm(z.object({ value: z.string() }))

    const Consumer = () => {
      const ctx = useFinalFormController() as any
      return <div data-testid="ctx-name">{ctx.name ?? ''}</div>
    }

    render(
      <sub.Provider name={'part' as any} control={{} as any}>
        <Consumer />
      </sub.Provider>
    )

    expect(screen.getByTestId('ctx-name')).toHaveTextContent('part')
  })
})
