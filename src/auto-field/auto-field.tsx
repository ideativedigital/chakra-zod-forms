'use client'

import { JSX } from 'react'
import { InputGroup, InputGroupProps } from '../components/ui/input-group'

import { ChakraComponent, InputProps } from '@chakra-ui/react'
import { zodTypeAtPath } from '../utils/zod-type-utils'

import React, { forwardRef } from 'react'
import z from 'zod'
import { useFieldController } from '../form-field-controller-context'
import { mergeRefs, useMergeRefs } from '../hooks/use-merge-refs'
import { removeArrayIndices } from '../sub-form'
import { mergeReactProps } from '../utils/merge-react-props'
import {
  defaultAutoFieldRenderers,
  FallbackFieldRenderer
} from './default-renderers'
import { useAutoFieldTypeManager } from './type-manager'

export type InputGroupWrapperProps = {
  startElement?: InputGroupProps['startElement']
  endElement?: InputGroupProps['endElement']
}

export type AutoFieldProps =
  | { asChild: true; children: React.ReactNode }
  | (InputProps & InputGroupWrapperProps)

export const InputGroupWrapper = ({
  startElement,
  endElement,
  children
}: InputGroupWrapperProps & { children: React.ReactElement }) => {
  if (!startElement && !endElement) return <>{children}</>
  return (
    <InputGroup w='full' startElement={startElement} endElement={endElement}>
      {children as React.ReactElement}
    </InputGroup>
  )
}

const _AutoField = forwardRef<HTMLInputElement, AutoFieldProps>(
  ({ asChild, ...rawprops }, thisRef) => {
    const { field, type } = useFieldController()
    const typeManager = useAutoFieldTypeManager()

    if (!field) throw new Error('AutoField requires a FieldContext')
    const ref = useMergeRefs([thisRef, field.ref])

    if (asChild) {
      if (!React.isValidElement(rawprops.children)) {
        return null
      }
      return React.cloneElement(rawprops.children, {
        ...mergeReactProps(field, rawprops.children.props as any),
        ref: mergeRefs([ref, (rawprops.children as any).ref])
      } as any)
    } else {
      const props = rawprops as InputProps & InputGroupWrapperProps

      const normalizedFieldName = removeArrayIndices(field.name)
      const zType = type ? zodTypeAtPath(type, normalizedFieldName) : z.any()

      // Find the appropriate renderer from the type manager
      let Renderer = typeManager.findRenderer(zType)

      // If no renderer found in user's manager, check default renderers
      if (!Renderer) {
        for (const config of defaultAutoFieldRenderers) {
          if (config.match(zType)) {
            Renderer = config.component
            break
          }
        }
      }

      // Use fallback if still no renderer found
      if (!Renderer) {
        Renderer = FallbackFieldRenderer
      }

      return <Renderer field={field} zodType={zType} props={props} ref={ref} />
    }
  }
) as ChakraComponent<'input', AutoFieldProps>

export const AutoField = _AutoField as (props: AutoFieldProps) => JSX.Element
