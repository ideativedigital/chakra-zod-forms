import { describe, expect, it, vi } from 'vitest'
import { mergeRefs } from '../src/hooks/use-merge-refs'

describe('mergeRefs helper', () => {
  it('writes to callback and object refs, ignoring null refs', () => {
    const callbackRef = vi.fn()
    const objectRef = { current: null as HTMLInputElement | null }

    const merged = mergeRefs<HTMLInputElement>([callbackRef, objectRef, null, undefined])
    const el = document.createElement('input')
    merged(el)

    expect(callbackRef).toHaveBeenCalledWith(el)
    expect(objectRef.current).toBe(el)
  })
})
