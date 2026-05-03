import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserRole } from "@/lib/supabase/roles";
import { MemberShell } from "@/components/member/member-shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name, last_name")
    .eq("id", user.id)
    .single();

  const roleInfo = await getUserRole(supabase, user.id);

  // If admin, redirect to respective admin panel
  if (roleInfo.role === "SUPER_ADMIN") redirect("/admin");
  if (roleInfo.role === "BRANCH_ADMIN") redirect("/branch");

  // Get latest membership status
  const { data: membership } = await supabase
    .from("memberships")
    .select("status")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (
    <MemberShell
      userName={profile?.first_name ?? "Member"}
      userId={user.id}
      membershipStatus={membership?.status ?? null}
    >
      {children}
    </MemberShell>
  );
}
