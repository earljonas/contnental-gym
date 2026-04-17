"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

/* ─── TYPES ─── */
interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  plan: string | null;
  otp: string[];
}

/* ─── PLANS ─── */
const plans = [
  {
    id: "basic",
    name: "BASIC",
    price: "₱1,500",
    period: "/month",
    dbId: 1,
    features: [
      "Full gym floor access",
      "Locker room and showers",
      "Open daily 6AM – 10PM",
      "Equipment walkthrough on signup",
    ],
  },
  {
    id: "elite",
    name: "ELITE",
    price: "₱2,500",
    period: "/month",
    dbId: 2,
    popular: true,
    features: [
      "Everything in Basic",
      "Group training sessions",
      "Coached technique clinics",
      "Priority equipment booking",
      "1 guest pass per month",
    ],
  },
  {
    id: "premium",
    name: "PREMIUM",
    price: "₱4,000",
    period: "/month",
    dbId: 3,
    features: [
      "Everything in Elite",
      "Monthly personal programming",
      "Body composition check-ins",
      "24/7 facility access",
      "Recovery area access",
    ],
  },
];

const steps = ["Account", "Plan", "Verify", "Done"];

const pageVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 40 : -40, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -40 : 40, opacity: 0 }),
};

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState<FormData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    plan: null,
    otp: ["", "", "", "", "", ""],
  });

  const supabase = createClient();

  /* ─── HELPERS ─── */
  const set = (field: keyof FormData, value: string) => {
    setForm((p) => ({ ...p, [field]: value }));
    setErrors((p) => ({ ...p, [field]: "" }));
  };

  const next = () => { setDir(1); setStep((s) => Math.min(s + 1, 3)); };
  const back = () => { setDir(-1); setStep((s) => Math.max(s - 1, 0)); };

  /* ─── VALIDATION ─── */
  const validateAccount = () => {
    const e: Record<string, string> = {};
    if (!form.firstName.trim()) e.firstName = "Required";
    if (!form.lastName.trim()) e.lastName = "Required";
    if (!form.email.trim()) e.email = "Required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Invalid email";
    if (!form.phone.trim()) e.phone = "Required";
    if (!form.password) e.password = "Required";
    else if (form.password.length < 8) e.password = "Min 8 characters";
    if (form.password !== form.confirmPassword) e.confirmPassword = "Passwords don't match";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  /* ─── STEP 0 → 1: Validate form ─── */
  const handleAccountNext = () => { if (validateAccount()) next(); };

  /* ─── STEP 1 → 2: Sign up with Supabase + send OTP ─── */
  const handlePlanNext = async () => {
    if (!form.plan) { setErrors({ plan: "Select a plan" }); return; }
    setErrors({});
    setLoading(true);

    // Sign up with Supabase — this creates the auth user
    // The trigger will auto-create the profile row
    const { error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          first_name: form.firstName,
          last_name: form.lastName,
          phone: form.phone,
          role: "MEMBER",
        },
      },
    });

    if (signUpError) {
      setErrors({ plan: signUpError.message });
      setLoading(false);
      return;
    }

    setLoading(false);
    next();
  };

  /* ─── OTP INPUT ─── */
  const setOtp = (i: number, v: string) => {
    if (v.length > 1) return;
    const otp = [...form.otp];
    otp[i] = v;
    setForm((p) => ({ ...p, otp }));
    setErrors({});
    if (v && i < 5) document.getElementById(`otp-${i + 1}`)?.focus();
  };

  const otpKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !form.otp[i] && i > 0)
      document.getElementById(`otp-${i - 1}`)?.focus();
  };

  /* ─── STEP 2 → 3: Verify OTP ─── */
  const handleVerify = async () => {
    const code = form.otp.join("");
    if (code.length < 6) { setErrors({ otp: "Enter the 6-digit code" }); return; }
    setLoading(true);

    const { error: verifyError } = await supabase.auth.verifyOtp({
      email: form.email,
      token: code,
      type: "signup",
    });

    if (verifyError) {
      setErrors({ otp: verifyError.message });
      setLoading(false);
      return;
    }

    // Create membership record
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const selectedPlan = plans.find((p) => p.id === form.plan);
      if (selectedPlan) {
        await supabase.from("memberships").insert({
          user_id: user.id,
          plan_id: selectedPlan.dbId,
          status: "PENDING",
        });
      }
    }

    setLoading(false);
    next();
  };

  /* ─── RESEND OTP ─── */
  const handleResendOtp = async () => {
    setLoading(true);
    await supabase.auth.resend({
      type: "signup",
      email: form.email,
    });
    setLoading(false);
  };

  /* ─── SHARED STYLES ─── */
  const inputCls = "h-12 rounded-none border-border-subtle bg-surface px-4 text-[14px] text-white placeholder:text-text-muted focus-visible:border-white focus-visible:ring-0";
  const labelCls = "text-[11px] font-medium uppercase tracking-[0.15em] text-text-secondary";

  return (
    <div>
      {/* ─── PROGRESS BAR ─── */}
      {step < 3 && (
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((label, i) => (
              <div key={label} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div className={`flex h-8 w-8 items-center justify-center text-[12px] font-medium transition-colors ${i <= step ? "border border-white bg-white text-black" : "border border-border-subtle text-text-muted"}`}>
                    {i < step ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 7"/></svg>
                    ) : (i + 1)}
                  </div>
                  <span className={`mt-2 text-[10px] uppercase tracking-[0.1em] ${i <= step ? "text-white" : "text-text-muted"}`}>{label}</span>
                </div>
                {i < steps.length - 1 && (
                  <div className={`mx-2 h-px w-8 sm:w-14 ${i < step ? "bg-white" : "bg-border-subtle"}`} style={{ marginTop: "-16px" }} />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── STEP CONTENT ─── */}
      <AnimatePresence mode="wait" custom={dir}>
        <motion.div key={step} custom={dir} variants={pageVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}>

          {/* ══════ STEP 0: ACCOUNT ══════ */}
          {step === 0 && (
            <div>
              <div className="mb-6">
                <h1 className="font-display text-3xl font-black uppercase tracking-tight text-white">CREATE ACCOUNT</h1>
                <p className="mt-1 text-[14px] text-text-secondary">Fill in your details to get started</p>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className={labelCls}>First Name</Label>
                    <Input id="firstName" value={form.firstName} onChange={(e) => set("firstName", e.target.value)} placeholder="Juan" autoComplete="given-name" className={inputCls} aria-invalid={!!errors.firstName} />
                    {errors.firstName && <p className="text-[12px] text-red-400">{errors.firstName}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className={labelCls}>Last Name</Label>
                    <Input id="lastName" value={form.lastName} onChange={(e) => set("lastName", e.target.value)} placeholder="Dela Cruz" autoComplete="family-name" className={inputCls} aria-invalid={!!errors.lastName} />
                    {errors.lastName && <p className="text-[12px] text-red-400">{errors.lastName}</p>}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className={labelCls}>Email</Label>
                  <Input id="email" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="you@email.com" autoComplete="email" className={inputCls} aria-invalid={!!errors.email} />
                  {errors.email && <p className="text-[12px] text-red-400">{errors.email}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className={labelCls}>Phone</Label>
                  <Input id="phone" type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+63 9XX XXX XXXX" autoComplete="tel" className={inputCls} aria-invalid={!!errors.phone} />
                  {errors.phone && <p className="text-[12px] text-red-400">{errors.phone}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className={labelCls}>Password</Label>
                  <div className="relative">
                    <Input id="password" type={showPw ? "text" : "password"} value={form.password} onChange={(e) => set("password", e.target.value)} placeholder="Minimum 8 characters" autoComplete="new-password" className={`${inputCls} pr-12`} aria-invalid={!!errors.password} />
                    <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary transition-colors hover:text-white">
                      {showPw ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      )}
                    </button>
                  </div>
                  {errors.password && <p className="text-[12px] text-red-400">{errors.password}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPw" className={labelCls}>Confirm Password</Label>
                  <Input id="confirmPw" type="password" value={form.confirmPassword} onChange={(e) => set("confirmPassword", e.target.value)} placeholder="Re-enter password" autoComplete="new-password" className={inputCls} aria-invalid={!!errors.confirmPassword} />
                  {errors.confirmPassword && <p className="text-[12px] text-red-400">{errors.confirmPassword}</p>}
                </div>
              </div>
              <button onClick={handleAccountNext} className="mt-8 flex h-12 w-full items-center justify-center border border-white bg-white text-[12px] font-medium uppercase tracking-[0.15em] text-black transition-all hover:bg-white/90">CONTINUE</button>
              <p className="mt-6 text-center text-[14px] text-text-secondary">
                Already have an account?{" "}
                <Link href="/login" className="font-medium text-white underline underline-offset-4 transition-colors hover:text-gold">Sign in</Link>
              </p>
            </div>
          )}

          {/* ══════ STEP 1: PLAN ══════ */}
          {step === 1 && (
            <div>
              <div className="mb-6">
                <h1 className="font-display text-3xl font-black uppercase tracking-tight text-white">CHOOSE YOUR PLAN</h1>
                <p className="mt-1 text-[14px] text-text-secondary">You can change your plan anytime</p>
              </div>
              {errors.plan && <p className="mb-4 text-[12px] text-red-400">{errors.plan}</p>}
              <div className="space-y-3">
                {plans.map((plan) => (
                  <button key={plan.id} type="button" onClick={() => { setForm((p) => ({ ...p, plan: plan.id })); setErrors({}); }}
                    className={`relative w-full border p-5 text-left transition-all ${form.plan === plan.id ? "border-white bg-white/5" : "border-border-subtle bg-surface hover:border-white/30"}`}>
                    {plan.popular && <span className="absolute -top-2.5 right-4 bg-white px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.1em] text-black">POPULAR</span>}
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-display text-lg font-black uppercase tracking-tight text-white">{plan.name}</h3>
                        <div className="mt-1 flex items-baseline gap-1">
                          <span className="font-display text-2xl font-black text-white">{plan.price}</span>
                          <span className="text-[12px] text-text-secondary">{plan.period}</span>
                        </div>
                      </div>
                      <div className={`flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors ${form.plan === plan.id ? "border-white bg-white" : "border-border-subtle"}`}>
                        {form.plan === plan.id && <div className="h-2 w-2 rounded-full bg-black" />}
                      </div>
                    </div>
                    {form.plan === plan.id && (
                      <motion.ul initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} transition={{ duration: 0.2 }} className="mt-4 space-y-2 border-t border-border-subtle pt-4">
                        {plan.features.map((f) => (
                          <li key={f} className="flex items-center gap-2 text-[13px] text-text-secondary">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C6A75E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 7"/></svg>
                            {f}
                          </li>
                        ))}
                      </motion.ul>
                    )}
                  </button>
                ))}
              </div>
              <div className="mt-8 flex gap-3">
                <button onClick={back} className="flex h-12 flex-1 items-center justify-center border border-border-subtle text-[12px] font-medium uppercase tracking-[0.15em] text-white transition-colors hover:border-white hover:bg-white/5">BACK</button>
                <button onClick={handlePlanNext} disabled={loading} className="flex h-12 flex-[2] items-center justify-center border border-white bg-white text-[12px] font-medium uppercase tracking-[0.15em] text-black transition-all hover:bg-white/90 disabled:opacity-50">
                  {loading ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent" /> : "CONTINUE"}
                </button>
              </div>
            </div>
          )}

          {/* ══════ STEP 2: VERIFY OTP ══════ */}
          {step === 2 && (
            <div>
              <div className="mb-8 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center border border-border-subtle bg-surface">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#C6A75E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                </div>
                <h1 className="font-display text-2xl font-black uppercase tracking-tight text-white">CHECK YOUR EMAIL</h1>
                <p className="mt-2 text-[14px] text-text-secondary">
                  We sent a 6-digit code to <span className="text-white">{form.email}</span>
                </p>
              </div>
              <div className="flex justify-center gap-3">
                {form.otp.map((digit, i) => (
                  <Input key={i} id={`otp-${i}`} type="text" inputMode="numeric" maxLength={1} value={digit}
                    onChange={(e) => setOtp(i, e.target.value.replace(/\D/g, ""))}
                    onKeyDown={(e) => otpKeyDown(i, e)}
                    className={`h-14 w-12 rounded-none border-border-subtle bg-surface px-0 text-center text-lg font-medium text-white focus-visible:border-white focus-visible:ring-0 ${errors.otp ? "border-red-500/60" : ""}`}
                  />
                ))}
              </div>
              {errors.otp && <p className="mt-3 text-center text-[12px] text-red-400">{errors.otp}</p>}
              <p className="mt-6 text-center text-[13px] text-text-secondary">
                Didn&apos;t receive it?{" "}
                <button onClick={handleResendOtp} disabled={loading} className="text-white underline underline-offset-4 transition-colors hover:text-gold disabled:opacity-50">
                  Resend code
                </button>
              </p>
              <div className="mt-8 flex gap-3">
                <button onClick={back} className="flex h-12 flex-1 items-center justify-center border border-border-subtle text-[12px] font-medium uppercase tracking-[0.15em] text-white transition-colors hover:border-white hover:bg-white/5">BACK</button>
                <button onClick={handleVerify} disabled={loading} className="flex h-12 flex-[2] items-center justify-center border border-white bg-white text-[12px] font-medium uppercase tracking-[0.15em] text-black transition-all hover:bg-white/90 disabled:opacity-50">
                  {loading ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent" /> : "VERIFY"}
                </button>
              </div>
            </div>
          )}

          {/* ══════ STEP 3: DONE ══════ */}
          {step === 3 && (
            <div>
              <div className="mb-6 flex h-16 w-16 items-center justify-center border border-gold bg-gold/10">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#C6A75E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 7"/></svg>
              </div>
              <h1 className="font-display text-4xl font-black uppercase tracking-tight text-white">YOU&apos;RE IN</h1>
              <p className="mt-3 max-w-sm text-[14px] leading-relaxed text-text-secondary">
                Your account has been created. Your membership will be activated once payment is confirmed.
              </p>
              <div className="mt-8 border border-border-subtle bg-surface p-6">
                <h3 className="mb-4 text-[11px] font-medium uppercase tracking-[0.15em] text-text-secondary">REGISTRATION SUMMARY</h3>
                <div className="space-y-3 text-[14px]">
                  <div className="flex justify-between"><span className="text-text-secondary">Name</span><span className="text-white">{form.firstName} {form.lastName}</span></div>
                  <div className="flex justify-between"><span className="text-text-secondary">Email</span><span className="text-white">{form.email}</span></div>
                  <div className="flex justify-between"><span className="text-text-secondary">Phone</span><span className="text-white">{form.phone}</span></div>
                  <div className="h-px bg-border-subtle" />
                  <div className="flex justify-between"><span className="text-text-secondary">Plan</span><span className="font-medium uppercase text-gold">{plans.find((p) => p.id === form.plan)?.name}</span></div>
                  <div className="flex justify-between"><span className="text-text-secondary">Price</span><span className="text-white">{plans.find((p) => p.id === form.plan)?.price}{plans.find((p) => p.id === form.plan)?.period}</span></div>
                  <div className="flex justify-between"><span className="text-text-secondary">Status</span><span className="text-[12px] uppercase tracking-wider text-yellow-500">Pending Activation</span></div>
                </div>
              </div>
              <div className="mt-4 border border-border-subtle bg-surface/50 p-5">
                <h4 className="mb-3 text-[11px] font-medium uppercase tracking-[0.15em] text-text-secondary">NEXT STEPS</h4>
                <ul className="space-y-2 text-[13px] text-text-secondary">
                  <li className="flex items-start gap-2"><span className="mt-0.5 text-gold">1.</span>Visit Contnental Fitness Gym in Davao City</li>
                  <li className="flex items-start gap-2"><span className="mt-0.5 text-gold">2.</span>Pay at the front desk or via GCash</li>
                  <li className="flex items-start gap-2"><span className="mt-0.5 text-gold">3.</span>Your membership activates immediately after payment</li>
                </ul>
              </div>
              <button onClick={() => router.push("/dashboard")} className="mt-8 flex h-12 w-full items-center justify-center border border-white bg-white text-[12px] font-medium uppercase tracking-[0.15em] text-black transition-all hover:bg-white/90">GO TO DASHBOARD</button>
            </div>
          )}

        </motion.div>
      </AnimatePresence>
    </div>
  );
}
