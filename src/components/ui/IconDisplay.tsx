import { cn } from '@/lib/utils';
import { validateProps } from '@/lib/validation';
import { specificSchemas } from '@/lib/validation/component-schemas';

/**
 * Props for the IconDisplay component
 */
interface IconDisplayProps {
  icon: string;
  text?: string;
  className?: string;
  iconClassName?: string;
  textClassName?: string;
  fallback?: string;
}

/**
 * IconDisplay component for displaying icons with optional text
 * Provides consistent styling and fallback handling for icons
 * @param icon - The icon to display (emoji or icon string)
 * @param text - Optional text to display alongside the icon
 * @param className - Optional CSS classes for the container
 * @param iconClassName - Optional CSS classes for the icon
 * @param textClassName - Optional CSS classes for the text
 * @param fallback - Fallback icon if the main icon is not available
 * @returns JSX element representing the icon display
 */
export function IconDisplay({ 
  icon, 
  text, 
  className, 
  iconClassName,
  textClassName,
  fallback = '📋' 
}: IconDisplayProps) {
  // Validate props in development
  if (process.env.NODE_ENV === 'development') {
    validateProps({ icon, text, className, iconClassName, textClassName, fallback }, specificSchemas.iconDisplay, 'IconDisplay');
  }
  const displayIcon = icon || fallback;
  
  return (
    <span className={cn('inline-flex items-center gap-1', className)}>
      <span className={cn('text-sm', iconClassName)} role="img" aria-label={text || 'Icon'}>
        {displayIcon}
      </span>
      {text && <span className={cn('text-sm', textClassName)}>{text}</span>}
    </span>
  );
}
