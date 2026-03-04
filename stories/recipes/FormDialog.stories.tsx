import { Button, Stack, Text, VStack } from '@chakra-ui/react'
import type { Meta, StoryObj } from '@storybook/react'
import React, { useState } from 'react'
import { z } from 'zod'
import { createZodForm } from '../../src'
import { RecipeResultPanel } from '../helpers/RecipeResultPanel'

const meta = {
  title: 'Recipes/Form Dialogs'
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Email is invalid')
})

const { Field, FormDialog, createFormDialog } = createZodForm(schema)

const formDialogUsageCode = `const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Email is invalid')
})

const { Field, FormDialog } = createZodForm(schema)

function ControlledFormDialogRecipe() {
  const [open, setOpen] = useState(false)
  const [result, setResult] = useState<unknown>({ status: 'Open dialog and submit' })

  return (
    <Stack gap="4" maxW="lg">
      <Button onClick={() => setOpen(true)}>Open FormDialog</Button>

      <FormDialog
        open={open}
        onClose={() => setOpen(false)}
        title="Edit profile"
        submitText="Save"
        defaultValue={{ name: 'Ada Lovelace', email: 'ada@example.com' }}
        onSubmit={async (value) => {
          setResult({ status: 'submitted', data: value })
          return true
        }}
        onSubmitFailed={(errors) => setResult({ status: 'invalid', errors })}>
        <Field name="name" label="Name" autofield />
        <Field name="email" label="Email" autofield />
      </FormDialog>

      <RecipeResultPanel result={result} />
    </Stack>
  )
}`

function ControlledFormDialogRecipe() {
  const [open, setOpen] = useState(false)
  const [result, setResult] = useState<unknown>({ status: 'Open dialog and submit' })

  return (
    <Stack gap='4' maxW='lg'>
      <Button onClick={() => setOpen(true)}>Open FormDialog</Button>

      <FormDialog
        open={open}
        onClose={() => setOpen(false)}
        title='Edit profile'
        submitText='Save'
        defaultValue={{ name: 'Ada Lovelace', email: 'ada@example.com' }}
        onSubmit={async value => {
          setResult({ status: 'submitted', data: value })
          return true
        }}
        onSubmitFailed={errors => setResult({ status: 'invalid', errors })}>
        <Field name='name' label='Name' autofield />
        <Field name='email' label='Email' autofield />
      </FormDialog>

      <RecipeResultPanel result={result} />
    </Stack>
  )
}

const createFormDialogUsageCode = `const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Email is invalid')
})

const { Field, createFormDialog } = createZodForm(schema)
const [openUserDialog, UserFormModal] = createFormDialog(
  props => (
    <VStack align='stretch' gap='3'>
      <Text fontSize='sm' color='fg.muted'>
        Fill in the fields below for: {props.title}
      </Text>
      <Field name='name' label='Name' autofield />
      <Field name='email' label='Email' autofield />
    </VStack>
  ),
  { submitText: 'Create' }
)

function AsyncFormDialogRecipe() {
  const [result, setResult] = useState<unknown>({ status: 'Open dialog and submit' })

  return (
    <Stack gap="4" maxW="lg">
      <Button
        onClick={async () => {
          const value = await openUserDialog({
            title: 'Create user',
            defaultValue: { name: '', email: '' },
          })

          setResult(value ? { status: 'submitted', data: value } : { status: 'cancelled' })
        }}>
        Open Async Dialog
      </Button>

      <UserFormModal />
      <RecipeResultPanel result={result} />
    </Stack>
  )
}`

const [openUserDialog, UserFormModal] = createFormDialog(
  props => (
    <VStack align='stretch' gap='3'>
      <Text fontSize='sm' color='fg.muted'>
        Fill in the fields below for: {props.title}
      </Text>
      <Field name='name' label='Name' autofield />
      <Field name='email' label='Email' autofield />
    </VStack>
  ),
  { submitText: 'Create' }
)

function AsyncFormDialogRecipe() {
  const [result, setResult] = useState<unknown>({ status: 'Open dialog and submit' })

  return (
    <Stack gap='4' maxW='lg'>
      <Button
        onClick={async () => {
          const value = await openUserDialog({
            title: 'Create user',
            defaultValue: { name: '', email: '' }
          })

          setResult(value ? { status: 'submitted', data: value } : { status: 'cancelled' })
        }}>
        Open Async Dialog
      </Button>

      <UserFormModal />
      <RecipeResultPanel result={result} />
    </Stack>
  )
}

export const ControlledFormDialog: Story = {
  render: () => <ControlledFormDialogRecipe />,
  parameters: {
    docs: {
      source: {
        code: formDialogUsageCode
      }
    }
  }
}

export const PromiseBasedFormDialog: Story = {
  render: () => <AsyncFormDialogRecipe />,
  parameters: {
    docs: {
      source: {
        code: createFormDialogUsageCode
      }
    }
  }
}
