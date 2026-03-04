import { createContext, ReactElement, useContext } from 'react'
import { Control, FieldPath, FieldPathByValue, FieldValues } from 'react-hook-form'
import { z, ZodType } from 'zod'
import { useFieldController } from './form-field-controller-context'
import { ManagedField, ManagedFieldProps } from './managed-field'

export type FieldPathByNullishValue<TFieldValues extends FieldValues, TValue> = FieldPathByValue<
  TFieldValues,
  TValue | null | undefined
>

export type FormPartProviderProps<
  SubElement extends FieldValues,
  ParentElement extends FieldValues,
  P extends FieldPathByNullishValue<ParentElement, SubElement>
> = {
  type: ZodType<SubElement>
  name: P
  control: Control<ParentElement>
}

export const removeArrayIndices = (name: string) => {
  return name.replace(/\.\d+/g, '')
}

export type FormPartContext<
  SubElement extends FieldValues,
  ParentElement extends FieldValues,
  P extends FieldPathByNullishValue<ParentElement, SubElement>
> = FormPartProviderProps<SubElement, ParentElement, P> & {
  parentType: ZodType<{ [K in P]: SubElement }>
}

const FormPartContext = createContext<FormPartContext<any, any, any> | null>(null)

export const FormPartProvider = <
  SubElement extends FieldValues,
  ParentElement extends FieldValues,
  P extends FieldPathByNullishValue<ParentElement, SubElement>
>({
  type,
  name,
  control,
  children
}: FormPartProviderProps<SubElement, ParentElement, P> & {
  children: ReactElement | ReactElement[]
}) => {
  return (
    <FormPartContext.Provider
      value={{
        type,
        name,
        control,
        parentType: z.object({ [removeArrayIndices(name)]: type }) as unknown as ZodType<{
          [K in P]: SubElement
        }>
      }}>
      {children}
    </FormPartContext.Provider>
  )
}

export const useFormPart = () => {
  const ctx = useContext(FormPartContext)
  if (!ctx) {
    throw new Error('useFormPart must be used within a FormPartProvider')
  }
  return ctx
}

const useFormPartSafe = () => {
  const ctx = useContext(FormPartContext)
  return ctx
}

export type ManagedFormPartManagedFieldProps<T extends FieldValues, P extends FieldPath<T>> = Omit<
  ManagedFieldProps<T, P>,
  'control'
>
export const FormPartManagedField = <T extends FieldValues, P extends FieldPath<T>>({
  name,
  ...props
}: ManagedFormPartManagedFieldProps<T, P>) => {
  const ctx = useFormPart()

  return (
    <ManagedField<T, P>
      {...props}
      control={ctx.control}
      name={`${ctx.name}.${name}` as any}
      type={ctx.parentType}
    />
  )
}

export const createSubForm = <SubElement extends FieldValues>(type: ZodType<SubElement>) => {
  const Provider = <
    ParentElement extends FieldValues,
    P extends FieldPathByNullishValue<ParentElement, SubElement>
  >(
    props: Omit<FormPartProviderProps<SubElement, ParentElement, P>, 'type'> & {
      children: ReactElement | ReactElement[]
    }
  ) => {
    return <FormPartProvider {...props} type={type} />
  }
  const Field = <P extends FieldPath<SubElement>>(
    props: ManagedFormPartManagedFieldProps<SubElement, P>
  ) => <FormPartManagedField {...props} />

  return { Provider, Field }
}

export const useFinalFormController = () => {
  const ctx = useFieldController()

  const subCtx = useFormPartSafe()

  if (!subCtx) {
    return ctx
  }
  return {
    ...subCtx,
    ...ctx
  }
}
