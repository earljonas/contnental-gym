import { MembershipPlansPage, type MembershipPlanRow } from "@/components/admin/membership-plans-page";
import { createClient } from "@/lib/supabase/server";

export default async function PlansPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("membership_plans")
    .select("id, name, price, duration, features, is_active, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="rounded-3xl border border-border bg-card p-8 text-sm text-muted-foreground">
        Unable to load membership plans right now.
      </div>
    );
  }

  const plans: MembershipPlanRow[] = (data ?? []).map((plan) => ({
    id: plan.id,
    name: plan.name,
    price: Number(plan.price),
    duration: Number(plan.duration),
    features: plan.features ?? [],
    isActive: Boolean(plan.is_active),
  }));

  return <MembershipPlansPage plans={plans} />;
}
