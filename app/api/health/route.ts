export const dynamic = "force-dynamic";

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  let ready = false;
  if (url && key) {
    try {
      const response = await fetch(new URL("/rest/v1/membership_plans?select=id&limit=1", url), {
        headers: { apikey: key }, signal: AbortSignal.timeout(2000), cache: "no-store",
      });
      ready = response.ok;
      await response.body?.cancel();
    } catch { /* The status intentionally omits upstream details. */ }
  }
  return Response.json({ status: ready ? "ready" : "unavailable" }, {
    status: ready ? 200 : 503,
    headers: { "Cache-Control": "no-store" },
  });
}
