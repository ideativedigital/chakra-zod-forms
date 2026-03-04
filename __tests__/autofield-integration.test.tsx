import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React, { forwardRef } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import { AutoField } from '../src/auto-field/auto-field'
import { matchesObjectShape } from '../src/auto-field/matchers'
import {
  AutoFieldTypeManagerProvider,
  createAutoFieldRenderer,
  createAutoFieldTypeManager
} from '../src/auto-field/type-manager'
import { createZodForm } from '../src/create-zod-form'
import { useFieldControllerWrapper } from '../src/form-field-controller-context'
import { isZodNumber, isZodString } from '../src/utils/zod-type-utils'

// Mock Chakra UI components to avoid provider setup complexity
vi.mock('@chakra-ui/react', () => {
  const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
    (props, ref) => <input ref={ref} {...props} />
  )
  const Box = ({ children, ...props }: React.PropsWithChildren<Record<string, any>>) => (
    <div {...props}>{children}</div>
  )
  const VStack = ({ children, ...props }: React.PropsWithChildren<Record<string, any>>) => (
    <div {...props}>{children}</div>
  )
  const Button = forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
    (props, ref) => <button ref={ref} {...props} />
  )

  // Mock Field component from Chakra
  const FieldRoot = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ children, ...props }, ref) => <div ref={ref} {...props}>{children}</div>
  )
  const FieldLabel = ({ children, ...props }: React.PropsWithChildren<Record<string, any>>) => (
    <label {...props}>{children}</label>
  )
  const FieldHelperText = ({ children }: React.PropsWithChildren) => <span>{children}</span>
  const FieldErrorText = ({ children }: React.PropsWithChildren) => <span>{children}</span>
  const FieldRequiredIndicator = () => <span>*</span>
  const FieldsetRoot = forwardRef<HTMLFieldSetElement, React.HTMLAttributes<HTMLFieldSetElement>>(
    ({ children, ...props }, ref) => <fieldset ref={ref} {...props}>{children}</fieldset>
  )
  const FieldsetLegend = ({ children, ...props }: React.PropsWithChildren<Record<string, any>>) => (
    <legend {...props}>{children}</legend>
  )
  const FieldsetContent = ({ children, ...props }: React.PropsWithChildren<Record<string, any>>) => (
    <div {...props}>{children}</div>
  )
  const FieldsetHelperText = ({ children }: React.PropsWithChildren) => <span>{children}</span>
  const FieldsetErrorText = ({ children }: React.PropsWithChildren) => <span>{children}</span>

  const Field = Object.assign(FieldRoot, {
    Root: FieldRoot,
    Label: FieldLabel,
    HelperText: FieldHelperText,
    ErrorText: FieldErrorText,
    RequiredIndicator: FieldRequiredIndicator
  })
  const Fieldset = Object.assign(FieldsetRoot, {
    Root: FieldsetRoot,
    Legend: FieldsetLegend,
    Content: FieldsetContent,
    HelperText: FieldsetHelperText,
    ErrorText: FieldsetErrorText
  })

  return {
    Input,
    Box,
    VStack,
    Button,
    Field,
    Fieldset,
    defineStyle: (styles: any) => styles,
    SystemStyleObject: {}
  }
})

vi.mock('../src/components/ui/input-group', () => ({
  InputGroup: ({ children }: React.PropsWithChildren) => <div data-testid="input-group">{children}</div>,
  InputGroupProps: {}
}))

vi.mock('../src/components/ui/number-input', () => ({
  NumberInput: {
    Root: ({ children, onValueChange, ...props }: React.PropsWithChildren<Record<string, any>>) => (
      <div data-testid="number-input" {...props}>{children}</div>
    ),
    Field: forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
      (props, ref) => <input ref={ref} type="number" {...props} />
    )
  }
}))

vi.mock('../src/components/ui/switch', () => ({
  Switch: forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
    (props, ref) => <input ref={ref} type="checkbox" {...props} />
  )
}))

vi.mock('../src/components/ui/button', () => ({
  Button: forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
    (props, ref) => <button ref={ref} {...props} />
  ),
  ButtonProps: {}
}))

vi.mock('../src/components/ui/dialog', () => ({
  Dialog: { Simple: ({ children }: React.PropsWithChildren) => <div>{children}</div> },
  DialogActionTrigger: ({ children }: React.PropsWithChildren) => <>{children}</>,
  DialogBody: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  DialogFooter: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  DialogHeader: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  DialogTitle: ({ children }: React.PropsWithChildren) => <h2>{children}</h2>,
  SimpleDialogProps: {}
}))

vi.mock('../src/utils/data-attr', () => ({
  dataAttr: (val: any) => val ? 'true' : undefined
}))

vi.mock('@coteries/utils/objects', () => ({
  AnyObject: {}
}))

// Mock default renderers to avoid complex Chakra dependencies
vi.mock('../src/auto-field/default-renderers', async (importOriginal) => {
  const React = await import('react')
  const { forwardRef } = React
  const original = await importOriginal() as any

  // Helper to check Zod type
  const hasZodTrait = (obj: any, traitName: string): boolean => {
    if (typeof obj !== 'object' || obj === null) return false
    if (obj._zod?.traits instanceof Set) return obj._zod.traits.has(traitName)
    return obj._def?.typeName === traitName
  }

  const isZodNumber = (z: any) => hasZodTrait(z, 'ZodNumber')
  const isZodBoolean = (z: any) => hasZodTrait(z, 'ZodBoolean')
  const isZodDate = (z: any) => hasZodTrait(z, 'ZodDate')
  const isZodString = (z: any) => hasZodTrait(z, 'ZodString')

  const MockStringRenderer = forwardRef<HTMLInputElement, any>((props, ref) => {
    const { field, props: inputProps } = props
    return React.createElement('input', {
      ref,
      'data-testid': `string-field-${field.name}`,
      value: field.value || '',
      onChange: (e: any) => field.onChange(e.target.value),
      ...inputProps
    })
  })

  const MockNumberRenderer = forwardRef<HTMLInputElement, any>((props, ref) => {
    const { field, props: inputProps } = props
    return React.createElement('input', {
      ref,
      type: 'number',
      'data-testid': `number-field-${field.name}`,
      value: field.value || 0,
      onChange: (e: any) => field.onChange(parseFloat(e.target.value)),
      ...inputProps
    })
  })

  const MockBooleanRenderer = forwardRef<HTMLInputElement, any>((props, ref) => {
    const { field, props: inputProps } = props
    return React.createElement('input', {
      ref,
      type: 'checkbox',
      'data-testid': `boolean-field-${field.name}`,
      checked: field.value || false,
      onChange: (e: any) => field.onChange(e.target.checked),
      ...inputProps
    })
  })

  const MockDateRenderer = forwardRef<HTMLInputElement, any>((props, ref) => {
    const { field, props: inputProps } = props
    return React.createElement('input', {
      ref,
      type: 'date',
      'data-testid': `date-field-${field.name}`,
      value: field.value || '',
      onChange: (e: any) => field.onChange(new Date(e.target.value)),
      ...inputProps
    })
  })

  return {
    ...original,
    NumberFieldRenderer: MockNumberRenderer,
    BooleanFieldRenderer: MockBooleanRenderer,
    DateFieldRenderer: MockDateRenderer,
    StringFieldRenderer: MockStringRenderer,
    FallbackFieldRenderer: MockStringRenderer,
    defaultAutoFieldRenderers: [
      { id: 'zod-number', match: isZodNumber, component: MockNumberRenderer, priority: -100 },
      { id: 'zod-boolean', match: isZodBoolean, component: MockBooleanRenderer, priority: -100 },
      { id: 'zod-date', match: isZodDate, component: MockDateRenderer, priority: -100 },
      { id: 'zod-string', match: isZodString, component: MockStringRenderer, priority: -200 }
    ],
    fallbackAutoFieldRenderer: {
      id: 'fallback',
      match: () => true,
      component: MockStringRenderer,
      priority: -1000
    }
  }
})

// ============================================================================
// Test Schemas
// ============================================================================

const amountSchema = z.object({
  currency: z.string(),
  value: z.number()
})

const formWithAmountSchema = z.object({
  name: z.string(),
  price: amountSchema
})

const formWithMultipleAmountsSchema = z.object({
  name: z.string(),
  price: amountSchema,
  discount: amountSchema.optional(),
  tax: z.object({
    rate: z.number(),
    amount: amountSchema
  })
})

// ============================================================================
// Custom Amount Renderer
// ============================================================================

const AmountFieldRenderer = createAutoFieldRenderer((props, ref) => {
  const { field, props: inputProps } = props

  return (
    <div data-testid="amount-field-renderer" data-field-name={field.name}>
      <label>
        Currency:
        <input
          data-testid={`${field.name}-currency`}
          value={field.value?.currency || ''}
          onChange={(e) => field.onChange({ ...field.value, currency: e.target.value })}
        />
      </label>
      <label>
        Value:
        <input
          data-testid={`${field.name}-value`}
          type="number"
          value={field.value?.value || 0}
          onChange={(e) => field.onChange({ ...field.value, value: parseFloat(e.target.value) })}
          ref={ref as React.Ref<HTMLInputElement>}
        />
      </label>
    </div>
  )
})

// Create matcher for amount objects
const isAmountObject = matchesObjectShape({
  currency: isZodString,
  value: isZodNumber
})

// Fallback renderer for primitive types (string, number, boolean, etc.)
const FallbackPrimitiveRenderer = createAutoFieldRenderer((props, ref) => {
  const { field } = props
  const isCheckbox = typeof field.value === 'boolean'

  if (isCheckbox) {
    return (
      <input
        ref={ref as React.Ref<HTMLInputElement>}
        type="checkbox"
        data-testid={`fallback-field-${field.name}`}
        checked={field.value || false}
        onChange={(e) => field.onChange(e.target.checked)}
      />
    )
  }

  return (
    <input
      ref={ref as React.Ref<HTMLInputElement>}
      data-testid={`fallback-field-${field.name}`}
      value={field.value ?? ''}
      onChange={(e) => field.onChange(e.target.value)}
    />
  )
})

// Helper to create a manager with fallback renderer
const createManagerWithFallback = (customRenderers: Parameters<typeof createAutoFieldTypeManager>[0] = []) => {
  return createAutoFieldTypeManager([
    ...customRenderers,
    {
      id: 'fallback',
      match: () => true,
      component: FallbackPrimitiveRenderer,
      priority: -1000
    }
  ])
}

// ============================================================================
// Test Wrapper Components
// ============================================================================

type TestFieldWrapperProps = {
  schema: z.ZodTypeAny
  name: string
  defaultValues?: Record<string, any>
  children: React.ReactNode
}

function TestFieldWrapper({
  schema,
  name,
  defaultValues,
  children
}: TestFieldWrapperProps) {
  const form = useForm({
    defaultValues: defaultValues
  })

  const FieldController = useFieldControllerWrapper(form.control, name as any, schema as any)

  return (
    <FormProvider {...form}>
      <form>
        <FieldController>{children}</FieldController>
      </form>
    </FormProvider>
  )
}

// ============================================================================
// Integration Tests
// ============================================================================

describe('AutoField Integration Tests', () => {
  describe('Custom Amount Renderer', () => {
    it('should render custom amount renderer when registered', async () => {
      const manager = createManagerWithFallback([
        {
          id: 'amount',
          match: isAmountObject,
          component: AmountFieldRenderer,
          priority: 10
        }
      ])

      render(
        <AutoFieldTypeManagerProvider manager={manager}>
          <TestFieldWrapper
            schema={formWithAmountSchema}
            name="price"
            defaultValues={{ name: 'Test', price: { currency: 'USD', value: 100 } }}
          >
            <AutoField />
          </TestFieldWrapper>
        </AutoFieldTypeManagerProvider>
      )

      // Verify custom renderer is used
      expect(screen.getByTestId('amount-field-renderer')).toBeInTheDocument()
      expect(screen.getByTestId('price-currency')).toBeInTheDocument()
      expect(screen.getByTestId('price-value')).toBeInTheDocument()
    })

    it('should render with correct initial values', async () => {
      const manager = createManagerWithFallback([
        {
          id: 'amount',
          match: isAmountObject,
          component: AmountFieldRenderer,
          priority: 10
        }
      ])

      render(
        <AutoFieldTypeManagerProvider manager={manager}>
          <TestFieldWrapper
            schema={formWithAmountSchema}
            name="price"
            defaultValues={{ name: 'Test', price: { currency: 'EUR', value: 250 } }}
          >
            <AutoField />
          </TestFieldWrapper>
        </AutoFieldTypeManagerProvider>
      )

      const currencyInput = screen.getByTestId('price-currency') as HTMLInputElement
      const valueInput = screen.getByTestId('price-value') as HTMLInputElement

      expect(currencyInput.value).toBe('EUR')
      expect(valueInput.value).toBe('250')
    })

    it('should update form values when user types', async () => {
      const user = userEvent.setup()
      const manager = createManagerWithFallback([
        {
          id: 'amount',
          match: isAmountObject,
          component: AmountFieldRenderer,
          priority: 10
        }
      ])

      render(
        <AutoFieldTypeManagerProvider manager={manager}>
          <TestFieldWrapper
            schema={formWithAmountSchema}
            name="price"
            defaultValues={{ name: 'Test', price: { currency: 'USD', value: 100 } }}
          >
            <AutoField />
          </TestFieldWrapper>
        </AutoFieldTypeManagerProvider>
      )

      const currencyInput = screen.getByTestId('price-currency') as HTMLInputElement

      await user.clear(currencyInput)
      await user.type(currencyInput, 'GBP')

      expect(currencyInput.value).toBe('GBP')
    })
  })

  describe('Multiple Amount Fields', () => {
    it('should render different amount fields with custom renderer', async () => {
      const manager = createManagerWithFallback([
        {
          id: 'amount',
          match: isAmountObject,
          component: AmountFieldRenderer,
          priority: 10
        }
      ])

      // Test component that renders multiple fields
      function MultiAmountForm() {
        const form = useForm<z.infer<typeof formWithMultipleAmountsSchema>>({
          defaultValues: {
            name: 'Product',
            price: { currency: 'USD', value: 100 },
            discount: { currency: 'USD', value: 10 }
          }
        })

        const PriceController = useFieldControllerWrapper(
          form.control,
          'price',
          formWithMultipleAmountsSchema as any
        )
        const DiscountController = useFieldControllerWrapper(
          form.control,
          'discount',
          formWithMultipleAmountsSchema as any
        )

        return (
          <FormProvider {...form}>
            <form>
              <PriceController>
                <div data-testid="price-wrapper">
                  <AutoField />
                </div>
              </PriceController>
              <DiscountController>
                <div data-testid="discount-wrapper">
                  <AutoField />
                </div>
              </DiscountController>
            </form>
          </FormProvider>
        )
      }

      render(
        <AutoFieldTypeManagerProvider manager={manager}>
          <MultiAmountForm />
        </AutoFieldTypeManagerProvider>
      )

      // Both amount fields should use the custom renderer
      const amountRenderers = screen.getAllByTestId('amount-field-renderer')
      expect(amountRenderers).toHaveLength(2)

      // Verify each field has correct test ids
      expect(screen.getByTestId('price-currency')).toBeInTheDocument()
      expect(screen.getByTestId('price-value')).toBeInTheDocument()
      expect(screen.getByTestId('discount-currency')).toBeInTheDocument()
      expect(screen.getByTestId('discount-value')).toBeInTheDocument()
    })
  })

  describe('Renderer Priority', () => {
    it('should use higher priority renderer over lower priority', async () => {
      // Create a lower priority "generic object" renderer
      const GenericObjectRenderer = createAutoFieldRenderer((props) => (
        <div data-testid="generic-object-renderer">Generic</div>
      ))

      const manager = createManagerWithFallback([
        {
          id: 'generic-object',
          match: (zodType) => {
            // Match any object
            return (zodType as any)._zod?.traits?.has('ZodObject') ||
              (zodType as any)._def?.typeName === 'ZodObject'
          },
          component: GenericObjectRenderer,
          priority: 0 // Lower priority
        },
        {
          id: 'amount',
          match: isAmountObject,
          component: AmountFieldRenderer,
          priority: 10 // Higher priority
        }
      ])

      render(
        <AutoFieldTypeManagerProvider manager={manager}>
          <TestFieldWrapper
            schema={formWithAmountSchema}
            name="price"
            defaultValues={{ name: 'Test', price: { currency: 'USD', value: 100 } }}
          >
            <AutoField />
          </TestFieldWrapper>
        </AutoFieldTypeManagerProvider>
      )

      // Should use amount renderer (higher priority), not generic
      expect(screen.getByTestId('amount-field-renderer')).toBeInTheDocument()
      expect(screen.queryByTestId('generic-object-renderer')).not.toBeInTheDocument()
    })

    it('should fall back to lower priority when high priority does not match', async () => {
      const GenericObjectRenderer = createAutoFieldRenderer((props) => (
        <div data-testid="generic-object-renderer">Generic Object</div>
      ))

      // Amount renderer only matches { currency, value } shape
      const manager = createManagerWithFallback([
        {
          id: 'amount',
          match: isAmountObject,
          component: AmountFieldRenderer,
          priority: 10
        },
        {
          id: 'generic-object',
          match: (zodType) => {
            return (zodType as any)._zod?.traits?.has('ZodObject') ||
              (zodType as any)._def?.typeName === 'ZodObject'
          },
          component: GenericObjectRenderer,
          priority: 0
        }
      ])

      // Schema with a different object shape
      const differentObjectSchema = z.object({
        name: z.string(),
        address: z.object({
          street: z.string(),
          city: z.string()
        })
      })

      render(
        <AutoFieldTypeManagerProvider manager={manager}>
          <TestFieldWrapper
            schema={differentObjectSchema}
            name="address"
            defaultValues={{ name: 'Test', address: { street: '123 Main', city: 'NYC' } }}
          >
            <AutoField />
          </TestFieldWrapper>
        </AutoFieldTypeManagerProvider>
      )

      // Should fall back to generic object renderer
      expect(screen.getByTestId('generic-object-renderer')).toBeInTheDocument()
      expect(screen.queryByTestId('amount-field-renderer')).not.toBeInTheDocument()
    })
  })

  describe('Combining Multiple Custom Renderers', () => {
    it('should support multiple specialized object renderers', async () => {
      // Coordinate renderer
      const CoordinateRenderer = createAutoFieldRenderer((props) => (
        <div data-testid="coordinate-renderer" data-field-name={props.field.name}>
          <input data-testid={`${props.field.name}-lat`} />
          <input data-testid={`${props.field.name}-lng`} />
        </div>
      ))

      const isCoordinate = matchesObjectShape({
        lat: isZodNumber,
        lng: isZodNumber
      })

      const manager = createManagerWithFallback([
        {
          id: 'amount',
          match: isAmountObject,
          component: AmountFieldRenderer,
          priority: 10
        },
        {
          id: 'coordinate',
          match: isCoordinate,
          component: CoordinateRenderer,
          priority: 10
        }
      ])

      // Schema with both amount and coordinate
      const complexSchema = z.object({
        price: amountSchema,
        location: z.object({
          lat: z.number(),
          lng: z.number()
        })
      })

      function ComplexForm() {
        const form = useForm<z.infer<typeof complexSchema>>({
          defaultValues: {
            price: { currency: 'USD', value: 99 },
            location: { lat: 40.7128, lng: -74.006 }
          }
        })

        const PriceController = useFieldControllerWrapper(
          form.control,
          'price',
          complexSchema as any
        )
        const LocationController = useFieldControllerWrapper(
          form.control,
          'location',
          complexSchema as any
        )

        return (
          <FormProvider {...form}>
            <form>
              <PriceController>
                <AutoField />
              </PriceController>
              <LocationController>
                <AutoField />
              </LocationController>
            </form>
          </FormProvider>
        )
      }

      render(
        <AutoFieldTypeManagerProvider manager={manager}>
          <ComplexForm />
        </AutoFieldTypeManagerProvider>
      )

      // Should render amount renderer for price
      expect(screen.getByTestId('amount-field-renderer')).toBeInTheDocument()
      expect(screen.getByTestId('price-currency')).toBeInTheDocument()

      // Should render coordinate renderer for location
      expect(screen.getByTestId('coordinate-renderer')).toBeInTheDocument()
      expect(screen.getByTestId('location-lat')).toBeInTheDocument()
      expect(screen.getByTestId('location-lng')).toBeInTheDocument()
    })
  })

  describe('Without Custom Manager (Default Fallback)', () => {
    it('should use default/fallback renderer when no custom manager is provided', async () => {
      // Without AutoFieldTypeManagerProvider, it should use defaults
      render(
        <TestFieldWrapper
          schema={z.object({ name: z.string() })}
          name="name"
          defaultValues={{ name: 'Test' }}
        >
          <AutoField data-testid="auto-field" />
        </TestFieldWrapper>
      )

      // Should render something (fallback to string renderer which renders an input)
      const inputs = screen.getAllByRole('textbox')
      expect(inputs.length).toBeGreaterThan(0)
    })
  })

  describe('Dynamic Renderer Registration', () => {
    it('should support registering renderers after manager creation', async () => {
      const manager = createAutoFieldTypeManager()

      // Initially no custom renderer
      expect(manager.findRenderer(amountSchema)).toBeNull()

      // Register amount renderer
      manager.register({
        id: 'amount',
        match: isAmountObject,
        component: AmountFieldRenderer,
        priority: 10
      })

      // Now should find the renderer
      expect(manager.findRenderer(amountSchema)).toBe(AmountFieldRenderer)

      // Render with the updated manager
      render(
        <AutoFieldTypeManagerProvider manager={manager}>
          <TestFieldWrapper
            schema={formWithAmountSchema}
            name="price"
            defaultValues={{ name: 'Test', price: { currency: 'USD', value: 100 } }}
          >
            <AutoField />
          </TestFieldWrapper>
        </AutoFieldTypeManagerProvider>
      )

      expect(screen.getByTestId('amount-field-renderer')).toBeInTheDocument()
    })
  })
})

describe('Real-World Scenarios', () => {
  describe('E-commerce Price Field', () => {
    const priceSchema = z.object({
      currency: z.string().min(3).max(3),
      value: z.number().min(0)
    })

    const productSchema = z.object({
      name: z.string().min(1),
      description: z.string().optional(),
      price: priceSchema,
      salePrice: priceSchema.optional()
    })

    it('should handle e-commerce product form with price fields', async () => {
      const user = userEvent.setup()

      const PriceFieldRenderer = createAutoFieldRenderer((props, ref) => {
        const { field } = props
        const [localCurrency, setLocalCurrency] = React.useState(field.value?.currency || 'USD')
        const [localValue, setLocalValue] = React.useState(field.value?.value || 0)

        const handleCurrencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
          setLocalCurrency(e.target.value)
          field.onChange({ currency: e.target.value, value: localValue })
        }

        const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
          const val = parseFloat(e.target.value) || 0
          setLocalValue(val)
          field.onChange({ currency: localCurrency, value: val })
        }

        return (
          <div data-testid="price-field" data-field-name={field.name}>
            <select
              data-testid={`${field.name}-currency-select`}
              value={localCurrency}
              onChange={handleCurrencyChange}
            >
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
            </select>
            <input
              data-testid={`${field.name}-amount-input`}
              type="number"
              step="0.01"
              value={localValue}
              onChange={handleValueChange}
              ref={ref as React.Ref<HTMLInputElement>}
            />
          </div>
        )
      })

      const isPriceObject = matchesObjectShape({
        currency: isZodString,
        value: isZodNumber
      })

      const manager = createManagerWithFallback([
        {
          id: 'price',
          match: isPriceObject,
          component: PriceFieldRenderer,
          priority: 10
        }
      ])

      function ProductForm() {
        const form = useForm<z.infer<typeof productSchema>>({
          defaultValues: {
            name: 'Test Product',
            price: { currency: 'USD', value: 29.99 }
          }
        })

        const PriceController = useFieldControllerWrapper(
          form.control,
          'price',
          productSchema as any
        )

        return (
          <FormProvider {...form}>
            <form data-testid="product-form">
              <PriceController>
                <AutoField />
              </PriceController>
            </form>
          </FormProvider>
        )
      }

      render(
        <AutoFieldTypeManagerProvider manager={manager}>
          <ProductForm />
        </AutoFieldTypeManagerProvider>
      )

      // Verify custom price renderer is used
      expect(screen.getByTestId('price-field')).toBeInTheDocument()

      // Verify initial values
      const currencySelect = screen.getByTestId('price-currency-select') as HTMLSelectElement
      const amountInput = screen.getByTestId('price-amount-input') as HTMLInputElement

      expect(currencySelect.value).toBe('USD')
      expect(amountInput.value).toBe('29.99')

      // Change currency
      await user.selectOptions(currencySelect, 'EUR')
      expect(currencySelect.value).toBe('EUR')

      // Change amount
      await user.clear(amountInput)
      await user.type(amountInput, '49.99')
      expect(amountInput.value).toBe('49.99')
    })
  })

  describe('Address Field', () => {
    const addressSchema = z.object({
      street: z.string(),
      city: z.string(),
      postalCode: z.string(),
      country: z.string()
    })

    it('should render custom address field renderer', async () => {
      const AddressFieldRenderer = createAutoFieldRenderer((props) => {
        const { field } = props
        return (
          <div data-testid="address-field" data-field-name={field.name}>
            <input
              data-testid={`${field.name}-street`}
              placeholder="Street"
              value={field.value?.street || ''}
              onChange={(e) => field.onChange({ ...field.value, street: e.target.value })}
            />
            <input
              data-testid={`${field.name}-city`}
              placeholder="City"
              value={field.value?.city || ''}
              onChange={(e) => field.onChange({ ...field.value, city: e.target.value })}
            />
            <input
              data-testid={`${field.name}-postalCode`}
              placeholder="Postal Code"
              value={field.value?.postalCode || ''}
              onChange={(e) => field.onChange({ ...field.value, postalCode: e.target.value })}
            />
            <input
              data-testid={`${field.name}-country`}
              placeholder="Country"
              value={field.value?.country || ''}
              onChange={(e) => field.onChange({ ...field.value, country: e.target.value })}
            />
          </div>
        )
      })

      const isAddress = matchesObjectShape({
        street: isZodString,
        city: isZodString,
        postalCode: isZodString,
        country: isZodString
      })

      const formSchema = z.object({
        name: z.string(),
        shippingAddress: addressSchema,
        billingAddress: addressSchema.optional()
      })

      const manager = createManagerWithFallback([
        {
          id: 'address',
          match: isAddress,
          component: AddressFieldRenderer,
          priority: 10
        }
      ])

      function AddressForm() {
        const form = useForm<z.infer<typeof formSchema>>({
          defaultValues: {
            name: 'John Doe',
            shippingAddress: {
              street: '123 Main St',
              city: 'New York',
              postalCode: '10001',
              country: 'USA'
            }
          }
        })

        const AddressController = useFieldControllerWrapper(
          form.control,
          'shippingAddress',
          formSchema as any
        )

        return (
          <FormProvider {...form}>
            <form>
              <AddressController>
                <AutoField />
              </AddressController>
            </form>
          </FormProvider>
        )
      }

      render(
        <AutoFieldTypeManagerProvider manager={manager}>
          <AddressForm />
        </AutoFieldTypeManagerProvider>
      )

      expect(screen.getByTestId('address-field')).toBeInTheDocument()
      expect(screen.getByTestId('shippingAddress-street')).toHaveValue('123 Main St')
      expect(screen.getByTestId('shippingAddress-city')).toHaveValue('New York')
      expect(screen.getByTestId('shippingAddress-postalCode')).toHaveValue('10001')
      expect(screen.getByTestId('shippingAddress-country')).toHaveValue('USA')
    })
  })
})

// ============================================================================
// createZodForm Integration Tests
// Tests use the render prop pattern instead of autofield to avoid module mocking issues
// AutoField functionality is thoroughly tested via TestFieldWrapper in earlier tests
// ============================================================================

describe('createZodForm Integration Tests', () => {
  // Amount schema for testing
  const zfAmountSchema = z.object({
    currency: z.string(),
    value: z.number()
  })

  describe('Form with render prop', () => {
    it('should require Fieldset when render returns multiple controls', () => {
      const priceOnlySchema = z.object({
        price: zfAmountSchema
      })

      const { Form, Field } = createZodForm(priceOnlySchema)

      expect(() =>
        render(
          <Form
            onSubmit={() => { }}
            defaultValue={{ price: { currency: 'USD', value: 99.99 } }}
          >
            <Field
              name="price"
              label="Price"
              render={({ field }) => (
                <div>
                  <input
                    data-testid="price-currency"
                    value={field.value?.currency || ''}
                    onChange={(e) => field.onChange({ ...field.value, currency: e.target.value })}
                  />
                  <input
                    data-testid="price-value"
                    type="number"
                    value={field.value?.value || 0}
                    onChange={(e) => field.onChange({ ...field.value, value: parseFloat(e.target.value) })}
                  />
                </div>
              )}
            />
          </Form>
        )
      ).toThrow(/renders multiple controls/)
    })

    it('should render custom component using Field render prop', async () => {
      const priceOnlySchema = z.object({
        price: zfAmountSchema
      })

      const { Form, Fieldset } = createZodForm(priceOnlySchema)

      render(
        <Form
          onSubmit={() => { }}
          defaultValue={{ price: { currency: 'USD', value: 99.99 } }}
        >
          <Fieldset
            name="price"
            label="Price"
            render={({ field }) => (
              <div data-testid="zf-amount-renderer">
                <input
                  data-testid="price-currency"
                  value={field.value?.currency || ''}
                  onChange={(e) => field.onChange({ ...field.value, currency: e.target.value })}
                />
                <input
                  data-testid="price-value"
                  type="number"
                  value={field.value?.value || 0}
                  onChange={(e) => field.onChange({ ...field.value, value: parseFloat(e.target.value) })}
                />
              </div>
            )}
          />
        </Form>
      )

      expect(screen.getByTestId('zf-amount-renderer')).toBeInTheDocument()
      expect(screen.getByTestId('price-currency')).toHaveValue('USD')
      expect(screen.getByTestId('price-value')).toHaveValue(99.99)
    })

    it('should render with correct initial values from form defaultValue prop', async () => {
      const priceOnlySchema = z.object({
        price: zfAmountSchema
      })

      const { Form, Fieldset } = createZodForm(priceOnlySchema)

      render(
        <Form
          onSubmit={() => { }}
          defaultValue={{ price: { currency: 'EUR', value: 149.50 } }}
        >
          <Fieldset
            name="price"
            label="Price"
            render={({ field }) => (
              <div>
                <input
                  data-testid="price-currency"
                  value={field.value?.currency || ''}
                  onChange={(e) => field.onChange({ ...field.value, currency: e.target.value })}
                />
                <input
                  data-testid="price-value"
                  type="number"
                  value={field.value?.value || 0}
                  onChange={(e) => field.onChange({ ...field.value, value: parseFloat(e.target.value) })}
                />
              </div>
            )}
          />
        </Form>
      )

      await waitFor(() => {
        expect(screen.getByTestId('price-currency')).toHaveValue('EUR')
        expect(screen.getByTestId('price-value')).toHaveValue(149.5)
      })
    })

    it('should update values when user interacts with custom renderer', async () => {
      const user = userEvent.setup()

      const priceOnlySchema = z.object({
        price: zfAmountSchema
      })

      const { Form, Field } = createZodForm(priceOnlySchema)

      render(
        <Form
          onSubmit={() => { }}
          defaultValue={{ price: { currency: 'USD', value: 50 } }}
        >
          <Field
            name="price"
            label="Price"
            render={({ field }) => (
              <div>
                <input
                  data-testid="price-currency"
                  value={field.value?.currency || ''}
                  onChange={(e) => field.onChange({ ...field.value, currency: e.target.value })}
                />
              </div>
            )}
          />
        </Form>
      )

      const currencyInput = screen.getByTestId('price-currency') as HTMLInputElement

      await waitFor(() => {
        expect(currencyInput.value).toBe('USD')
      })

      await user.clear(currencyInput)
      await user.type(currencyInput, 'GBP')

      expect(currencyInput.value).toBe('GBP')
    })
  })

  describe('Multiple fields with render prop', () => {
    it('should render multiple custom field types correctly', async () => {
      const storeSchema = z.object({
        price: zfAmountSchema,
        location: z.object({
          lat: z.number(),
          lng: z.number()
        })
      })

      const { Form, Fieldset } = createZodForm(storeSchema)

      render(
        <Form
          onSubmit={() => { }}
          defaultValue={{
            price: { currency: 'USD', value: 100 },
            location: { lat: 40.7128, lng: -74.006 }
          }}
        >
          <Fieldset
            name="price"
            label="Price"
            render={({ field }) => (
              <div data-testid="zf-amount-renderer">
                <input
                  data-testid="price-currency"
                  value={field.value?.currency || ''}
                  onChange={(e) => field.onChange({ ...field.value, currency: e.target.value })}
                />
                <input
                  data-testid="price-value"
                  type="number"
                  value={field.value?.value || 0}
                  onChange={(e) => field.onChange({ ...field.value, value: parseFloat(e.target.value) })}
                />
              </div>
            )}
          />
          <Fieldset
            name="location"
            label="Location"
            render={({ field }) => (
              <div data-testid="zf-coordinate-renderer">
                <input
                  data-testid="location-lat"
                  type="number"
                  value={field.value?.lat || 0}
                  onChange={(e) => field.onChange({ ...field.value, lat: parseFloat(e.target.value) })}
                />
                <input
                  data-testid="location-lng"
                  type="number"
                  value={field.value?.lng || 0}
                  onChange={(e) => field.onChange({ ...field.value, lng: parseFloat(e.target.value) })}
                />
              </div>
            )}
          />
        </Form>
      )

      // Should have both custom renderers
      expect(screen.getByTestId('zf-amount-renderer')).toBeInTheDocument()
      expect(screen.getByTestId('zf-coordinate-renderer')).toBeInTheDocument()

      // Verify initial values
      expect(screen.getByTestId('price-currency')).toHaveValue('USD')
      expect(screen.getByTestId('price-value')).toHaveValue(100)
      expect(screen.getByTestId('location-lat')).toHaveValue(40.7128)
      expect(screen.getByTestId('location-lng')).toHaveValue(-74.006)
    })
  })

  describe('Nested object fields', () => {
    it('should render nested amount fields with render prop', async () => {
      const totalsSchema = z.object({
        totals: z.object({
          subtotal: zfAmountSchema,
          tax: zfAmountSchema,
          total: zfAmountSchema
        })
      })

      const { Form, Fieldset } = createZodForm(totalsSchema)

      type AmountValue = { currency: string; value: number }

      const renderAmountField = (name: string) => ({ field }: { field: { value: AmountValue; onChange: (v: AmountValue) => void } }) => (
        <div data-testid={`${name}-renderer`}>
          <input
            data-testid={`${name}-currency`}
            value={field.value?.currency || ''}
            onChange={(e) => field.onChange({ ...field.value, currency: e.target.value })}
          />
          <input
            data-testid={`${name}-value`}
            type="number"
            value={field.value?.value || 0}
            onChange={(e) => field.onChange({ ...field.value, value: parseFloat(e.target.value) })}
          />
        </div>
      )

      render(
        <Form
          onSubmit={() => { }}
          defaultValue={{
            totals: {
              subtotal: { currency: 'USD', value: 100 },
              tax: { currency: 'USD', value: 10 },
              total: { currency: 'USD', value: 110 }
            }
          }}
        >
          <Fieldset name="totals.subtotal" label="Subtotal" render={renderAmountField('totals.subtotal')} />
          <Fieldset name="totals.tax" label="Tax" render={renderAmountField('totals.tax')} />
          <Fieldset name="totals.total" label="Total" render={renderAmountField('totals.total')} />
        </Form>
      )

      // Verify each nested field
      expect(screen.getByTestId('totals.subtotal-currency')).toHaveValue('USD')
      expect(screen.getByTestId('totals.subtotal-value')).toHaveValue(100)
      expect(screen.getByTestId('totals.tax-currency')).toHaveValue('USD')
      expect(screen.getByTestId('totals.tax-value')).toHaveValue(10)
      expect(screen.getByTestId('totals.total-currency')).toHaveValue('USD')
      expect(screen.getByTestId('totals.total-value')).toHaveValue(110)
    })
  })

  describe('Form defaultValue changes', () => {
    it('should maintain form state when values change', async () => {
      const user = userEvent.setup()

      const priceSchema = z.object({
        price: zfAmountSchema
      })

      const { Form, Fieldset } = createZodForm(priceSchema)

      render(
        <Form
          onSubmit={() => { }}
          defaultValue={{ price: { currency: 'USD', value: 50 } }}
        >
          <Fieldset
            name="price"
            label="Price"
            render={({ field }) => (
              <div>
                <input
                  data-testid="price-currency"
                  value={field.value?.currency || ''}
                  onChange={(e) => field.onChange({ ...field.value, currency: e.target.value })}
                />
                <input
                  data-testid="price-value"
                  type="number"
                  value={field.value?.value || 0}
                  onChange={(e) => field.onChange({ ...field.value, value: parseFloat(e.target.value) })}
                />
              </div>
            )}
          />
        </Form>
      )

      // Wait for form to initialize
      await waitFor(() => {
        expect(screen.getByTestId('price-currency')).toHaveValue('USD')
      })

      // Modify the value
      const valueInput = screen.getByTestId('price-value') as HTMLInputElement
      await user.clear(valueInput)
      await user.type(valueInput, '75')

      // Verify the currency is still preserved
      expect(screen.getByTestId('price-currency')).toHaveValue('USD')
      expect(valueInput).toHaveValue(75)
    })
  })

  describe('Using useForm hook from createZodForm', () => {
    it('should work with external form instance', async () => {
      const priceSchema = z.object({
        price: zfAmountSchema
      })

      const ZodFormInstance = createZodForm(priceSchema)
      const { Form, Fieldset, useForm: usePriceForm } = ZodFormInstance

      function ProductFormWithExternalControl() {
        const form = usePriceForm({
          defaultValues: {
            price: { currency: 'CHF', value: 299 }
          }
        })

        return (
          <Form onSubmit={() => { }} zodForm={form}>
            <Fieldset
              name="price"
              label="Price"
              render={({ field }) => (
                <div>
                  <input
                    data-testid="price-currency"
                    value={field.value?.currency || ''}
                    onChange={(e) => field.onChange({ ...field.value, currency: e.target.value })}
                  />
                  <input
                    data-testid="price-value"
                    type="number"
                    value={field.value?.value || 0}
                    onChange={(e) => field.onChange({ ...field.value, value: parseFloat(e.target.value) })}
                  />
                </div>
              )}
            />
          </Form>
        )
      }

      render(<ProductFormWithExternalControl />)

      // Should render with the default values from useForm
      expect(screen.getByTestId('price-currency')).toHaveValue('CHF')
      expect(screen.getByTestId('price-value')).toHaveValue(299)
    })
  })

  describe('Field with children', () => {
    it('should render custom content via render prop', async () => {
      const productSchema = z.object({
        price: zfAmountSchema
      })

      const { Form, Field } = createZodForm(productSchema)

      render(
        <Form
          onSubmit={() => { }}
          defaultValue={{ price: { currency: 'USD', value: 50 } }}
        >
          <Field
            name="price"
            label="Price"
            render={() => <input data-testid="custom-child-input" placeholder="Custom input" />}
          />
        </Form>
      )

      // Should render custom child
      expect(screen.getByTestId('custom-child-input')).toBeInTheDocument()
    })
  })

  describe('Real-world e-commerce form', () => {
    it('should handle complete product form with multiple complex fields', async () => {
      const user = userEvent.setup()

      const productFormSchema = z.object({
        pricing: z.object({
          basePrice: zfAmountSchema,
          costPrice: zfAmountSchema
        }),
        inventory: z.object({
          quantity: z.number(),
          reorderPoint: z.number()
        })
      })

      const { Form, Fieldset } = createZodForm(productFormSchema)

      render(
        <Form
          onSubmit={() => { }}
          defaultValue={{
            pricing: {
              basePrice: { currency: 'USD', value: 99.99 },
              costPrice: { currency: 'USD', value: 45.00 }
            },
            inventory: {
              quantity: 100,
              reorderPoint: 20
            }
          }}
        >
          <Fieldset
            name="pricing.basePrice"
            label="Base Price"
            render={({ field }) => (
              <div data-testid="basePrice-renderer">
                <input
                  data-testid="pricing.basePrice-currency"
                  value={field.value?.currency || ''}
                  onChange={(e) => field.onChange({ ...field.value, currency: e.target.value })}
                />
                <input
                  data-testid="pricing.basePrice-value"
                  type="number"
                  value={field.value?.value || 0}
                  onChange={(e) => field.onChange({ ...field.value, value: parseFloat(e.target.value) })}
                />
              </div>
            )}
          />
          <Fieldset
            name="pricing.costPrice"
            label="Cost Price"
            render={({ field }) => (
              <div data-testid="costPrice-renderer">
                <input
                  data-testid="pricing.costPrice-currency"
                  value={field.value?.currency || ''}
                  onChange={(e) => field.onChange({ ...field.value, currency: e.target.value })}
                />
                <input
                  data-testid="pricing.costPrice-value"
                  type="number"
                  value={field.value?.value || 0}
                  onChange={(e) => field.onChange({ ...field.value, value: parseFloat(e.target.value) })}
                />
              </div>
            )}
          />
          <Fieldset
            name="inventory"
            label="Inventory"
            render={({ field }) => (
              <div data-testid="inventory-renderer">
                <input
                  data-testid="inventory-quantity"
                  type="number"
                  value={field.value?.quantity || 0}
                  onChange={(e) => field.onChange({ ...field.value, quantity: parseInt(e.target.value) })}
                />
                <input
                  data-testid="inventory-reorderPoint"
                  type="number"
                  value={field.value?.reorderPoint || 0}
                  onChange={(e) => field.onChange({ ...field.value, reorderPoint: parseInt(e.target.value) })}
                />
              </div>
            )}
          />
        </Form>
      )

      // Verify initial values
      await waitFor(() => {
        expect(screen.getByTestId('pricing.basePrice-currency')).toHaveValue('USD')
        expect(screen.getByTestId('pricing.basePrice-value')).toHaveValue(99.99)
      })

      expect(screen.getByTestId('inventory-quantity')).toHaveValue(100)
      expect(screen.getByTestId('inventory-reorderPoint')).toHaveValue(20)

      // Modify inventory
      const quantityInput = screen.getByTestId('inventory-quantity')
      await user.clear(quantityInput)
      await user.type(quantityInput, '150')
      expect(quantityInput).toHaveValue(150)

      // Verify other fields are still preserved
      expect(screen.getByTestId('inventory-reorderPoint')).toHaveValue(20)
      expect(screen.getByTestId('pricing.costPrice-currency')).toHaveValue('USD')
    })
  })
})
