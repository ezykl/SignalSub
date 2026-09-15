export type ClassValue = string | number | boolean | undefined | null | ClassValue[];

/**
 * Utility for combining conditional class names cleanly in NativeWind.
 * Filters out falsy values and joins valid classes with a single space.
 */
export function cn(...inputs: ClassValue[]): string {
  const classes: string[] = [];

  for (const input of inputs) {
    if (!input) continue;
    if (typeof input === 'string') {
      classes.push(input.trim());
    } else if (Array.isArray(input)) {
      const inner = cn(...input);
      if (inner) classes.push(inner);
    }
  }

  return classes.filter(Boolean).join(' ');
}
