/**
 * How a customer reaches a human.
 *
 * Kept in one place because the number appears on the product page, and will
 * appear in order emails and on the confirmation page next. Overridable by
 * environment so it can be changed without a code edit — worth having, because
 * a number registered with Meta's WhatsApp Cloud API cannot also receive
 * messages in the WhatsApp app, and if that turns out to be the case here this
 * has to point somewhere else.
 */

/** Digits only, with country code — the form wa.me expects. */
export const SUPPORT_WHATSAPP =
  process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP ?? "918852825511";

/** Display form, as an Indian customer would read it. */
export const SUPPORT_WHATSAPP_DISPLAY =
  process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP_DISPLAY ?? "+91 88528 25511";

export const SUPPORT_HOURS =
  process.env.NEXT_PUBLIC_SUPPORT_HOURS ?? "Mon–Sat, 12pm–7pm";

/**
 * A wa.me link that opens the chat with the question half-written.
 *
 * The context matters: "I have a question" from an unknown number is a
 * conversation that starts with two rounds of "about which product?".
 */
export function whatsAppLink(context?: string): string {
  const message = context
    ? `Hi! I have a question about ${context}.`
    : "Hi! I have a question.";
  return `https://wa.me/${SUPPORT_WHATSAPP}?text=${encodeURIComponent(message)}`;
}
