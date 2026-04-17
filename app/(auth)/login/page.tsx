"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { getRouteForRole, getUserRole } from "@/lib/supabase/roles";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const supabase = createClient();

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setIsLoading(false);
      return;
    }

    // Fetch role to redirect
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const roleInfo = await getUserRole(supabase, user.id);

      router.refresh(); // Clear Next.js client-side router cache
      router.push(getRouteForRole(roleInfo.role));
    }

    setIsLoading(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-4xl font-black uppercase tracking-tight text-white">
          WELCOME BACK
        </h1>
        <p className="mt-2 text-[15px] text-text-secondary">
          Sign in to your Contnental account
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="border border-red-500/30 bg-red-500/10 px-4 py-3 text-[13px] text-red-400"
          >
            {error}
          </motion.div>
        )}

        <div className="space-y-2">
          <Label htmlFor="email" className="text-[11px] font-medium uppercase tracking-[0.15em] text-text-secondary">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="you@email.com"
            autoComplete="email"
            className="h-12 rounded-none border-border-subtle bg-surface px-4 text-[14px] text-white placeholder:text-text-muted focus-visible:border-white focus-visible:ring-0"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-[11px] font-medium uppercase tracking-[0.15em] text-text-secondary">
            Password
          </Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              autoComplete="current-password"
              className="h-12 rounded-none border-border-subtle bg-surface px-4 pr-12 text-[14px] text-white placeholder:text-text-muted focus-visible:border-white focus-visible:ring-0"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary transition-colors hover:text-white"
            >
              {showPassword ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              )}
            </button>
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              className="text-[11px] uppercase tracking-[0.1em] text-text-secondary transition-colors hover:text-white"
            >
              Forgot Password
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="flex h-12 w-full items-center justify-center border border-white bg-white text-[12px] font-medium uppercase tracking-[0.15em] text-black transition-all hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
          ) : (
            "SIGN IN"
          )}
        </button>
      </form>

      <div className="my-8 flex items-center gap-4">
        <div className="h-px flex-1 bg-border-subtle" />
        <span className="text-[11px] uppercase tracking-[0.15em] text-text-muted">or</span>
        <div className="h-px flex-1 bg-border-subtle" />
      </div>

      <p className="text-center text-[14px] text-text-secondary">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="font-medium text-white underline underline-offset-4 transition-colors hover:text-gold">
          Register here
        </Link>
      </p>
    </motion.div>
  );
}
