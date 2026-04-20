import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { AdminShell } from "@/components/admin/admin-shell";
import { createClient } from "@/lib/supabase/server";
import { getUserRole } from "@/lib/supabase/roles";

export default async function AdminLayout({
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

  if (roleInfo.role === "BRANCH_ADMIN") redirect("/branch");
  if (roleInfo.role !== "SUPER_ADMIN") redirect("/dashboard");

  const cookieStore = await cookies();
  const initialTheme = cookieStore.get("continental-admin-theme")?.value === "dark" ? "dark" : "light";
  const initialSidebarCollapsed =
    cookieStore.get("continental-admin-sidebar-collapsed")?.value === "true";
  const userName = `${profile?.first_name ?? "Super"} ${profile?.last_name ?? "Admin"}`.trim();

  return (
    <AdminShell
      userName={userName}
      role={roleInfo.role}
      initialTheme={initialTheme}
      initialSidebarCollapsed={initialSidebarCollapsed}
    >
      {children}
    </AdminShell>
  );
}
