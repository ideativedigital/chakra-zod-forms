import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import { createZodForm } from '../src/create-zod-form'

vi.mock('@chakra-ui/react', () => ({
  VStack: ({ as, children, ...props }: React.PropsWithChildren<Record<string, any>>) => {
    const Comp = as ?? 'div'
    return <Comp {...props}>{children}</Comp>
  }
}))

vi.mock('../src/components/ui/button', () => ({
  Button: React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean }>(
    ({ loading, children, ...props }, ref) => (
      <button ref={ref} data-loading={loading ? 'true' : 'false'} {...props}>
        {children}
      </button>
    )
  )
}))

vi.mock('../src/components/ui/dialog', () => ({
  Dialog: {
    Simple: ({
      children,
      onClose
    }: React.PropsWithChildren<{ onClose: () => void }>) => (
      <div data-testid="dialog-simple">
        <button type="button" data-testid="dialog-close" onClick={onClose}>
          Close
        </button>
        {children}
      </div>
    )
  },
  DialogActionTrigger: ({ children }: React.PropsWithChildren) => <>{children}</>,
  DialogBody: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  DialogFooter: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  DialogHeader: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  DialogTitle: ({ children }: React.PropsWithChildren) => <h2>{children}</h2>
}))

vi.mock('../src/managed-field', () => ({
  ManagedField: ({ children }: React.PropsWithChildren) => <div data-testid="managed-field">{children}</div>
}))

vi.mock('../src/managed-fieldset', () => ({
  ManagedFieldset: ({ children, autofield }: React.PropsWithChildren<{ autofield?: boolean }>) => (
    <fieldset data-testid="managed-fieldset" data-autofield={String(autofield)}>
      {children}
    </fieldset>
  )
}))

describe('createZodForm extra behavior', () => {
  it('submits valid form values', async () => {
    const schema = z.object({})
    const onSubmit = vi.fn()
    const { Form } = createZodForm(schema)

    render(
      <Form onSubmit={onSubmit}>
        <button type="submit">Submit</button>
      </Form>
    )

    fireEvent.click(screen.getByText('Submit'))
    await waitFor(() => expect(onSubmit).toHaveBeenCalled())
  })

  it('calls onSubmitFailed for invalid form', async () => {
    const schema = z.object({ name: z.string().min(1) })
    const onSubmitFailed = vi.fn()
    const { Form } = createZodForm(schema)

    render(
      <Form onSubmit={vi.fn()} onSubmitFailed={onSubmitFailed}>
        <button type="submit">Submit</button>
      </Form>
    )

    fireEvent.click(screen.getByText('Submit'))
    await waitFor(() => expect(onSubmitFailed).toHaveBeenCalled())
  })

  it('does not close FormDialog when submit returns false', async () => {
    const schema = z.object({})
    const onClose = vi.fn()
    const { FormDialog } = createZodForm(schema)

    render(
      <FormDialog title="Title" open onClose={onClose} onSubmit={async () => false}>
        <div>Body</div>
      </FormDialog>
    )

    fireEvent.click(screen.getByText('Submit'))
    await waitFor(() => expect(onClose).not.toHaveBeenCalled())
  })

  it('closes FormDialog after successful submit', async () => {
    const schema = z.object({})
    const onClose = vi.fn()
    const { FormDialog } = createZodForm(schema)

    render(
      <FormDialog title="Title" open onClose={onClose} onSubmit={async () => true}>
        <div>Body</div>
      </FormDialog>
    )

    fireEvent.click(screen.getByText('Submit'))
    await waitFor(() => expect(onClose).toHaveBeenCalled())
  })

  it('defaults Fieldset autofield to true and supports opt-out', () => {
    const schema = z.object({ nested: z.object({ value: z.string() }) })
    const { Form, Fieldset } = createZodForm(schema)

    const { rerender } = render(
      <Form onSubmit={vi.fn()}>
        <Fieldset name="nested" />
      </Form>
    )

    expect(screen.getByTestId('managed-fieldset')).toHaveAttribute('data-autofield', 'true')

    rerender(
      <Form onSubmit={vi.fn()}>
        <Fieldset name="nested" autofield={false} />
      </Form>
    )

    expect(screen.getByTestId('managed-fieldset')).toHaveAttribute('data-autofield', 'false')
  })

  it('createFormDialog resolves with submitted values', async () => {
    const schema = z.object({
      value: z.string().default('done')
    })
    const { createFormDialog } = createZodForm(schema)
    const [openDialog, AsyncFormDialog] = createFormDialog(() => <div>Body</div>)

    render(<AsyncFormDialog />)

    let submitPromise!: Promise<{ value: string } | undefined>
    await act(async () => {
      submitPromise = openDialog({
        title: 'Async dialog',
        submitText: 'Confirm',
        defaultValue: { value: 'saved' }
      })
    })

    await act(async () => {
      fireEvent.click(await screen.findByText('Confirm'))
    })

    await expect(submitPromise).resolves.toEqual({ value: 'saved' })
  })

  it('createFormDialog resolves undefined when dialog is closed', async () => {
    const schema = z.object({
      value: z.string().default('done')
    })
    const { createFormDialog } = createZodForm(schema)
    const [openDialog, AsyncFormDialog] = createFormDialog(() => <div>Body</div>)

    render(<AsyncFormDialog />)

    let submitPromise!: Promise<{ value: string } | undefined>
    await act(async () => {
      submitPromise = openDialog({
        title: 'Async dialog',
        defaultValue: { value: 'saved' }
      })
    })

    await act(async () => {
      fireEvent.click(await screen.findByTestId('dialog-close'))
    })

    await expect(submitPromise).resolves.toBeUndefined()
  })

  it('createFormDialog merges base props with openDialog props', async () => {
    const schema = z.object({
      value: z.string().default('done')
    })
    const { createFormDialog } = createZodForm(schema)
    const [openDialog, AsyncFormDialog] = createFormDialog(() => <div>Body</div>, {
      submitText: 'Base Submit'
    })

    render(<AsyncFormDialog />)

    let submitPromise!: Promise<{ value: string } | undefined>
    await act(async () => {
      submitPromise = openDialog({
        title: 'Async dialog',
        defaultValue: { value: 'saved' }
      })
    })

    await act(async () => {
      fireEvent.click(await screen.findByText('Base Submit'))
    })

    await expect(submitPromise).resolves.toEqual({ value: 'saved' })
  })

  it('createFormDialog supports baseProps-first overload', async () => {
    const schema = z.object({
      value: z.string().default('done')
    })
    const { createFormDialog } = createZodForm(schema)
    const [openDialog, AsyncFormDialog] = createFormDialog(
      { submitText: 'Create With Overload' },
      () => <div>Body</div>
    )

    render(<AsyncFormDialog />)

    let submitPromise!: Promise<{ value: string } | undefined>
    await act(async () => {
      submitPromise = openDialog({
        title: 'Async dialog',
        defaultValue: { value: 'saved' }
      })
    })

    await act(async () => {
      fireEvent.click(await screen.findByText('Create With Overload'))
    })

    await expect(submitPromise).resolves.toEqual({ value: 'saved' })
  })
})
