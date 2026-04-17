"use client";

import { motion } from "framer-motion";
import Image from "next/image";

export function Hero() {
  return (
    <section
      id="hero"
      className="relative flex min-h-[100svh] flex-col items-center justify-center overflow-hidden bg-page-bg"
    >
      {/* Background image */}
      <div className="absolute inset-0">
        <Image
          src="/gym1.jpg"
          alt="Contnental Fitness Gym floor"
          fill
          className="object-cover"
          priority
          quality={85}
          sizes="100vw"
        />
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/60" />
        {/* Bottom gradient fade */}
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-[#0A0A0A] to-transparent" />
      </div>

      <div className="relative z-10 flex max-w-4xl flex-col items-center px-6 text-center">
        {/* Label */}
        <motion.span
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="label-caps mb-6 text-text-secondary"
        >
          DAVAO CITY, PHILIPPINES
        </motion.span>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, letterSpacing: "-0.05em" }}
          animate={{ opacity: 1, letterSpacing: "0.02em" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="font-display leading-[0.9] font-black uppercase text-white"
          style={{
            fontSize: "clamp(72px, 10vw, 140px)",
          }}
        >
          TRAIN HERE
        </motion.h1>

        {/* Subline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-6 max-w-lg text-base leading-relaxed text-text-secondary"
        >
          A fully equipped strength and conditioning gym with structured
          programs, experienced coaches, and everything you need to train
          properly.
        </motion.p>

        {/* CTA */}
        <motion.a
          href="#membership"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-10 inline-flex h-12 items-center bg-gold px-8 text-[13px] font-medium uppercase tracking-[0.15em] text-black transition-opacity duration-200 hover:opacity-90 max-sm:w-full max-sm:justify-center"
          style={{ borderRadius: 0 }}
        >
          VIEW MEMBERSHIP
        </motion.a>
      </div>

      {/* Bottom divider */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-white/20" />
    </section>
  );
}
