import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name, last_name")
    .eq("id", user!.id)
    .single();

  const { data: membership } = await supabase
    .from("memberships")
    .select("status, plan_id, membership_plans(name, price)")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Welcome */}
      <div className="mb-8">
        <h1 className="font-display text-3xl font-black uppercase tracking-tight text-white sm:text-4xl">
          Customer Page
        </h1>
        <p className="mt-2 text-[15px] text-text-secondary">
          Welcome back, {profile?.first_name} {profile?.last_name}
        </p>
      </div>

      {/* Membership status card */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div className="border border-border-subtle bg-surface p-6">
          <h3 className="mb-1 text-[11px] font-medium uppercase tracking-[0.15em] text-text-secondary">
            MEMBERSHIP STATUS
          </h3>
          <div className="mt-3 flex items-center gap-2">
            <div
              className={`h-2 w-2 rounded-full ${
                membership?.status === "ACTIVE"
                  ? "bg-green-500"
                  : "bg-yellow-500"
              }`}
            />
            <span className="text-[14px] font-medium uppercase tracking-wider text-white">
              {membership?.status || "No membership"}
            </span>
          </div>
        </div>

        <div className="border border-border-subtle bg-surface p-6">
          <h3 className="mb-1 text-[11px] font-medium uppercase tracking-[0.15em] text-text-secondary">
            CURRENT PLAN
          </h3>
          <p className="mt-3 font-display text-xl font-black uppercase text-gold">
            {(membership?.membership_plans as Record<string, string>)?.name || "—"}
          </p>
        </div>

        <div className="border border-border-subtle bg-surface p-6">
          <h3 className="mb-1 text-[11px] font-medium uppercase tracking-[0.15em] text-text-secondary">
            MONTHLY RATE
          </h3>
          <p className="mt-3 font-display text-xl font-black text-white">
            {(membership?.membership_plans as Record<string, number>)?.price
              ? `₱${Number((membership?.membership_plans as Record<string, number>).price).toLocaleString()}`
              : "—"}
          </p>
        </div>
      </div>
    </div>
  );
}
