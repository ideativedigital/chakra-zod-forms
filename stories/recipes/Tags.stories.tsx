import { Input, Stack } from '@chakra-ui/react'
import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { z } from 'zod'
import { createZodForm } from '../../src'
import { RecipeResultPanel } from '../helpers/RecipeResultPanel'

const meta = {
  title: 'Recipes/Tags'
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

const schema = z.object({
  tags: z.array(z.string()).default([])
})

const { Form, Field, SubmitButton } = createZodForm(schema)

const parseTags = (raw: string) =>
  raw
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean)

function TagsTextInput({ field }: { field: { value?: string[]; onChange: (value: string[]) => void } }) {
  const [draft, setDraft] = useState((field.value ?? []).join(', '))

  return (
    <Input
      placeholder="comma,separated,tags"
      value={draft}
      onChange={(e) => {
        const raw = e.target.value
        setDraft(raw)
        field.onChange(parseTags(raw))
      }}
      onBlur={() => setDraft((field.value ?? []).join(', '))}
    />
  )
}

const tagsUsageCode = `const schema = z.object({
  tags: z.array(z.string()).default([])
})

const { Form, Field, SubmitButton } = createZodForm(schema)

const parseTags = (raw: string) =>
  raw
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean)

function TagsTextInput({ field }: { field: { value?: string[]; onChange: (value: string[]) => void } }) {
  const [draft, setDraft] = useState((field.value ?? []).join(', '))

  return (
    <Input
      placeholder="comma,separated,tags"
      value={draft}
      onChange={(e) => {
        const raw = e.target.value
        setDraft(raw)
        field.onChange(parseTags(raw))
      }}
      onBlur={() => setDraft((field.value ?? []).join(', '))}
    />
  )
}

function TagsRecipe() {
  const [result, setResult] = useState<unknown>({ status: 'Submit to see output' })

  return (
    <Stack gap="4" maxW="lg">
      <Form
        onSubmit={(value) => setResult({ status: 'submitted', data: value })}
        onSubmitFailed={(errors) => setResult({ status: 'invalid', errors })}
        defaultValue={{ tags: ['forms', 'zod'] }}>
        <Field
          name="tags"
          label="Tags"
          render={({ field }) => <TagsTextInput field={field} />}
        />
        <SubmitButton>Save tags</SubmitButton>
      </Form>
      <RecipeResultPanel result={result} />
    </Stack>
  )
}`

function TagsRecipe() {
  const [result, setResult] = useState<unknown>({ status: 'Submit to see output' })

  return (
    <Stack gap="4" maxW="lg">
      <Form
        onSubmit={(value) => setResult({ status: 'submitted', data: value })}
        onSubmitFailed={(errors) => setResult({ status: 'invalid', errors })}
        defaultValue={{ tags: ['forms', 'zod'] }}>
        <Field
          name="tags"
          label="Tags"
          render={({ field }) => <TagsTextInput field={field} />}
        />
        <SubmitButton>Save tags</SubmitButton>
      </Form>
      <RecipeResultPanel result={result} />
    </Stack>
  )
}

export const TagsRecipeStory: Story = {
  render: () => <TagsRecipe />,
  parameters: {
    docs: {
      source: {
        code: tagsUsageCode
      }
    }
  }
}

