"use client";

import { useRef, useState, useEffect } from "react";
import { Download, Share2, X } from "lucide-react";

/* ─── Types ─── */
interface StickerStatsProps {
  duration: string;
  volume: number;
  exerciseCount: number;
  totalSets?: number;
  routineName?: string | null;
  targetMuscles?: string[];
  prs?: string[];
  onDone: () => void;
}

/* ─── Muscle Resolver ─── */
function resolveRegions(targets: string[]): Set<string> {
  const active = new Set<string>();
  const map: Record<string, string[]> = {
    chest: ["upperBack"], pectorals: ["upperBack"], pecs: ["upperBack"],
    back: ["traps", "upperBack", "lowerBack"], lats: ["upperBack"],
    "upper back": ["traps", "upperBack"], "lower back": ["lowerBack"],
    traps: ["traps"], trapezius: ["traps"],
    shoulders: ["shoulders"], delts: ["shoulders"], deltoids: ["shoulders"],
    biceps: ["upperArms"], triceps: ["upperArms"], arms: ["upperArms", "forearms"],
    forearms: ["forearms"],
    core: ["lowerBack"], abs: ["lowerBack"],
    legs: ["hamstrings", "calves"], quads: ["hamstrings"], quadriceps: ["hamstrings"],
    hamstrings: ["hamstrings"], glutes: ["glutes"],
    calves: ["calves"], calf: ["calves"],
  };
  for (const t of targets) {
    const k = t.toLowerCase().trim();
    for (const [kw, regions] of Object.entries(map)) {
      if (k.includes(kw)) regions.forEach((r) => active.add(r));
    }
  }
  return active;
}

/* ─── Body Map ─── */
function BodyMap({ targetMuscles }: { targetMuscles: string[] }) {
  const a = resolveRegions(targetMuscles);
  const on = "#C9973E";
  const off = "rgba(255,255,255,0.04)";
  const c = (r: string) => (a.has(r) ? on : off);

  return (
    <svg viewBox="0 0 200 400" fill="none" className="h-full w-auto">
      <ellipse cx={100} cy={28} rx={18} ry={20} fill="rgba(255,255,255,0.05)" />
      <rect x={92} y={48} width={16} height={12} rx={5} fill="rgba(255,255,255,0.04)" />
      <path d="M92,56 Q74,62 56,80 L62,90 Q76,74 92,68Z" fill={c("traps")} />
      <path d="M108,56 Q126,62 144,80 L138,90 Q124,74 108,68Z" fill={c("traps")} />
      <ellipse cx={48} cy={88} rx={16} ry={15} fill={c("shoulders")} />
      <ellipse cx={152} cy={88} rx={16} ry={15} fill={c("shoulders")} />
      <rect x={68} y={68} width={64} height={66} rx={8} fill={c("upperBack")} />
      <rect x={72} y={136} width={56} height={34} rx={6} fill={c("lowerBack")} />
      <rect x={26} y={96} width={18} height={58} rx={9} fill={c("upperArms")} />
      <rect x={156} y={96} width={18} height={58} rx={9} fill={c("upperArms")} />
      <rect x={24} y={158} width={14} height={50} rx={7} fill={c("forearms")} />
      <rect x={162} y={158} width={14} height={50} rx={7} fill={c("forearms")} />
      <ellipse cx={84} cy={184} rx={16} ry={16} fill={c("glutes")} />
      <ellipse cx={116} cy={184} rx={16} ry={16} fill={c("glutes")} />
      <rect x={66} y={204} width={26} height={82} rx={12} fill={c("hamstrings")} />
      <rect x={108} y={204} width={26} height={82} rx={12} fill={c("hamstrings")} />
      <rect x={68} y={292} width={22} height={66} rx={10} fill={c("calves")} />
      <rect x={110} y={292} width={22} height={66} rx={10} fill={c("calves")} />
    </svg>
  );
}

/* ─── Confetti ─── */
function ConfettiCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const colors = ["#C9973E", "#E8C068", "#FFD700", "#B8882F", "#fff"];
    const ps = Array.from({ length: 50 }, () => ({
      x: Math.random() * canvas.width,
      y: -10 - Math.random() * canvas.height * 0.4,
      w: 3 + Math.random() * 5, h: 5 + Math.random() * 8,
      color: colors[Math.floor(Math.random() * colors.length)],
      vx: (Math.random() - 0.5) * 3, vy: 2 + Math.random() * 3,
      rot: Math.random() * Math.PI * 2, spin: (Math.random() - 0.5) * 0.15,
      op: 1, decay: 0.004 + Math.random() * 0.004,
    }));
    let id: number;
    (function loop() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;
      for (const p of ps) {
        if (p.op <= 0) continue;
        alive = true;
        p.x += p.vx; p.y += p.vy; p.vy += 0.04;
        p.rot += p.spin; p.op -= p.decay;
        ctx.save(); ctx.globalAlpha = Math.max(0, p.op);
        ctx.translate(p.x, p.y); ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }
      if (alive) id = requestAnimationFrame(loop);
    })();
    return () => cancelAnimationFrame(id);
  }, []);
  return <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 z-[60]" />;
}

/* ─── Main ─── */
export function StickerStats({
  duration, volume, exerciseCount, totalSets, routineName, targetMuscles = [], onDone,
}: StickerStatsProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setShowConfetti(false), 3500);
    return () => clearTimeout(t);
  }, []);

  async function handleDownload() {
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      const { toPng } = await import("html-to-image");
      const url = await toPng(cardRef.current, { pixelRatio: 3, backgroundColor: undefined });
      const a = document.createElement("a");
      a.href = url; a.download = `continental-${Date.now()}.png`; a.click();
    } catch (e) { console.error(e); } finally { setDownloading(false); }
  }

  async function handleShare() {
    if (!cardRef.current) return;
    try {
      const { toBlob } = await import("html-to-image");
      const blob = await toBlob(cardRef.current, { pixelRatio: 3, backgroundColor: undefined });
      if (!blob) return;
      const file = new File([blob], "continental-session.png", { type: "image/png" });
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: "Continental Session" });
      } else { handleDownload(); }
    } catch { handleDownload(); }
  }

  const hasMuscles = targetMuscles.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/95 p-4 backdrop-blur-sm">
      {showConfetti && <ConfettiCanvas />}

      <button onClick={onDone} className="absolute right-4 top-4 z-[70] rounded-lg p-2 text-muted-foreground hover:text-foreground">
        <X className="size-5" />
      </button>

      {/* ─── Card ─── */}
      <div
        ref={cardRef}
        className="relative w-full max-w-[360px] overflow-hidden rounded-2xl"
        style={{ background: "rgba(12, 12, 12, 0.88)", backdropFilter: "blur(24px)" }}
      >
        <div className="absolute inset-0 rounded-2xl pointer-events-none" style={{ boxShadow: "inset 0 0 0 1px rgba(201,151,62,0.12)" }} />

        <div className="relative p-5">
          {/* Header: Logo + Routine */}
          <div className="mb-4 flex items-center justify-between">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Continental" className="h-7 w-auto object-contain" style={{ filter: "brightness(0.9)" }} />
            {routineName && (
              <span className="font-display text-[13px] font-black uppercase tracking-tight text-foreground/80">
                {routineName}
              </span>
            )}
          </div>

          {/* Thin gold line */}
          <div className="mb-4 h-px w-full" style={{ background: "linear-gradient(90deg, #C9973E 0%, transparent 100%)" }} />

          {/* Content: Stats + Body Map side by side */}
          <div className={`flex gap-4 ${hasMuscles ? "" : "justify-center"}`}>

            {/* Stats column */}
            <div className={`flex flex-col justify-center gap-3 ${hasMuscles ? "" : "items-center text-center"}`}>
              <Stat label="Duration" value={duration} />
              <Stat label="Exercises" value={String(exerciseCount)} />
              {totalSets != null && totalSets > 0 && <Stat label="Sets" value={String(totalSets)} />}
              <Stat label="Volume" value={`${volume.toLocaleString()}kg`} />
            </div>

            {/* Body Map */}
            {hasMuscles && (
              <div className="flex flex-1 items-center justify-center">
                <div className="h-[180px]">
                  <BodyMap targetMuscles={targetMuscles} />
                </div>
              </div>
            )}
          </div>

          {/* Date */}
          <p className="mt-4 text-[8px] font-medium tracking-widest text-muted-foreground/25">
            {new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-5 flex gap-3">
        <button onClick={handleDownload} disabled={downloading}
          className="flex items-center gap-2 rounded-xl border border-border px-5 py-3 text-[12px] font-semibold uppercase tracking-wider text-foreground transition-all hover:bg-muted active:scale-[0.97]">
          <Download className="size-4" /> {downloading ? "..." : "Save"}
        </button>
        <button onClick={handleShare}
          className="flex items-center gap-2 rounded-xl bg-[#C9973E] px-5 py-3 text-[12px] font-semibold uppercase tracking-wider text-black transition-all hover:bg-[#B8882F] active:scale-[0.97]">
          <Share2 className="size-4" /> Share
        </button>
      </div>

      <button onClick={onDone}
        className="mt-3 w-full max-w-[360px] rounded-xl border border-border/50 py-3 text-[12px] font-semibold uppercase tracking-wider text-muted-foreground transition-all hover:bg-muted hover:text-foreground active:scale-[0.98]">
        Done
      </button>
    </div>
  );
}

/* ─── Stat ─── */
function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[8px] font-medium uppercase tracking-[0.2em] text-muted-foreground/35">{label}</p>
      <p className="font-display text-xl font-black leading-tight text-foreground">{value}</p>
    </div>
  );
}
