import { createClient } from "@/lib/supabase/server";
import { CheckInPage } from "@/components/member/checkin-page";
import { pickCurrentMembership } from "@/lib/member-membership";

export default async function CheckInRoute() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name, last_name, branch_id, branches(name)")
    .eq("id", user!.id)
    .single();

  // Current membership
  const { data: memberships } = await supabase
    .from("memberships")
    .select("status, end_date, created_at")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false })
    .limit(10);

  const membership = pickCurrentMembership(memberships ?? []);

  // Last attendance
  const { data: lastCheckin } = await supabase
    .from("attendance")
    .select("check_in_time, branches(name)")
    .eq("user_id", user!.id)
    .order("check_in_time", { ascending: false })
    .limit(1)
    .maybeSingle();

  const branchData = profile?.branches as unknown as { name: string } | null;
  const lastBranch = lastCheckin?.branches as unknown as { name: string } | null;

  return (
    <CheckInPage
      userId={user!.id}
      fullName={`${profile?.first_name ?? ""} ${profile?.last_name ?? ""}`.trim()}
      branchName={branchData?.name ?? null}
      membershipStatus={membership?.status ?? null}
      lastCheckIn={
        lastCheckin
          ? {
              time: lastCheckin.check_in_time,
              branch: lastBranch?.name ?? "Unknown",
            }
          : null
      }
    />
  );
}
