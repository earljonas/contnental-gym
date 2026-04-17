"use client";

import { motion } from "framer-motion";

export function AppPreview() {
  return (
    <section className="section-shell bg-page-bg">
      <div className="mx-auto max-w-6xl px-6 lg:px-8">
        <div className="grid items-center gap-16 md:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="label-caps text-text-secondary">MEMBER APP</span>
            <h2 className="section-title mt-4 font-display text-white">
              TRACK YOUR
              <br />
              PROGRESS
            </h2>
            <p className="mt-6 max-w-md text-[15px] leading-relaxed text-text-secondary">
              Every member gets access to the Contnental app. Log your
              workouts, track your lifts over time, and see where you&rsquo;re
              actually improving.
            </p>
            <ul className="mt-8 flex flex-col gap-4">
              {[
                "Log sets, reps, and weight for every session",
                "See weekly volume and training frequency",
                "Track body measurements and progress photos",
                "Access your coach's programming directly",
              ].map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-3 text-[14px] text-text-secondary"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    className="mt-0.5 shrink-0"
                  >
                    <path
                      d="M3 8L6.5 11.5L13 5"
                      stroke="#C6A75E"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{
              duration: 0.6,
              delay: 0.15,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="flex justify-center"
          >
            <div
              className="relative w-[280px] overflow-hidden border-2 border-[#333] bg-[#0E0E0E] p-2 shadow-2xl shadow-black/50"
              style={{ borderRadius: "36px" }}
            >
              <div className="absolute left-1/2 top-2 z-20 h-[24px] w-[100px] -translate-x-1/2 rounded-full bg-black" />

              <div
                className="overflow-hidden bg-[#111] px-5 pb-6 pt-12"
                style={{ borderRadius: "32px" }}
              >
                <div className="mb-6 flex items-center justify-between text-[10px] text-text-muted">
                  <span>9:41</span>
                  <div className="flex gap-1">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="#444">
                      <rect x="1" y="6" width="4" height="12" rx="1" />
                      <rect x="7" y="4" width="4" height="14" rx="1" />
                      <rect x="13" y="2" width="4" height="16" rx="1" />
                      <rect
                        x="19"
                        y="0"
                        width="4"
                        height="18"
                        rx="1"
                        fill="#666"
                      />
                    </svg>
                    <svg width="18" height="12" viewBox="0 0 24 14" fill="none">
                      <rect
                        x="0.5"
                        y="0.5"
                        width="19"
                        height="11"
                        rx="2"
                        stroke="#444"
                      />
                      <rect
                        x="2"
                        y="2"
                        width="14"
                        height="8"
                        rx="1"
                        fill="#666"
                      />
                      <rect x="21" y="4" width="2" height="4" rx="1" fill="#444" />
                    </svg>
                  </div>
                </div>

                <p className="text-[11px] text-text-secondary">Good evening</p>
                <p className="mt-0.5 font-display text-[18px] font-black uppercase text-white">
                  MEMBER
                </p>

                <div className="mt-5 border border-[#2A2A2A] bg-[#1A1A1A] p-4">
                  <div className="flex items-center justify-between">
                    <span
                      className="label-caps text-text-secondary"
                      style={{ fontSize: "9px" }}
                    >
                      TODAY&apos;S WORKOUT
                    </span>
                    <span className="text-[9px] text-gold">PUSH DAY</span>
                  </div>

                  <div className="mt-3 space-y-2.5">
                    {[
                      { name: "Bench Press", sets: "4x8", weight: "80kg" },
                      { name: "OHP", sets: "3x10", weight: "45kg" },
                      { name: "Incline DB Press", sets: "3x12", weight: "30kg" },
                      { name: "Cable Flyes", sets: "3x15", weight: "15kg" },
                    ].map((ex) => (
                      <div
                        key={ex.name}
                        className="flex items-center justify-between"
                      >
                        <span className="text-[12px] text-white">{ex.name}</span>
                        <div className="flex gap-2 text-[11px] text-text-secondary">
                          <span>{ex.sets}</span>
                          <span className="text-text-muted">•</span>
                          <span>{ex.weight}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2">
                  {[
                    { label: "Sessions", value: "4/6" },
                    { label: "Volume", value: "12.4k" },
                    { label: "Streak", value: "12d" },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className="border border-[#2A2A2A] bg-[#1A1A1A] p-3 text-center"
                    >
                      <p className="font-display text-[16px] font-black text-white">
                        {stat.value}
                      </p>
                      <p className="mt-0.5 text-[8px] uppercase tracking-wider text-text-muted">
                        {stat.label}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] uppercase tracking-wider text-text-secondary">
                      Weekly Goal
                    </span>
                    <span className="text-[9px] text-text-muted">67%</span>
                  </div>
                  <div className="mt-2 h-1.5 w-full bg-[#2A2A2A]">
                    <div className="h-full bg-gold" style={{ width: "67%" }} />
                  </div>
                </div>

                <div className="mt-6 flex justify-around border-t border-[#2A2A2A] pt-3">
                  {["Home", "Log", "Stats", "Profile"].map((tab, i) => (
                    <span
                      key={tab}
                      className={`text-[9px] uppercase tracking-wider ${
                        i === 0 ? "text-white" : "text-text-muted"
                      }`}
                    >
                      {tab}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
