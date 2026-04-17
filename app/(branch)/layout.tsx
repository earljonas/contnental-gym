import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { getUserRole } from "@/lib/supabase/roles";

export default async function BranchLayout({
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
    .select("first_name, last_name, branches(name)")
    .eq("id", user.id)
    .single();

  const roleInfo = await getUserRole(supabase, user.id);

  // Only branch admins can access
  if (roleInfo.role === "SUPER_ADMIN") redirect("/admin");
  if (roleInfo.role !== "BRANCH_ADMIN") redirect("/dashboard");

  const branch = Array.isArray(profile?.branches) ? profile.branches[0] : profile?.branches;
  const branchName = branch?.name || "Branch";

  return (
    <div className="flex min-h-screen flex-col bg-page-bg">
      {/* Top nav */}
      <header className="border-b border-border-subtle bg-surface">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex flex-col leading-none">
              <span className="font-display text-lg font-black uppercase tracking-tight text-white">
                CONTNENTAL
              </span>
              <span className="text-[9px] font-medium uppercase tracking-[0.2em] text-text-secondary">
                FITNESS GYM
              </span>
            </Link>
            <span className="ml-2 border border-blue-500 bg-blue-500/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.1em] text-blue-500">
              BRANCH ADMIN
            </span>
            <span className="text-[11px] font-medium text-text-muted">
              {branchName}
            </span>
          </div>

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
