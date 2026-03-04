import { Grid, Input, Stack } from '@chakra-ui/react'
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
  title: 'Recipes/Address'
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

const Address = z.object({
  street: z.string(),
  city: z.string(),
  postalCode: z.string(),
  country: z.string()
})

const schema = z.object({
  shippingAddress: Address
})

const { Form, Fieldset, SubmitButton } = createZodForm(schema)

const AddressInput = createAutoFieldRenderer(({ field }) => (
  <Grid templateColumns="repeat(2, minmax(0, 1fr))" gap="3">
    <Input
      gridColumn="span 2"
      placeholder="Street"
      value={field.value?.street ?? ''}
      onChange={(e) => field.onChange({ ...field.value, street: e.target.value })}
    />
    <Input
      placeholder="City"
      value={field.value?.city ?? ''}
      onChange={(e) => field.onChange({ ...field.value, city: e.target.value })}
    />
    <Input
      placeholder="Postal code"
      value={field.value?.postalCode ?? ''}
      onChange={(e) => field.onChange({ ...field.value, postalCode: e.target.value })}
    />
    <Input
      gridColumn="span 2"
      placeholder="Country"
      value={field.value?.country ?? ''}
      onChange={(e) => field.onChange({ ...field.value, country: e.target.value })}
    />
  </Grid>
))

const manager = createAutoFieldTypeManagerWithDefaults([
  {
    id: 'address-input',
    match: matches(Address),
    component: AddressInput,
    priority: 10
  }
])

const addressUsageCode = `const Address = z.object({
  street: z.string(),
  city: z.string(),
  postalCode: z.string(),
  country: z.string()
})

const schema = z.object({
  shippingAddress: Address
})

const { Form, Fieldset, SubmitButton } = createZodForm(schema)

const AddressInput = createAutoFieldRenderer(({ field }) => (
  <Grid templateColumns="repeat(2, minmax(0, 1fr))" gap="3">
    <Input
      gridColumn="span 2"
      placeholder="Street"
      value={field.value?.street ?? ''}
      onChange={(e) => field.onChange({ ...field.value, street: e.target.value })}
    />
    <Input
      placeholder="City"
      value={field.value?.city ?? ''}
      onChange={(e) => field.onChange({ ...field.value, city: e.target.value })}
    />
    <Input
      placeholder="Postal code"
      value={field.value?.postalCode ?? ''}
      onChange={(e) => field.onChange({ ...field.value, postalCode: e.target.value })}
    />
    <Input
      gridColumn="span 2"
      placeholder="Country"
      value={field.value?.country ?? ''}
      onChange={(e) => field.onChange({ ...field.value, country: e.target.value })}
    />
  </Grid>
))

const manager = createAutoFieldTypeManagerWithDefaults([
  {
    id: 'address-input',
    match: matches(Address),
    component: AddressInput,
    priority: 10
  }
])

function AddressRecipe() {
  const [result, setResult] = useState<unknown>({ status: 'Submit to see output' })

  return (
    <Stack gap="4" maxW="lg">
      <AutoFieldTypeManagerProvider manager={manager}>
        <Form
          onSubmit={(value) => setResult({ status: 'submitted', data: value })}
          onSubmitFailed={(errors) => setResult({ status: 'invalid', errors })}
          defaultValue={{ shippingAddress: { street: '', city: '', postalCode: '', country: '' } }}>
          <Fieldset name="shippingAddress" label="Shipping address" />
          <SubmitButton>Save address</SubmitButton>
        </Form>
      </AutoFieldTypeManagerProvider>
      <RecipeResultPanel result={result} />
    </Stack>
  )
}`

function AddressRecipe() {
  const [result, setResult] = useState<unknown>({ status: 'Submit to see output' })

  return (
    <Stack gap="4" maxW="lg">
      <AutoFieldTypeManagerProvider manager={manager}>
        <Form
          onSubmit={(value) => setResult({ status: 'submitted', data: value })}
          onSubmitFailed={(errors) => setResult({ status: 'invalid', errors })}
          defaultValue={{ shippingAddress: { street: '', city: '', postalCode: '', country: '' } }}>
          <Fieldset name="shippingAddress" label="Shipping address" />
          <SubmitButton>Save address</SubmitButton>
        </Form>
      </AutoFieldTypeManagerProvider>
      <RecipeResultPanel result={result} />
    </Stack>
  )
}

export const AddressInputRecipe: Story = {
  render: () => <AddressRecipe />,
  parameters: {
    docs: {
      source: {
        code: addressUsageCode
      }
    }
  }
}

