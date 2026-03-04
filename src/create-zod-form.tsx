'use client'
import { StackProps, VStack } from '@chakra-ui/react'
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema'
import { ForwardRefExoticComponent, forwardRef, JSX, ReactNode, RefAttributes, useEffect } from 'react'
import {
  DefaultValues,
  FieldPath,
  FieldValues,
  FormProvider,
  SubmitErrorHandler,
  SubmitHandler,
  useForm,
  useFormContext,
  UseFormProps,
  UseFormReset,
  UseFormReturn
} from 'react-hook-form'
import { ZodType } from 'zod'
import { Button, ButtonProps } from './components/ui/button'
import {
  Dialog,
  DialogActionTrigger,
  DialogBody,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  SimpleDialogProps
} from './components/ui/dialog'
import { ManagedField, ManagedFieldProps } from './managed-field'
import { ManagedFieldset, ManagedFieldsetProps } from './managed-fieldset'
import { AnyObject } from './utils/types'

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
export type ZodFormResult<T extends AnyObject> = {
  useForm: (opts?: Omit<UseFormProps<T, any>, 'resolver'>) => UseFormReturn<T>
  useCurrentForm: () => UseFormReturn<T>
  SubmitButton: ForwardRefExoticComponent<Omit<ButtonProps, 'loading'> & RefAttributes<HTMLButtonElement>>
  Form: (props: ZodFormProps<T>) => JSX.Element
  Field: <P extends FieldPath<T>>(props: ZodFieldProps<T, P>) => JSX.Element
  Fieldset: <P extends FieldPath<T>>(props: ZodFieldsetProps<T, P>) => JSX.Element
  FormDialog: (props: ZodFormDialogProps<T>) => JSX.Element
}

export const SubmitButton = forwardRef<HTMLButtonElement, Omit<ButtonProps, 'loading'>>(
  (p, ref) => {
    const ctx = useFormContext()
    if (!ctx) throw new Error('SubmitButton must be used below Form or FormProvider')

    return <Button {...p} loading={ctx.formState.isSubmitting} type='submit' ref={ref} />
  }
)

export function createZodForm<T extends AnyObject>(ztype: ZodType<T>): ZodFormResult<T> {
  const FormSubmitButton = SubmitButton

  function Field<P extends FieldPath<T>>({ children, ...p }: ZodFieldProps<T, P>) {
    const ctx = useFormContext<T>()
    if (!ctx) throw new Error('FormContral must be used below Form or FormProvider')

    const shouldAutofield = p.render ? p.autofield : (p.autofieldAsChild ? false : (p.autofield ?? true))
    return (
      <ManagedField {...p} autofield={shouldAutofield} control={ctx.control} type={ztype}>
        {children}
      </ManagedField>
    )
  }

  function Fieldset<P extends FieldPath<T>>({ children, ...p }: ZodFieldsetProps<T, P>) {
    const ctx = useFormContext<T>()
    if (!ctx) throw new Error('FormContral must be used below Form or FormProvider')
    const shouldAutofield = p.render ? p.autofield : (p.autofieldAsChild ? false : (p.autofield ?? true))
    return (
      <ManagedFieldset {...p} autofield={shouldAutofield} control={ctx.control} type={ztype}>
        {children}
      </ManagedFieldset>
    )
  }
  function Form({
    onSubmit,
    onSubmitFailed,
    zodForm,
    children,
    resetFn,
    defaultValue,
    ...props
  }: ZodFormProps<T>) {
    const form = zodForm ?? useForm<T>({ resolver: standardSchemaResolver(ztype) })
    useEffect(() => {
      if (defaultValue) {
        if (resetFn) {
          resetFn(form.reset, defaultValue ?? ({} as DefaultValues<T>))
        } else {
          form.reset(defaultValue ?? ({} as Partial<T>))
        }
      }
    }, [resetFn, defaultValue, form.reset])
    return (
      <FormProvider {...form}>
        <VStack
          as='form'
          align='stretch'
          w='full'
          {...props}
          onSubmit={e => {
            e?.stopPropagation()
            e?.preventDefault()
            console.log('submitting form')
            return form.handleSubmit(
              async (v, e) => {
                try {
                  return await onSubmit(v, e)
                } catch (e) {
                  console.error('Error on submit form: ', e)
                }
              },
              (err, e) => {
                onSubmitFailed?.(err, e)
                console.error('Form errors: ', err)
                console.error('object: ', form.watch())
              }
            )(e)
          }}>
          {children}
        </VStack>
      </FormProvider>
    )
  }

  function FormDialog({
    children,
    cancelText = 'Cancel',
    submitText = 'Submit',
    onSubmit,
    onSubmitFailed,
    closeOnSubmit = true,
    defaultValue,
    title,
    actions,
    zodForm,
    resetFn,
    ...props
  }: ZodFormDialogProps<T>) {
    const register = zodForm ?? useForm<T>({ resolver: standardSchemaResolver(ztype) })
    useEffect(() => {
      if (props.open) {
        if (resetFn) {
          resetFn(register.reset, defaultValue ?? ({} as DefaultValues<T>))
        } else if (defaultValue) {
          register.reset(defaultValue)
        }
      }
    }, [props.open, defaultValue, resetFn, register.reset])
    return (
      <Dialog.Simple {...props}>
        <Form
          onSubmit={async e => {
            const res = await onSubmit(e)
            if (typeof res === 'boolean' && !res) return
            closeOnSubmit && props.onClose()
          }}
          onSubmitFailed={onSubmitFailed}
          zodForm={register}
          defaultValue={defaultValue}
          resetFn={resetFn}
          align='stretch'
          flex='1'>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <VStack align='stretch'>{children}</VStack>
          </DialogBody>
          <DialogFooter>
            {actions ?? (
              <>
                <DialogActionTrigger asChild>
                  <Button variant='ghost' mr='3'>
                    {cancelText}
                  </Button>
                </DialogActionTrigger>
                <FormSubmitButton>{submitText}</FormSubmitButton>
              </>
            )}
          </DialogFooter>
        </Form>
      </Dialog.Simple>
    )
  }

  return {
    useForm: opts => useForm<T>({ resolver: standardSchemaResolver(ztype), ...opts }),
    useCurrentForm: () => useFormContext<T>(),
    SubmitButton: FormSubmitButton,
    Form,
    Field,
    Fieldset,
    FormDialog
  }
}
