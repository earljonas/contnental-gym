"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") ?? "");
    if (password.length < 8 || password !== form.get("confirm")) {
      setError("Enter matching passwords of at least 8 characters.");
      return;
    }
    setError("");
    setPending(true);
    try {
      const client = createClient();
      const { error } = await client.auth.updateUser({ password });
      if (error) {
        setError("Could not save the password. Try again or request a new link.");
        return;
      }
      await client.auth.signOut();
      router.replace("/login");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={save} className="space-y-4">
      <h1 className="text-2xl font-semibold">Set a new password</h1>
      <Label htmlFor="new-password">New password</Label>
      <Input id="new-password" name="password" type="password" autoComplete="new-password" minLength={8} maxLength={72} required />
      <Label htmlFor="confirm-password">Confirm password</Label>
      <Input id="confirm-password" name="confirm" type="password" autoComplete="new-password" minLength={8} maxLength={72} required />
      {error && <p role="alert" className="text-red-400">{error}</p>}
      <Button type="submit" disabled={pending}>Save password</Button>
      <Link href="/login" className="block text-sm underline">Back to sign in</Link>
    </form>
  );
}
