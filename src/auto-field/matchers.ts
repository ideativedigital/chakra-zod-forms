import { ZodTypeAny } from 'zod'
import { isZodObject, isZodString } from '../utils/zod-type-utils'
import { ZodTypeMatcher } from './type-manager'

/**
 * Helper to check Zod type trait (supports both Zod v3 and v4)
 */
const hasZodTrait = (obj: any, traitName: string): boolean => {
  if (typeof obj !== 'object' || obj === null) return false
  if (obj._zod?.traits instanceof Set) {
    return obj._zod.traits.has(traitName)
  }
  return obj._def?.typeName === traitName
}

/**
 * Get metadata from a Zod type (supports both Zod v3 and v4)
 */
const getZodMeta = (zodType: ZodTypeAny): Record<string, any> | undefined => {
  // Zod v4: call .meta() with no arguments to retrieve metadata
  if (typeof (zodType as any).meta === 'function') {
    try {
      const meta = (zodType as any).meta()
      if (meta && typeof meta === 'object' && Object.keys(meta).length > 0) {
        return meta
      }
    } catch {
      // Ignore errors
    }
  }

  // Zod v3: metadata might be in _def
  return (zodType as any)._def?.meta
}

/**
 * Get description from a Zod type (supports both Zod v3 and v4)
 */
const getZodDescription = (zodType: ZodTypeAny): string | undefined => {
  // Zod v4
  const v4Desc = (zodType as any)._zod?.def?.description || (zodType as any)._zod?.bag?.description
  if (v4Desc) return v4Desc

  // Zod v3
  return (zodType as any)._def?.description || (zodType as any).description
}

/**
 * Get the shape keys from a Zod object type
 */
const getObjectShapeKeys = (zodType: ZodTypeAny): string[] => {
  if (!isZodObject(zodType)) return []
  const shape = (zodType as any).shape || (zodType as any)._zod?.def?.shape || (zodType as any)._def?.shape
  return shape ? Object.keys(shape) : []
}

/**
 * Get the shape from a Zod object type
 */
const getObjectShape = (zodType: ZodTypeAny): Record<string, ZodTypeAny> | undefined => {
  if (!isZodObject(zodType)) return undefined
  return (zodType as any).shape || (zodType as any)._zod?.def?.shape || (zodType as any)._def?.shape
}

// ============================================================================
// Matcher Factories
// ============================================================================

/**
 * Creates a matcher for objects that have all the specified keys
 * 
 * @example
 * ```tsx
 * // Match any object with street, city, and zip fields
 * const isAddress = matchesObjectWithKeys(['street', 'city', 'zip'])
 * 
 * manager.register({
 *   id: 'address',
 *   match: isAddress,
 *   component: AddressFieldRenderer,
 *   priority: 10
 * })
 * ```
 */
export function matchesObjectWithKeys(requiredKeys: string[]): ZodTypeMatcher {
  return (zodType: ZodTypeAny) => {
    if (!isZodObject(zodType)) return false
    const shapeKeys = getObjectShapeKeys(zodType)
    return requiredKeys.every(key => shapeKeys.includes(key))
  }
}

/**
 * Creates a matcher for objects that have exactly the specified keys (no more, no less)
 * 
 * @example
 * ```tsx
 * // Match objects with exactly these fields
 * const isCoordinate = matchesObjectWithExactKeys(['lat', 'lng'])
 * ```
 */
export function matchesObjectWithExactKeys(exactKeys: string[]): ZodTypeMatcher {
  return (zodType: ZodTypeAny) => {
    if (!isZodObject(zodType)) return false
    const shapeKeys = getObjectShapeKeys(zodType)
    if (shapeKeys.length !== exactKeys.length) return false
    return exactKeys.every(key => shapeKeys.includes(key))
  }
}

/**
 * Creates a matcher for types with specific metadata
 * Use with .meta() in Zod v4 or custom metadata in v3
 * 
 * @example
 * ```tsx
 * // Define schema with metadata
 * const addressSchema = z.object({...}).meta({ fieldType: 'address' })
 * 
 * // Match by metadata
 * const isAddress = matchesMeta('fieldType', 'address')
 * ```
 */
export function matchesMeta(key: string, value: any): ZodTypeMatcher {
  return (zodType: ZodTypeAny) => {
    const meta = getZodMeta(zodType)
    return meta?.[key] === value
  }
}

/**
 * Creates a matcher for types with metadata containing the specified key
 * 
 * @example
 * ```tsx
 * const hasCustomRenderer = matchesMetaKey('customRenderer')
 * ```
 */
export function matchesMetaKey(key: string): ZodTypeMatcher {
  return (zodType: ZodTypeAny) => {
    const meta = getZodMeta(zodType)
    return meta !== undefined && key in meta
  }
}

/**
 * Creates a matcher for types with a specific description
 * Use with .describe() in Zod
 * 
 * @example
 * ```tsx
 * // Define schema with description
 * const addressSchema = z.object({...}).describe('address')
 * 
 * // Match by description
 * const isAddress = matchesDescription('address')
 * ```
 */
export function matchesDescription(description: string): ZodTypeMatcher {
  return (zodType: ZodTypeAny) => {
    return getZodDescription(zodType) === description
  }
}

/**
 * Creates a matcher for types with a description containing the specified substring
 * 
 * @example
 * ```tsx
 * const isAddressLike = matchesDescriptionContains('address')
 * ```
 */
export function matchesDescriptionContains(substring: string): ZodTypeMatcher {
  return (zodType: ZodTypeAny) => {
    const desc = getZodDescription(zodType)
    return desc !== undefined && desc.toLowerCase().includes(substring.toLowerCase())
  }
}

/**
 * Creates a matcher for string types with a specific format (Zod v4)
 * 
 * @example
 * ```tsx
 * const isEmail = matchesStringFormat('email')
 * const isUrl = matchesStringFormat('url')
 * const isUuid = matchesStringFormat('uuid')
 * ```
 */
export function matchesStringFormat(format: string): ZodTypeMatcher {
  return (zodType: ZodTypeAny) => {
    if (!isZodString(zodType)) return false
    // Zod v4 stores format directly on the type
    return (zodType as any).format === format
  }
}

/**
 * Creates a matcher that checks if the shape fields match specific types
 * 
 * @example
 * ```tsx
 * // Match objects where 'amount' is a number and 'currency' is a string
 * const isMoney = matchesObjectShape({
 *   amount: isZodNumber,
 *   currency: isZodString
 * })
 * ```
 */
export function matchesObjectShape(
  shapeMatchers: Record<string, ZodTypeMatcher>
): ZodTypeMatcher {
  return (zodType: ZodTypeAny) => {
    const shape = getObjectShape(zodType)
    if (!shape) return false

    for (const [key, matcher] of Object.entries(shapeMatchers)) {
      const fieldType = shape[key]
      if (!fieldType || !matcher(fieldType)) return false
    }
    return true
  }
}

/**
 * Creates a matcher that matches a specific schema instance.
 *
 * Useful when you reuse a schema constant and want to bind a renderer
 * to that exact schema (including optional/nullable/default wrappers
 * thanks to unwrapping in `zodTypeAtPath`).
 *
 * @example
 * ```tsx
 * const Amount = z.object({
 *   currency: z.string(),
 *   amount: z.number(),
 * })
 *
 * manager.register({
 *   id: 'amount',
 *   match: matches(Amount),
 *   component: AmountRenderer,
 *   priority: 10,
 * })
 * ```
 */
export function matches(schema: ZodTypeAny): ZodTypeMatcher {
  return (zodType: ZodTypeAny) => zodType === schema
}

/**
 * Combines multiple matchers with AND logic
 * 
 * @example
 * ```tsx
 * const isSpecialAddress = and(
 *   matchesObjectWithKeys(['street', 'city', 'zip']),
 *   matchesMeta('fieldType', 'address')
 * )
 * ```
 */
export function and(...matchers: ZodTypeMatcher[]): ZodTypeMatcher {
  return (zodType: ZodTypeAny) => matchers.every(m => m(zodType))
}

/**
 * Combines multiple matchers with OR logic
 * 
 * @example
 * ```tsx
 * const isAddressOrLocation = or(
 *   matchesObjectWithKeys(['street', 'city', 'zip']),
 *   matchesObjectWithKeys(['lat', 'lng'])
 * )
 * ```
 */
export function or(...matchers: ZodTypeMatcher[]): ZodTypeMatcher {
  return (zodType: ZodTypeAny) => matchers.some(m => m(zodType))
}

/**
 * Negates a matcher
 * 
 * @example
 * ```tsx
 * const isNotString = not(isZodString)
 * ```
 */
export function not(matcher: ZodTypeMatcher): ZodTypeMatcher {
  return (zodType: ZodTypeAny) => !matcher(zodType)
}
