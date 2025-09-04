import { cn } from '@/lib/utils';

interface IconDisplayProps {
  icon: string;
  text?: string;
  className?: string;
  iconClassName?: string;
  textClassName?: string;
  fallback?: string;
}

export function IconDisplay({ 
  icon, 
  text, 
  className, 
  iconClassName,
  textClassName,
  fallback = '📋' 
}: IconDisplayProps) {
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
