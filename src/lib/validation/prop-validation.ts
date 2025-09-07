// Component Prop Validation Utilities
// Provides runtime validation for React component props

import { z } from 'zod';
import { log } from '@/lib/errors';

/**
 * Validates component props using Zod schemas
 * @param props - The props object to validate
 * @param schema - The Zod schema to validate against
 * @param componentName - The name of the component for error logging
 * @returns The validated props or throws an error
 */
export function validateProps<T>(
  props: unknown,
  schema: z.ZodSchema<T>,
  componentName: string
): T {
  try {
    return schema.parse(props);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessage = `Invalid props for ${componentName}: ${error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`;
      log.error('Component prop validation failed', error, {
        componentName,
        props,
        validationErrors: error.issues
      });
      throw new Error(errorMessage);
    }
    throw error;
  }
}

/**
 * Validates component props with a fallback to default values
 * @param props - The props object to validate
 * @param schema - The Zod schema to validate against
 * @param defaults - Default values to use if validation fails
 * @param componentName - The name of the component for error logging
 * @returns The validated props or default values
 */
export function validatePropsWithDefaults<T>(
  props: unknown,
  schema: z.ZodSchema<T>,
  defaults: T,
  componentName: string
): T {
  try {
    return schema.parse(props);
  } catch (error) {
    if (error instanceof z.ZodError) {
      log.warn('Component prop validation failed, using defaults', {
        componentName,
        props,
        validationErrors: error.issues,
        defaults
      });
      return defaults;
    }
    throw error;
  }
}

/**
 * Creates a prop validation schema for common component props
 */
export const commonPropSchemas = {
  /**
   * Schema for components with optional className and children
   */
  baseComponent: z.object({
    className: z.string().optional(),
    children: z.any().optional(),
  }),

  /**
   * Schema for components with required id prop
   */
  withId: z.object({
    id: z.string().min(1, 'ID is required'),
  }),

  /**
   * Schema for components with optional callback functions
   */
  withCallbacks: z.object({
    onSuccess: z.function().optional(),
    onError: z.function().optional(),
    onCancel: z.function().optional(),
  }),

  /**
   * Schema for modal components
   */
  modal: z.object({
    open: z.boolean(),
    onClose: z.function(),
  }),

  /**
   * Schema for form components
   */
  form: z.object({
    onSubmit: z.function(),
    onCancel: z.function().optional(),
    loading: z.boolean().optional(),
    error: z.string().optional(),
  }),
};

/**
 * Validates that required props are present
 * @param props - The props object to validate
 * @param requiredProps - Array of required prop names
 * @param componentName - The name of the component for error logging
 * @throws Error if any required props are missing
 */
export function validateRequiredProps(
  props: Record<string, unknown>,
  requiredProps: string[],
  componentName: string
): void {
  const missingProps = requiredProps.filter(prop => 
    props[prop] === undefined || props[prop] === null
  );

  if (missingProps.length > 0) {
    const errorMessage = `Missing required props for ${componentName}: ${missingProps.join(', ')}`;
    log.error('Component missing required props', undefined, {
      componentName,
      missingProps,
      availableProps: Object.keys(props)
    });
    throw new Error(errorMessage);
  }
}

/**
 * Validates that callback props are functions
 * @param props - The props object to validate
 * @param callbackProps - Array of callback prop names
 * @param componentName - The name of the component for error logging
 * @throws Error if any callback props are not functions
 */
export function validateCallbackProps(
  props: Record<string, unknown>,
  callbackProps: string[],
  componentName: string
): void {
  const invalidCallbacks = callbackProps.filter(prop => 
    props[prop] !== undefined && typeof props[prop] !== 'function'
  );

  if (invalidCallbacks.length > 0) {
    const errorMessage = `Invalid callback props for ${componentName}: ${invalidCallbacks.join(', ')} must be functions`;
    log.error('Component has invalid callback props', undefined, {
      componentName,
      invalidCallbacks,
      callbackProps
    });
    throw new Error(errorMessage);
  }
}

/**
 * Validates that string props are non-empty
 * @param props - The props object to validate
 * @param stringProps - Array of string prop names
 * @param componentName - The name of the component for error logging
 * @throws Error if any string props are empty
 */
export function validateStringProps(
  props: Record<string, unknown>,
  stringProps: string[],
  componentName: string
): void {
  const emptyStrings = stringProps.filter(prop => 
    props[prop] !== undefined && (typeof props[prop] !== 'string' || (props[prop] as string).trim() === '')
  );

  if (emptyStrings.length > 0) {
    const errorMessage = `Empty string props for ${componentName}: ${emptyStrings.join(', ')}`;
    log.error('Component has empty string props', undefined, {
      componentName,
      emptyStrings,
      stringProps
    });
    throw new Error(errorMessage);
  }
}
