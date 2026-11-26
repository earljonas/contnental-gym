"use server";

import { revalidatePath } from "next/cache";
import { settleMembership } from "@/lib/gym/staff-operations";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getUserRole } from "@/lib/supabase/roles";
import { checkInMember } from "../attendance/actions";

export async function manualCheckInFromMembers(memberId: string) {
  const result = await checkInMember(memberId, "Manual");
  if (result.success) revalidatePath("/branch/members");
  return result;
}

export async function updateBranchMemberProfile(data: {
  memberId: string;
  firstName: string;
  lastName: string;
  phone?: string;
}) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated" };

    const roleInfo = await getUserRole(supabase, user.id);
    if (roleInfo.role !== "BRANCH_ADMIN" || !roleInfo.branch_id) {
      return { error: "Unauthorized" };
    }

    const firstName = data.firstName.trim();
    const lastName = data.lastName.trim();
    const phone = data.phone?.trim() || null;

    if (!firstName || !lastName) {
      return { error: "First name and last name are required" };
    }

    const { data: updated, error } = await supabase.rpc(
      "branch_admin_update_member_profile",
      {
        member_id: data.memberId,
        new_first_name: firstName,
        new_last_name: lastName,
        new_phone: phone,
      }
    );

    if (error || updated !== true) {
      console.error("[updateBranchMemberProfile] update failed:", error);
      return { error: "Failed to update member" };
    }

    revalidatePath("/branch/members");
    return { success: true };
  } catch (err) {
    console.error("[updateBranchMemberProfile] Unexpected error:", err);
    return { error: "Unexpected error occurred" };
  }
}

type WalkInPayment = {
  planId: number;
  paymentMethod: "CASH" | "GCASH";
  referenceNumber?: string;
};

export async function completeExistingMemberRegistration(input: WalkInPayment & { memberId: string }) {
  const result = await settleMembership({
    target_member: input.memberId, target_plan: input.planId,
    method: input.paymentMethod, reference: input.referenceNumber,
  });
  return { ...result, memberId: input.memberId };
}

export async function registerWalkInMember(input: WalkInPayment & {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };
  const role = await getUserRole(supabase, user.id);
  if (role.role !== "BRANCH_ADMIN" || !role.branch_id) return { error: "Branch staff access required" };
  const mfa = await supabase.rpc("staff_mfa_required");
  if (mfa.error || mfa.data) return { error: "Verify your staff account before creating a walk-in account." };
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return { error: "Walk-in account creation is unavailable. Use online registration." };

  const firstName = input.firstName.trim();
  const lastName = input.lastName.trim();
  const phone = input.phone.trim();
  const email = input.email.trim().toLowerCase();
  const reference = input.referenceNumber?.trim();
  if (!firstName || firstName.length > 80 || !lastName || lastName.length > 80 || !phone || phone.length > 32) {
    return { error: "Enter the member’s name and phone number." };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return { error: "Enter a valid email address." };
  if (input.password.length < 8 || input.password.length > 72) return { error: "Password must be 8–72 characters." };
  if (input.paymentMethod !== "CASH" && (input.paymentMethod !== "GCASH" || !reference || reference.length > 80)) {
    return { error: "Choose cash or enter a valid GCash reference." };
  }

  const { data: plan } = await supabase.from("membership_plans").select("id").eq("id", input.planId).eq("is_active", true).maybeSingle();
  if (!plan) return { error: "Select an available plan." };

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: input.password,
    email_confirm: true,
    user_metadata: { first_name: firstName, last_name: lastName, phone },
    app_metadata: { walk_in_branch: role.branch_id },
  });
  if (!data.user || error) {
    if (error?.code !== "email_exists") console.error("gym.walk_in.auth_failed", { code: error?.code });
    return { error: "Could not create the account. If the member is already registered, use Complete registration." };
  }

  // The auth account is intentionally kept when settlement cannot be confirmed.
  // Complete registration retries the same operation without creating another account.
  const result = await settleMembership({
    target_member: data.user.id,
    target_plan: input.planId,
    method: input.paymentMethod,
    reference,
  }, supabase);
  if (result.error) return { error: `Account created. Use Complete registration to retry. ${result.error}` };
  return { ...result, memberId: data.user.id, memberName: `${firstName} ${lastName}` };
}
