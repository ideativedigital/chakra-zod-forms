'use client'
import { VStack } from '@chakra-ui/react'
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema'
import { useEffect } from 'react'
import { DefaultValues, FieldPath, FormProvider, useForm, useFormContext } from 'react-hook-form'
import { ZodType } from 'zod'
import { Button } from '../components/ui/button'
import {
  Dialog,
  DialogActionTrigger,
  DialogBody,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '../components/ui/dialog'
import { ManagedField } from '../managed-field'
import { ManagedFieldset } from '../managed-fieldset'
import { AnyObject } from '../utils/types'
import { ZodFieldProps, ZodFieldsetProps, ZodFormDialogProps, ZodFormProps } from './types'

export function createFormComponents<T extends AnyObject>(
  ztype: ZodType<T>,
  FormSubmitButton: React.ComponentType<React.PropsWithChildren>
) {
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

  return { Field, Fieldset, Form, FormDialog } as const
}
