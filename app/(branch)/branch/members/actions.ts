"use server";

import { revalidatePath } from "next/cache";
import { createClient as createSupabaseJsClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUserRole } from "@/lib/supabase/roles";

function canUseAdminClient() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export async function manualCheckInFromMembers(memberId: string) {
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

    const { data: targetProfile } = await supabase
      .from("profiles")
      .select("id, role")
      .eq("id", memberId)
      .eq("role", "MEMBER")
      .single();

    if (!targetProfile) {
      return { error: "Member not found" };
    }

    // Verify member has active membership
    const { data: memberships } = await supabase
      .from("memberships")
      .select("status")
      .eq("user_id", memberId)
      .eq("status", "ACTIVE")
      .limit(1);

    if (!memberships || memberships.length === 0) {
      return { error: "Member does not have an active membership" };
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const { data: existingCheckIn, error: existingCheckInError } = await supabase
      .from("attendance")
      .select("id")
      .eq("user_id", memberId)
      .gte("check_in_time", todayStart.toISOString())
      .lte("check_in_time", todayEnd.toISOString())
      .limit(1)
      .maybeSingle();

    if (existingCheckInError) {
      console.error("[manualCheckInFromMembers] duplicate check failed:", existingCheckInError);
      return { error: "Failed to verify today's check-in" };
    }

    if (existingCheckIn) {
      return { error: "Already checked in today" };
    }

    const { error: insertError } = await supabase.from("attendance").insert({
      user_id: memberId,
      branch_id: roleInfo.branch_id,
      checked_in_by: user.id,
      check_in_time: new Date().toISOString(),
    });

    if (insertError) {
      console.error("[manualCheckInFromMembers] insert failed:", insertError);
      return { error: "Failed to record check-in" };
    }

    revalidatePath("/branch/members");
    revalidatePath("/branch/attendance");
    return { success: true };
  } catch (err) {
    console.error("[manualCheckInFromMembers] Unexpected error:", err);
    return { error: "Unexpected error occurred" };
  }
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

export async function completeExistingMemberRegistration(data: {
  memberId: string;
  planId: number;
  paymentMethod: "CASH" | "GCASH";
  referenceNumber?: string;
}) {
  try {
    if (!canUseAdminClient()) {
      return {
        error:
          "Completing an existing account requires SUPABASE_SERVICE_ROLE_KEY so the app can create the membership safely.",
      };
    }

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated" };

    const roleInfo = await getUserRole(supabase, user.id);
    if (roleInfo.role !== "BRANCH_ADMIN" || !roleInfo.branch_id) {
      return { error: "Unauthorized" };
    }

    const referenceNumber = data.referenceNumber?.trim() || null;
    if (data.paymentMethod === "GCASH" && !referenceNumber) {
      return { error: "GCash reference number is required" };
    }

    const { data: targetMember, error: targetError } = await supabase
      .from("profiles")
      .select("id, role, branch_id")
      .eq("id", data.memberId)
      .eq("role", "MEMBER")
      .maybeSingle();

    if (targetError) {
      console.error("[completeExistingMemberRegistration] target lookup failed:", targetError);
      return { error: "Failed to load member" };
    }
    if (!targetMember) return { error: "Member not found" };

    const { data: existingMemberships, error: membershipsError } = await supabase
      .from("memberships")
      .select("id, status")
      .eq("user_id", data.memberId);

    if (membershipsError) {
      console.error("[completeExistingMemberRegistration] membership lookup failed:", membershipsError);
      return { error: "Failed to verify member membership" };
    }
    if ((existingMemberships ?? []).some((membership) => membership.status === "ACTIVE")) {
      return { error: "Member already has an active membership" };
    }
    if ((existingMemberships ?? []).length > 0) {
      return { error: "Member already has membership history. Use the existing renewal or activation flow." };
    }

    const { data: plan, error: planError } = await supabase
      .from("membership_plans")
      .select("id, name, price, duration, is_active")
      .eq("id", data.planId)
      .eq("is_active", true)
      .maybeSingle();

    if (planError) {
      console.error("[completeExistingMemberRegistration] plan lookup failed:", planError);
      return { error: "Failed to load selected plan" };
    }
    if (!plan) return { error: "Selected plan is not available" };

    const admin = createAdminClient();
    const today = new Date();
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + Number(plan.duration));

    if (!targetMember.branch_id) {
      const { error: profileError } = await admin
        .from("profiles")
        .update({
          branch_id: roleInfo.branch_id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", data.memberId)
        .eq("role", "MEMBER")
        .is("branch_id", null);

      if (profileError) {
        console.error("[completeExistingMemberRegistration] profile update failed:", profileError);
        return { error: "Failed to set registration branch" };
      }
    }

    const { data: membership, error: membershipError } = await admin
      .from("memberships")
      .insert({
        user_id: data.memberId,
        plan_id: plan.id,
        status: "ACTIVE",
        start_date: today.toISOString().split("T")[0],
        end_date: endDate.toISOString().split("T")[0],
      })
      .select("id")
      .single();

    if (membershipError || !membership) {
      console.error("[completeExistingMemberRegistration] membership insert failed:", membershipError);
      return { error: "Failed to create membership" };
    }

    const { error: paymentError } = await admin.from("payments").insert({
      user_id: data.memberId,
      membership_id: membership.id,
      branch_id: roleInfo.branch_id,
      amount: Number(plan.price),
      payment_method: data.paymentMethod,
      status: "CONFIRMED",
      reference_number: referenceNumber,
      confirmed_by: user.id,
      confirmed_at: new Date().toISOString(),
    });

    if (paymentError) {
      console.error("[completeExistingMemberRegistration] payment insert failed:", paymentError);
      await admin.from("memberships").delete().eq("id", membership.id);
      return { error: "Failed to record payment" };
    }

    revalidatePath("/branch");
    revalidatePath("/branch/members");
    revalidatePath("/branch/billing");

    return { success: true, memberId: data.memberId };
  } catch (err) {
    console.error("[completeExistingMemberRegistration] Unexpected error:", err);
    return { error: err instanceof Error ? err.message : "Unexpected error occurred" };
  }
}

export async function registerWalkInMember(data: {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  planId: number;
  paymentMethod: "CASH" | "GCASH";
  referenceNumber?: string;
}) {
  let createdUserId: string | null = null;

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
    const email = data.email.trim().toLowerCase();
    const phone = data.phone.trim();
    const password = data.password.trim();
    const referenceNumber = data.referenceNumber?.trim() || null;

    if (!firstName || !lastName) {
      return { error: "First name and last name are required" };
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { error: "Enter a valid email address" };
    }
    if (!phone) {
      return { error: "Phone number is required" };
    }
    if (password.length < 8) {
      return { error: "Temporary password must be at least 8 characters" };
    }
    if (data.paymentMethod === "GCASH" && !referenceNumber) {
      return { error: "GCash reference number is required" };
    }

    const { data: plan, error: planError } = await supabase
      .from("membership_plans")
      .select("id, name, price, duration, is_active")
      .eq("id", data.planId)
      .eq("is_active", true)
      .maybeSingle();

    if (planError) {
      console.error("[registerWalkInMember] plan lookup failed:", planError);
      return { error: "Failed to load selected plan" };
    }
    if (!plan) {
      return { error: "Selected plan is not available" };
    }

    if (canUseAdminClient()) {
      const admin = createAdminClient();
      const { data: authData, error: createUserError } =
        await admin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: {
            first_name: firstName,
            last_name: lastName,
            phone,
            role: "MEMBER",
            branch_id: roleInfo.branch_id,
          },
        });

      if (createUserError || !authData.user) {
        console.error("[registerWalkInMember] auth user creation failed:", createUserError);
        return { error: createUserError?.message ?? "Failed to create member account" };
      }

      createdUserId = authData.user.id;

      const { error: profileError } = await admin.from("profiles").upsert({
        id: createdUserId,
        email,
        first_name: firstName,
        last_name: lastName,
        phone,
        role: "MEMBER",
        branch_id: roleInfo.branch_id,
        updated_at: new Date().toISOString(),
      });

      if (profileError) {
        console.error("[registerWalkInMember] profile upsert failed:", profileError);
        throw new Error("Failed to create member profile");
      }

      const today = new Date();
      const endDate = new Date(today);
      endDate.setDate(endDate.getDate() + Number(plan.duration));

      const { data: membership, error: membershipError } = await admin
        .from("memberships")
        .insert({
          user_id: createdUserId,
          plan_id: plan.id,
          status: "ACTIVE",
          start_date: today.toISOString().split("T")[0],
          end_date: endDate.toISOString().split("T")[0],
        })
        .select("id")
        .single();

      if (membershipError || !membership) {
        console.error("[registerWalkInMember] membership insert failed:", membershipError);
        throw new Error("Failed to create active membership");
      }

      const { error: paymentError } = await admin.from("payments").insert({
        user_id: createdUserId,
        membership_id: membership.id,
        branch_id: roleInfo.branch_id,
        amount: Number(plan.price),
        payment_method: data.paymentMethod,
        status: "CONFIRMED",
        reference_number: referenceNumber,
        confirmed_by: user.id,
        confirmed_at: new Date().toISOString(),
      });

      if (paymentError) {
        console.error("[registerWalkInMember] payment insert failed:", paymentError);
        throw new Error("Failed to record payment");
      }
    } else {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !anonKey) {
        return { error: "Missing Supabase public environment variables" };
      }

      const signupClient = createSupabaseJsClient(supabaseUrl, anonKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      });
      const { data: authData, error: signUpError } = await signupClient.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            phone,
            role: "MEMBER",
            branch_id: roleInfo.branch_id,
          },
        },
      });

      if (signUpError || !authData.user) {
        console.error("[registerWalkInMember] public signup failed:", signUpError);
        return { error: signUpError?.message ?? "Failed to create member account" };
      }
      if (!authData.session) {
        return {
          error:
            "Member account was created, but email confirmation is enabled. Add SUPABASE_SERVICE_ROLE_KEY to .env.local for instant walk-in activation.",
        };
      }

      createdUserId = authData.user.id;
      const memberClient = createSupabaseJsClient(supabaseUrl, anonKey, {
        global: {
          headers: {
            Authorization: `Bearer ${authData.session.access_token}`,
          },
        },
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      });

      await memberClient
        .from("profiles")
        .update({
          first_name: firstName,
          last_name: lastName,
          phone,
          role: "MEMBER",
          branch_id: roleInfo.branch_id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", createdUserId);

      const today = new Date();
      const endDate = new Date(today);
      endDate.setDate(endDate.getDate() + Number(plan.duration));

      const { data: membership, error: membershipError } = await memberClient
        .from("memberships")
        .insert({
          user_id: createdUserId,
          plan_id: plan.id,
          status: "ACTIVE",
          start_date: today.toISOString().split("T")[0],
          end_date: endDate.toISOString().split("T")[0],
        })
        .select("id")
        .single();

      if (membershipError || !membership) {
        console.error("[registerWalkInMember] member membership insert failed:", membershipError);
        throw new Error("Failed to create active membership");
      }

      const { error: paymentError } = await supabase.from("payments").insert({
        user_id: createdUserId,
        membership_id: membership.id,
        branch_id: roleInfo.branch_id,
        amount: Number(plan.price),
        payment_method: data.paymentMethod,
        status: "CONFIRMED",
        reference_number: referenceNumber,
        confirmed_by: user.id,
        confirmed_at: new Date().toISOString(),
      });

      if (paymentError) {
        console.error("[registerWalkInMember] branch payment insert failed:", paymentError);
        throw new Error("Failed to record payment");
      }
    }

    revalidatePath("/branch");
    revalidatePath("/branch/members");
    revalidatePath("/branch/billing");

    return {
      success: true,
      memberId: createdUserId,
      memberName: `${firstName} ${lastName}`.trim(),
    };
  } catch (err) {
    console.error("[registerWalkInMember] Unexpected error:", err);

    if (createdUserId && canUseAdminClient()) {
      try {
        await createAdminClient().auth.admin.deleteUser(createdUserId);
      } catch (cleanupError) {
        console.error("[registerWalkInMember] cleanup failed:", cleanupError);
      }
    }

    return { error: err instanceof Error ? err.message : "Unexpected error occurred" };
  }
}
