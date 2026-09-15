/**
 * An error the server refused us with, carrying whatever it said about why.
 *
 * Most refusals only need their message shown. A few have to be acted on, and
 * the server marks those with a `code` — matching on the English sentence
 * instead is how a copy edit silently turns into a broken checkout.
 */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    /** The server's stable identifier for this rule, when it has one. */
    readonly code: string | null = null
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * The customer typed a phone number that already belongs to a registered
 * account. Checkout answers this by offering to sign them in with a code
 * rather than by turning them away.
 */
export const ACCOUNT_EXISTS_PHONE = "ACCOUNT_EXISTS_PHONE";

/**
 * Same for the email, which guest checkout treats as optional — so the way
 * through is to drop it, not to sign in with a number that owns no account.
 */
export const ACCOUNT_EXISTS_EMAIL = "ACCOUNT_EXISTS_EMAIL";

/** The error body every endpoint returns. Every field is best-effort. */
interface ErrorBody {
  message?: string;
  code?: string;
}

/**
 * Turns a failed `fetch` Response into an ApiError, reading the body when
 * there is one. Never throws on its own account: a server that answers with
 * something other than our error shape still has to produce a usable error.
 */
export async function apiErrorFrom(response: Response, fallback: string): Promise<ApiError> {
  const body = (await response.json().catch(() => ({}))) as ErrorBody;
  return new ApiError(body.message ?? fallback, response.status, body.code ?? null);
}
