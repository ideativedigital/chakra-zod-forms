export type AnyObject = Record<string, unknown>

export type MaybePromise<T> = T | Promise<T>

export const isPromise = <T>(value: MaybePromise<T>): value is Promise<T> =>
    value && (value instanceof Promise || (typeof value === 'object' && 'then' in value))