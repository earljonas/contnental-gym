"use client";

import { useRef, useState } from "react";
import { Download, Share2, X, Trophy, Timer, Volume2, Dumbbell } from "lucide-react";

interface StickerStatsProps {
  duration: string;
  volume: number;
  exerciseCount: number;
  prs?: string[];
  onDone: () => void;
}

export function StickerStats({ duration, volume, exerciseCount, prs = [], onDone }: StickerStatsProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  async function handleDownload() {
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: "#0A0A0A",
        scale: 2,
      });
      const url = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = url;
      a.download = `contnental-session-${Date.now()}.png`;
      a.click();
    } catch (err) {
      console.error(err);
    } finally {
      setDownloading(false);
    }
  }

  async function handleShare() {
    if (!cardRef.current) return;
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: "#0A0A0A",
        scale: 2,
      });
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const file = new File([blob], "session.png", { type: "image/png" });
        if (navigator.share) {
          await navigator.share({ files: [file], title: "Contnental Session" });
        } else {
          handleDownload();
        }
      });
    } catch {
      handleDownload();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background p-6">
      <button onClick={onDone} className="absolute right-4 top-4 rounded-lg p-2 text-muted-foreground hover:text-foreground">
        <X className="size-5" />
      </button>

      <p className="mb-6 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
        Session Complete
      </p>

      {/* Shareable Card */}
      <div
        ref={cardRef}
        className="w-full max-w-sm overflow-hidden rounded-2xl border border-border bg-card p-6"
        style={{ background: "linear-gradient(145deg, #141414 0%, #1a1a1a 50%, #141414 100%)" }}
      >
        {/* Logo */}
        <div className="mb-6 flex flex-col leading-none">
          <span className="font-display text-lg font-black uppercase tracking-tight text-foreground">
            CONTNENTAL
          </span>
          <span className="text-[9px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
            FITNESS GYM
          </span>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <StatBadge icon={Timer} label="Duration" value={duration} />
          <StatBadge icon={Volume2} label="Volume" value={`${volume.toLocaleString()}kg`} />
          <StatBadge icon={Dumbbell} label="Exercises" value={String(exerciseCount)} />
          {prs.length > 0 && <StatBadge icon={Trophy} label="PRs" value={String(prs.length)} gold />}
        </div>

        {/* Date */}
        <p className="mt-6 text-center text-[10px] font-medium uppercase tracking-[0.15em] text-muted-foreground">
          {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
        </p>
      </div>

      {/* Actions */}
      <div className="mt-6 flex gap-3">
        <button onClick={handleDownload} disabled={downloading}
          className="flex items-center gap-2 rounded-xl border border-border px-5 py-3 text-[12px] font-semibold uppercase tracking-wider text-foreground transition-all hover:bg-muted active:scale-[0.98]">
          <Download className="size-4" />
          {downloading ? "..." : "Download"}
        </button>
        <button onClick={handleShare}
          className="flex items-center gap-2 rounded-xl bg-[#C9973E] px-5 py-3 text-[12px] font-semibold uppercase tracking-wider text-black transition-all hover:bg-[#B8882F] active:scale-[0.98]">
          <Share2 className="size-4" />
          Share
        </button>
      </div>

      <button onClick={onDone}
        className="mt-4 text-[12px] font-medium text-muted-foreground transition-colors hover:text-foreground">
        Done
      </button>
    </div>
  );
}

function StatBadge({
  icon: Icon, label, value, gold,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  gold?: boolean;
}) {
  return (
    <div className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${
      gold ? "border-[#C9973E]/30 bg-[#C9973E]/10" : "border-border bg-background/50"
    }`}>
      <Icon className={`size-5 ${gold ? "text-[#C9973E]" : "text-muted-foreground"}`} />
      <div>
        <p className={`font-display text-lg font-black ${gold ? "text-[#C9973E]" : "text-foreground"}`}>
          {value}
        </p>
        <p className="text-[9px] font-medium uppercase tracking-[0.15em] text-muted-foreground">
          {label}
        </p>
      </div>
    </div>
  );
}
