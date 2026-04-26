import { redirect } from "next/navigation";

import { BranchDashboardPage } from "@/components/admin/branch-dashboard";
import { getBranchDashboard } from "@/lib/branch-admin/data";
import { createClient } from "@/lib/supabase/server";
import { getUserRole } from "@/lib/supabase/roles";

export default async function BranchPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const roleInfo = await getUserRole(supabase, user.id);
  if (roleInfo.role !== "BRANCH_ADMIN" || !roleInfo.branch_id) {
    redirect("/login");
  }

  const data = await getBranchDashboard(roleInfo.branch_id);

  return <BranchDashboardPage data={data} />;
}
