"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/* ─── Update Profile ─── */
export async function updateProfile(data: {
  first_name: string;
  last_name: string;
  phone: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const firstName = data.first_name.trim();
  const lastName = data.last_name.trim();
  const phone = data.phone.trim();
  if (!firstName || !lastName || firstName.length > 80 || lastName.length > 80 || phone.length > 32) {
    throw new Error("Enter your name and a valid phone number.");
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      first_name: firstName,
      last_name: lastName,
      phone,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/profile");
}

/* ─── Update Avatar URL ─── */
export async function updateAvatar(avatarUrl: string) {
  if (avatarUrl.length > 500_000 || !/^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(avatarUrl)) {
    throw new Error("Choose a JPG, PNG, or WebP photo under 375 KB.");
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("profiles")
    .update({ avatar_url: avatarUrl, updated_at: new Date().toISOString() })
    .eq("id", user.id);

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/profile");
}

/* ─── Change Password ─── */
export async function changePassword(newPassword: string) {
  if (newPassword.length < 8 || newPassword.length > 72) throw new Error("Password must be 8–72 characters.");
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw new Error(error.message);
}
