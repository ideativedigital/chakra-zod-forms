# @ideative/chakra-zod-forms

Type-safe form helpers for React Hook Form + Zod + Chakra UI.

## What this library provides

- `createZodForm(schema)` factory with typed `Form`, `Field`, `Fieldset`, and `FormDialog`
- `ManagedField` / `ManagedFieldset` wrappers to reduce form boilerplate
- `AutoField` that picks input renderers from Zod field types
- Extensible auto-field type manager and matcher utilities
- Sub-form helpers for nested object sections

## Installation

```bash
pnpm add @ideative/chakra-zod-forms
```

Peer dependencies:

```bash
pnpm add react @chakra-ui/react react-icons
```

Direct runtime dependencies used by this package:

- `react-hook-form`
- `@hookform/resolvers`
- `zod`

## Quick start

```tsx
import { Button } from '@chakra-ui/react'
import { z } from 'zod'
import { createZodForm } from '@ideative/chakra-zod-forms'

const schema = z.object({
  firstName: z.string().min(1),
  age: z.number().min(18),
  isActive: z.boolean().default(true),
})

type FormValue = z.infer<typeof schema>

const { Form, Field } = createZodForm<FormValue>(schema)

export function UserForm() {
  return (
    <Form
      defaultValue={{ firstName: '', age: 18, isActive: true }}
      onSubmit={(value) => {
        console.log(value)
      }}
    >
      <Field name="firstName" label="First name" autofield />
      <Field name="age" label="Age" autofield />
      <Field name="isActive" label="Active" autofield />

      <Button type="submit">Save</Button>
    </Form>
  )
}
```

## AutoField customization

Register a custom renderer for specific Zod shapes:

```tsx
import {
  AutoFieldTypeManagerProvider,
  createAutoFieldTypeManagerWithDefaults,
  matchesObjectShape,
  isZodNumber,
  isZodString
} from '@ideative/chakra-zod-forms'

const isMoneyObject = matchesObjectShape({
  currency: isZodString,
  value: isZodNumber,
})

const manager = createAutoFieldTypeManagerWithDefaults([
  {
    id: 'money',
    match: isMoneyObject,
    component: MoneyFieldRenderer,
    priority: 10,
  },
])

<AutoFieldTypeManagerProvider manager={manager}>
  <MyForm />
</AutoFieldTypeManagerProvider>
```

## Exports

Primary exports from `src/index.ts`:

- `createZodForm`
- `ManagedField`, `ManagedFieldset`
- `createSubForm`, `FormPartProvider`, `FormPartManagedField`
- `AutoField` and all `auto-field/*` utilities
- UI helpers: `Field`, `ToggleTip`
- Zod type utilities

## Development

```bash
pnpm install
pnpm test:run
pnpm build
pnpm storybook
```

Build static Storybook docs:

```bash
pnpm storybook:build
```

## Documentation

Storybook is the documentation surface for this project.
Deployment workflow: `.github/workflows/deploy-storybook.yml`.

## License

MIT
