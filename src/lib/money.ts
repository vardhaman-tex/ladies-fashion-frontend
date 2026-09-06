/**
 * One place that turns a rupee amount into something a shopper reads.
 *
 * The product detail page used to print `₹{price.toFixed(2)}` while the product
 * cards directly beneath it printed `₹{price.toLocaleString("en-IN")}`, so the
 * same suit was ₹1500.00 in the buying decision and ₹1,500 in the row of
 * suggestions under it. Two formatters is one too many: a trailing `.00` reads
 * like a database dump rather than a price tag, and Indian digit grouping
 * (1,50,000 rather than 150,000) is what the number is expected to look like.
 */

/**
 * Formats an amount as rupees.
 *
 * Whole rupees print without decimals — every price in the catalogue is a whole
 * number, and `.00` is noise. A fractional amount keeps both decimal places
 * rather than being rounded, because rounding a price is a lie about what the
 * customer will be charged, and `₹1,399.5` is not a way to write money.
 */
export function inr(amount: number): string {
  const fractionDigits = Number.isInteger(amount) ? 0 : 2;
  return `₹${amount.toLocaleString("en-IN", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  })}`;
}
