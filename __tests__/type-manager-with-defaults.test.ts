import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { createAutoFieldTypeManagerWithDefaults } from '../src/auto-field/create-manager-with-defaults'
import { defaultAutoFieldRenderers, NumberFieldRenderer, StringFieldRenderer } from '../src/auto-field/default-renderers'
import {
  createAutoFieldRenderer
} from '../src/auto-field/type-manager'

describe('createAutoFieldTypeManagerWithDefaults', () => {
  it('should create manager with default renderers', () => {
    const manager = createAutoFieldTypeManagerWithDefaults()

    // Should have defaults + fallback
    expect(manager.getRenderers().length).toBe(defaultAutoFieldRenderers.length + 1)
  })

  it('should find default renderers for basic types', () => {
    const manager = createAutoFieldTypeManagerWithDefaults()

    expect(manager.findRenderer(z.number())).toBe(NumberFieldRenderer)
    expect(manager.findRenderer(z.string())).toBe(StringFieldRenderer)
  })

  it('should allow custom renderers to override defaults', () => {
    const customNumberRenderer = createAutoFieldRenderer(() => null)

    // Support both Zod v3 and v4
    const isNumber = (zType: z.ZodTypeAny) => {
      if ((zType as any)._zod?.traits?.has('ZodNumber')) return true
      return (zType as any)._def?.typeName === 'ZodNumber'
    }

    const manager = createAutoFieldTypeManagerWithDefaults([
      {
        id: 'custom-number',
        match: isNumber,
        component: customNumberRenderer,
        priority: 10 // Higher than default -100
      }
    ])

    // Custom renderer should be found first due to higher priority
    const found = manager.findRenderer(z.number())
    expect(manager.getRenderers().find(r => r.component === found)?.id).toBe('custom-number')
  })

  it('should support adding specialized matchers with high priority', () => {
    const emailRenderer = createAutoFieldRenderer(() => null)

    // Custom matcher for email strings - supports both Zod v3 and v4
    const isEmailString = (zodType: z.ZodTypeAny) => {
      // Check if it's a string first
      const isString = (zodType as any)._zod?.traits?.has('ZodString') ||
        (zodType as any)._def?.typeName === 'ZodString'
      if (!isString) return false
      // Zod v4: check format property directly
      if ((zodType as any).format === 'email') return true
      // Zod v3: check _def.checks
      const checks = (zodType as any)._def?.checks
      return checks?.some((c: any) => c.kind === 'email') ?? false
    }

    const manager = createAutoFieldTypeManagerWithDefaults([
      {
        id: 'email',
        match: isEmailString,
        component: emailRenderer,
        priority: 10
      }
    ])

    // Email string should use email renderer
    const foundEmail = manager.findRenderer(z.string().email())
    expect(manager.getRenderers().find(r => r.component === foundEmail)?.id).toBe('email')

    // Plain string should use default string renderer
    const foundString = manager.findRenderer(z.string())
    expect(manager.getRenderers().find(r => r.component === foundString)?.id).toBe('zod-string')
  })

  it('should maintain correct priority order', () => {
    const customRenderer = createAutoFieldRenderer(() => null)

    const manager = createAutoFieldTypeManagerWithDefaults([
      { id: 'custom', match: () => true, component: customRenderer, priority: 50 }
    ])

    const renderers = manager.getRenderers()

    // Custom should be first (priority 50)
    expect(renderers[0].id).toBe('custom')

    // Defaults should follow in order
    const defaultIds = renderers.slice(1).map(r => r.id)
    expect(defaultIds).toContain('zod-number')
    expect(defaultIds).toContain('zod-string')
    expect(defaultIds).toContain('fallback')
  })

  it('should have fallback renderer as last', () => {
    const manager = createAutoFieldTypeManagerWithDefaults()
    const renderers = manager.getRenderers()

    expect(renderers[renderers.length - 1].id).toBe('fallback')
  })
})

describe('integration: type manager with form schema', () => {
  const userSchema = z.object({
    name: z.string(),
    email: z.string().email(),
    age: z.number().min(0),
    isActive: z.boolean(),
    birthDate: z.date(),
    tags: z.array(z.string())
  })

  it('should find appropriate renderers for all user schema fields', () => {
    const manager = createAutoFieldTypeManagerWithDefaults()

    // Each field type should find a renderer
    expect(manager.findRenderer(z.string())).not.toBeNull()
    expect(manager.findRenderer(z.number())).not.toBeNull()
    expect(manager.findRenderer(z.boolean())).not.toBeNull()
    expect(manager.findRenderer(z.date())).not.toBeNull()
  })

  it('should handle complex nested schemas', () => {
    const complexSchema = z.object({
      user: z.object({
        profile: z.object({
          name: z.string(),
          settings: z.record(z.boolean())
        })
      }),
      items: z.array(z.object({
        id: z.number(),
        value: z.string()
      }))
    })

    const manager = createAutoFieldTypeManagerWithDefaults()

    // String and number fields inside nested structures should still match
    expect(manager.findRenderer(z.string())).not.toBeNull()
    expect(manager.findRenderer(z.number())).not.toBeNull()
    expect(manager.findRenderer(z.boolean())).not.toBeNull()
  })
})
