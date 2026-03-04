import { describe, expect, it, vi } from 'vitest'
import { dataAttr } from '../src/utils/data-attr'
import { mergeReactProps } from '../src/utils/merge-react-props'
import { omit } from '../src/utils/omit'
import { isPromise } from '../src/utils/types'

describe('utility helpers', () => {
  it('composes handlers and merges style/className in mergeReactProps', () => {
    const parentClick = vi.fn()
    const childClick = vi.fn()

    const merged = mergeReactProps(
      {
        onClick: parentClick,
        style: { color: 'red', padding: 4 },
        className: 'parent',
        asChild: true
      },
      {
        onClick: childClick,
        style: { color: 'blue' },
        className: 'child',
        asChild: false
      }
    )

    merged.onClick('event')
    expect(childClick).toHaveBeenCalledWith('event')
    expect(parentClick).toHaveBeenCalledWith('event')
    expect(merged.style).toEqual({ color: 'blue', padding: 4 })
    expect(merged.className).toBe('parent child')
    expect(merged.asChild).toBe(false)
  })

  it('uses parent handler when child handler is missing', () => {
    const parentClick = vi.fn()
    const merged = mergeReactProps({ onClick: parentClick }, {})
    merged.onClick?.('x')
    expect(parentClick).toHaveBeenCalledWith('x')
  })

  it('detects promises and thenables', async () => {
    expect(isPromise(Promise.resolve(1))).toBe(true)
    expect(isPromise({ then: () => {} } as any)).toBe(true)
    expect(isPromise(123 as any)).toBe(false)
    expect(isPromise(undefined as any)).toBeFalsy()
  })

  it('omits keys from object', () => {
    const val = omit({ a: 1, b: 2, c: 3 }, 'b')
    expect(val).toEqual({ a: 1, c: 3 })
  })

  it('converts value to data attribute', () => {
    expect(dataAttr(true)).toBe('true')
    expect(dataAttr(1)).toBe('true')
    expect(dataAttr(false)).toBeUndefined()
    expect(dataAttr(null)).toBeUndefined()
  })
})
