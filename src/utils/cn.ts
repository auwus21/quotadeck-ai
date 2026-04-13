import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind CSS classes with conflict resolution.
 *
 * Uses `clsx` for conditional class joining and `tailwind-merge`
 * to resolve conflicting Tailwind utilities (e.g., `p-2 p-4` → `p-4`).
 *
 * @param inputs - Class values to merge (strings, arrays, objects)
 * @returns Merged class string with conflicts resolved
 *
 * @example
 * ```ts
 * cn("p-2 bg-red-500", isActive && "bg-blue-500")
 * // → "p-2 bg-blue-500" (when isActive is true)
 * ```
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
