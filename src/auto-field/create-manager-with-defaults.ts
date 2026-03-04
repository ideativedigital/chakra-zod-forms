import { defaultAutoFieldRenderers, fallbackAutoFieldRenderer } from './default-renderers'
import {
  AutoFieldTypeConfig,
  AutoFieldTypeManager,
  createAutoFieldTypeManager
} from './type-manager'

/**
 * Creates a type manager with default renderers pre-registered
 * Use this when you want to extend the defaults with your own renderers
 *
 * @example
 * ```tsx
 * import { createAutoFieldTypeManagerWithDefaults, isZodString } from 'zod-forms'
 *
 * const manager = createAutoFieldTypeManagerWithDefaults([
 *   {
 *     id: 'email-input',
 *     match: (z) => isZodString(z) && z._def.checks?.some(c => c.kind === 'email'),
 *     component: EmailInput,
 *     priority: 10 // Higher priority than defaults
 *   }
 * ])
 *
 * <AutoFieldTypeManagerProvider manager={manager}>
 *   <MyForm />
 * </AutoFieldTypeManagerProvider>
 * ```
 */
export function createAutoFieldTypeManagerWithDefaults(
  customRenderers: AutoFieldTypeConfig[] = []
): AutoFieldTypeManager {
  return createAutoFieldTypeManager([
    ...customRenderers,
    ...defaultAutoFieldRenderers,
    fallbackAutoFieldRenderer
  ])
}
