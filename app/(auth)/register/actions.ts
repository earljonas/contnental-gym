"use server";

import { createAdminClient } from "@/lib/supabase/admin";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function escapeLikePattern(value: string) {
  return value.replace(/[\\%_]/g, "\\$&");
}

export async function checkRegistrationEmail(email: string) {
  const normalizedEmail = email.trim().toLowerCase();

  if (!emailPattern.test(normalizedEmail)) {
    return { exists: false, error: "Invalid email" };
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { exists: false, checkUnavailable: true };
  }

  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("profiles")
      .select("id")
      .ilike("email", escapeLikePattern(normalizedEmail))
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("[checkRegistrationEmail] profile lookup failed:", error);
      return { exists: false, checkUnavailable: true };
    }

    return { exists: Boolean(data) };
  } catch (err) {
    console.error("[checkRegistrationEmail] unexpected failure:", err);
    return { exists: false, checkUnavailable: true };
  }
}
