import { createClient } from "@/lib/supabase/server";

export default async function BranchPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Get current user's branch
  const { data: profile } = await supabase
    .from("profiles")
    .select("branch_id, branches(name)")
    .eq("id", user!.id)
    .single();

  const rawBranches = profile?.branches;
  const branchObj = Array.isArray(rawBranches) ? rawBranches[0] : rawBranches;
  const branchName = (branchObj as Record<string, string> | null)?.name;

  // Fetch members associated with this branch (meaning their last attendance or branch assigned)
  // For now, let's fetch all users and their memberships, RLS will restrict to their branch anyway.
  const { data: members } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, phone, role, created_at, memberships(status, plan_id, membership_plans(name))")
    .eq("role", "MEMBER")
    .order("created_at", { ascending: false });

  const totalMembers = members?.length || 0;
  const activeMembers =
    members?.filter((m) =>
      Array.isArray(m.memberships) && m.memberships.some((ms) => ms.status === "ACTIVE")
    ).length || 0;
  const pendingMembers =
    members?.filter((m) =>
      Array.isArray(m.memberships) && m.memberships.some((ms) => ms.status === "PENDING")
    ).length || 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-3xl font-black uppercase tracking-tight text-white sm:text-4xl">
          Branch Admin Page
        </h1>
        <p className="mt-2 text-[15px] text-text-secondary">
          Managing: <span className="text-white">{branchName || "Unknown Branch"}</span>
        </p>
      </div>

      {/* Stats */}
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <div className="border border-border-subtle bg-surface p-6">
          <h3 className="text-[11px] font-medium uppercase tracking-[0.15em] text-text-secondary">
            BRANCH MEMBERS
          </h3>
          <p className="mt-2 font-display text-3xl font-black text-white">
            {totalMembers}
          </p>
        </div>
        <div className="border border-border-subtle bg-surface p-6">
          <h3 className="text-[11px] font-medium uppercase tracking-[0.15em] text-text-secondary">
            ACTIVE
          </h3>
          <p className="mt-2 font-display text-3xl font-black text-green-500">
            {activeMembers}
          </p>
        </div>
        <div className="border border-border-subtle bg-surface p-6">
          <h3 className="text-[11px] font-medium uppercase tracking-[0.15em] text-text-secondary">
            PENDING ACTIVATION
          </h3>
          <p className="mt-2 font-display text-3xl font-black text-yellow-500">
            {pendingMembers}
          </p>
        </div>
      </div>

      {/* Members table */}
      <div className="border border-border-subtle bg-surface">
        <div className="border-b border-border-subtle px-6 py-4">
          <h2 className="text-[11px] font-medium uppercase tracking-[0.15em] text-text-secondary">
            LOCAL MEMBERS
          </h2>
        </div>

        {/* Desktop table */}
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border-subtle text-left">
                <th className="px-6 py-3 text-[11px] font-medium uppercase tracking-[0.15em] text-text-secondary">
                  Name
                </th>
                <th className="px-6 py-3 text-[11px] font-medium uppercase tracking-[0.15em] text-text-secondary">
                  Phone
                </th>
                <th className="px-6 py-3 text-[11px] font-medium uppercase tracking-[0.15em] text-text-secondary">
                  Plan
                </th>
                <th className="px-6 py-3 text-[11px] font-medium uppercase tracking-[0.15em] text-text-secondary">
                  Status
                </th>
                <th className="px-6 py-3 text-[11px] font-medium uppercase tracking-[0.15em] text-text-secondary">
                  Joined
                </th>
              </tr>
            </thead>
            <tbody>
              {members?.map((member) => {
                const latestMembership = Array.isArray(member.memberships)
                  ? member.memberships[0]
                  : null;
                return (
                  <tr
                    key={member.id}
                    className="border-b border-border-subtle last:border-0 transition-colors hover:bg-white/[0.02]"
                  >
                    <td className="px-6 py-4 text-[14px] text-white">
                      {member.first_name} {member.last_name}
                    </td>
                    <td className="px-6 py-4 text-[14px] text-text-secondary">
                      {member.phone || "—"}
                    </td>
                    <td className="px-6 py-4 text-[14px] font-medium uppercase text-gold">
                      {latestMembership
                        ? (latestMembership as unknown as Record<string, Record<string, string>>)?.membership_plans?.name
                        : "—"}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-block text-[11px] font-medium uppercase tracking-wider ${
                          (latestMembership as unknown as Record<string, string>)?.status === "ACTIVE"
                            ? "text-green-500"
                            : (latestMembership as unknown as Record<string, string>)?.status === "PENDING"
                              ? "text-yellow-500"
                              : "text-text-muted"
                        }`}
                      >
                        {(latestMembership as unknown as Record<string, string>)?.status || "NONE"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[13px] text-text-secondary">
                      {new Date(member.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="space-y-0 md:hidden">
          {members?.map((member) => {
            const latestMembership = Array.isArray(member.memberships)
              ? member.memberships[0]
              : null;
            return (
              <div
                key={member.id}
                className="border-b border-border-subtle p-4 last:border-0"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[14px] font-medium text-white">
                    {member.first_name} {member.last_name}
                  </span>
                  <span
                    className={`text-[10px] font-medium uppercase tracking-wider ${
                      (latestMembership as unknown as Record<string, string>)?.status === "ACTIVE"
                        ? "text-green-500"
                        : (latestMembership as unknown as Record<string, string>)?.status === "PENDING"
                          ? "text-yellow-500"
                          : "text-text-muted"
                    }`}
                  >
                    {(latestMembership as unknown as Record<string, string>)?.status || "NONE"}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-3 text-[12px] text-text-secondary">
                  <span>{member.phone || "No phone"}</span>
                  <span>•</span>
                  <span className="text-gold uppercase">
                    {latestMembership
                      ? (latestMembership as unknown as Record<string, Record<string, string>>)?.membership_plans?.name
                      : "No plan"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {members?.length === 0 && (
          <div className="px-6 py-12 text-center text-[14px] text-text-muted">
            No members yet
          </div>
        )}
      </div>
    </div>
  );
}
