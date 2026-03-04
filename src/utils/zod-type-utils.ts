import { FieldPath, FieldPathValue } from 'react-hook-form'
import {
  ZodArray,
  ZodBoolean,
  ZodDate,
  ZodDefault,
  ZodDiscriminatedUnion,
  ZodEnum,
  ZodNullable,
  ZodNumber,
  ZodObject,
  ZodOptional,
  ZodRecord,
  ZodString,
  ZodType,
  ZodTypeAny,
  ZodUnion,
  z
} from 'zod'
import { AnyObject } from './types'


/**
 * A type guard function that narrows the type of its argument.
 */
export type Validator<T> = (obj: any) => obj is T

/**
 * Creates a type guard (Validator) from a predicate function.
 * @param predicate - A function that returns true if the value matches the expected type
 * @returns A type guard function
 * @example
 * const isPositive = validate<number>(n => typeof n === 'number' && n > 0)
 * if (isPositive(value)) {
 *   // value is typed as number here
 * }
 */
export const validate =
  <T>(predicate: (obj: any) => boolean): Validator<T> =>
    (obj: any): obj is T => {
      return predicate(obj)
    }

/**
 * Helper to check Zod type name - supports both Zod v3 (_def.typeName) and v4 (_zod.traits)
 */
const hasZodTrait = (obj: any, traitName: string): boolean => {
  if (typeof obj !== 'object' || obj === null) return false
  // Zod v4: check _zod.traits Set
  if (obj._zod?.traits instanceof Set) {
    return obj._zod.traits.has(traitName)
  }
  // Zod v3: check _def.typeName
  return obj._def?.typeName === traitName
}

/** Type guard that checks if a Zod type is ZodNumber. */
export const isZodNumber = validate<ZodNumber>(
  o => hasZodTrait(o, 'ZodNumber')
)

/** Type guard that checks if a Zod type is ZodDate. */
export const isZodDate = validate<ZodDate>(
  o => hasZodTrait(o, 'ZodDate')
)

/** Type guard that checks if a Zod type is ZodString. */
export const isZodString = validate<ZodString>(
  o => hasZodTrait(o, 'ZodString')
)

/** Type guard that checks if a Zod type is ZodBoolean. */
export const isZodBoolean = validate<ZodBoolean>(
  o => hasZodTrait(o, 'ZodBoolean')
)

/** Type guard that checks if a value is any Zod type. */
export const isZodType = validate<ZodTypeAny>(
  o => {
    if (typeof o !== 'object' || o === null) return false
    // Zod v4: check for _zod.traits containing 'ZodType'
    if (o._zod?.traits instanceof Set) {
      return o._zod.traits.has('ZodType')
    }
    // Zod v3: check _def.typeName
    return typeof o._def?.typeName === 'string' && o._def.typeName.startsWith('Zod')
  }
)

/**
 * Extracts the keys of an object as a typed array.
 * @param r - The object to get keys from
 * @returns Array of keys with proper typing
 */
export const keys = <K extends string>(r: Record<K, any>): K[] => Object.keys(r) as K[]

/**
 * Creates a Zod enum schema from the keys of an object.
 * @param obj - The object whose keys will become enum values
 * @returns A ZodEnum schema
 * @example
 * const statusMap = { active: 1, inactive: 0 }
 * const StatusEnum = ObjectKeysEnum(statusMap)
 * // StatusEnum accepts 'active' | 'inactive'
 */
export function ObjectKeysEnum<K extends string>(obj: Record<K, any>) {
  return z.enum([keys(obj)[0]!, ...keys(obj)])
}

/** Type guard that checks if a Zod type is ZodObject. */
export const isZodObject = validate<ZodObject<any>>(
  o => hasZodTrait(o, 'ZodObject')
)

/** Type guard that checks if a Zod type is ZodNullable. */
export const isZodNullable = validate<ZodNullable<any>>(
  o => hasZodTrait(o, 'ZodNullable')
)

/** Type guard that checks if a Zod type is ZodOptional. */
export const isZodOptional = validate<ZodOptional<any>>(
  o => hasZodTrait(o, 'ZodOptional')
)

/** Type guard that checks if a Zod type is ZodDefault. */
export const isZodDefault = validate<ZodDefault<any>>(
  o => hasZodTrait(o, 'ZodDefault')
)

/** Type guard that checks if a Zod type is ZodEffects. */
export const isZodEffects = validate<ZodTypeAny>(
  o => hasZodTrait(o, 'ZodEffects') || hasZodTrait(o, 'ZodPipe')
)

/** Type guard that checks if a Zod type is ZodArray. */
export const isZodArray = validate<ZodArray<any>>(
  o => hasZodTrait(o, 'ZodArray')
)

/** Type guard that checks if a Zod type is ZodRecord. */
export const isZodRecord = validate<ZodRecord<any, any>>(
  o => hasZodTrait(o, 'ZodRecord')
)

/** Type guard that checks if a Zod type is ZodEnum. */
export const isZodEnum = validate<ZodEnum<any>>(
  o => hasZodTrait(o, 'ZodEnum')
)

/** Type guard that checks if a Zod type is ZodUnion. */
export const isZodUnion = validate<ZodUnion<any>>(
  o => hasZodTrait(o, 'ZodUnion')
)

/** Type guard that checks if a Zod type is ZodDiscriminatedUnion. */
export const isZodDiscriminatedUnion = validate<ZodDiscriminatedUnion<any, any>>(
  o => hasZodTrait(o, 'ZodDiscriminatedUnion')
)

/** Type guard that checks if a Zod type is ZodNativeEnum. */
export const isZodNativeEnum = validate<ZodTypeAny>(
  o => hasZodTrait(o, 'ZodNativeEnum')
)

/**
 * Get the inner type from a wrapper type (works for both Zod v3 and v4)
 */
const getInnerType = (zType: ZodTypeAny): ZodTypeAny | undefined => {
  // Try Zod v4 structure first
  const innerFromDef = (zType as any)._zod?.def?.innerType
  if (innerFromDef) return innerFromDef

  // Zod v3 structure
  const innerFromV3 = (zType as any)._def?.innerType
  if (innerFromV3) return innerFromV3

  // For effects/transforms, try schema property (v3)
  const schemaFromV3 = (zType as any)._def?.schema
  if (schemaFromV3) return schemaFromV3

  return undefined
}

/**
 * Unwrap a zod type
 * @param zType the zod type to unwrap
 * @returns the unwrapped zod type
 */
const unwrapZType = (zType: ZodTypeAny): ZodTypeAny => {
  if (isZodNullable(zType) || isZodOptional(zType) || isZodDefault(zType)) {
    const inner = getInnerType(zType)
    return inner ? unwrapZType(inner) : zType
  } else if (isZodEffects(zType)) {
    const inner = getInnerType(zType)
    return inner ? unwrapZType(inner) : zType
  } else return zType
}


const schemes = ['http://', 'https://']

/**
 * Creates a Zod string schema that validates and normalizes URLs.
 * Automatically prepends 'https://' if no scheme is provided.
 * Allows template strings starting with '$' or '{' to pass through.
 * @param args - Optional string schema arguments plus custom urlMessage
 * @returns A Zod schema that validates and normalizes URLs
 * @example
 * const schema = z.object({ website: zUrl() })
 * schema.parse({ website: 'example.com' })    // => { website: 'https://example.com/' }
 * schema.parse({ website: 'https://foo.com' }) // => { website: 'https://foo.com/' }
 */
export const zUrl = (args: Parameters<typeof z.string>[0] & { urlMessage?: string } = {}) =>
  z.string(args).transform((s, ctx) => {
    if (s.startsWith('$') || s.startsWith('{')) {
      return s
    }
    const fixed = !schemes.some(sch => s.startsWith(sch)) ? `https://${s}` : s
    const result = z.string().url().safeParse(fixed)
    if (!result.success) {
      ctx.addIssue({
        code: 'invalid_format',
        format: 'url',
        message: args?.urlMessage || 'Invalid URL'
      })
      return z.NEVER
    }
    return new URL(fixed).toString()
  })

export const zodTypeAtPath = <T extends AnyObject, P extends FieldPath<T>>(
  zType: ZodType<T>,
  path: P
): ZodType<FieldPathValue<T, P>> => {
  // Handle null/undefined input
  if (!zType) {
    return z.any() as ZodType<FieldPathValue<T, P>>
  }

  const cleaned = unwrapZType(zType)
  if (path === '') {
    return cleaned as ZodType<FieldPathValue<T, P>>
  }
  const [head, ...tail] = path.split('.')
  const restOfPath = (tail.length === 0 ? '' : tail.join('.')) as P

  if (isZodDiscriminatedUnion(cleaned) || isZodUnion(cleaned)) {
    const found = (cleaned.options as ZodTypeAny[]).filter(isZodObject).find(s => s.shape[head!])
    return found ? zodTypeAtPath(found.shape[head!], restOfPath) : z.any()
  } else if (isZodObject(cleaned)) {
    const nextType = cleaned.shape[head!]
    if (!nextType) return z.any() as ZodType<FieldPathValue<T, P>>
    return zodTypeAtPath(nextType, restOfPath)
  } else if (isZodRecord(cleaned)) {
    return zodTypeAtPath(cleaned.valueType, restOfPath)
  } else if (isZodArray(cleaned)) {
    if (!isNaN(parseInt(head!))) {
      return zodTypeAtPath(cleaned.element, restOfPath)
    } else {
      console.log('remaining path', path, cleaned.element)
      return zodTypeAtPath(cleaned.element, path)
    }
  } else return z.any()
}
