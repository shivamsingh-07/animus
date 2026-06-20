type ClassValue = string | number | false | null | undefined;

/**
 * Tiny `classNames` helper — filters out falsy values and joins the rest.
 * Keeps JSX class composition readable without pulling in a dependency.
 */
export function cn(...classes: ClassValue[]): string {
  return classes.filter(Boolean).join(' ');
}
