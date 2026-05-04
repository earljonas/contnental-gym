import { redirect } from "next/navigation";

import { BranchBillingPage } from "@/components/admin/branch-billing";
import { getBranchBilling, getBillingMemberOptions } from "@/lib/branch-admin/data";
import { createClient } from "@/lib/supabase/server";
import { getUserRole } from "@/lib/supabase/roles";

export default async function BillingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const roleInfo = await getUserRole(supabase, user.id);
  if (roleInfo.role !== "BRANCH_ADMIN" || !roleInfo.branch_id) {
    redirect("/login");
  }

  const [data, members] = await Promise.all([
    getBranchBilling(roleInfo.branch_id),
    getBillingMemberOptions(roleInfo.branch_id),
  ]);

  return <BranchBillingPage data={data} members={members} />;
}
