import { redirect } from "next/navigation";

import { BranchAttendancePage } from "@/components/admin/branch-attendance";
import { getBranchAttendance, getSearchableMembers } from "@/lib/branch-admin/data";
import { createClient } from "@/lib/supabase/server";
import { getUserRole } from "@/lib/supabase/roles";

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
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
  const dateFilter = params.date || undefined;

  const [data, members] = await Promise.all([
    getBranchAttendance(roleInfo.branch_id, dateFilter),
    getSearchableMembers(roleInfo.branch_id),
  ]);

  return (
    <BranchAttendancePage
      data={data}
      members={members}
      dateFilter={dateFilter}
    />
  );
}
