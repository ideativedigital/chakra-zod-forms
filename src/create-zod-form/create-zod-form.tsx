'use client'
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema'
import { useForm, useFormContext } from 'react-hook-form'
import { ZodType } from 'zod'
import { createAsyncDialog } from '../components/ui/async-dialog'
import { AnyObject } from '../utils/types'
import { createFormComponents } from './form-components'
import { SubmitButton } from './submit-button'
import {
  ZodCreateFormDialogRender,
  ZodFormDialogBaseProps,
  ZodFormDialogOpenProps,
  ZodFormResult
} from './types'

export function createZodForm<T extends AnyObject>(ztype: ZodType<T>): ZodFormResult<T> {
  const FormSubmitButton = SubmitButton
  const { Form, Field, Fieldset, FormDialog } = createFormComponents<T>(ztype, FormSubmitButton)

  function createFormDialog(
    renderOrBaseProps: ZodCreateFormDialogRender<T> | ZodFormDialogBaseProps<T>,
    basePropsOrRender?: ZodFormDialogBaseProps<T> | ZodCreateFormDialogRender<T>
  ) {
    const render =
      typeof renderOrBaseProps === 'function'
        ? renderOrBaseProps
        : (basePropsOrRender as ZodCreateFormDialogRender<T>)
    const baseProps =
      typeof renderOrBaseProps === 'function'
        ? (basePropsOrRender as ZodFormDialogBaseProps<T> | undefined)
        : renderOrBaseProps
    if (typeof render !== 'function') {
      throw new Error('createFormDialog requires a render function')
    }

    const [controller, AsyncFormDialog] = createAsyncDialog<ZodFormDialogOpenProps<T>, T, Record<string, never>>(function AsyncFormDialog(
      props
    ) {
      if (!props.open) return null

      const { onClose, openProps } = props
      const mergedProps = { ...baseProps, ...openProps }
      return (
        <FormDialog
          {...mergedProps}
          open
          closeOnSubmit={false}
          onClose={() => onClose(undefined)}
          onSubmit={async value => {
            await onClose(value)
            return true
          }}
        >
          {render(mergedProps)}
        </FormDialog>
      )
    })

    const openDialog = (opts: ZodFormDialogOpenProps<T>) => controller.openDialog(opts) as Promise<T | undefined>
    return [openDialog, AsyncFormDialog] as const
  }

  return {
    useForm: opts => useForm<T>({ resolver: standardSchemaResolver(ztype), ...opts }),
    useCurrentForm: () => useFormContext<T>(),
    SubmitButton: FormSubmitButton,
    Form,
    Field,
    Fieldset,
    FormDialog,
    createFormDialog
  }
}
