import type { SupabaseClient } from "@supabase/supabase-js";

export type PublicPlan = { id: number; name: string; price: number; duration: number };

export const formatPlanPrice = (price: number) => new Intl.NumberFormat("en-PH", {
  style: "currency", currency: "PHP", maximumFractionDigits: 2, minimumFractionDigits: 0,
}).format(price);

export async function getActivePlans(client: SupabaseClient) {
  const { data, error } = await client.from("membership_plans")
    .select("id, name, price, duration")
    .eq("is_active", true)
    .order("duration")
    .retry(false);
  return { plans: (data ?? []) as PublicPlan[], unavailable: Boolean(error) };
}
