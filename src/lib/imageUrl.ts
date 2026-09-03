/**
 * Validation for images supplied as an already-hosted URL rather than an
 * upload. Every admin screen that takes an image offers this, so the rule
 * lives in one place and matches the backend's ImageUrlUtil.
 */

const IMAGE_URL_PATTERN = /^https?:\/\/\S+$/i;

export const IMAGE_URL_HINT = "Enter a full image address starting with http:// or https://";

/** True when the value looks like an absolute web address we can store. */
export function isValidImageUrl(value: string): boolean {
  return IMAGE_URL_PATTERN.test(value.trim());
}

/**
 * Validates a URL as typed.
 *
 * @returns the trimmed URL, or an `error` describing why it can't be used.
 *   A blank value returns neither — "nothing entered" is a normal state on
 *   every form that also offers a file upload.
 */
export function parseImageUrl(value: string): { url?: string; error?: string } {
  const trimmed = value.trim();
  if (!trimmed) return {};
  if (!isValidImageUrl(trimmed)) return { error: IMAGE_URL_HINT };
  return { url: trimmed };
}
