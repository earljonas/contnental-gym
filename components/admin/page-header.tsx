import { Button } from "@/components/ui/button";

export function AdminPageHeader({
  title,
  actionLabel,
}: {
  title: string;
  actionLabel?: string;
}) {
  return (
    <div className="flex flex-col gap-4 border-b border-border pb-6 md:flex-row md:items-end md:justify-between">
      <div>
        <h2 className="font-display text-4xl font-black uppercase tracking-tight text-foreground md:text-5xl">
          {title}
        </h2>
      </div>

      {actionLabel ? (
        <Button className="h-11 rounded-2xl px-5 text-xs font-semibold uppercase tracking-[0.16em]">
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}
