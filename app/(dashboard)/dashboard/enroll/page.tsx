import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatPlanPrice, getActivePlans } from "@/lib/gym/plans";

async function enroll(form: FormData) {
  "use server";
  const planId = Number(form.get("plan"));
  if (!Number.isSafeInteger(planId) || planId < 1) redirect("/dashboard/enroll?error=1");
  const supabase = await createClient();
  const { error } = await supabase.rpc("enroll_member", { requested_plan: planId });
  if (error) redirect("/dashboard/enroll?error=1");
  redirect("/dashboard?enrolled=1");
}

export default async function EnrollPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const supabase = await createClient();
  const { plans, unavailable } = await getActivePlans(supabase);
  const params = await searchParams;
  return (
    <section className="mx-auto max-w-2xl space-y-4 p-6">
      <h1 className="text-2xl font-semibold">Choose a membership plan</h1>
      <p className="text-sm text-muted-foreground">The front desk activates your membership when you pay.</p>
      {params.error && <p role="alert">Could not save this plan. Check for an existing membership or try again.</p>}
      {unavailable && <p role="alert">Plans are temporarily unavailable. Refresh to try again.</p>}
      {!unavailable && !plans.length && <p>No plans are open for enrollment.</p>}
      {plans.map((plan) => (
        <form key={plan.id} action={enroll} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4">
          <div><p className="font-semibold">{plan.name}</p><p>{formatPlanPrice(plan.price)} · {plan.duration} days</p></div>
          <button name="plan" value={plan.id} className="min-h-11 rounded-lg bg-primary px-4 text-primary-foreground">Select plan</button>
        </form>
      ))}
    </section>
  );
}
