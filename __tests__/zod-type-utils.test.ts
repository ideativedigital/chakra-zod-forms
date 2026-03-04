import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import {
  isZodArray,
  isZodBoolean,
  isZodDate,
  isZodDefault,
  isZodEnum,
  isZodNullable,
  isZodNumber,
  isZodObject,
  isZodOptional,
  isZodRecord,
  isZodString,
  isZodType,
  isZodUnion,
  zodTypeAtPath
} from '../src/utils/zod-type-utils'

describe('Zod type guards', () => {
  describe('isZodNumber', () => {
    it('should return true for ZodNumber', () => {
      expect(isZodNumber(z.number())).toBe(true)
      expect(isZodNumber(z.number().int())).toBe(true)
      expect(isZodNumber(z.number().positive())).toBe(true)
    })

    it('should return false for non-number types', () => {
      expect(isZodNumber(z.string())).toBe(false)
      expect(isZodNumber(z.boolean())).toBe(false)
      expect(isZodNumber(null)).toBe(false)
      expect(isZodNumber(undefined)).toBe(false)
    })
  })

  describe('isZodString', () => {
    it('should return true for ZodString', () => {
      expect(isZodString(z.string())).toBe(true)
      expect(isZodString(z.string().email())).toBe(true)
      expect(isZodString(z.string().url())).toBe(true)
    })

    it('should return false for non-string types', () => {
      expect(isZodString(z.number())).toBe(false)
      expect(isZodString(z.boolean())).toBe(false)
    })
  })

  describe('isZodBoolean', () => {
    it('should return true for ZodBoolean', () => {
      expect(isZodBoolean(z.boolean())).toBe(true)
    })

    it('should return false for non-boolean types', () => {
      expect(isZodBoolean(z.string())).toBe(false)
      expect(isZodBoolean(z.number())).toBe(false)
    })
  })

  describe('isZodDate', () => {
    it('should return true for ZodDate', () => {
      expect(isZodDate(z.date())).toBe(true)
    })

    it('should return false for non-date types', () => {
      expect(isZodDate(z.string())).toBe(false)
      expect(isZodDate(z.number())).toBe(false)
    })
  })

  describe('isZodObject', () => {
    it('should return true for ZodObject', () => {
      expect(isZodObject(z.object({}))).toBe(true)
      expect(isZodObject(z.object({ name: z.string() }))).toBe(true)
    })

    it('should return false for non-object types', () => {
      expect(isZodObject(z.string())).toBe(false)
      expect(isZodObject(z.array(z.string()))).toBe(false)
    })
  })

  describe('isZodArray', () => {
    it('should return true for ZodArray', () => {
      expect(isZodArray(z.array(z.string()))).toBe(true)
      expect(isZodArray(z.array(z.number()))).toBe(true)
    })

    it('should return false for non-array types', () => {
      expect(isZodArray(z.string())).toBe(false)
      expect(isZodArray(z.object({}))).toBe(false)
    })
  })

  describe('isZodOptional', () => {
    it('should return true for optional types', () => {
      expect(isZodOptional(z.string().optional())).toBe(true)
      expect(isZodOptional(z.number().optional())).toBe(true)
    })

    it('should return false for required types', () => {
      expect(isZodOptional(z.string())).toBe(false)
      expect(isZodOptional(z.number())).toBe(false)
    })
  })

  describe('isZodNullable', () => {
    it('should return true for nullable types', () => {
      expect(isZodNullable(z.string().nullable())).toBe(true)
      expect(isZodNullable(z.number().nullable())).toBe(true)
    })

    it('should return false for non-nullable types', () => {
      expect(isZodNullable(z.string())).toBe(false)
      expect(isZodNullable(z.number())).toBe(false)
    })
  })

  describe('isZodDefault', () => {
    it('should return true for types with defaults', () => {
      expect(isZodDefault(z.string().default('test'))).toBe(true)
      expect(isZodDefault(z.number().default(0))).toBe(true)
    })

    it('should return false for types without defaults', () => {
      expect(isZodDefault(z.string())).toBe(false)
      expect(isZodDefault(z.number())).toBe(false)
    })
  })

  describe('isZodEnum', () => {
    it('should return true for ZodEnum', () => {
      expect(isZodEnum(z.enum(['a', 'b', 'c']))).toBe(true)
    })

    it('should return false for non-enum types', () => {
      expect(isZodEnum(z.string())).toBe(false)
      expect(isZodEnum(z.union([z.literal('a'), z.literal('b')]))).toBe(false)
    })
  })

  describe('isZodUnion', () => {
    it('should return true for ZodUnion', () => {
      expect(isZodUnion(z.union([z.string(), z.number()]))).toBe(true)
    })

    it('should return false for non-union types', () => {
      expect(isZodUnion(z.string())).toBe(false)
      expect(isZodUnion(z.enum(['a', 'b']))).toBe(false)
    })
  })

  describe('isZodRecord', () => {
    it('should return true for ZodRecord', () => {
      expect(isZodRecord(z.record(z.string(), z.string()))).toBe(true)
      expect(isZodRecord(z.record(z.string(), z.number()))).toBe(true)
    })

    it('should return false for non-record types', () => {
      expect(isZodRecord(z.object({}))).toBe(false)
      expect(isZodRecord(z.array(z.string()))).toBe(false)
    })
  })

  describe('isZodType', () => {
    it('should return true for any Zod type', () => {
      expect(isZodType(z.string())).toBe(true)
      expect(isZodType(z.number())).toBe(true)
      expect(isZodType(z.object({}))).toBe(true)
      expect(isZodType(z.array(z.string()))).toBe(true)
    })

    it('should return false for non-Zod values', () => {
      expect(isZodType(null)).toBe(false)
      expect(isZodType(undefined)).toBe(false)
      expect(isZodType('string')).toBe(false)
      expect(isZodType(123)).toBe(false)
      expect(isZodType({})).toBe(false)
    })
  })
})

describe('zodTypeAtPath', () => {
  const schema = z.object({
    name: z.string(),
    age: z.number(),
    email: z.string().email(),
    address: z.object({
      street: z.string(),
      city: z.string(),
      zip: z.number()
    }),
    tags: z.array(z.string()),
    // Use two-argument form for Zod v4 compatibility
    settings: z.record(z.string(), z.boolean())
  })

  it('should return root type for empty path', () => {
    const result = zodTypeAtPath(schema, '' as any)
    expect(isZodObject(result)).toBe(true)
  })

  it('should return type for top-level field', () => {
    expect(isZodString(zodTypeAtPath(schema, 'name'))).toBe(true)
    expect(isZodNumber(zodTypeAtPath(schema, 'age'))).toBe(true)
  })

  it('should return type for nested field', () => {
    expect(isZodString(zodTypeAtPath(schema, 'address.street'))).toBe(true)
    expect(isZodNumber(zodTypeAtPath(schema, 'address.zip'))).toBe(true)
  })

  it('should return element type for array path', () => {
    expect(isZodString(zodTypeAtPath(schema, 'tags.0'))).toBe(true)
    expect(isZodString(zodTypeAtPath(schema, 'tags.5'))).toBe(true)
  })

  it('should return value type for record path', () => {
    expect(isZodBoolean(zodTypeAtPath(schema, 'settings.anyKey'))).toBe(true)
  })

  it('should handle optional fields', () => {
    const optionalSchema = z.object({
      name: z.string().optional()
    })
    const result = zodTypeAtPath(optionalSchema, 'name')
    // The unwrapping happens inside zodTypeAtPath
    expect(isZodString(result)).toBe(true)
  })

  it('should handle nullable fields', () => {
    const nullableSchema = z.object({
      name: z.string().nullable()
    })
    const result = zodTypeAtPath(nullableSchema, 'name')
    expect(isZodString(result)).toBe(true)
  })

  it('should handle deeply nested paths', () => {
    const deepSchema = z.object({
      level1: z.object({
        level2: z.object({
          level3: z.object({
            value: z.boolean()
          })
        })
      })
    })
    const result = zodTypeAtPath(deepSchema, 'level1.level2.level3.value')
    expect(isZodBoolean(result)).toBe(true)
  })

  it('should handle discriminated unions', () => {
    const unionSchema = z.discriminatedUnion('type', [
      z.object({ type: z.literal('a'), value: z.string() }),
      z.object({ type: z.literal('b'), count: z.number() })
    ])

    const wrapped = z.object({ item: unionSchema })

    // Should find 'value' field from first option
    const valueResult = zodTypeAtPath(wrapped, 'item.value')
    expect(isZodString(valueResult)).toBe(true)
  })

  it('should return z.any() for invalid paths', () => {
    const result = zodTypeAtPath(schema, 'nonexistent' as any)
    // When path doesn't exist, it returns z.any()
    // Check for both Zod v3 and v4 structure
    const isAny = result?._def?.typeName === 'ZodAny' ||
      (result as any)?._zod?.traits?.has?.('ZodAny') ||
      result?.constructor?.name === 'ZodAny'
    expect(isAny).toBe(true)
  })
})
