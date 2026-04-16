"use client";

import { useEffect, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

const navLinks = [
  { label: "Programs", href: "#programs" },
  { label: "Coaches", href: "#coaches" },
  { label: "Membership", href: "#membership" },
  { label: "Contact", href: "#contact" },
];

export function Navbar() {
  const { scrollY } = useScroll();
  const bgOpacity = useTransform(scrollY, [0, 100], [0, 1]);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <motion.nav
      className="fixed top-0 left-0 right-0 z-50 border-b border-transparent"
      style={{
        borderBottomColor: useTransform(
          scrollY,
          [0, 100],
          ["transparent", "#2A2A2A"]
        ),
      }}
    >
      {/* Background layer */}
      <motion.div
        className="absolute inset-0 backdrop-blur-md"
        style={{
          backgroundColor: "#0A0A0A",
          opacity: bgOpacity,
        }}
      />

      <div className="relative mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
        {/* Logo */}
        <a href="#" className="flex flex-col leading-none">
          <span className="font-display text-[22px] font-black uppercase tracking-tight text-white">
            CONTINENTAL
          </span>
          <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-text-secondary">
            FITNESS GYM
          </span>
        </a>

        {/* Desktop Nav */}
        <div className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-[13px] font-medium uppercase tracking-[0.1em] text-text-secondary transition-colors duration-200 hover:text-white"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* CTA */}
        <a
          href="/register"
          className="hidden h-9 items-center bg-gold px-5 text-[12px] font-medium uppercase tracking-[0.15em] text-black transition-opacity duration-200 hover:opacity-90 md:inline-flex"
          style={{ borderRadius: 0 }}
        >
          JOIN NOW
        </a>

        {/* Mobile hamburger */}
        <button
          className="relative z-50 flex h-8 w-8 flex-col items-center justify-center gap-[5px] md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          <span
            className={`block h-[1.5px] w-5 bg-white transition-all duration-300 ${
              mobileOpen ? "translate-y-[6.5px] rotate-45" : ""
            }`}
          />
          <span
            className={`block h-[1.5px] w-5 bg-white transition-all duration-300 ${
              mobileOpen ? "opacity-0" : ""
            }`}
          />
          <span
            className={`block h-[1.5px] w-5 bg-white transition-all duration-300 ${
              mobileOpen ? "-translate-y-[6.5px] -rotate-45" : ""
            }`}
          />
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-40 flex flex-col items-center justify-center gap-8 bg-page-bg md:hidden"
        >
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="font-display text-3xl font-black uppercase tracking-tight text-white"
            >
              {link.label}
            </a>
          ))}
          <a
            href="/register"
            onClick={() => setMobileOpen(false)}
            className="mt-4 inline-flex h-12 items-center bg-gold px-8 text-[13px] font-medium uppercase tracking-[0.15em] text-black"
          >
            JOIN NOW
          </a>
        </motion.div>
      )}
    </motion.nav>
  );
}
