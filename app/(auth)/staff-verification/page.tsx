"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import QRCode from "react-qr-code";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { getRouteForRole, getUserRole } from "@/lib/supabase/roles";

export default function StaffVerification() {
  const router = useRouter();
  const [factorId, setFactorId] = useState("");
  const [setup, setSetup] = useState<{ uri: string; secret: string } | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [supabase] = useState(createClient);

  async function start() {
    setBusy(true);
    setError("");
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/login"); return; }
      const role = await getUserRole(supabase, user.id);
      if (role.role === "MEMBER") { router.replace("/dashboard"); return; }
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error) throw error;
      const verified = data.totp[0];
      if (verified) { setFactorId(verified.id); return; }
      const { data: created, error: setupError } = await supabase.auth.mfa.enroll({ factorType: "totp", issuer: "Contnental Fitness Gym" });
      if (setupError || !created) throw setupError;
      setFactorId(created.id);
      setSetup({ uri: created.totp.uri, secret: created.totp.secret });
    } catch {
      setError("Could not set up staff verification. Try again or contact your account administrator.");
    } finally { setBusy(false); }
  }

  async function verify(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const code = String(new FormData(event.currentTarget).get("code") ?? "").trim();
    if (!/^\d{6}$/.test(code)) { setError("Enter the six-digit code from your authenticator."); return; }
    setBusy(true);
    setError("");
    try {
      const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId, code });
      if (error) { setError("The code could not be verified. Try the next code from your authenticator."); return; }
      setSetup(null);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/login"); return; }
      router.replace(getRouteForRole((await getUserRole(supabase, user.id)).role));
      router.refresh();
    } finally { setBusy(false); }
  }

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">Verify staff access</h1>
      {!factorId && <Button type="button" onClick={start} disabled={busy}>Continue with authenticator</Button>}
      {setup && <div className="space-y-3">
        <p>Scan this QR code with your authenticator app, or enter the key manually.</p>
        <QRCode value={setup.uri} size={144} className="border-8 border-white bg-white" title="Set up your authenticator" />
        <code className="block break-all text-sm">{setup.secret}</code>
      </div>}
      {factorId && <form onSubmit={verify} className="space-y-3">
        <Label htmlFor="staff-code">Authenticator code</Label>
        <Input id="staff-code" name="code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} required />
        <Button type="submit" disabled={busy}>Verify and continue</Button>
      </form>}
      {error && <p role="alert">{error}</p>}
      <form action="/auth/signout" method="post"><Button type="submit" variant="outline">Sign out</Button></form>
    </section>
  );
}
