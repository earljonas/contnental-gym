import { BranchesManager, type BranchCard } from "@/components/admin/branches-manager";
import { createClient } from "@/lib/supabase/server";

type BranchRow = {
  id: number;
  name: string;
  location: string | null;
};

type ProfileMembershipRow = {
  branch_id: number | null;
  memberships: { status: string }[] | null;
};

type AdminRow = {
  first_name: string;
  last_name: string;
  branch_id: number | null;
};

export default async function SuperAdminBranchesPage() {
  const supabase = await createClient();

  const [
    { data: branches, error: branchesError },
    { data: profiles, error: profilesError },
    { data: admins },
  ] = await Promise.all([
    supabase.from("branches").select("id, name, location").order("name"),
    supabase
      .from("profiles")
      .select("branch_id, memberships(status)")
      .eq("role", "MEMBER"),
    supabase
      .from("profiles")
      .select("first_name, last_name, branch_id")
      .eq("role", "BRANCH_ADMIN"),
  ]);

  if (branchesError || profilesError) {
    return (
      <div className="rounded-3xl border border-border bg-card p-8 text-sm text-muted-foreground">
        Unable to load branches right now.
      </div>
    );
  }

  const activeMembersByBranch = new Map<number, number>();

  for (const profile of (profiles ?? []) as ProfileMembershipRow[]) {
    if (!profile.branch_id) continue;

    const hasActiveMembership = Array.isArray(profile.memberships)
      && profile.memberships.some((membership) => membership.status === "ACTIVE");

    if (!hasActiveMembership) continue;

    activeMembersByBranch.set(
      profile.branch_id,
      (activeMembersByBranch.get(profile.branch_id) ?? 0) + 1
    );
  }

  const adminByBranch = new Map<number, string>();
  for (const admin of (admins ?? []) as AdminRow[]) {
    if (admin.branch_id) {
      adminByBranch.set(admin.branch_id, `${admin.first_name} ${admin.last_name}`.trim());
    }
  }

  const branchCards: BranchCard[] = ((branches ?? []) as BranchRow[]).map((branch) => ({
    id: branch.id,
    name: branch.name,
    location: branch.location ?? "Location unavailable",
    activeMembers: activeMembersByBranch.get(branch.id) ?? 0,
    adminName: adminByBranch.get(branch.id),
  }));

  return <BranchesManager initialBranches={branchCards} />;
}
