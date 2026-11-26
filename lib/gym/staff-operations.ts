import "server-only";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type Settlement = {
  target_member: string | null;
  method: "CASH" | "GCASH" | null;
  reference?: string;
  target_membership?: number;
  target_plan?: number;
  collection_branch?: number;
  pending_payment?: number;
};

export async function settleMembership(input: Settlement, supabase?: Awaited<ReturnType<typeof createClient>>) {
  const client = supabase ?? await createClient();
  const { data, error } = await client.rpc("settle_membership", input);
  if (error || typeof data !== "number") {
    if (error && !["P0001", "42501"].includes(error.code)) {
      console.error("gym.settlement.failed", { code: error.code });
    }
    return { error: error && ["P0001", "42501"].includes(error.code) ? error.message : "Could not record payment. Try again before collecting again." };
  }
  for (const path of ["/branch", "/branch/members", "/branch/billing", "/admin", "/admin/members", "/admin/billing"]) {
    revalidatePath(path);
  }
  return { success: true as const, receiptId: data };
}
