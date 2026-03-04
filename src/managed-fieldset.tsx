'use client'
import { forwardRef } from 'react'
import {
  Control,
  Controller,
  ControllerFieldState,
  ControllerProps,
  ControllerRenderProps,
  FieldPath,
  FieldValues,
  UseFormStateReturn
} from 'react-hook-form'
import { ZodType } from 'zod'
import { AutoField } from './auto-field'
import { Fieldset, FieldsetProps } from './components/ui/fieldset'
import { useFieldController, useFieldControllerWrapper } from './form-field-controller-context'

type RenderControlled<T extends FieldValues, P extends FieldPath<T>> = (_: {
  field: ControllerRenderProps<T, P>
  fieldState: ControllerFieldState
  formState: UseFormStateReturn<T>
}) => React.ReactElement

export type ManagedFieldsetProps<T extends FieldValues, P extends FieldPath<T>> = FieldsetProps & {
  control: Control<T>
  name: P
  rules?: ControllerProps<T, P>['rules']
  type?: ZodType<T>
  render?: RenderControlled<T, P>
  autofield?: boolean
  autofieldAsChild?: boolean
}

const FieldsetWithErrors = forwardRef<HTMLFieldSetElement, FieldsetProps>(
  ({ invalid, errorText, ...props }, ref) => {
    const {
      fieldState: { error }
    } = useFieldController<any, any>()
    return (
      <Fieldset
        ref={ref}
        {...props}
        invalid={invalid || !!error}
        errorText={errorText || (error && error.message)}
      />
    )
  }
)

export const ManagedFieldset = <T extends FieldValues, P extends FieldPath<T>>({
  children,
  control,
  name,
  type,
  rules,
  render,
  autofield,
  autofieldAsChild,
  ...props
}: ManagedFieldsetProps<T, P>) => {
  const FormController = useFieldControllerWrapper(control, name, type, rules)

  return (
    <FormController>
      <FieldsetWithErrors invalid={!!props.errorText} errorText={props.errorText} {...props}>
        {render ? (
          <Controller control={control} name={name} render={render} />
        ) : autofieldAsChild ? (
          <AutoField asChild>{children}</AutoField>
        ) : autofield ? (
          <AutoField />
        ) : (
          children
        )}
      </FieldsetWithErrors>
    </FormController>
  )
}
