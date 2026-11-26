"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { lookupMemberForCheckIn, type MemberLookup, type SearchableMember } from "@/lib/branch-admin/data";

const uuidPattern = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;

export async function checkInMember(
  memberId: string,
  method: "QR" | "Manual",
): Promise<{ success?: boolean; error?: string; member?: MemberLookup }> {
  if (!uuidPattern.test(memberId)) return { error: "Member not found" };
  const supabase = await createClient();
  const { data: result, error } = await supabase.rpc("record_gym_visit", {
    target_member: memberId, visit_method: method,
  });
  if (error) {
    if (error.code !== "42501") console.error("gym.checkin.failed", { code: error.code });
    return { error: error.code === "42501" ? "Branch staff access required" : "Could not record the visit. Try again." };
  }
  if (result === "NONE") return { error: "Member not found" };
  const member = await lookupMemberForCheckIn(memberId);
  if (result === "DUPLICATE") return { error: "Already checked in today", member: member ?? undefined };
  if (result !== "RECORDED") return { error: `Membership is ${result}`, member: member ?? undefined };
  revalidatePath("/branch");
  revalidatePath("/branch/attendance");
  return { success: true, member: member ?? undefined };
}

export async function searchCheckInMembers(query: string): Promise<{ members: SearchableMember[]; error?: string }> {
  const name = query.trim();
  if (name.length < 2 || name.length > 80) return { members: [] };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("checkin_directory", { name_filter: name });
  if (error) return { members: [], error: "Search is unavailable. Try again." };
  return {
    members: (data ?? []).map((member: { id: string; first_name: string; last_name: string }) => ({
      id: member.id, name: `${member.first_name} ${member.last_name}`.trim(),
    })),
  };
}
