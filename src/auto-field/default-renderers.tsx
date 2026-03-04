'use client'

import { Input } from '@chakra-ui/react'
import React from 'react'
import { NumberInput } from '../components/ui/number-input'
import { Switch } from '../components/ui/switch'
import { omit } from '../utils/omit'
import { isZodBoolean, isZodDate, isZodNumber, isZodString } from '../utils/zod-type-utils'
import { InputGroupWrapper, InputGroupWrapperProps } from './auto-field'
import {
  AutoFieldTypeConfig,
  createAutoFieldRenderer
} from './type-manager'

/**
 * Default renderer for ZodNumber fields
 */
export const NumberFieldRenderer = createAutoFieldRenderer((props, ref) => {
  const { field, props: inputProps } = props
  const { value, ...rest } = field

  return (
    <NumberInput.Root
      w="100%"
      bg="white"
      {...inputProps}
      name={field.name}
      defaultValue={isNaN(value) ? 0 : value}
      onBlur={field.onBlur}
      onValueChange={(n: { valueAsNumber: number }) => field.onChange(n.valueAsNumber)}
    >
      <NumberInput.Field {...inputProps} {...rest} ref={ref as any} />
    </NumberInput.Root>
  )
})

/**
 * Default renderer for ZodBoolean fields
 */
export const BooleanFieldRenderer = createAutoFieldRenderer((props, ref) => {
  const { field, props: inputProps } = props

  return (
    <Switch
      {...inputProps}
      checked={field.value}
      onCheckedChange={(val: { checked: boolean }) => {
        field.onChange(val.checked)
      }}
      {...omit(field, 'onChange', 'value')}
      ref={ref as any}
      name={field.name}
    />
  )
})

/**
 * Default renderer for ZodDate fields
 */
export const DateFieldRenderer = createAutoFieldRenderer((props, ref) => {
  const { field, props: inputProps } = props
  const { value, ...rest } = field
  const { startElement, endElement, ...restProps } = inputProps as InputGroupWrapperProps & Record<string, any>

  const val =
    value instanceof Date && !isNaN(value.getTime())
      ? value.toISOString().split('T')[0]
      : value

  return (
    <InputGroupWrapper startElement={startElement} endElement={endElement}>
      <Input
        {...rest}
        defaultValue={val}
        {...restProps}
        name={field.name}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
          const val = new Date(e.target.value)
          field.onChange({
            ...e,
            target: {
              ...e.target,
              value: !isNaN(val.getTime()) ? val : e.target.value
            }
          })
        }}
        ref={ref as any}
        type="date"
      />
    </InputGroupWrapper>
  )
})

/**
 * Default renderer for ZodString fields (fallback for text input)
 */
export const StringFieldRenderer = createAutoFieldRenderer((props, ref) => {
  const { field, props: inputProps } = props
  const { startElement, endElement, ...restProps } = inputProps as InputGroupWrapperProps & Record<string, any>

  return (
    <InputGroupWrapper startElement={startElement} endElement={endElement}>
      <Input
        variant="outline"
        {...field}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => field.onChange(e.target.value)}
        ref={ref as any}
        {...restProps}
      />
    </InputGroupWrapper>
  )
})

/**
 * Default renderer configurations for built-in Zod types
 * These are registered with negative priorities so user-defined renderers take precedence
 */
export const defaultAutoFieldRenderers: AutoFieldTypeConfig[] = [
  {
    id: 'zod-number',
    match: isZodNumber,
    component: NumberFieldRenderer,
    priority: -100
  },
  {
    id: 'zod-boolean',
    match: isZodBoolean,
    component: BooleanFieldRenderer,
    priority: -100
  },
  {
    id: 'zod-date',
    match: isZodDate,
    component: DateFieldRenderer,
    priority: -100
  },
  {
    id: 'zod-string',
    match: isZodString,
    component: StringFieldRenderer,
    priority: -200 // Lower priority as it's the most generic
  }
]

/**
 * Fallback renderer for any unmatched type (basic text input)
 */
export const FallbackFieldRenderer = StringFieldRenderer

export const fallbackAutoFieldRenderer: AutoFieldTypeConfig = {
  id: 'fallback',
  match: () => true, // Matches everything
  component: FallbackFieldRenderer,
  priority: -1000 // Lowest priority
}
