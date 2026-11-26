import Link from "next/link";

export function ReportUnavailable({ title, href }: { title: string; href: string }) {
  return <section className="space-y-3 rounded-xl border p-6">
    <h1 className="text-xl font-semibold">{title}</h1>
    <p role="alert" className="text-sm text-muted-foreground">The report could not be loaded. Try again before using these figures.</p>
    <Link href={href} className="inline-flex min-h-11 items-center rounded-lg border px-4 text-sm font-medium">Retry</Link>
  </section>;
}
