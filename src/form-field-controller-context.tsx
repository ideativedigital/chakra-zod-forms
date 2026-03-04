'use client'
import { JSX, PropsWithChildren, createContext, useCallback, useContext, useMemo } from 'react'
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


type ControllerRenderFnProps<T extends FieldValues, P extends FieldPath<T>> = {
  field: ControllerRenderProps<T, P> & {}
  fieldState: ControllerFieldState
  formState: UseFormStateReturn<T>
  type?: ZodType<T>
}

type FormFieldControllerContext<T extends FieldValues, P extends FieldPath<T>> = {
  control?: Control<T>
  name?: P
  props: ControllerRenderFnProps<T, P>
}

const FormFieldControllerContext = createContext<FormFieldControllerContext<any, any>>({
  props: {} as any
})

type FieldControllerWrapperReturn<T extends FieldValues, P extends FieldPath<T>> = {
  (p: PropsWithChildren): JSX.Element
  WithRenderer: (p: {
    render: (props: ControllerRenderFnProps<T, P>) => JSX.Element
  }) => JSX.Element
}

export const useFieldControllerWrapper = <T extends FieldValues, P extends FieldPath<T>>(
  control: Control<T>,
  name: P,
  type?: ZodType<T>,
  rules?: ControllerProps<T, P>['rules']
): FieldControllerWrapperReturn<T, P> => {
  const mb = useContext(FormFieldControllerContext) as FormFieldControllerContext<T, P>
  const Wrapper = useMemo(() => {
    if (mb.name !== name) {
      return function ControllerContextWrapper({ children }: PropsWithChildren) {
        return (
          <Controller
            control={control}
            name={name}
            rules={rules}
            render={function WithControllerContext(props) {
              const { field, fieldState, formState } = props
              const reworkedField = useMemo(
                () => ({
                  ...field,
                  value: field.value === null ? undefined : field.value
                }),
                [field]
              )

              return (
                <FormFieldControllerContext.Provider
                  value={{
                    control,
                    name,
                    props: {
                      field: reworkedField,
                      fieldState: fieldState,
                      formState: formState,
                      type
                    }
                  }}>
                  {children}
                </FormFieldControllerContext.Provider>
              )
            }}
          />
        )
      }
    } else {
      return function ControllerContext({ children }: PropsWithChildren) {
        return <>{children}</>
      }
    }
  }, [])
  const WithRenderer = useCallback(function WrapperWithRenderer({
    render
  }: {
    render: (props: ControllerRenderFnProps<T, P>) => JSX.Element
  }) {
    const field = useFieldController<T, P>()
    return <Wrapper>{render(field)}</Wrapper>
  }, [])
  return Object.assign(Wrapper, {
    WithRenderer
  })
}

export const useFieldController = <T extends FieldValues, P extends FieldPath<T>>() =>
  useContext(FormFieldControllerContext).props as ControllerRenderFnProps<T, P>
