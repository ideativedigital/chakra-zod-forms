import { Input, Stack } from '@chakra-ui/react'
import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { z } from 'zod'
import { createZodForm } from '../../src'
import { RecipeResultPanel } from '../helpers/RecipeResultPanel'

const meta = {
  title: 'Recipes/Phone'
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

const phoneSchema = z.object({
  phone: z.string().transform((v) => v.replace(/[^\d+]/g, '')).pipe(z.string().min(8))
})

const { Form, Field, SubmitButton } = createZodForm(phoneSchema)

const phoneUsageCode = `const phoneSchema = z.object({
  phone: z.string().transform((v) => v.replace(/[^\\d+]/g, '')).pipe(z.string().min(8))
})

const { Form, Field, SubmitButton } = createZodForm(phoneSchema)

function PhoneRecipe() {
  const [result, setResult] = useState<unknown>({ status: 'Submit to see output' })

  return (
    <Stack gap="4" maxW="lg">
      <Form
        onSubmit={(value) => setResult({ status: 'submitted', data: value })}
        onSubmitFailed={(errors) => setResult({ status: 'invalid', errors })}
        defaultValue={{ phone: '' }}>
        <Field
          name="phone"
          label="Phone"
          render={({ field }) => (
            <Input
              placeholder="+1 555 123 4567"
              value={field.value ?? ''}
              onChange={(e) => field.onChange(e.target.value)}
            />
          )}
        />
        <SubmitButton>Save</SubmitButton>
      </Form>
      <RecipeResultPanel result={result} />
    </Stack>
  )
}`

function PhoneRecipe() {
  const [result, setResult] = useState<unknown>({ status: 'Submit to see output' })

  return (
    <Stack gap="4" maxW="lg">
      <Form
        onSubmit={(value) => setResult({ status: 'submitted', data: value })}
        onSubmitFailed={(errors) => setResult({ status: 'invalid', errors })}
        defaultValue={{ phone: '' }}>
        <Field
          name="phone"
          label="Phone"
          render={({ field }) => (
            <Input
              placeholder="+1 555 123 4567"
              value={field.value ?? ''}
              onChange={(e) => field.onChange(e.target.value)}
            />
          )}
        />
        <SubmitButton>Save</SubmitButton>
      </Form>
      <RecipeResultPanel result={result} />
    </Stack>
  )
}

export const PhoneInputRecipe: Story = {
  render: () => <PhoneRecipe />,
  parameters: {
    docs: {
      source: {
        code: phoneUsageCode
      }
    }
  }
}

