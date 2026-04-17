import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { getUserRole } from "@/lib/supabase/roles";

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

  return (
    <div className="flex min-h-screen flex-col bg-page-bg">
      {/* Top nav */}
      <header className="border-b border-border-subtle bg-surface">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex flex-col leading-none">
            <span className="font-display text-lg font-black uppercase tracking-tight text-white">
              CONTNENTAL
            </span>
            <span className="text-[9px] font-medium uppercase tracking-[0.2em] text-text-secondary">
              FITNESS GYM
            </span>
          </Link>

          <div className="flex items-center gap-4">
            <span className="text-[13px] text-text-secondary">
              {profile?.first_name} {profile?.last_name}
            </span>
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="text-[11px] uppercase tracking-[0.15em] text-text-secondary transition-colors hover:text-white"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1">{children}</main>
    </div>
  );
}
