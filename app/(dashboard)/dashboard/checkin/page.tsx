import { createClient } from "@/lib/supabase/server";
import { CheckInPage } from "@/components/member/checkin-page";

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

  // Latest membership
  const { data: membership } = await supabase
    .from("memberships")
    .select("status, end_date")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

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
