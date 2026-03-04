import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import {
  createAutoFieldRenderer,
  createAutoFieldTypeManager
} from '../src/auto-field/type-manager'
import { isZodNumber, isZodString } from '../src/utils/zod-type-utils'

// Mock renderer components
const mockNumberRenderer = createAutoFieldRenderer(() => null)
const mockStringRenderer = createAutoFieldRenderer(() => null)
const mockBooleanRenderer = createAutoFieldRenderer(() => null)
const mockCustomRenderer = createAutoFieldRenderer(() => null)

describe('createAutoFieldTypeManager', () => {
  describe('basic operations', () => {
    it('should create an empty manager', () => {
      const manager = createAutoFieldTypeManager()
      expect(manager.getRenderers()).toHaveLength(0)
    })

    it('should create a manager with initial renderers', () => {
      const manager = createAutoFieldTypeManager([
        { id: 'number', match: isZodNumber, component: mockNumberRenderer }
      ])
      expect(manager.getRenderers()).toHaveLength(1)
    })

    it('should register a new renderer', () => {
      const manager = createAutoFieldTypeManager()
      manager.register({ id: 'string', match: isZodString, component: mockStringRenderer })
      expect(manager.getRenderers()).toHaveLength(1)
    })

    it('should unregister a renderer by id', () => {
      const manager = createAutoFieldTypeManager([
        { id: 'number', match: isZodNumber, component: mockNumberRenderer }
      ])
      manager.unregister('number')
      expect(manager.getRenderers()).toHaveLength(0)
    })

    it('should replace existing renderer with same id', () => {
      const manager = createAutoFieldTypeManager([
        { id: 'number', match: isZodNumber, component: mockNumberRenderer, priority: 0 }
      ])
      manager.register({ id: 'number', match: isZodNumber, component: mockCustomRenderer, priority: 10 })
      expect(manager.getRenderers()).toHaveLength(1)
      expect(manager.getRenderers()[0].component).toBe(mockCustomRenderer)
    })

    it('should clear all renderers', () => {
      const manager = createAutoFieldTypeManager([
        { id: 'number', match: isZodNumber, component: mockNumberRenderer },
        { id: 'string', match: isZodString, component: mockStringRenderer }
      ])
      manager.clear()
      expect(manager.getRenderers()).toHaveLength(0)
    })
  })

  describe('findRenderer', () => {
    it('should find renderer for matching Zod type', () => {
      const manager = createAutoFieldTypeManager([
        { id: 'number', match: isZodNumber, component: mockNumberRenderer },
        { id: 'string', match: isZodString, component: mockStringRenderer }
      ])

      const numberSchema = z.number()
      const stringSchema = z.string()

      expect(manager.findRenderer(numberSchema)).toBe(mockNumberRenderer)
      expect(manager.findRenderer(stringSchema)).toBe(mockStringRenderer)
    })

    it('should return null when no renderer matches', () => {
      const manager = createAutoFieldTypeManager([
        { id: 'number', match: isZodNumber, component: mockNumberRenderer }
      ])

      const stringSchema = z.string()
      expect(manager.findRenderer(stringSchema)).toBeNull()
    })

    it('should match wrapped types (optional, nullable)', () => {
      // Note: The matching is done on the raw type, so we need to test
      // what the actual implementation does with unwrapped types
      const manager = createAutoFieldTypeManager([
        { id: 'number', match: isZodNumber, component: mockNumberRenderer }
      ])

      const optionalNumber = z.number().optional()
      // The match function receives the type as-is, unwrapping happens in AutoField
      // So this should NOT match since isZodNumber checks typeName directly
      expect(manager.findRenderer(optionalNumber)).toBeNull()
    })
  })

  describe('priority ordering', () => {
    it('should sort renderers by priority (highest first)', () => {
      const manager = createAutoFieldTypeManager([
        { id: 'low', match: () => true, component: mockNumberRenderer, priority: -100 },
        { id: 'high', match: () => true, component: mockStringRenderer, priority: 100 },
        { id: 'medium', match: () => true, component: mockBooleanRenderer, priority: 0 }
      ])

      const renderers = manager.getRenderers()
      expect(renderers[0].id).toBe('high')
      expect(renderers[1].id).toBe('medium')
      expect(renderers[2].id).toBe('low')
    })

    it('should find higher priority renderer first', () => {
      const lowPriorityRenderer = createAutoFieldRenderer(() => null)
      const highPriorityRenderer = createAutoFieldRenderer(() => null)

      const manager = createAutoFieldTypeManager([
        { id: 'low', match: isZodNumber, component: lowPriorityRenderer, priority: -100 },
        { id: 'high', match: isZodNumber, component: highPriorityRenderer, priority: 100 }
      ])

      const numberSchema = z.number()
      expect(manager.findRenderer(numberSchema)).toBe(highPriorityRenderer)
    })

    it('should default priority to 0', () => {
      const manager = createAutoFieldTypeManager([
        { id: 'no-priority', match: () => true, component: mockNumberRenderer }
      ])

      expect(manager.getRenderers()[0].priority).toBe(0)
    })

    it('should re-sort after registering new renderer', () => {
      const manager = createAutoFieldTypeManager([
        { id: 'low', match: () => true, component: mockNumberRenderer, priority: -100 }
      ])

      manager.register({ id: 'high', match: () => true, component: mockStringRenderer, priority: 100 })

      const renderers = manager.getRenderers()
      expect(renderers[0].id).toBe('high')
      expect(renderers[1].id).toBe('low')
    })
  })

  describe('custom matchers', () => {
    it('should support custom match functions', () => {
      // Custom matcher for email strings - supports both Zod v3 and v4
      const isEmailString = (zodType: z.ZodTypeAny) => {
        if (!isZodString(zodType)) return false
        // Zod v4: check format property directly
        if ((zodType as any).format === 'email') return true
        // Zod v3: check _def.checks
        const checks = (zodType as any)._def?.checks
        return checks?.some((c: any) => c.kind === 'email') ?? false
      }

      const emailRenderer = createAutoFieldRenderer(() => null)

      const manager = createAutoFieldTypeManager([
        { id: 'email', match: isEmailString, component: emailRenderer, priority: 10 },
        { id: 'string', match: isZodString, component: mockStringRenderer, priority: 0 }
      ])

      const emailSchema = z.string().email()
      const plainString = z.string()

      // Use config id to verify correct renderer was found
      const foundEmail = manager.findRenderer(emailSchema)
      const foundString = manager.findRenderer(plainString)
      expect(manager.getRenderers().find(r => r.component === foundEmail)?.id).toBe('email')
      expect(manager.getRenderers().find(r => r.component === foundString)?.id).toBe('string')
    })

    it('should support matching by Zod type name', () => {
      // Support both Zod v3 and v4
      const isZodEnum = (zodType: z.ZodTypeAny) => {
        // Zod v4: check traits
        if ((zodType as any)._zod?.traits?.has('ZodEnum')) return true
        // Zod v3: check _def.typeName
        return (zodType as any)._def?.typeName === 'ZodEnum'
      }

      const enumRenderer = createAutoFieldRenderer(() => null)

      const manager = createAutoFieldTypeManager([
        { id: 'enum', match: isZodEnum, component: enumRenderer }
      ])

      const enumSchema = z.enum(['a', 'b', 'c'])
      const found = manager.findRenderer(enumSchema)
      expect(found).not.toBeNull()
      expect(manager.getRenderers().find(r => r.component === found)?.id).toBe('enum')
    })
  })
})

describe('createAutoFieldRenderer', () => {
  it('should create a forwardRef component', () => {
    const renderer = createAutoFieldRenderer((props, ref) => null)
    expect(renderer).toBeDefined()
    // ForwardRef components have a $$typeof symbol
    expect((renderer as any).$$typeof).toBeDefined()
  })
})
