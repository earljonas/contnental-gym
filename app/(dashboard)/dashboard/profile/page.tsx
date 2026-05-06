import { createClient } from "@/lib/supabase/server";
import { ProfilePage } from "@/components/member/profile-page";

export default async function ProfileRoute() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Profile with branch
  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name, last_name, email, phone, avatar_url, branch_id, branches(name)")
    .eq("id", user!.id)
    .single();

  // Membership with plan
  const { data: membership } = await supabase
    .from("memberships")
    .select("status, start_date, end_date, plan_id, membership_plans(name, duration)")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // Payments
  const { data: payments } = await supabase
    .from("payments")
    .select("id, amount, payment_method, status, created_at, membership_id, memberships(membership_plans(name))")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false });

  const branchData = profile?.branches as unknown as { name: string } | null;
  const membershipPlan = membership?.membership_plans as unknown as { name: string; duration: number } | null;

  return (
    <ProfilePage
      profile={{
        firstName: profile?.first_name ?? "",
        lastName: profile?.last_name ?? "",
        email: profile?.email ?? "",
        phone: profile?.phone ?? "",
        avatarUrl: profile?.avatar_url ?? null,
        branchName: branchData?.name ?? null,
      }}
      membership={
        membership
          ? {
              status: membership.status,
              planName: membershipPlan?.name ?? "Unknown",
              duration: membershipPlan?.duration ?? 30,
              startDate: membership.start_date,
              endDate: membership.end_date,
            }
          : null
      }
      payments={(payments ?? []).map((p) => {
        const mPlan = p.memberships as unknown as { membership_plans: { name: string } | null } | null;
        return {
          id: p.id,
          amount: p.amount,
          method: p.payment_method,
          status: p.status,
          date: p.created_at,
          planName: mPlan?.membership_plans?.name ?? "—",
        };
      })}
    />
  );
}
