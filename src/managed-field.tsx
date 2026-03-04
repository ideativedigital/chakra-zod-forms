'use client'
import { forwardRef, useEffect, useRef } from 'react'
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
import { Field, FieldProps } from './components/ui/field'

import { AutoField } from './auto-field'
import { useFieldController, useFieldControllerWrapper } from './form-field-controller-context'

type RenderControlled<T extends FieldValues, P extends FieldPath<T>> = (_: {
  field: ControllerRenderProps<T, P>
  fieldState: ControllerFieldState
  formState: UseFormStateReturn<T>
}) => React.ReactElement

export type ManagedFieldProps<T extends FieldValues, P extends FieldPath<T>> = FieldProps & {
  control: Control<T>
  name: P
  rules?: ControllerProps<T, P>['rules']
  type?: ZodType<T>
  render?: RenderControlled<T, P>
  autofield?: boolean
  autofieldAsChild?: boolean
  placeholder?: string
  startElement?: React.ReactNode
  endElement?: React.ReactNode
  allowMultipleControls?: boolean
}

const FieldWithErrors = forwardRef<HTMLDivElement, FieldProps>(
  ({ invalid, errorText, ...props }, ref) => {
    const {
      fieldState: { error }
    } = useFieldController<any, any>()
    return (
      <Field
        ref={ref}
        {...props}
        invalid={invalid || !!error}
        errorText={errorText || (error && error.message)}
      />
    )
  }
)

export const ManagedField = <T extends FieldValues, P extends FieldPath<T>>({
  children,
  control,
  name,
  type,
  rules,
  render,
  autofield,
  autofieldAsChild,
  placeholder,
  startElement,
  endElement,
  allowMultipleControls,
  ...props
}: ManagedFieldProps<T, P>) => {
  const FormController = useFieldControllerWrapper(control, name, type, rules)
  const fieldRootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (allowMultipleControls) return
    const root = fieldRootRef.current
    if (!root) return

    const controls = root.querySelectorAll(
      'input, select, textarea, [role="combobox"], [role="spinbutton"], [role="switch"]'
    )
    if (controls.length > 1) {
      throw new Error(
        `Field "${String(
          name
        )}" renders multiple controls. Use Fieldset for grouped/atomic multi-input values, or set allowMultipleControls to true if intentional.`
      )
    }
  }, [allowMultipleControls, name, children, render, autofield, autofieldAsChild])

  return (
    <FormController>
      <FieldWithErrors ref={fieldRootRef} invalid={!!props.errorText} errorText={props.errorText} {...props}>
        {render ? (
          <Controller control={control} name={name} render={render} />
        ) : autofieldAsChild ? (
          <AutoField
            asChild
            placeholder={props.floatingLabel ? '' : placeholder}
            startElement={startElement}
            endElement={endElement}>
            {children}
          </AutoField>
        ) : autofield ? (
          <AutoField
            placeholder={props.floatingLabel ? '' : placeholder}
            startElement={startElement}
            endElement={endElement}
          />
        ) : (
          children
        )}
      </FieldWithErrors>
    </FormController>
  )
}
