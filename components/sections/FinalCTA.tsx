"use client";

import { useState } from "react";
import { motion } from "framer-motion";

export function FinalCTA() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <section id="contact" className="section-shell bg-section-alt">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="mx-auto max-w-4xl px-6 text-center lg:px-8"
      >
        <h2
          className="font-display font-black uppercase text-white"
          style={{ fontSize: "clamp(40px, 6vw, 80px)", lineHeight: "1" }}
        >
          GET IN TOUCH
        </h2>

        <p className="mt-6 text-base leading-relaxed text-text-secondary">
          Reach out and we&rsquo;ll send you membership details, class times,
          and the best starting point based on how you want to train.
        </p>

        <div className="mt-10 grid gap-3 text-left sm:grid-cols-3">
          {[
            { label: "Visit us", value: "Davao City, Philippines" },
            { label: "Hours", value: "Daily 6AM - 10PM" },
            { label: "Fastest reply", value: "Email within 24 hours" },
          ].map((item) => (
            <div
              key={item.label}
              className="border border-border-subtle bg-surface p-5"
            >
              <p className="label-caps text-text-secondary">{item.label}</p>
              <p className="mt-3 text-sm leading-relaxed text-white">
                {item.value}
              </p>
            </div>
          ))}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            setSubmitted(true);
          }}
          className="mt-10 flex flex-col gap-3 sm:flex-row sm:gap-0"
        >
          <input
            type="email"
            placeholder="Your email address"
            required
            className="h-12 flex-1 border border-border-subtle bg-surface px-5 text-[14px] text-white placeholder:text-text-muted outline-none transition-colors duration-200 focus:border-white sm:border-r-0"
            style={{ borderRadius: 0 }}
          />
          <button
            type="submit"
            className="h-12 shrink-0 bg-gold px-8 text-[12px] font-medium uppercase tracking-[0.15em] text-black transition-opacity duration-200 hover:opacity-90"
            style={{ borderRadius: 0 }}
          >
            GET STARTED
          </button>
        </form>

        <p className="mt-6 text-[13px] text-text-muted">
          {submitted
            ? "Thanks - your details are ready to be sent once the form is wired up."
            : "No contracts. Cancel anytime."}
        </p>
      </motion.div>
    </section>
  );
}
