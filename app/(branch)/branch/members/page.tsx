import { redirect } from "next/navigation";

import { BranchMembersPage } from "@/components/admin/branch-members";
import {
  getBranchMembers,
  getBranchMemberDetails,
} from "@/lib/branch-admin/data";
import { createClient } from "@/lib/supabase/server";
import { getUserRole } from "@/lib/supabase/roles";

// Reuse the pending members fetcher from the dashboard data layer
async function getPendingWalkups() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, first_name, last_name, email, created_at, memberships(id, status, plan_id, membership_plans(name, price))"
    )
    .eq("role", "MEMBER")
    .is("branch_id", null)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[getPendingWalkups] Error fetching profiles:", error);
    throw new Error("Failed to fetch pending walkups");
  }

  return (data ?? [])
    .filter((profile) => {
      const memberships = Array.isArray(profile.memberships)
        ? profile.memberships
        : [];
      return memberships.some((m) => m.status === "PENDING");
    })
    .map((profile) => {
      const memberships = Array.isArray(profile.memberships)
        ? profile.memberships
        : [];
      const pendingMembership = memberships.find(
        (m) => m.status === "PENDING"
      );
      const plan = pendingMembership?.membership_plans as unknown as {
        name: string;
        price: number;
      } | null;

      return {
        id: profile.id,
        name: `${profile.first_name} ${profile.last_name}`.trim(),
        email: profile.email,
        plan: plan?.name ?? "No plan",
        planPrice: plan?.price ?? 0,
        membershipId: pendingMembership?.id ?? 0,
        planId: pendingMembership?.plan_id ?? 0,
        registeredDate: new Date(profile.created_at).toLocaleDateString(
          "en-US",
          { month: "short", day: "numeric", year: "numeric" }
        ),
      };
    });
}

export default async function MembersPage({
  searchParams,
}: {
  searchParams: Promise<{ memberId?: string; edit?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const roleInfo = await getUserRole(supabase, user.id);
  if (roleInfo.role !== "BRANCH_ADMIN" || !roleInfo.branch_id) {
    redirect("/login");
  }

  const params = await searchParams;

  const [data, pendingWalkups, memberDetails] = await Promise.all([
    getBranchMembers(roleInfo.branch_id),
    getPendingWalkups(),
    params.memberId
      ? getBranchMemberDetails(params.memberId, roleInfo.branch_id)
      : Promise.resolve(null),
  ]);

  return (
    <BranchMembersPage
      data={data}
      pendingWalkups={pendingWalkups}
      memberDetails={memberDetails}
      editMode={params.edit === "1"}
    />
  );
}
