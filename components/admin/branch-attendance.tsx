"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Camera,
  CameraOff,
  Check,
  AlertTriangle,
  Clock,
  Search,
  ScanLine,
  UserCheck,
  Users,
  CalendarDays,
  TrendingUp,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

import { AdminPageHeader } from "@/components/admin/page-header";
import { AdminPageTransition } from "@/components/admin/page-transition";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type {
  BranchAttendanceData,
  MemberLookup,
  SearchableMember,
} from "@/lib/branch-admin/data";
import { checkInMember } from "@/app/(branch)/branch/attendance/actions";

// ── Status feedback config ──

type FeedbackState = {
  type: "success" | "expired" | "pending" | "error" | null;
  member?: MemberLookup;
  message: string;
};

const SCANNER_STORAGE_KEY = "continental-branch-scanner-enabled";

const feedbackConfig = {
  success: {
    icon: Check,
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    text: "text-emerald-500",
    iconBg: "bg-emerald-500/20",
  },
  expired: {
    icon: AlertTriangle,
    bg: "bg-rose-500/10",
    border: "border-rose-500/30",
    text: "text-rose-500",
    iconBg: "bg-rose-500/20",
  },
  pending: {
    icon: Clock,
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    text: "text-amber-500",
    iconBg: "bg-amber-500/20",
  },
  error: {
    icon: AlertTriangle,
    bg: "bg-rose-500/10",
    border: "border-rose-500/30",
    text: "text-rose-500",
    iconBg: "bg-rose-500/20",
  },
};

// ── QR Scanner Component ──

type Html5QrcodeType = InstanceType<typeof import("html5-qrcode").Html5Qrcode>;

function QrScanner({ onScan, enabled }: { onScan: (code: string) => void; enabled: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scannerRef = useRef<Html5QrcodeType | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || !containerRef.current) return;

    let html5QrCode: Html5QrcodeType | null = null;
    let mounted = true;

    async function startScanner() {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        if (!mounted || !containerRef.current) return;

        html5QrCode = new Html5Qrcode(containerRef.current.id);
        scannerRef.current = html5QrCode;

        await html5QrCode.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1,
          },
          (decodedText: string) => {
            onScan(decodedText);
          },
          () => {
            // Ignore failed scans
          }
        );

        if (mounted) setCameraActive(true);
      } catch (err: unknown) {
        if (mounted) {
          const message =
            err instanceof Error
              ? err.message
              : typeof err === "object" &&
                  err !== null &&
                  "message" in err &&
                  typeof err.message === "string"
                ? err.message
                : "Unknown error";
          setCameraError(
            message.includes("NotAllowed")
              ? "Camera access denied. Please allow camera permissions."
              : "Unable to start camera. Try the manual check-in below."
          );
        }
      }
    }

    startScanner();

    return () => {
      mounted = false;
      if (html5QrCode) {
        html5QrCode.stop().catch(() => {});
      }
    };
  }, [enabled, onScan]);

  if (cameraError) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-border bg-secondary/20 p-12 text-center">
        <CameraOff className="size-10 text-muted-foreground" />
        <p className="text-sm text-muted-foreground max-w-xs">{cameraError}</p>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-black">
      <div
        id="qr-reader"
        ref={containerRef}
        className="aspect-square w-full max-w-[320px] mx-auto"
      />
      {!cameraActive && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-secondary/80">
          <Camera className="size-8 text-muted-foreground animate-pulse" />
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Starting camera...
          </p>
        </div>
      )}
    </div>
  );
}

// ── Manual Check-in Component ──

function ManualCheckIn({
  members,
  onCheckIn,
  isPending,
}: {
  members: SearchableMember[];
  onCheckIn: (memberId: string) => void;
  isPending: boolean;
}) {
  const [search, setSearch] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<SearchableMember | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filteredMembers = search.trim().length > 0
    ? members.filter((m) =>
        m.name.toLowerCase().includes(search.toLowerCase())
      ).slice(0, 8)
    : [];

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleSelect(member: SearchableMember) {
    setSelectedMember(member);
    setSearch(member.name);
    setIsDropdownOpen(false);
  }

  function handleSubmit() {
    if (!selectedMember) return;
    onCheckIn(selectedMember.id);
    setSearch("");
    setSelectedMember(null);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Search className="size-4" />
        <span className="text-[11px] font-semibold uppercase tracking-[0.16em]">
          Manual Check-in
        </span>
      </div>
      <div className="flex gap-3" ref={dropdownRef}>
        <div className="relative flex-1">
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSelectedMember(null);
              setIsDropdownOpen(e.target.value.trim().length > 0);
            }}
            onFocus={() => {
              if (search.trim().length > 0) setIsDropdownOpen(true);
            }}
            placeholder="Search member name..."
            className="h-12 rounded-2xl bg-secondary/20 pl-4 text-sm"
            disabled={isPending}
          />
          {isDropdownOpen && filteredMembers.length > 0 && (
            <div className="absolute top-full left-0 right-0 z-20 mt-2 max-h-56 overflow-y-auto rounded-2xl border border-border bg-card shadow-xl">
              {filteredMembers.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  className="w-full px-4 py-3 text-left text-sm font-medium text-foreground transition-colors hover:bg-secondary/50 first:rounded-t-2xl last:rounded-b-2xl"
                  onClick={() => handleSelect(m)}
                >
                  {m.name}
                </button>
              ))}
            </div>
          )}
          {isDropdownOpen && filteredMembers.length === 0 && search.trim().length > 0 && (
            <div className="absolute top-full left-0 right-0 z-20 mt-2 rounded-2xl border border-border bg-card px-4 py-6 text-center text-sm text-muted-foreground shadow-xl">
              No members found
            </div>
          )}
        </div>
        <Button
          onClick={handleSubmit}
          disabled={!selectedMember || isPending}
          className="h-12 shrink-0 rounded-2xl px-6 text-xs font-bold uppercase tracking-[0.16em]"
        >
          <UserCheck className="mr-2 size-4" />
          {isPending ? "Checking in..." : "Check In"}
        </Button>
      </div>
    </div>
  );
}

// ── Main Attendance Page ──

export function BranchAttendancePage({
  data,
  members,
  dateFilter,
}: {
  data: BranchAttendanceData;
  members: SearchableMember[];
  dateFilter?: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<FeedbackState>({ type: null, message: "" });
  const [scannerEnabled, setScannerEnabled] = useState(() => {
    if (typeof window === "undefined") return true;
    const saved = window.localStorage.getItem(SCANNER_STORAGE_KEY);
    return saved === null ? true : saved === "true";
  });
  const lastScannedRef = useRef<string>("");
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showFeedback = useCallback((state: FeedbackState) => {
    setFeedback(state);
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    feedbackTimerRef.current = setTimeout(() => {
      setFeedback({ type: null, message: "" });
    }, 5000);
  }, []);

  const handleCheckIn = useCallback(
    (memberId: string, method: "QR" | "Manual") => {
      // Debounce duplicate QR scans
      if (method === "QR" && memberId === lastScannedRef.current) return;
      lastScannedRef.current = memberId;

      startTransition(async () => {
        const result = await checkInMember(memberId, method);

        if (result.success && result.member) {
          showFeedback({
            type: "success",
            member: result.member,
            message: "Check-in successful",
          });
          router.refresh();
        } else if (result.member) {
          const status = result.member.membershipStatus;
          if (status === "EXPIRED" || status === "CANCELLED") {
            showFeedback({
              type: "expired",
              member: result.member,
              message: "Membership expired — collect payment before entry",
            });
          } else if (status === "PENDING") {
            showFeedback({
              type: "pending",
              member: result.member,
              message: "Membership pending activation",
            });
          } else {
            showFeedback({
              type: "error",
              member: result.member,
              message: result.error ?? "Cannot check in this member",
            });
          }
        } else {
          showFeedback({
            type: "error",
            message: result.error ?? "Check-in failed",
          });
        }

        // Reset debounce after delay
        setTimeout(() => {
          lastScannedRef.current = "";
        }, 3000);
      });
    },
    [showFeedback, router]
  );

  const handleQrScan = useCallback(
    (code: string) => {
      // Extract UUID from the scanned code — could be raw UUID or a URL containing it
      const uuidMatch = code.match(
        /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i
      );
      if (uuidMatch) {
        handleCheckIn(uuidMatch[0], "QR");
      }
    },
    [handleCheckIn]
  );

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val) {
      router.push(`/branch/attendance?date=${val}`);
    } else {
      router.push("/branch/attendance");
    }
  };

  const currentFeedbackConfig = feedback.type ? feedbackConfig[feedback.type] : null;

  function toggleScanner() {
    setScannerEnabled((enabled) => {
      const next = !enabled;
      window.localStorage.setItem(SCANNER_STORAGE_KEY, String(next));
      return next;
    });
  }

  return (
    <AdminPageTransition>
      <div className="space-y-8">
        <AdminPageHeader title="Attendance" />

        {/* ── TOP HALF: Check-in Station ── */}
        <Card className="overflow-hidden rounded-[30px]">
          <CardHeader className="border-b border-border/70 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-2xl bg-secondary">
                  <ScanLine className="size-5 text-foreground" />
                </div>
                <div>
                  <CardTitle>Check-in Station</CardTitle>
                  <CardDescription className="mt-0.5 text-xs">
                    Scan member QR code or use manual search
                  </CardDescription>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={toggleScanner}
                className="h-9 rounded-full px-4 text-[11px] font-semibold uppercase tracking-[0.12em]"
              >
                {scannerEnabled ? (
                  <>
                    <CameraOff className="mr-1.5 size-3.5" />
                    Disable Camera
                  </>
                ) : (
                  <>
                    <Camera className="mr-1.5 size-3.5" />
                    Enable Camera
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
              {/* Scanner / Feedback column */}
              <div className="space-y-5">
                {scannerEnabled && !feedback.type && (
                  <QrScanner onScan={handleQrScan} enabled={scannerEnabled} />
                )}

                {/* Feedback overlay */}
                <AnimatePresence mode="wait">
                  {feedback.type && currentFeedbackConfig && (
                    <motion.div
                      key="feedback"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className={`relative rounded-2xl border ${currentFeedbackConfig.border} ${currentFeedbackConfig.bg} p-6`}
                    >
                      <button
                        type="button"
                        className="absolute right-3 top-3 rounded-full p-1 text-muted-foreground hover:text-foreground"
                        onClick={() => setFeedback({ type: null, message: "" })}
                      >
                        <X className="size-4" />
                      </button>

                      <div className="flex flex-col items-center gap-4 text-center">
                        <div
                          className={`flex size-16 items-center justify-center rounded-full ${currentFeedbackConfig.iconBg}`}
                        >
                          <currentFeedbackConfig.icon
                            className={`size-8 ${currentFeedbackConfig.text}`}
                          />
                        </div>

                        {feedback.member && (
                          <div className="space-y-1">
                            {feedback.member.avatarUrl && (
                              <img
                                src={feedback.member.avatarUrl}
                                alt=""
                                className="mx-auto mb-3 size-16 rounded-full border-2 border-border object-cover"
                              />
                            )}
                            <p className="text-lg font-bold text-foreground">
                              {feedback.member.name}
                            </p>
                            <Badge
                              variant="secondary"
                              className={
                                feedback.member.membershipStatus === "ACTIVE"
                                  ? "badge-active"
                                  : feedback.member.membershipStatus === "PENDING"
                                    ? "badge-pending"
                                    : "badge-expired"
                              }
                            >
                              {feedback.member.membershipStatus}
                            </Badge>
                          </div>
                        )}

                        <p
                          className={`text-sm font-semibold ${currentFeedbackConfig.text}`}
                        >
                          {feedback.message}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {!scannerEnabled && !feedback.type && (
                  <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-border bg-secondary/20 p-12 text-center">
                    <CameraOff className="size-10 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Camera disabled. Use manual check-in.
                    </p>
                  </div>
                )}
              </div>

              {/* Manual check-in column */}
              <div className="flex flex-col justify-between gap-6">
                <ManualCheckIn
                  members={members}
                  onCheckIn={(id) => handleCheckIn(id, "Manual")}
                  isPending={isPending}
                />

                {/* Quick stats inline */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-2xl border border-border bg-secondary/30 p-4 text-center">
                    <Users className="mx-auto mb-2 size-5 text-muted-foreground" />
                    <p className="font-display text-2xl font-black text-foreground">
                      {data.summary.todayCount}
                    </p>
                    <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                      Today
                    </p>
                  </div>
                  <div className="rounded-2xl border border-border bg-secondary/30 p-4 text-center">
                    <CalendarDays className="mx-auto mb-2 size-5 text-muted-foreground" />
                    <p className="font-display text-2xl font-black text-foreground">
                      {data.summary.weekCount}
                    </p>
                    <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                      This Week
                    </p>
                  </div>
                  <div className="rounded-2xl border border-border bg-secondary/30 p-4 text-center">
                    <TrendingUp className="mx-auto mb-2 size-5 text-muted-foreground" />
                    <p className="font-display text-lg font-black text-foreground leading-tight">
                      {data.summary.busiestDay}
                    </p>
                    <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                      Busiest ({data.summary.busiestDayCount})
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── BOTTOM HALF: Attendance Log ── */}
        <Card className="rounded-[30px]">
          <CardHeader className="flex-col gap-4 border-b border-border/70 p-6 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <CardTitle>Attendance Log</CardTitle>
            <div className="flex items-center gap-3">
              <Input
                type="date"
                value={dateFilter ?? ""}
                onChange={handleDateChange}
                className="h-10 w-[160px] rounded-xl border-border bg-background text-sm"
                aria-label="Filter by date"
              />
              {dateFilter && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push("/branch/attendance")}
                  className="h-10 rounded-xl px-3 text-xs font-semibold uppercase tracking-[0.12em]"
                >
                  Today
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {data.log.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-8 text-center md:p-12">
                <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-secondary">
                  <CalendarDays className="size-7 text-muted-foreground" />
                </div>
                <p className="text-sm font-semibold text-foreground">
                  No check-ins recorded
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {dateFilter
                    ? "No members checked in on this date."
                    : "Members will appear here as they check in today."}
                </p>
                {dateFilter && (
                  <button
                    type="button"
                    onClick={() => router.push("/branch/attendance")}
                    className="mt-5 inline-flex h-10 items-center rounded-xl bg-[#C9973E] px-4 text-[11px] font-bold uppercase tracking-[0.16em] text-black"
                  >
                    Back to Today
                  </button>
                )}
              </div>
            ) : (
              <Table className="min-w-[480px]">
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Member Name</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Method</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.log.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="text-[15px] font-medium">
                        {row.memberName}
                      </TableCell>
                      <TableCell className="text-[15px] text-muted-foreground">
                        {row.time}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={
                            row.method === "QR"
                              ? "bg-sky-500/10 text-sky-600 border-sky-500/20"
                              : "bg-violet-500/10 text-violet-600 border-violet-500/20"
                          }
                        >
                          {row.method}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminPageTransition>
  );
}
