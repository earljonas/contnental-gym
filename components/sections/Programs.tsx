"use client";

import { motion } from "framer-motion";

const programs = [
  {
    title: "STRENGTH",
    description:
      "Squat, bench, deadlift, and accessory work. All sessions follow structured programming with progressive overload tracked week to week.",
    icon: (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#888"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <line x1="2" y1="12" x2="22" y2="12" />
        <rect x="3" y="8" width="3" height="8" rx="0.5" />
        <rect x="18" y="8" width="3" height="8" rx="0.5" />
        <rect x="6" y="9.5" width="2" height="5" rx="0.5" />
        <rect x="16" y="9.5" width="2" height="5" rx="0.5" />
      </svg>
    ),
  },
  {
    title: "CONDITIONING",
    description:
      "Sleds, ropes, kettlebells, and circuit work. Each session has programmed work-to-rest ratios and clear targets for the day.",
    icon: (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#888"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="2,12 6,12 8,6 10,18 12,10 14,14 16,12 22,12" />
      </svg>
    ),
  },
  {
    title: "PERFORMANCE",
    description:
      "For athletes with competition goals. Speed, agility, and power development with measurable benchmarks and regular testing.",
    icon: (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#888"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="6" />
        <circle cx="12" cy="12" r="2" />
      </svg>
    ),
  },
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

export function Programs() {
  return (
    <section id="programs" className="section-shell bg-page-bg">
      <div className="mx-auto max-w-6xl px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mb-16"
        >
          <span className="label-caps text-text-secondary">WHAT WE OFFER</span>
          <h2 className="section-title mt-4 font-display text-white">
            PROGRAMS
          </h2>
        </motion.div>

        <motion.div
          className="grid gap-6 md:grid-cols-3"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
        >
          {programs.map((program) => (
            <motion.div
              key={program.title}
              variants={itemVariants}
              whileHover={{
                borderColor: "#FFFFFF",
                y: -4,
                transition: { duration: 0.25 },
              }}
              className="group flex flex-col border border-border-subtle bg-surface p-8 transition-colors duration-300"
              style={{ borderRadius: 0 }}
            >
              <div className="mb-6">{program.icon}</div>
              <h3 className="font-display text-2xl font-black uppercase tracking-tight text-white">
                {program.title}
              </h3>
              <p className="mt-3 text-[15px] leading-relaxed text-text-secondary">
                {program.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
