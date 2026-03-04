import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { createAutoFieldTypeManagerWithDefaults } from '../src/auto-field/create-manager-with-defaults'
import {
  and,
  matches,
  matchesDescription,
  matchesDescriptionContains,
  matchesMeta,
  matchesMetaKey,
  matchesObjectShape,
  matchesObjectWithExactKeys,
  matchesObjectWithKeys,
  matchesStringFormat,
  not,
  or
} from '../src/auto-field/matchers'
import {
  createAutoFieldRenderer,
  createAutoFieldTypeManager
} from '../src/auto-field/type-manager'
import { isZodNumber, isZodString } from '../src/utils/zod-type-utils'

describe('Object Key Matchers', () => {
  describe('matchesObjectWithKeys', () => {
    it('should match objects containing all required keys', () => {
      const matcher = matchesObjectWithKeys(['street', 'city', 'zip'])

      const addressSchema = z.object({
        street: z.string(),
        city: z.string(),
        zip: z.string(),
        country: z.string() // Extra key is OK
      })

      expect(matcher(addressSchema)).toBe(true)
    })

    it('should not match objects missing required keys', () => {
      const matcher = matchesObjectWithKeys(['street', 'city', 'zip'])

      const partialSchema = z.object({
        street: z.string(),
        city: z.string()
        // Missing zip
      })

      expect(matcher(partialSchema)).toBe(false)
    })

    it('should not match non-object types', () => {
      const matcher = matchesObjectWithKeys(['foo'])

      expect(matcher(z.string())).toBe(false)
      expect(matcher(z.number())).toBe(false)
      expect(matcher(z.array(z.string()))).toBe(false)
    })
  })

  describe('matchesObjectWithExactKeys', () => {
    it('should match objects with exactly the specified keys', () => {
      const matcher = matchesObjectWithExactKeys(['lat', 'lng'])

      const coordSchema = z.object({
        lat: z.number(),
        lng: z.number()
      })

      expect(matcher(coordSchema)).toBe(true)
    })

    it('should not match objects with extra keys', () => {
      const matcher = matchesObjectWithExactKeys(['lat', 'lng'])

      const extendedSchema = z.object({
        lat: z.number(),
        lng: z.number(),
        altitude: z.number()
      })

      expect(matcher(extendedSchema)).toBe(false)
    })

    it('should not match objects with missing keys', () => {
      const matcher = matchesObjectWithExactKeys(['lat', 'lng'])

      const partialSchema = z.object({
        lat: z.number()
      })

      expect(matcher(partialSchema)).toBe(false)
    })
  })
})

describe('Metadata Matchers', () => {
  describe('matchesMeta', () => {
    it('should match types with specific metadata value', () => {
      const matcher = matchesMeta('fieldType', 'address')

      // Zod v4 uses .meta()
      const schemaWithMeta = z.object({
        street: z.string()
      }).meta({ fieldType: 'address' })

      expect(matcher(schemaWithMeta)).toBe(true)
    })

    it('should not match types without the metadata', () => {
      const matcher = matchesMeta('fieldType', 'address')

      const schemaWithoutMeta = z.object({
        street: z.string()
      })

      expect(matcher(schemaWithoutMeta)).toBe(false)
    })

    it('should not match types with different metadata value', () => {
      const matcher = matchesMeta('fieldType', 'address')

      const schemaWithDifferentMeta = z.object({
        street: z.string()
      }).meta({ fieldType: 'location' })

      expect(matcher(schemaWithDifferentMeta)).toBe(false)
    })
  })

  describe('matchesMetaKey', () => {
    it('should match types that have the metadata key', () => {
      const matcher = matchesMetaKey('customRenderer')

      const schemaWithMeta = z.string().meta({ customRenderer: 'MyRenderer' })

      expect(matcher(schemaWithMeta)).toBe(true)
    })

    it('should not match types without the metadata key', () => {
      const matcher = matchesMetaKey('customRenderer')

      const schemaWithoutKey = z.string().meta({ otherKey: 'value' })

      expect(matcher(schemaWithoutKey)).toBe(false)
    })
  })
})

describe('Description Matchers', () => {
  describe('matchesDescription', () => {
    it('should match types with exact description', () => {
      const matcher = matchesDescription('address')

      const schema = z.object({
        street: z.string()
      }).describe('address')

      expect(matcher(schema)).toBe(true)
    })

    it('should not match types with different description', () => {
      const matcher = matchesDescription('address')

      const schema = z.object({
        street: z.string()
      }).describe('location')

      expect(matcher(schema)).toBe(false)
    })
  })

  describe('matchesDescriptionContains', () => {
    it('should match types with description containing substring', () => {
      const matcher = matchesDescriptionContains('address')

      const schema = z.object({
        street: z.string()
      }).describe('Billing address for the customer')

      expect(matcher(schema)).toBe(true)
    })

    it('should be case insensitive', () => {
      const matcher = matchesDescriptionContains('ADDRESS')

      const schema = z.object({
        street: z.string()
      }).describe('billing address')

      expect(matcher(schema)).toBe(true)
    })
  })
})

describe('String Format Matchers', () => {
  describe('matchesStringFormat', () => {
    it('should match email strings', () => {
      const matcher = matchesStringFormat('email')

      expect(matcher(z.string().email())).toBe(true)
      expect(matcher(z.string())).toBe(false)
    })

    it('should match url strings', () => {
      const matcher = matchesStringFormat('url')

      expect(matcher(z.string().url())).toBe(true)
      expect(matcher(z.string())).toBe(false)
    })

    it('should match uuid strings', () => {
      const matcher = matchesStringFormat('uuid')

      expect(matcher(z.string().uuid())).toBe(true)
      expect(matcher(z.string())).toBe(false)
    })
  })
})

describe('Shape Type Matchers', () => {
  describe('matchesObjectShape', () => {
    it('should match objects where fields match the specified type matchers', () => {
      const matcher = matchesObjectShape({
        amount: isZodNumber,
        currency: isZodString
      })

      const moneySchema = z.object({
        amount: z.number(),
        currency: z.string()
      })

      expect(matcher(moneySchema)).toBe(true)
    })

    it('should not match if field types do not match', () => {
      const matcher = matchesObjectShape({
        amount: isZodNumber,
        currency: isZodString
      })

      const wrongTypes = z.object({
        amount: z.string(), // Wrong: should be number
        currency: z.string()
      })

      expect(matcher(wrongTypes)).toBe(false)
    })

    it('should not match if fields are missing', () => {
      const matcher = matchesObjectShape({
        amount: isZodNumber,
        currency: isZodString
      })

      const missingField = z.object({
        amount: z.number()
        // Missing currency
      })

      expect(matcher(missingField)).toBe(false)
    })
  })

  describe('matches', () => {
    it('should match the exact same schema instance', () => {
      const Amount = z.object({
        currency: z.string(),
        amount: z.number()
      })

      const matcher = matches(Amount)
      expect(matcher(Amount)).toBe(true)
    })

    it('should not match a different schema instance with same shape', () => {
      const AmountA = z.object({
        currency: z.string(),
        amount: z.number()
      })
      const AmountB = z.object({
        currency: z.string(),
        amount: z.number()
      })

      const matcher = matches(AmountA)
      expect(matcher(AmountB)).toBe(false)
    })

    it('should still work with optional wrappers after unwrapping', () => {
      const Amount = z.object({
        currency: z.string(),
        amount: z.number()
      })
      const FormSchema = z.object({
        price: Amount.optional()
      })

      const extracted = (FormSchema.shape as any).price.unwrap()
      const matcher = matches(Amount)
      expect(matcher(extracted)).toBe(true)
    })
  })
})

describe('Logical Combinators', () => {
  describe('and', () => {
    it('should match when all matchers match', () => {
      const matcher = and(
        matchesObjectWithKeys(['street', 'city']),
        matchesDescription('address')
      )

      const schema = z.object({
        street: z.string(),
        city: z.string()
      }).describe('address')

      expect(matcher(schema)).toBe(true)
    })

    it('should not match when any matcher fails', () => {
      const matcher = and(
        matchesObjectWithKeys(['street', 'city']),
        matchesDescription('address')
      )

      const schemaWithoutDesc = z.object({
        street: z.string(),
        city: z.string()
      })

      expect(matcher(schemaWithoutDesc)).toBe(false)
    })
  })

  describe('or', () => {
    it('should match when any matcher matches', () => {
      const matcher = or(
        matchesObjectWithKeys(['street', 'city', 'zip']),
        matchesObjectWithKeys(['line1', 'city', 'postalCode'])
      )

      const usAddress = z.object({
        street: z.string(),
        city: z.string(),
        zip: z.string()
      })

      const ukAddress = z.object({
        line1: z.string(),
        city: z.string(),
        postalCode: z.string()
      })

      expect(matcher(usAddress)).toBe(true)
      expect(matcher(ukAddress)).toBe(true)
    })

    it('should not match when no matchers match', () => {
      const matcher = or(
        matchesObjectWithKeys(['foo']),
        matchesObjectWithKeys(['bar'])
      )

      const schema = z.object({ baz: z.string() })

      expect(matcher(schema)).toBe(false)
    })
  })

  describe('not', () => {
    it('should negate the matcher', () => {
      const notString = not(isZodString)

      expect(notString(z.number())).toBe(true)
      expect(notString(z.string())).toBe(false)
    })
  })
})

describe('Integration: Amount object with custom AutoField renderer', () => {
  // Define the amount schema: { currency: string, value: number }
  const amountSchema = z.object({
    currency: z.string(),
    value: z.number()
  })

  // Schema with amount field nested in a form
  const formSchema = z.object({
    name: z.string(),
    price: amountSchema,
    discount: amountSchema.optional()
  })

  describe('matching amount objects', () => {
    it('should match amount objects using matchesObjectWithExactKeys', () => {
      const isAmount = matchesObjectWithExactKeys(['currency', 'value'])

      expect(isAmount(amountSchema)).toBe(true)
    })

    it('should match amount objects using matchesObjectShape', () => {
      const isAmount = matchesObjectShape({
        currency: isZodString,
        value: isZodNumber
      })

      expect(isAmount(amountSchema)).toBe(true)
    })

    it('should not match objects with wrong field types', () => {
      const isAmount = matchesObjectShape({
        currency: isZodString,
        value: isZodNumber
      })

      const wrongSchema = z.object({
        currency: z.number(), // Wrong type
        value: z.number()
      })

      expect(isAmount(wrongSchema)).toBe(false)
    })

    it('should not match objects with extra fields when using exact keys', () => {
      const isAmountExact = matchesObjectWithExactKeys(['currency', 'value'])

      const extendedSchema = z.object({
        currency: z.string(),
        value: z.number(),
        formatted: z.string() // Extra field
      })

      expect(isAmountExact(extendedSchema)).toBe(false)
    })

    it('should match objects with extra fields when using matchesObjectShape', () => {
      const isAmount = matchesObjectShape({
        currency: isZodString,
        value: isZodNumber
      })

      const extendedSchema = z.object({
        currency: z.string(),
        value: z.number(),
        formatted: z.string() // Extra field is OK with shape matching
      })

      expect(isAmount(extendedSchema)).toBe(true)
    })
  })

  describe('registering amount renderer with type manager', () => {
    it('should find custom amount renderer when registered', () => {
      const amountRenderer = createAutoFieldRenderer(() => null)

      const isAmount = matchesObjectShape({
        currency: isZodString,
        value: isZodNumber
      })

      const manager = createAutoFieldTypeManager([
        {
          id: 'amount',
          match: isAmount,
          component: amountRenderer,
          priority: 10
        }
      ])

      const foundRenderer = manager.findRenderer(amountSchema)
      expect(foundRenderer).toBe(amountRenderer)
    })

    it('should find amount renderer with higher priority than defaults', () => {
      const amountRenderer = createAutoFieldRenderer(() => null)

      const isAmount = matchesObjectShape({
        currency: isZodString,
        value: isZodNumber
      })

      const manager = createAutoFieldTypeManagerWithDefaults([
        {
          id: 'amount',
          match: isAmount,
          component: amountRenderer,
          priority: 10
        }
      ])

      const foundRenderer = manager.findRenderer(amountSchema)
      expect(foundRenderer).toBe(amountRenderer)

      // Verify renderer id
      const foundConfig = manager.getRenderers().find((r: any) => r.component === foundRenderer)
      expect(foundConfig?.id).toBe('amount')
    })

    it('should still find default renderers for non-amount fields', () => {
      const amountRenderer = createAutoFieldRenderer(() => null)

      const isAmount = matchesObjectShape({
        currency: isZodString,
        value: isZodNumber
      })

      const manager = createAutoFieldTypeManagerWithDefaults([
        {
          id: 'amount',
          match: isAmount,
          component: amountRenderer,
          priority: 10
        }
      ])

      // String fields should use default string renderer
      const stringRenderer = manager.findRenderer(z.string())
      const stringConfig = manager.getRenderers().find((r: any) => r.component === stringRenderer)
      expect(stringConfig?.id).toBe('zod-string')

      // Number fields should use default number renderer
      const numberRenderer = manager.findRenderer(z.number())
      const numberConfig = manager.getRenderers().find((r: any) => r.component === numberRenderer)
      expect(numberConfig?.id).toBe('zod-number')
    })
  })

  describe('matching with metadata', () => {
    it('should match amount with metadata annotation', () => {
      const amountWithMeta = z.object({
        currency: z.string(),
        value: z.number()
      }).meta({ fieldType: 'amount' })

      const isAmountByMeta = matchesMeta('fieldType', 'amount')

      expect(isAmountByMeta(amountWithMeta)).toBe(true)
      expect(isAmountByMeta(amountSchema)).toBe(false) // No meta
    })

    it('should combine shape and metadata matching with and()', () => {
      const isAmountComplete = and(
        matchesObjectShape({
          currency: isZodString,
          value: isZodNumber
        }),
        matchesMeta('fieldType', 'amount')
      )

      const amountWithMeta = z.object({
        currency: z.string(),
        value: z.number()
      }).meta({ fieldType: 'amount' })

      const amountWithoutMeta = z.object({
        currency: z.string(),
        value: z.number()
      })

      const wrongFieldsWithMeta = z.object({
        foo: z.string(),
        bar: z.number()
      }).meta({ fieldType: 'amount' })

      expect(isAmountComplete(amountWithMeta)).toBe(true)
      expect(isAmountComplete(amountWithoutMeta)).toBe(false)
      expect(isAmountComplete(wrongFieldsWithMeta)).toBe(false)
    })
  })

  describe('real-world usage pattern', () => {
    it('should work with a complete form schema containing amount fields', () => {
      const amountRenderer = createAutoFieldRenderer(() => null)

      // Create matcher for amount objects
      const isAmount = matchesObjectShape({
        currency: isZodString,
        value: isZodNumber
      })

      // Create manager with amount renderer
      const manager = createAutoFieldTypeManagerWithDefaults([
        {
          id: 'amount',
          match: isAmount,
          component: amountRenderer,
          priority: 10
        }
      ])

      // Test that the amount field in the form would use the amount renderer
      // In real usage, zodTypeAtPath would extract the nested type
      expect(manager.findRenderer(amountSchema)).toBe(amountRenderer)

      // Test that regular fields still work
      expect(manager.findRenderer(z.string())).not.toBe(amountRenderer)
      expect(manager.findRenderer(z.number())).not.toBe(amountRenderer)
    })

    it('should handle multiple currency formats', () => {
      const amountRenderer = createAutoFieldRenderer(() => null)

      // Match both amount formats: {currency, value} or {currencyCode, amount}
      const isAmount = or(
        matchesObjectShape({
          currency: isZodString,
          value: isZodNumber
        }),
        matchesObjectShape({
          currencyCode: isZodString,
          amount: isZodNumber
        })
      )

      const manager = createAutoFieldTypeManager([
        {
          id: 'amount',
          match: isAmount,
          component: amountRenderer,
          priority: 10
        }
      ])

      const format1 = z.object({ currency: z.string(), value: z.number() })
      const format2 = z.object({ currencyCode: z.string(), amount: z.number() })
      const notAmount = z.object({ foo: z.string(), bar: z.number() })

      expect(manager.findRenderer(format1)).toBe(amountRenderer)
      expect(manager.findRenderer(format2)).toBe(amountRenderer)
      expect(manager.findRenderer(notAmount)).toBeNull()
    })
  })
})

