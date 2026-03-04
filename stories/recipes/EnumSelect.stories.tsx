import { Stack } from '@chakra-ui/react'
import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { z } from 'zod'
import { createZodForm } from '../../src'
import { RecipeResultPanel } from '../helpers/RecipeResultPanel'

const meta = {
  title: 'Recipes/Enum Select'
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

const schema = z.object({
  status: z.enum(['draft', 'active', 'archived'])
})

const { Form, Field, SubmitButton } = createZodForm(schema)

const enumSelectUsageCode = `const schema = z.object({
  status: z.enum(['draft', 'active', 'archived'])
})

const { Form, Field, SubmitButton } = createZodForm(schema)

function EnumRecipe() {
  const [result, setResult] = useState<unknown>({ status: 'Submit to see output' })

  return (
    <Stack gap="4" maxW="lg">
      <Form
        onSubmit={(value) => setResult({ status: 'submitted', data: value })}
        onSubmitFailed={(errors) => setResult({ status: 'invalid', errors })}
        defaultValue={{ status: 'draft' }}>
        <Field
          name="status"
          label="Status"
          render={({ field }) => (
            <select
              value={field.value}
              onChange={(e) => field.onChange(e.target.value)}
              style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }}>
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="archived">Archived</option>
            </select>
          )}
        />
        <SubmitButton>Update</SubmitButton>
      </Form>
      <RecipeResultPanel result={result} />
    </Stack>
  )
}`

function EnumRecipe() {
  const [result, setResult] = useState<unknown>({ status: 'Submit to see output' })

  return (
    <Stack gap="4" maxW="lg">
      <Form
        onSubmit={(value) => setResult({ status: 'submitted', data: value })}
        onSubmitFailed={(errors) => setResult({ status: 'invalid', errors })}
        defaultValue={{ status: 'draft' }}>
        <Field
          name="status"
          label="Status"
          render={({ field }) => (
            <select
              value={field.value}
              onChange={(e) => field.onChange(e.target.value)}
              style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }}>
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="archived">Archived</option>
            </select>
          )}
        />
        <SubmitButton>Update</SubmitButton>
      </Form>
      <RecipeResultPanel result={result} />
    </Stack>
  )
}

export const EnumSelectRecipe: Story = {
  render: () => <EnumRecipe />,
  parameters: {
    docs: {
      source: {
        code: enumSelectUsageCode
      }
    }
  }
}

