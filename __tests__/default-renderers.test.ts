import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import {
  BooleanFieldRenderer,
  DateFieldRenderer,
  defaultAutoFieldRenderers,
  fallbackAutoFieldRenderer,
  FallbackFieldRenderer,
  NumberFieldRenderer,
  StringFieldRenderer
} from '../src/auto-field/default-renderers'

describe('defaultAutoFieldRenderers', () => {
  it('should have 4 default renderers', () => {
    expect(defaultAutoFieldRenderers).toHaveLength(4)
  })

  it('should have correct ids', () => {
    const ids = defaultAutoFieldRenderers.map(r => r.id)
    expect(ids).toContain('zod-number')
    expect(ids).toContain('zod-boolean')
    expect(ids).toContain('zod-date')
    expect(ids).toContain('zod-string')
  })

  it('should have negative priorities', () => {
    for (const renderer of defaultAutoFieldRenderers) {
      expect(renderer.priority).toBeLessThan(0)
    }
  })

  describe('number renderer', () => {
    const numberConfig = defaultAutoFieldRenderers.find(r => r.id === 'zod-number')!

    it('should match z.number()', () => {
      expect(numberConfig.match(z.number())).toBe(true)
    })

    it('should match z.number().int()', () => {
      expect(numberConfig.match(z.number().int())).toBe(true)
    })

    it('should not match z.string()', () => {
      expect(numberConfig.match(z.string())).toBe(false)
    })

    it('should have priority -100', () => {
      expect(numberConfig.priority).toBe(-100)
    })

    it('should have NumberFieldRenderer component', () => {
      expect(numberConfig.component).toBe(NumberFieldRenderer)
    })
  })

  describe('boolean renderer', () => {
    const booleanConfig = defaultAutoFieldRenderers.find(r => r.id === 'zod-boolean')!

    it('should match z.boolean()', () => {
      expect(booleanConfig.match(z.boolean())).toBe(true)
    })

    it('should not match z.string()', () => {
      expect(booleanConfig.match(z.string())).toBe(false)
    })

    it('should have priority -100', () => {
      expect(booleanConfig.priority).toBe(-100)
    })

    it('should have BooleanFieldRenderer component', () => {
      expect(booleanConfig.component).toBe(BooleanFieldRenderer)
    })
  })

  describe('date renderer', () => {
    const dateConfig = defaultAutoFieldRenderers.find(r => r.id === 'zod-date')!

    it('should match z.date()', () => {
      expect(dateConfig.match(z.date())).toBe(true)
    })

    it('should not match z.string()', () => {
      expect(dateConfig.match(z.string())).toBe(false)
    })

    it('should have priority -100', () => {
      expect(dateConfig.priority).toBe(-100)
    })

    it('should have DateFieldRenderer component', () => {
      expect(dateConfig.component).toBe(DateFieldRenderer)
    })
  })

  describe('string renderer', () => {
    const stringConfig = defaultAutoFieldRenderers.find(r => r.id === 'zod-string')!

    it('should match z.string()', () => {
      expect(stringConfig.match(z.string())).toBe(true)
    })

    it('should match z.string().email()', () => {
      expect(stringConfig.match(z.string().email())).toBe(true)
    })

    it('should not match z.number()', () => {
      expect(stringConfig.match(z.number())).toBe(false)
    })

    it('should have lower priority than other defaults (-200)', () => {
      expect(stringConfig.priority).toBe(-200)
    })

    it('should have StringFieldRenderer component', () => {
      expect(stringConfig.component).toBe(StringFieldRenderer)
    })
  })
})

describe('fallbackAutoFieldRenderer', () => {
  it('should have id "fallback"', () => {
    expect(fallbackAutoFieldRenderer.id).toBe('fallback')
  })

  it('should match any type', () => {
    expect(fallbackAutoFieldRenderer.match(z.string())).toBe(true)
    expect(fallbackAutoFieldRenderer.match(z.number())).toBe(true)
    expect(fallbackAutoFieldRenderer.match(z.boolean())).toBe(true)
    expect(fallbackAutoFieldRenderer.match(z.object({}))).toBe(true)
    expect(fallbackAutoFieldRenderer.match(z.array(z.string()))).toBe(true)
    expect(fallbackAutoFieldRenderer.match(z.any())).toBe(true)
  })

  it('should have lowest priority (-1000)', () => {
    expect(fallbackAutoFieldRenderer.priority).toBe(-1000)
  })

  it('should use FallbackFieldRenderer (same as StringFieldRenderer)', () => {
    expect(fallbackAutoFieldRenderer.component).toBe(FallbackFieldRenderer)
    expect(FallbackFieldRenderer).toBe(StringFieldRenderer)
  })
})

describe('renderer priority ordering', () => {
  it('should order: custom (positive) > default (-100) > string (-200) > fallback (-1000)', () => {
    const priorities = [
      ...defaultAutoFieldRenderers.map(r => ({ id: r.id, priority: r.priority! })),
      { id: fallbackAutoFieldRenderer.id, priority: fallbackAutoFieldRenderer.priority! }
    ].sort((a, b) => b.priority - a.priority)

    // String should be after number, boolean, date (all -100)
    const stringIndex = priorities.findIndex(p => p.id === 'zod-string')
    const numberIndex = priorities.findIndex(p => p.id === 'zod-number')
    const fallbackIndex = priorities.findIndex(p => p.id === 'fallback')

    expect(stringIndex).toBeGreaterThan(numberIndex)
    expect(fallbackIndex).toBeGreaterThan(stringIndex)
  })
})
