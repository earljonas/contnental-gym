"use client";

import { motion } from "framer-motion";

const stats = [
  { value: "1,200+", label: "Active Members", highlight: true },
  { value: "8", label: "Years Running", highlight: false },
  { value: "150+", label: "Machines & Equipment", highlight: false },
  { value: "12,000", label: "Sq Ft of Space", highlight: false },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
  },
};

export function Stats() {
  return (
    <section className="section-shell-compact border-y border-border-subtle bg-section-alt">
      <motion.div
        className="mx-auto grid max-w-5xl grid-cols-2 gap-8 px-6 md:grid-cols-4 md:gap-4 lg:px-8"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
      >
        {stats.map((stat) => (
          <motion.div
            key={stat.label}
            variants={itemVariants}
            className="flex flex-col items-center text-center"
          >
            <span
              className={`font-display text-[clamp(36px,5vw,56px)] font-black leading-none ${
                stat.highlight ? "text-gold" : "text-white"
              }`}
            >
              {stat.value}
            </span>
            <span className="label-caps mt-3 text-text-secondary">
              {stat.label}
            </span>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
