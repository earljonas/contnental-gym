"use client";

import { useState } from "react";
import {
  User, Mail, Phone, Edit3, Save, X, Lock,
  Bell, Trash2, ChevronDown, CreditCard, Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { updateProfile, updateAvatar, changePassword } from "@/app/(dashboard)/dashboard/profile/actions";

/* ─── Types ─── */
interface ProfileData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  avatarUrl: string | null;
  branchName: string | null;
}

interface MembershipData {
  status: string;
  planName: string;
  duration: number;
  startDate: string | null;
  endDate: string | null;
}

interface PaymentData {
  id: number;
  amount: number;
  method: string;
  status: string;
  date: string;
  planName: string;
}

interface ProfilePageProps {
  profile: ProfileData;
  membership: MembershipData | null;
  payments: PaymentData[];
}

/* ─── Main ─── */
export function ProfilePage({ profile, membership, payments }: ProfilePageProps) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    first_name: profile.firstName,
    last_name: profile.lastName,
    phone: profile.phone,
  });
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showAllPayments, setShowAllPayments] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);

  async function handleSaveProfile() {
    setSaving(true);
    try {
      await updateProfile(form);
      setEditing(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    try {
      // Convert to base64 data URL as fallback (no Supabase Storage bucket needed)
      const reader = new FileReader();
      reader.onload = async () => {
        const dataUrl = reader.result as string;
        await updateAvatar(dataUrl);
        setAvatarUploading(false);
      };
      reader.readAsDataURL(file);
    } catch {
      setAvatarUploading(false);
    }
  }

  const initials = `${profile.firstName[0] ?? ""}${profile.lastName[0] ?? ""}`.toUpperCase();
  const displayPayments = showAllPayments ? payments : payments.slice(0, 10);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-black uppercase tracking-tight text-foreground md:text-3xl">
          Profile
        </h1>
        <p className="mt-1 text-[13px] text-muted-foreground">
          Personal info, membership, and settings
        </p>
      </div>

      {/* ═══ Section 1: Personal Info ═══ */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground">
            Personal Info
          </p>
          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
            >
              <Edit3 className="size-3" />
              Edit
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => setEditing(false)}
                className="rounded-full p-1.5 text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </button>
              <button
                onClick={handleSaveProfile}
                disabled={saving}
                className="flex items-center gap-1 rounded-full bg-[#C9973E] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-black"
              >
                <Save className="size-3" />
                {saving ? "..." : "Save"}
              </button>
            </div>
          )}
        </div>

        <div className="mt-4 flex items-center gap-4">
          {/* Avatar */}
          <label className="relative cursor-pointer">
            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-[#C9973E]/10">
              {profile.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                <span className="font-display text-lg font-black text-[#C9973E]">{initials}</span>
              )}
            </div>
            {avatarUploading && (
              <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-background/70">
                <span className="text-[10px] text-foreground">...</span>
              </div>
            )}
            <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
          </label>

          {/* Info */}
          <div className="flex-1 space-y-2">
            {editing ? (
              <>
                <div className="flex gap-2">
                  <Input
                    value={form.first_name}
                    onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))}
                    placeholder="First name"
                    className="h-9 rounded-xl text-[13px]"
                  />
                  <Input
                    value={form.last_name}
                    onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))}
                    placeholder="Last name"
                    className="h-9 rounded-xl text-[13px]"
                  />
                </div>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="Phone"
                  className="h-9 rounded-xl text-[13px]"
                />
              </>
            ) : (
              <>
                <p className="font-display text-base font-black uppercase tracking-tight text-foreground">
                  {profile.firstName} {profile.lastName}
                </p>
                <div className="space-y-0.5 text-[12px] text-muted-foreground">
                  <p className="flex items-center gap-1.5">
                    <Mail className="size-3.5" /> {profile.email}
                  </p>
                  {profile.phone && (
                    <p className="flex items-center gap-1.5">
                      <Phone className="size-3.5" /> {profile.phone}
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ═══ Section 2: Membership Card ═══ */}
      <div
        className="overflow-hidden rounded-2xl border border-border"
        style={{
          background: "linear-gradient(145deg, #0f0f0f 0%, #1a1a1a 50%, #0f0f0f 100%)",
        }}
      >
        <div className="p-6">
          {/* Card Header */}
          <div className="flex items-start justify-between">
            <div className="flex flex-col leading-none">
              <span className="font-display text-lg font-black uppercase tracking-tight text-foreground">
                CONTNENTAL
              </span>
              <span className="text-[9px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                FITNESS GYM
              </span>
            </div>
            {membership && (
              <span
                className={cn(
                  "rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wider",
                  membership.status === "ACTIVE"
                    ? "bg-emerald-500/10 text-emerald-500"
                    : membership.status === "PENDING"
                      ? "bg-amber-500/10 text-amber-500"
                      : "bg-red-500/10 text-red-500",
                )}
              >
                {membership.status}
              </span>
            )}
          </div>

          {/* Card Body */}
          <div className="mt-6">
            <p className="font-display text-xl font-black uppercase tracking-tight text-foreground">
              {profile.firstName} {profile.lastName}
            </p>
            {profile.branchName && (
              <p className="mt-1 text-[11px] text-muted-foreground">{profile.branchName}</p>
            )}
          </div>

          {membership ? (
            <div className="mt-6 grid grid-cols-3 gap-4 border-t border-border pt-4">
              <div>
                <p className="text-[9px] font-medium uppercase tracking-[0.15em] text-muted-foreground">Plan</p>
                <p className="mt-0.5 text-[13px] font-medium text-[#C9973E]">{membership.planName}</p>
              </div>
              <div>
                <p className="text-[9px] font-medium uppercase tracking-[0.15em] text-muted-foreground">Start</p>
                <p className="mt-0.5 text-[13px] font-medium text-foreground">
                  {membership.startDate
                    ? new Date(membership.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                    : "—"}
                </p>
              </div>
              <div>
                <p className="text-[9px] font-medium uppercase tracking-[0.15em] text-muted-foreground">Expires</p>
                <p className="mt-0.5 text-[13px] font-medium text-foreground">
                  {membership.endDate
                    ? new Date(membership.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                    : "—"}
                </p>
              </div>
            </div>
          ) : (
            <div className="mt-6 border-t border-border pt-4">
              <p className="text-[13px] text-muted-foreground">No active membership</p>
            </div>
          )}
        </div>
      </div>

      {/* ═══ Section 3: Payment History ═══ */}
      <div className="space-y-4">
        <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground">
          Payment History
        </p>
        {payments.length === 0 ? (
          <div className="flex flex-col items-center rounded-2xl border border-dashed border-border px-6 py-12 text-center">
            <CreditCard className="mb-3 size-8 text-muted-foreground/50" />
            <p className="font-display text-lg font-black uppercase tracking-tight text-foreground">No payments</p>
            <p className="mt-1 text-[13px] text-muted-foreground">Your payment history will appear here</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            {/* Table Header */}
            <div className="grid grid-cols-5 gap-2 border-b border-border px-4 py-2.5">
              {["Date", "Plan", "Amount", "Method", "Status"].map((h) => (
                <span key={h} className="text-[10px] font-medium uppercase tracking-[0.15em] text-muted-foreground">
                  {h}
                </span>
              ))}
            </div>
            {/* Rows */}
            {displayPayments.map((p) => (
              <div key={p.id} className="grid grid-cols-5 gap-2 border-b border-border px-4 py-3 last:border-b-0">
                <span className="text-[12px] text-foreground">
                  {new Date(p.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </span>
                <span className="truncate text-[12px] text-foreground">{p.planName}</span>
                <span className="text-[12px] text-foreground">₱{p.amount.toLocaleString()}</span>
                <span className="text-[12px] text-muted-foreground">{p.method}</span>
                <span
                  className={cn(
                    "inline-flex w-fit rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                    p.status === "CONFIRMED"
                      ? "bg-emerald-500/10 text-emerald-500"
                      : "bg-amber-500/10 text-amber-500",
                  )}
                >
                  {p.status}
                </span>
              </div>
            ))}
            {payments.length > 10 && (
              <button
                onClick={() => setShowAllPayments((v) => !v)}
                className="flex w-full items-center justify-center gap-1.5 border-t border-border py-3 text-[12px] font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                <ChevronDown className={cn("size-3.5 transition-transform", showAllPayments && "rotate-180")} />
                {showAllPayments ? "Show less" : `View all (${payments.length})`}
              </button>
            )}
          </div>
        )}
      </div>

      {/* ═══ Section 4: Settings ═══ */}
      <div className="space-y-4">
        <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground">
          Settings
        </p>
        <div className="space-y-2">
          {/* Change Password */}
          <button
            onClick={() => setShowPassword(true)}
            className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card px-4 py-4 text-left transition-all hover:bg-muted"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#C9973E]/10">
              <Lock className="size-4 text-[#C9973E]" />
            </div>
            <div>
              <p className="text-[13px] font-medium text-foreground">Change Password</p>
              <p className="text-[11px] text-muted-foreground">Update your account password</p>
            </div>
          </button>

          {/* Notifications (disabled) */}
          <div className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card px-4 py-4 opacity-50">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#C9973E]/10">
              <Bell className="size-4 text-[#C9973E]" />
            </div>
            <div className="flex-1">
              <p className="text-[13px] font-medium text-foreground">Notifications</p>
              <p className="text-[11px] text-muted-foreground">Coming soon</p>
            </div>
            <div className="h-6 w-10 rounded-full bg-muted" />
          </div>

          {/* Delete Account */}
          <button
            onClick={() => alert("Account deletion is not available yet. Contact support.")}
            className="flex w-full items-center gap-3 rounded-2xl border border-red-500/20 bg-card px-4 py-4 text-left transition-all hover:bg-red-500/5"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-500/10">
              <Trash2 className="size-4 text-red-500" />
            </div>
            <div>
              <p className="text-[13px] font-medium text-red-500">Delete Account</p>
              <p className="text-[11px] text-muted-foreground">Permanently delete your account and data</p>
            </div>
          </button>
        </div>
      </div>

      {/* Password Sheet */}
      <ChangePasswordSheet open={showPassword} onClose={() => setShowPassword(false)} />
    </div>
  );
}

/* ═══ Change Password Sheet ═══ */
function ChangePasswordSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    setError("");
    if (password.length < 6) { setError("Minimum 6 characters"); return; }
    if (password !== confirm) { setError("Passwords don't match"); return; }
    setSaving(true);
    try {
      await changePassword(password);
      setPassword("");
      setConfirm("");
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update password");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="bottom" className="max-h-[60vh] rounded-t-2xl">
        <SheetHeader>
          <SheetTitle className="font-display text-lg font-black uppercase tracking-tight">
            Change Password
          </SheetTitle>
        </SheetHeader>
        <div className="space-y-4 px-4 pb-6">
          <div>
            <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground">
              New Password
            </label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min 6 characters"
              className="h-10 rounded-xl"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground">
              Confirm Password
            </label>
            <Input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Re-enter password"
              className="h-10 rounded-xl"
            />
          </div>
          {error && <p className="text-[12px] text-red-500">{error}</p>}
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#C9973E] px-5 py-3.5 text-[12px] font-semibold uppercase tracking-wider text-black transition-all hover:bg-[#B8882F] active:scale-[0.98] disabled:opacity-50"
          >
            {saving ? "Updating..." : "Update Password"}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
