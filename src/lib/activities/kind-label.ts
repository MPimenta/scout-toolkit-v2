/** A format or focus as the API embeds it in an activity. */
export interface NamedValue {
  name: string;
}

/** The part of an activity that says what kind it is and what it works on. */
export interface KindSource {
  format?: NamedValue | null;
  focus?: NamedValue | null;
  secondary_focus?: NamedValue | null;
}

/**
 * The names that describe an activity, in reading order: format, main focus and, when asked for,
 * the secondary focus. Values the activity does not have are left out.
 */
export function activityKindParts(activity: KindSource, options: { secondary?: boolean } = {}): string[] {
  const parts = [activity.format?.name, activity.focus?.name];
  if (options.secondary) parts.push(activity.secondary_focus?.name);
  return parts.filter((part): part is string => Boolean(part));
}

/** `Formato · Foco` (or with the secondary focus), or an empty string when the activity has neither. */
export function activityKindLabel(activity: KindSource, options: { secondary?: boolean } = {}): string {
  return activityKindParts(activity, options).join(' · ');
}
