import { NextResponse } from "next/server";

/**
 * Looks a pincode up so checkout can fill in city and state.
 *
 * It goes through the server rather than straight from the browser so the
 * CSP can stay closed to third-party hosts, and so the answer — which never
 * changes in practice — is cached for a month instead of being asked for again
 * by every shopper who types the same pincode.
 *
 * It only ever helps: any failure answers `found: false` and the shopper types
 * their city by hand, exactly as before. A third-party outage must not be able
 * to block an order.
 */
const SIX_DIGITS = /^[1-9]\d{5}$/;

interface PostOffice {
  Name?: string;
  District?: string;
  Block?: string;
  State?: string;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ pin: string }> }
) {
  const { pin } = await params;
  if (!SIX_DIGITS.test(pin)) {
    return NextResponse.json({ found: false }, { status: 400 });
  }

  try {
    const response = await fetch(`https://api.postalpincode.in/pincode/${pin}`, {
      next: { revalidate: 60 * 60 * 24 * 30 },
      signal: AbortSignal.timeout(4000),
    });
    if (!response.ok) return NextResponse.json({ found: false });

    const body = (await response.json()) as Array<{
      Status?: string;
      PostOffice?: PostOffice[] | null;
    }>;
    const office = body?.[0]?.Status === "Success" ? body[0].PostOffice?.[0] : undefined;
    if (!office?.State) return NextResponse.json({ found: false });

    // Block is the town for most rural offices, District the nearest city; a
    // courier's address book wants the latter, which is also what people write.
    const city = (office.District ?? office.Block ?? "").trim();
    return NextResponse.json(
      { found: true, city, state: office.State.trim() },
      { headers: { "Cache-Control": "public, s-maxage=2592000, stale-while-revalidate=86400" } }
    );
  } catch {
    return NextResponse.json({ found: false });
  }
}
