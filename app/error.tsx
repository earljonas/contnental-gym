"use client";

import { Button } from "@/components/ui/button";

export default function ErrorPage({ unstable_retry }: { unstable_retry: () => void }) {
  return <section className="mx-auto max-w-xl space-y-4 p-6">
    <h1 className="text-2xl font-semibold">This page could not be loaded</h1>
    <p role="alert" className="text-sm text-muted-foreground">Try again in a moment.</p>
    <Button type="button" onClick={unstable_retry}>Try again</Button>
  </section>;
}
