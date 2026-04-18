"use client";

import { useState, useTransition } from "react";
import { MapPin, Users, X } from "lucide-react";
import { useRouter } from "next/navigation";

import { AdminPageHeader } from "@/components/admin/page-header";
import { AdminPageTransition } from "@/components/admin/page-transition";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

export type BranchCard = {
  id: number;
  name: string;
  location: string;
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
  const supabase = createClient();
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

  function closeEditor() {
    if (isPending) return;
    setErrorMessage("");
    setEditingBranch(null);
  }

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

      const { data, error } = await supabase
        .from("branches")
        .update({ name, location })
        .eq("id", editingBranch.id)
        .select("id, name, location")
        .single();

      if (error || !data) {
        setErrorMessage(error?.message ?? "Unable to save branch changes.");
        return;
      }

      setBranches((current) =>
        current.map((branch) =>
          branch.id === data.id
            ? { ...branch, name: data.name, location: data.location ?? branch.location }
            : branch
        )
      );
      setEditingBranch(null);
      router.refresh();
    });
  }

  return (
    <AdminPageTransition>
      <div className="space-y-8">
        <AdminPageHeader title="Branches" actionLabel={`${branches.length} locations`} />

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {branches.map((branch) => (
            <Card key={branch.id} className="rounded-[28px]">
              <CardHeader className="gap-4">
                <div className="space-y-2">
                  <CardTitle className="font-display text-3xl font-black uppercase tracking-tight">
                    {branch.name}
                  </CardTitle>
                  <CardDescription className="flex items-start gap-2 text-sm">
                    <MapPin className="mt-0.5 size-4 shrink-0 text-accent" />
                    <span>{branch.location}</span>
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="rounded-2xl border border-border bg-secondary/55 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Active members
                  </p>
                  <div className="mt-3 flex items-center gap-3">
                    <Users className="size-5 text-accent" />
                    <span className="font-display text-4xl font-black tracking-tight">
                      {branch.activeMembers}
                    </span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="h-11 w-full rounded-2xl px-5 text-xs font-semibold uppercase tracking-[0.16em]"
                  onClick={() => openEditor(branch)}
                >
                  Edit
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {editingBranch ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
            <div className="w-full max-w-lg rounded-[28px] border border-border bg-card p-6 shadow-2xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Edit branch
                  </p>
                  <h2 className="mt-2 font-display text-3xl font-black uppercase tracking-tight text-foreground">
                    {editingBranch.name}
                  </h2>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={closeEditor}
                  disabled={isPending}
                  aria-label="Close branch editor"
                >
                  <X className="size-4" />
                </Button>
              </div>

              <div className="mt-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="branch-name">Branch name</Label>
                  <Input
                    id="branch-name"
                    value={editingBranch.name}
                    onChange={(event) => updateField("name", event.target.value)}
                    className="h-11 rounded-2xl"
                    disabled={isPending}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="branch-location">Location</Label>
                  <Input
                    id="branch-location"
                    value={editingBranch.location}
                    onChange={(event) => updateField("location", event.target.value)}
                    className="h-11 rounded-2xl"
                    disabled={isPending}
                  />
                </div>
                {errorMessage ? (
                  <p className="text-sm text-destructive">{errorMessage}</p>
                ) : null}
              </div>

              <div className="mt-6 flex flex-wrap justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 rounded-2xl px-5 text-xs font-semibold uppercase tracking-[0.16em]"
                  onClick={closeEditor}
                  disabled={isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  className="h-11 rounded-2xl px-5 text-xs font-semibold uppercase tracking-[0.16em]"
                  onClick={saveBranch}
                  disabled={isPending}
                >
                  {isPending ? "Saving..." : "Save changes"}
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </AdminPageTransition>
  );
}
