import { describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import {
  ObjectKeysEnum,
  isZodDiscriminatedUnion,
  isZodEffects,
  isZodNativeEnum,
  keys,
  validate,
  zUrl,
  zodTypeAtPath
} from '../src/utils/zod-type-utils'

describe('zod-type-utils extra coverage', () => {
  it('validate creates a type guard', () => {
    const isPositive = validate<number>((n) => typeof n === 'number' && n > 0)
    expect(isPositive(10)).toBe(true)
    expect(isPositive(-1)).toBe(false)
  })

  it('keys and ObjectKeysEnum use object keys', () => {
    const map = { active: 1, pending: 2, archived: 3 }
    expect(keys(map)).toEqual(['active', 'pending', 'archived'])
    const EnumSchema = ObjectKeysEnum(map)
    expect(EnumSchema.safeParse('active').success).toBe(true)
    expect(EnumSchema.safeParse('missing').success).toBe(false)
  })

  it('detects effects/discriminated/native enums', () => {
    const transformed = z.string().transform((s) => s.trim())
    expect(isZodEffects(transformed as any)).toBe(true)

    const dUnion = z.discriminatedUnion('kind', [
      z.object({ kind: z.literal('a'), value: z.string() }),
      z.object({ kind: z.literal('b'), value: z.number() })
    ])
    expect(isZodDiscriminatedUnion(dUnion as any)).toBe(true)

    expect(isZodNativeEnum({ _def: { typeName: 'ZodNativeEnum' } } as any)).toBe(true)
  })

  it('zUrl normalizes valid URLs and allows template placeholders', () => {
    const schema = zUrl()
    expect(schema.parse('example.com')).toBe('https://example.com/')
    expect(schema.parse('https://site.dev')).toBe('https://site.dev/')
    expect(schema.parse('${ENV_URL}')).toBe('${ENV_URL}')
    expect(schema.parse('{dynamicUrl}')).toBe('{dynamicUrl}')
  })

  it('zUrl returns validation issue for invalid URL', () => {
    const schema = zUrl({ urlMessage: 'Bad URL' })
    const result = schema.safeParse('://not-valid')
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe('Bad URL')
    }
  })

  it('zodTypeAtPath handles null root and non-numeric array path', () => {
    const nullRoot = zodTypeAtPath(undefined as any, 'anything' as any)
    expect((nullRoot as any)._def?.typeName === 'ZodAny' || (nullRoot as any)?._zod).toBeTruthy()

    const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
    const schema = z.object({
      list: z.array(z.object({ name: z.string() }))
    })

    const t = zodTypeAtPath(schema, 'list.name' as any)
    expect(t).toBeDefined()
    expect(spy).toHaveBeenCalled()
    spy.mockRestore()
  })

  it('zodTypeAtPath unwraps optional/effects wrappers across v3/v4-like shapes', () => {
    const v4LikeOptional = {
      _zod: {
        traits: new Set(['ZodOptional']),
        def: { innerType: z.object({ v: z.string() }) }
      }
    }
    const res1 = zodTypeAtPath(v4LikeOptional as any, 'v' as any)
    expect(res1).toBeDefined()

    const v3LikeOptional = {
      _def: { typeName: 'ZodOptional', innerType: z.object({ v: z.number() }) }
    }
    const res2 = zodTypeAtPath(v3LikeOptional as any, 'v' as any)
    expect(res2).toBeDefined()

    const v3LikeEffects = {
      _def: { typeName: 'ZodEffects', schema: z.object({ s: z.string() }) }
    }
    const res3 = zodTypeAtPath(v3LikeEffects as any, 's' as any)
    expect(res3).toBeDefined()

    const effectsWithoutInner = {
      _zod: { traits: new Set(['ZodEffects']) }
    }
    const res4 = zodTypeAtPath(effectsWithoutInner as any, '' as any)
    expect(res4).toBeDefined()
  })
})
