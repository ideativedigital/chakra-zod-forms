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
  title: 'Recipes/Date Range'
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

const DateRange = z.object({
  start: z.date(),
  end: z.date()
})

const schema = z.object({
  availability: DateRange
})

const { Form, Fieldset, SubmitButton } = createZodForm(schema)

const DateRangeInput = createAutoFieldRenderer(({ field }) => (
  <HStack>
    <Input
      type="date"
      value={field.value?.start ? new Date(field.value.start).toISOString().slice(0, 10) : ''}
      onChange={(e) =>
        field.onChange({
          ...field.value,
          start: new Date(e.target.value)
        })
      }
    />
    <Input
      type="date"
      value={field.value?.end ? new Date(field.value.end).toISOString().slice(0, 10) : ''}
      onChange={(e) =>
        field.onChange({
          ...field.value,
          end: new Date(e.target.value)
        })
      }
    />
  </HStack>
))

const manager = createAutoFieldTypeManagerWithDefaults([
  {
    id: 'date-range',
    match: matches(DateRange),
    component: DateRangeInput,
    priority: 10
  }
])

const dateRangeUsageCode = `const DateRange = z.object({
  start: z.date(),
  end: z.date()
})

const schema = z.object({
  availability: DateRange
})

const { Form, Fieldset, SubmitButton } = createZodForm(schema)

const DateRangeInput = createAutoFieldRenderer(({ field }) => (
  <HStack>
    <Input
      type="date"
      value={field.value?.start ? new Date(field.value.start).toISOString().slice(0, 10) : ''}
      onChange={(e) =>
        field.onChange({
          ...field.value,
          start: new Date(e.target.value)
        })
      }
    />
    <Input
      type="date"
      value={field.value?.end ? new Date(field.value.end).toISOString().slice(0, 10) : ''}
      onChange={(e) =>
        field.onChange({
          ...field.value,
          end: new Date(e.target.value)
        })
      }
    />
  </HStack>
))

const manager = createAutoFieldTypeManagerWithDefaults([
  {
    id: 'date-range',
    match: matches(DateRange),
    component: DateRangeInput,
    priority: 10
  }
])

function DateRangeRecipe() {
  const [result, setResult] = useState<unknown>({ status: 'Submit to see output' })

  return (
    <Stack gap="4" maxW="lg">
      <AutoFieldTypeManagerProvider manager={manager}>
        <Form
          onSubmit={(value) => setResult({ status: 'submitted', data: value })}
          onSubmitFailed={(errors) => setResult({ status: 'invalid', errors })}
          defaultValue={{ availability: { start: new Date(), end: new Date() } }}>
          <Fieldset name="availability" label="Availability" />
          <SubmitButton>Save range</SubmitButton>
        </Form>
      </AutoFieldTypeManagerProvider>
      <RecipeResultPanel result={result} />
    </Stack>
  )
}`

function DateRangeRecipe() {
  const [result, setResult] = useState<unknown>({ status: 'Submit to see output' })

  return (
    <Stack gap="4" maxW="lg">
      <AutoFieldTypeManagerProvider manager={manager}>
        <Form
          onSubmit={(value) => setResult({ status: 'submitted', data: value })}
          onSubmitFailed={(errors) => setResult({ status: 'invalid', errors })}
          defaultValue={{ availability: { start: new Date(), end: new Date() } }}>
          <Fieldset name="availability" label="Availability" />
          <SubmitButton>Save range</SubmitButton>
        </Form>
      </AutoFieldTypeManagerProvider>
      <RecipeResultPanel result={result} />
    </Stack>
  )
}

export const DateRangeRecipeStory: Story = {
  render: () => <DateRangeRecipe />,
  parameters: {
    docs: {
      source: {
        code: dateRangeUsageCode
      }
    }
  }
}

