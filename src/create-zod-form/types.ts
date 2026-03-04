'use client'
import type { StackProps } from '@chakra-ui/react'
import type {
  ForwardRefExoticComponent,
  JSX,
  ReactNode,
  ReactElement,
  RefAttributes
} from 'react'
import type {
  DefaultValues,
  FieldPath,
  FieldValues,
  SubmitErrorHandler,
  SubmitHandler,
  UseFormProps,
  UseFormReset,
  UseFormReturn
} from 'react-hook-form'
import type { ButtonProps } from '../components/ui/button'
import type { SimpleDialogProps } from '../components/ui/dialog'
import type { ManagedFieldProps } from '../managed-field'
import type { ManagedFieldsetProps } from '../managed-fieldset'
import type { AnyObject } from '../utils/types'

export type ZodFieldProps<T extends FieldValues, P extends FieldPath<T>> = Omit<
  ManagedFieldProps<T, P>,
  'control'
>

export type ZodFieldsetProps<T extends FieldValues, P extends FieldPath<T>> = Omit<
  ManagedFieldsetProps<T, P>,
  'control'
>

export type ZodFormDialogProps<T extends AnyObject> = SimpleDialogProps & {
  title: ReactNode
  cancelText?: string
  submitText?: string
  onSubmit: SubmitHandler<T>
  onSubmitFailed?: SubmitErrorHandler<T>
  closeOnSubmit?: boolean
  defaultValue?: DefaultValues<T>
  resetFn?: (reset: UseFormReset<T>, t: DefaultValues<T>) => void
  zodForm?: UseFormReturn<T>
  actions?: ReactNode
}

export type ZodFormProps<T extends AnyObject> = Omit<StackProps, 'onSubmit' | 'defaultValue' | 'value'> & {
  onSubmit: SubmitHandler<T>
  onSubmitFailed?: SubmitErrorHandler<T>
  defaultValue?: DefaultValues<T>
  resetFn?: (reset: UseFormReset<T>, t: DefaultValues<T>) => void
  zodForm?: UseFormReturn<T>
}

export type ZodFormDialogOpenProps<T extends AnyObject> = Omit<
  ZodFormDialogProps<T>,
  'open' | 'onClose' | 'onSubmit' | 'closeOnSubmit' | 'zodForm' | 'children'
>

export type ZodFormDialogBaseProps<T extends AnyObject> = Partial<ZodFormDialogOpenProps<T>>
export type ZodCreateFormDialogRender<T extends AnyObject> = (
  props: ZodFormDialogOpenProps<T>
) => ReactElement | null

export type ZodFormResult<T extends AnyObject> = {
  useForm: (opts?: Omit<UseFormProps<T, any>, 'resolver'>) => UseFormReturn<T>
  useCurrentForm: () => UseFormReturn<T>
  SubmitButton: ForwardRefExoticComponent<Omit<ButtonProps, 'loading'> & RefAttributes<HTMLButtonElement>>
  Form: (props: ZodFormProps<T>) => JSX.Element
  Field: <P extends FieldPath<T>>(props: ZodFieldProps<T, P>) => JSX.Element
  Fieldset: <P extends FieldPath<T>>(props: ZodFieldsetProps<T, P>) => JSX.Element
  FormDialog: (props: ZodFormDialogProps<T>) => JSX.Element
  createFormDialog: {
    (render: ZodCreateFormDialogRender<T>, baseProps?: ZodFormDialogBaseProps<T>): readonly [
      (opts: ZodFormDialogOpenProps<T>) => Promise<T | undefined>,
      (props: Record<string, never>) => JSX.Element | null
    ]
    (baseProps: ZodFormDialogBaseProps<T>, render: ZodCreateFormDialogRender<T>): readonly [
      (opts: ZodFormDialogOpenProps<T>) => Promise<T | undefined>,
      (props: Record<string, never>) => JSX.Element | null
    ]
  }
}
