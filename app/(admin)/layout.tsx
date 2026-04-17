import { redirect } from "next/navigation";

import { AdminSidebar } from "@/components/admin/sidebar";
import { Button } from "@/components/ui/button";
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

  const userName = `${profile?.first_name ?? "Super"} ${profile?.last_name ?? "Admin"}`.trim();

  return (
    <div className="super-admin-theme min-h-screen bg-[var(--admin-shell)] text-foreground">
      <AdminSidebar userName={userName} />

      <div className="min-h-screen lg:pl-72">
        <header className="sticky top-0 z-20 border-b border-border bg-white/90 backdrop-blur">
          <div className="flex items-center justify-end gap-4 px-4 py-4 sm:px-6 lg:px-8">
            <form action="/auth/signout" method="post">
              <Button
                variant="outline"
                className="h-10 rounded-2xl px-4 text-xs font-semibold uppercase tracking-[0.16em]"
              >
                Sign out
              </Button>
            </form>
          </div>
        </header>

        <main className="min-h-[calc(100vh-73px)] bg-white px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
