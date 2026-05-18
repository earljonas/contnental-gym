"use client";

import { useState, useTransition, useEffect, useCallback } from "react";
import { MapPin, X, Edit2, Building2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";

import { AdminPageHeader } from "@/components/admin/page-header";
import { AdminPageTransition } from "@/components/admin/page-transition";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateBranch } from "@/app/(admin)/super-admin/branches/actions";

export type BranchCard = {
  id: number;
  name: string;
  location: string;
  registeredMembers: number;
  activeMembers: number;
};

type EditState = {
  id: number;
  name: string;
  location: string;
} | null;

export function BranchesManager({
  initialBranches,
}: {
  initialBranches: BranchCard[];
}) {
  const router = useRouter();
  const [branches, setBranches] = useState(initialBranches);
  const [editingBranch, setEditingBranch] = useState<EditState>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  function openEditor(branch: BranchCard) {
    setErrorMessage("");
    setEditingBranch({
      id: branch.id,
      name: branch.name,
      location: branch.location,
    });
  }

  const closeEditor = useCallback(() => {
    if (isPending) return;
    setErrorMessage("");
    setEditingBranch(null);
  }, [isPending]);

  useEffect(() => {
    if (!editingBranch) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeEditor();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [editingBranch, closeEditor]);

  function updateField(field: "name" | "location", value: string) {
    setEditingBranch((current) => (current ? { ...current, [field]: value } : current));
  }

  function saveBranch() {
    if (!editingBranch) return;

    const name = editingBranch.name.trim();
    const location = editingBranch.location.trim();

    if (!name || !location) {
      setErrorMessage("Branch name and location are required.");
      return;
    }

    startTransition(async () => {
      setErrorMessage("");

      const result = await updateBranch({
        id: editingBranch.id,
        name,
        location,
      });

      if (result.error || !result.branch) {
        setErrorMessage(result.error ?? "Unable to save branch changes.");
        return;
      }

      setBranches((current) =>
        current.map((branch) =>
          branch.id === result.branch.id
            ? { ...branch, name: result.branch.name, location: result.branch.location }
            : branch
        )
      );
      setEditingBranch(null);
      router.refresh();
    });
  }

  return (
    <AdminPageTransition>
      <div className="space-y-10">
        <AdminPageHeader title="Branches" actionLabel={`${branches.length} locations`} />

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {branches.map((branch, index) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.4 }}
              key={branch.id}
              className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-border bg-card p-8 transition-colors hover:border-foreground/30"
            >
              <div className="relative z-10 flex items-start justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 mb-2">
                    <Building2 className="size-4 text-primary" />
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                      Branch
                    </span>
                  </div>
                  <h3 className="font-display text-3xl font-black uppercase tracking-tight text-foreground">
                    {branch.name}
                  </h3>
                  <p className="flex items-center gap-1.5 text-sm text-muted-foreground font-medium">
                    <MapPin className="size-3.5" />
                    {branch.location}
                  </p>
                </div>

                <button
                  onClick={() => openEditor(branch)}
                  className="flex size-10 shrink-0 items-center justify-center rounded-full border border-border bg-secondary/50 text-muted-foreground transition-colors hover:border-foreground hover:bg-foreground hover:text-background"
                  aria-label="Edit branch"
                >
                  <Edit2 className="size-4" />
                </button>
              </div>

              <div className="relative z-10 mt-10 grid gap-5 border-t border-border/50 pt-6 sm:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                    Registered Members
                  </p>
                  <div className="flex items-baseline gap-2">
                    <span className="font-display text-4xl font-black tracking-tighter text-foreground leading-none">
                      {branch.registeredMembers}
                    </span>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                    Active Registered
                  </p>
                  <div className="flex items-baseline gap-2">
                    <span className="font-display text-4xl font-black tracking-tighter text-foreground leading-none">
                      {branch.activeMembers}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Editor Modal */}
        {editingBranch ? (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="branch-editor-title"
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-lg overflow-hidden rounded-3xl border border-border bg-card"
            >
              <div className="flex items-center justify-between border-b border-border/50 bg-secondary/30 px-8 py-6">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                    Edit Location
                  </p>
                  <h2 id="branch-editor-title" className="mt-1 font-display text-2xl font-black uppercase tracking-tight text-foreground">
                    {editingBranch.name}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={closeEditor}
                  disabled={isPending}
                  className="flex size-8 items-center justify-center rounded-full bg-secondary/50 text-muted-foreground transition-colors hover:bg-foreground hover:text-background"
                  aria-label="Close branch editor"
                >
                  <X className="size-4" />
                </button>
              </div>

              <div className="p-8 space-y-6">
                <div className="space-y-2.5">
                  <Label htmlFor="branch-name" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Branch name</Label>
                  <Input
                    id="branch-name"
                    value={editingBranch.name}
                    onChange={(event) => updateField("name", event.target.value)}
                    className="h-12 rounded-2xl bg-secondary/20"
                    disabled={isPending}
                  />
                </div>
                <div className="space-y-2.5">
                  <Label htmlFor="branch-location" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Location</Label>
                  <Input
                    id="branch-location"
                    value={editingBranch.location}
                    onChange={(event) => updateField("location", event.target.value)}
                    className="h-12 rounded-2xl bg-secondary/20"
                    disabled={isPending}
                  />
                </div>
                {errorMessage ? (
                  <p className="text-sm font-medium text-destructive bg-destructive/10 px-4 py-3 rounded-xl">{errorMessage}</p>
                ) : null}

                <div className="mt-8 flex items-center justify-end gap-3 pt-4 border-t border-border/50">
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-12 rounded-2xl px-6 text-xs font-bold uppercase tracking-[0.16em] hover:bg-secondary/50"
                    onClick={closeEditor}
                    disabled={isPending}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    className="h-12 rounded-2xl px-8 text-xs font-bold uppercase tracking-[0.16em]"
                    onClick={saveBranch}
                    disabled={isPending}
                  >
                    {isPending ? "Saving..." : "Save changes"}
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        ) : null}
      </div>
    </AdminPageTransition>
  );
}
