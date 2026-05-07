"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getUserRole } from "@/lib/supabase/roles";

export async function activateMember(data: {
  memberId: string;
  membershipId: number;
  planId: number;
  amount: number;
  paymentMethod: "CASH" | "GCASH";
  referenceNumber?: string;
}) {
  try {
    const supabase = await createClient();

    // Get current user info
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated" };

    const roleInfo = await getUserRole(supabase, user.id);
    if (roleInfo.role !== "BRANCH_ADMIN" || !roleInfo.branch_id) {
      return { error: "Unauthorized" };
    }

    const branchId = roleInfo.branch_id;

    const { data: targetMember, error: targetError } = await supabase
      .from("profiles")
      .select("id, role, branch_id")
      .eq("id", data.memberId)
      .eq("role", "MEMBER")
      .maybeSingle();

    if (targetError) {
      console.error("[activateMember] target profile lookup failed:", targetError);
      return { error: "Failed to load member" };
    }

    if (!targetMember) {
      return { error: "Member not found" };
    }

    if (targetMember.branch_id && targetMember.branch_id !== branchId) {
      return { error: "Member is already assigned to another branch" };
    }

    const { data: pendingMembership, error: pendingMembershipError } = await supabase
      .from("memberships")
      .select("id, user_id, status, plan_id")
      .eq("id", data.membershipId)
      .eq("user_id", data.memberId)
      .eq("status", "PENDING")
      .maybeSingle();

    if (pendingMembershipError) {
      console.error("[activateMember] pending membership lookup failed:", pendingMembershipError);
      return { error: "Failed to load pending membership" };
    }

    if (!pendingMembership) {
      return { error: "Pending membership not found" };
    }

    // 1. Assign the member to this branch. Supabase can return no error when
    // RLS updates zero rows, so request the updated row and verify it.
    if (targetMember.branch_id === null) {
      const { data: updatedProfile, error: profileError } = await supabase
        .from("profiles")
        .update({ branch_id: branchId })
        .eq("id", data.memberId)
        .is("branch_id", null)
        .select("id, branch_id")
        .maybeSingle();

      if (profileError) {
        console.error("[activateMember] profile update failed:", profileError);
        return { error: "Failed to assign branch" };
      }

      if (!updatedProfile || updatedProfile.branch_id !== branchId) {
        return { error: "Failed to assign branch" };
      }
    }

    // 2. Activate the membership
    const today = new Date();
    // Fetch plan duration to calculate end_date
    const { data: plan } = await supabase
      .from("membership_plans")
      .select("duration")
      .eq("id", pendingMembership.plan_id)
      .single();

    const duration = plan?.duration ?? 30;
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + duration);

    const { data: activatedMembership, error: membershipError } = await supabase
      .from("memberships")
      .update({
        status: "ACTIVE",
        start_date: today.toISOString().split("T")[0],
        end_date: endDate.toISOString().split("T")[0],
      })
      .eq("id", data.membershipId)
      .eq("user_id", data.memberId)
      .eq("status", "PENDING")
      .select("id, status")
      .maybeSingle();

    if (membershipError) {
      console.error("[activateMember] membership update failed:", membershipError);
      return { error: "Failed to activate membership" };
    }

    if (!activatedMembership || activatedMembership.status !== "ACTIVE") {
      return { error: "Failed to activate membership" };
    }

    // 3. Create payment record
    const { error: paymentError } = await supabase.from("payments").insert({
      user_id: data.memberId,
      membership_id: data.membershipId,
      branch_id: branchId,
      amount: data.amount,
      payment_method: data.paymentMethod,
      status: "CONFIRMED",
      reference_number: data.referenceNumber || null,
      confirmed_by: user.id,
      confirmed_at: new Date().toISOString(),
    });

    if (paymentError) {
      console.error("[activateMember] payment insert failed:", paymentError);
      return { error: "Failed to record payment" };
    }

    revalidatePath("/branch");
    return { success: true };
  } catch (err) {
    console.error("[activateMember] Unexpected error:", err);
    return { error: "Unexpected error occurred" };
  }
}
