import React from 'react'
import { HStack, Input, Stack } from '@chakra-ui/react'
import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { z } from 'zod'
import {
  AutoFieldTypeManagerProvider,
  createAutoFieldRenderer,
  createAutoFieldTypeManagerWithDefaults,
  createZodForm,
  matches
} from '../../src'
import { RecipeResultPanel } from '../helpers/RecipeResultPanel'

const meta = {
  title: 'Recipes/Amount'
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

const Amount = z.object({
  currency: z.string(),
  value: z.number()
})

const AmountSchema = z.object({
  amount: Amount
})

const { Form, Fieldset, SubmitButton } = createZodForm(AmountSchema)

const AmountInput = createAutoFieldRenderer(({ field }) => (
  <HStack>
    <select
      value={field.value?.currency ?? 'USD'}
      onChange={(e) => field.onChange({ ...field.value, currency: e.target.value })}
      style={{ maxWidth: '140px', padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }}>
      <option value="USD">USD</option>
      <option value="EUR">EUR</option>
      <option value="GBP">GBP</option>
    </select>
    <Input
      type="number"
      value={field.value?.value ?? 0}
      onChange={(e) => field.onChange({ ...field.value, value: Number(e.target.value) })}
    />
  </HStack>
))

const manager = createAutoFieldTypeManagerWithDefaults([
  {
    id: 'amount-input',
    match: matches(Amount),
    component: AmountInput,
    priority: 10
  }
])

const amountUsageCode = `const Amount = z.object({
  currency: z.string(),
  value: z.number()
})

const AmountSchema = z.object({
  amount: Amount
})

const { Form, Fieldset, SubmitButton } = createZodForm(AmountSchema)

const AmountInput = createAutoFieldRenderer(({ field }) => (
  <HStack>
    <select
      value={field.value?.currency ?? 'USD'}
      onChange={(e) => field.onChange({ ...field.value, currency: e.target.value })}
      style={{ maxWidth: '140px', padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }}>
      <option value="USD">USD</option>
      <option value="EUR">EUR</option>
      <option value="GBP">GBP</option>
    </select>
    <Input
      type="number"
      value={field.value?.value ?? 0}
      onChange={(e) => field.onChange({ ...field.value, value: Number(e.target.value) })}
    />
  </HStack>
))

const manager = createAutoFieldTypeManagerWithDefaults([
  {
    id: 'amount-input',
    match: matches(Amount),
    component: AmountInput,
    priority: 10
  }
])

function AmountRecipe() {
  const [result, setResult] = useState<unknown>({ status: 'Submit to see output' })

  return (
    <Stack gap="4" maxW="lg">
      <AutoFieldTypeManagerProvider manager={manager}>
        <Form
          onSubmit={(value) => setResult({ status: 'submitted', data: value })}
          onSubmitFailed={(errors) => setResult({ status: 'invalid', errors })}
          defaultValue={{ amount: { currency: 'USD', value: 42 } }}>
          <Fieldset name="amount" label="Amount" />
          <SubmitButton>Submit</SubmitButton>
        </Form>
      </AutoFieldTypeManagerProvider>
      <RecipeResultPanel result={result} />
    </Stack>
  )
}`

function AmountRecipe() {
  const [result, setResult] = useState<unknown>({ status: 'Submit to see output' })

  return (
    <Stack gap="4" maxW="lg">
      <AutoFieldTypeManagerProvider manager={manager}>
        <Form
          onSubmit={(value) => setResult({ status: 'submitted', data: value })}
          onSubmitFailed={(errors) => setResult({ status: 'invalid', errors })}
          defaultValue={{ amount: { currency: 'USD', value: 42 } }}>
          <Fieldset name="amount" label="Amount" />
          <SubmitButton>Submit</SubmitButton>
        </Form>
      </AutoFieldTypeManagerProvider>
      <RecipeResultPanel result={result} />
    </Stack>
  )
}

const SharedAmount = z.object({
  currency: z.string(),
  amount: z.number()
})

const SharedSchema = z.object({
  subtotal: SharedAmount,
  tax: SharedAmount.optional()
})

const SharedAmountInput = createAutoFieldRenderer(({ field }) => (
  <HStack>
    <select
      value={field.value?.currency ?? 'USD'}
      onChange={(e) => field.onChange({ ...field.value, currency: e.target.value })}
      style={{ maxWidth: '140px', padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }}>
      <option value="USD">USD</option>
      <option value="EUR">EUR</option>
      <option value="GBP">GBP</option>
    </select>
    <Input
      type="number"
      value={field.value?.amount ?? 0}
      onChange={(e) => field.onChange({ ...field.value, amount: Number(e.target.value) })}
    />
  </HStack>
))

const sharedManager = createAutoFieldTypeManagerWithDefaults([
  {
    id: 'shared-amount',
    match: matches(SharedAmount),
    component: SharedAmountInput,
    priority: 10
  }
])

const shared = createZodForm(SharedSchema)

const sharedSchemaUsageCode = `const SharedAmount = z.object({
  currency: z.string(),
  amount: z.number()
})

const SharedSchema = z.object({
  subtotal: SharedAmount,
  tax: SharedAmount.optional()
})

const SharedAmountInput = createAutoFieldRenderer(({ field }) => (
  <HStack>
    <select
      value={field.value?.currency ?? 'USD'}
      onChange={(e) => field.onChange({ ...field.value, currency: e.target.value })}
      style={{ maxWidth: '140px', padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }}>
      <option value="USD">USD</option>
      <option value="EUR">EUR</option>
      <option value="GBP">GBP</option>
    </select>
    <Input
      type="number"
      value={field.value?.amount ?? 0}
      onChange={(e) => field.onChange({ ...field.value, amount: Number(e.target.value) })}
    />
  </HStack>
))

const sharedManager = createAutoFieldTypeManagerWithDefaults([
  {
    id: 'shared-amount',
    match: matches(SharedAmount),
    component: SharedAmountInput,
    priority: 10
  }
])

const shared = createZodForm(SharedSchema)

function SharedSchemaRecipe() {
  const [result, setResult] = useState<unknown>({ status: 'Submit to see output' })

  return (
    <Stack gap="4" maxW="lg">
      <AutoFieldTypeManagerProvider manager={sharedManager}>
        <shared.Form
          onSubmit={(value) => setResult({ status: 'submitted', data: value })}
          onSubmitFailed={(errors) => setResult({ status: 'invalid', errors })}
          defaultValue={{
            subtotal: { currency: 'USD', amount: 100 },
            tax: { currency: 'USD', amount: 20 }
          }}>
          <shared.Fieldset name="subtotal" label="Subtotal" />
          <shared.Fieldset name="tax" label="Tax" />
          <shared.SubmitButton>Save</shared.SubmitButton>
        </shared.Form>
      </AutoFieldTypeManagerProvider>
      <RecipeResultPanel result={result} />
    </Stack>
  )
}`

function SharedSchemaRecipe() {
  const [result, setResult] = useState<unknown>({ status: 'Submit to see output' })

  return (
    <Stack gap="4" maxW="lg">
      <AutoFieldTypeManagerProvider manager={sharedManager}>
        <shared.Form
          onSubmit={(value) => setResult({ status: 'submitted', data: value })}
          onSubmitFailed={(errors) => setResult({ status: 'invalid', errors })}
          defaultValue={{
            subtotal: { currency: 'USD', amount: 100 },
            tax: { currency: 'USD', amount: 20 }
          }}>
          <shared.Fieldset name="subtotal" label="Subtotal" />
          <shared.Fieldset name="tax" label="Tax" />
          <shared.SubmitButton>Save</shared.SubmitButton>
        </shared.Form>
      </AutoFieldTypeManagerProvider>
      <RecipeResultPanel result={result} />
    </Stack>
  )
}

export const AmountInputRecipe: Story = {
  render: () => <AmountRecipe />,
  parameters: {
    docs: {
      source: {
        code: amountUsageCode
      }
    }
  }
}

export const SharedSchemaMatcherRecipe: Story = {
  render: () => <SharedSchemaRecipe />,
  parameters: {
    docs: {
      source: {
        code: sharedSchemaUsageCode
      }
    }
  }
}

