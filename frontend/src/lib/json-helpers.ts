/**
 * Safe JSON parsing utilities
 * Provides error handling for JSON parsing to prevent crashes
 */

/**
 * Safely parses JSON string
 * @param json - JSON string to parse (can be null)
 * @param fallback - Fallback value if parsing fails
 * @param context - Context description for better debugging
 * @returns Parsed object or fallback value
 */
export const safeJsonParse = <T>(
  json: string | null,
  fallback: T,
  context: string = 'JSON data'
): T => {
  if (!json) {
    return fallback;
  }

  try {
    return JSON.parse(json) as T;
  } catch (error) {
    console.error(`[JSON Parse Error] ${context}:`, error);
    // TODO: Send to error tracking service (e.g., Sentry)
    return fallback;
  }
};

/**
 * Safely stringifies an object to JSON
 * @param obj - Object to stringify
 * @param fallback - Fallback value if stringification fails
 * @param context - Context description for better debugging
 * @returns JSON string or fallback value
 */
export const safeJsonStringify = <T>(
  obj: T,
  fallback: string,
  context: string = 'Object'
): string => {
  try {
    return JSON.stringify(obj);
  } catch (error) {
    console.error(`[JSON Stringify Error] ${context}:`, error);
    return fallback;
  }
};
