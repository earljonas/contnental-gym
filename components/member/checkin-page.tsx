"use client";

import QRCode from "react-qr-code";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface CheckInPageProps {
  userId: string;
  fullName: string;
  branchName: string | null;
  membershipStatus: string | null;
  lastCheckIn: { time: string; branch: string } | null;
}

function getRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function CheckInPage({
  userId,
  fullName,
  branchName,
  membershipStatus,
  lastCheckIn,
}: CheckInPageProps) {
  const isActive = membershipStatus === "ACTIVE";

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center space-y-8 px-4 py-8">
      {/* QR Card */}
      <div
        className="w-full max-w-sm overflow-hidden rounded-2xl border border-border"
        style={{
          background: "linear-gradient(145deg, #0f0f0f 0%, #1a1a1a 50%, #0f0f0f 100%)",
        }}
      >
        {/* Header */}
        <div className="flex flex-col items-center border-b border-border px-6 pt-6 pb-4">
          <span className="font-display text-lg font-black uppercase tracking-tight text-foreground">
            CONTNENTAL
          </span>
          <span className="text-[9px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
            FITNESS GYM
          </span>
          {branchName && (
            <span className="mt-2 rounded-full bg-[#C9973E]/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#C9973E]">
              {branchName}
            </span>
          )}
        </div>

        {/* QR Section */}
        <div className="flex flex-col items-center px-6 py-8">
          {isActive ? (
            <>
              <div className="rounded-2xl bg-white p-4">
                <QRCode
                  value={userId}
                  size={200}
                  level="M"
                  bgColor="#ffffff"
                  fgColor="#0a0a0a"
                />
              </div>
              <p className="mt-5 font-display text-base font-black uppercase tracking-tight text-foreground">
                {fullName}
              </p>
            </>
          ) : (
            <div className="flex flex-col items-center py-6">
              {/* Blurred placeholder QR */}
              <div className="relative rounded-2xl bg-white/5 p-4">
                <div className="h-[200px] w-[200px] rounded-xl bg-muted/20 backdrop-blur-xl" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="rounded-xl bg-background/90 px-4 py-3 text-center">
                    <p className="text-[12px] font-medium text-foreground">
                      Membership Required
                    </p>
                  </div>
                </div>
              </div>
              <p className="mt-5 max-w-[240px] text-center text-[13px] text-muted-foreground">
                Activate your membership to check in
              </p>
              <Link
                href="/dashboard"
                className="mt-3 rounded-xl bg-[#C9973E] px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-black transition-all hover:bg-[#B8882F] active:scale-[0.98]"
              >
                View Membership
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Info */}
      <div className="w-full max-w-sm space-y-3">
        {isActive && (
          <p className="text-center text-[12px] text-muted-foreground">
            Show this at the entrance
          </p>
        )}

        {/* Last Check-in */}
        {lastCheckIn && (
          <div className="flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-3">
            <span className="text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground">
              Last Visited
            </span>
            <span className="text-[12px] text-foreground">
              {getRelativeTime(lastCheckIn.time)} · {lastCheckIn.branch}
            </span>
          </div>
        )}

        {/* Status Pill */}
        <div className="flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-3">
          <span className="text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground">
            Membership
          </span>
          <span
            className={cn(
              "rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wider",
              isActive
                ? "bg-emerald-500/10 text-emerald-500"
                : membershipStatus === "PENDING"
                  ? "bg-amber-500/10 text-amber-500"
                  : "bg-red-500/10 text-red-500",
            )}
          >
            {membershipStatus ?? "NONE"}
          </span>
        </div>
      </div>
    </div>
  );
}
