'use client'

import React, {
  createContext,
  forwardRef,
  useContext,
  useMemo,
  type ForwardRefExoticComponent,
  type PropsWithChildren,
  type RefAttributes
} from 'react'
import { ControllerRenderProps, FieldPath, FieldPathValue, FieldValues } from 'react-hook-form'
import { ZodType, ZodTypeAny } from 'zod'

/**
 * Props passed to an AutoField renderer component
 */
export type AutoFieldRendererProps<T extends FieldValues = any, P extends FieldPath<T> = any> = {
  /** The field controller from react-hook-form */
  field: ControllerRenderProps<T, P>
  /** The resolved Zod type for this field */
  zodType: ZodType<FieldPathValue<T, P>>
  /** Additional props passed to AutoField */
  props: Record<string, any>
}

/**
 * A component that renders a field based on its Zod type
 */
export type AutoFieldRenderer = ForwardRefExoticComponent<
  AutoFieldRendererProps & RefAttributes<HTMLElement>
>

/**
 * A function that determines if a renderer should handle a given Zod type
 */
export type ZodTypeMatcher = (zodType: ZodTypeAny) => boolean

/**
 * Configuration for a registered AutoField renderer
 */
export type AutoFieldTypeConfig = {
  /** Unique identifier for this renderer */
  id: string
  /** Function to determine if this renderer handles the given Zod type */
  match: ZodTypeMatcher
  /** The component to render for matching types */
  component: AutoFieldRenderer
  /** Priority for matching (higher = checked first). Default is 0 */
  priority?: number
}

/**
 * Registry entry with resolved priority
 */
type RegistryEntry = AutoFieldTypeConfig & { priority: number }

/**
 * Creates an AutoField type manager for registering custom field renderers
 */
export function createAutoFieldTypeManager(initialRenderers: AutoFieldTypeConfig[] = []) {
  const entries: RegistryEntry[] = initialRenderers.map(r => ({
    ...r,
    priority: r.priority ?? 0
  }))

  // Sort by priority (descending)
  const sortByPriority = () => {
    entries.sort((a, b) => b.priority - a.priority)
  }

  sortByPriority()

  return {
    /**
     * Register a new renderer for a Zod type
     */
    register(config: AutoFieldTypeConfig): void {
      const existing = entries.findIndex(e => e.id === config.id)
      const entry: RegistryEntry = { ...config, priority: config.priority ?? 0 }

      if (existing >= 0) {
        entries[existing] = entry
      } else {
        entries.push(entry)
      }
      sortByPriority()
    },

    /**
     * Unregister a renderer by id
     */
    unregister(id: string): void {
      const index = entries.findIndex(e => e.id === id)
      if (index >= 0) {
        entries.splice(index, 1)
      }
    },

    /**
     * Find the renderer that matches the given Zod type
     */
    findRenderer(zodType: ZodTypeAny): AutoFieldRenderer | null {
      for (const entry of entries) {
        if (entry.match(zodType)) {
          return entry.component
        }
      }
      return null
    },

    /**
     * Get all registered renderers
     */
    getRenderers(): readonly RegistryEntry[] {
      return entries
    },

    /**
     * Clear all registered renderers
     */
    clear(): void {
      entries.length = 0
    }
  }
}

export type AutoFieldTypeManager = ReturnType<typeof createAutoFieldTypeManager>

// Default global manager instance
const defaultManager = createAutoFieldTypeManager()

// Context for the type manager
const AutoFieldTypeManagerContext = createContext<AutoFieldTypeManager>(defaultManager)

/**
 * Provider component for the AutoField type manager
 *
 * @example
 * ```tsx
 * const customManager = createAutoFieldTypeManager([
 *   {
 *     id: 'email',
 *     match: (z) => isZodString(z) && z._def.checks?.some(c => c.kind === 'email'),
 *     component: EmailInput,
 *     priority: 10
 *   }
 * ])
 *
 * <AutoFieldTypeManagerProvider manager={customManager}>
 *   <MyForm />
 * </AutoFieldTypeManagerProvider>
 * ```
 */
export function AutoFieldTypeManagerProvider({
  manager,
  children
}: PropsWithChildren<{ manager: AutoFieldTypeManager }>) {
  return (
    <AutoFieldTypeManagerContext.Provider value={manager}>
      {children}
    </AutoFieldTypeManagerContext.Provider>
  )
}

/**
 * Hook to access the current AutoField type manager
 */
export function useAutoFieldTypeManager(): AutoFieldTypeManager {
  return useContext(AutoFieldTypeManagerContext)
}

/**
 * Hook to create a local type manager that extends the parent manager
 *
 * @example
 * ```tsx
 * const localManager = useExtendedAutoFieldTypeManager([
 *   { id: 'currency', match: isCurrency, component: CurrencyInput, priority: 5 }
 * ])
 * ```
 */
export function useExtendedAutoFieldTypeManager(
  additionalRenderers: AutoFieldTypeConfig[]
): AutoFieldTypeManager {
  const parentManager = useAutoFieldTypeManager()

  return useMemo(() => {
    // Create new manager with parent's renderers plus additional ones
    const parentRenderers = [...parentManager.getRenderers()]
    return createAutoFieldTypeManager([...parentRenderers, ...additionalRenderers])
  }, [parentManager, additionalRenderers])
}

/**
 * Helper to create an AutoField renderer component with proper typing
 *
 * @example
 * ```tsx
 * const EmailInput = createAutoFieldRenderer((props, ref) => {
 *   const { field, zodType, props: inputProps } = props
 *   return <input type="email" {...field} {...inputProps} ref={ref} />
 * })
 * ```
 */
export function createAutoFieldRenderer(
  render: (
    props: AutoFieldRendererProps,
    ref: React.ForwardedRef<HTMLElement>
  ) => React.ReactElement | null
): AutoFieldRenderer {
  return forwardRef<HTMLElement, AutoFieldRendererProps>(render)
}

/**
 * Get the default global type manager
 */
export function getDefaultAutoFieldTypeManager(): AutoFieldTypeManager {
  return defaultManager
}
