'use client'
import { forwardRef } from 'react'
import { useFormContext } from 'react-hook-form'
import { Button, ButtonProps } from '../components/ui/button'

export const SubmitButton = forwardRef<HTMLButtonElement, Omit<ButtonProps, 'loading'>>((p, ref) => {
  const ctx = useFormContext()
  if (!ctx) throw new Error('SubmitButton must be used below Form or FormProvider')

  return <Button {...p} loading={ctx.formState.isSubmitting} type='submit' ref={ref} />
})
