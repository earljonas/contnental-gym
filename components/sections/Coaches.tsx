"use client";

import { motion } from "framer-motion";
import Image from "next/image";

const coaches = [
  {
    name: "Chris",
    role: "Head Coach",
    bio: "10+ years of competitive bodybuilding experience. Handles hypertrophy programming and contest prep for members who compete.",
    image: "/chris.jpg",
    position: "center 25%",
  },
  {
    name: "Sam",
    role: "Performance Coach",
    bio: "Background in competitive powerlifting. Writes strength programs and works one-on-one with members on individual goals.",
    image: "/sam.jpg",
    position: "center 60%",
  },
  {
    name: "David",
    role: "Strength & Conditioning",
    bio: "Certified strength and conditioning specialist. Runs group sessions and leads technique clinics for compound lifts.",
    image: "/david2.jpg",
    position: "center 30%",
  },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
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

export function Coaches() {
  return (
    <section id="coaches" className="bg-section-alt py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-6 lg:px-8">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mb-16 max-w-xl"
        >
          <span className="label-caps text-text-secondary">THE TEAM</span>
          <h2 className="section-title mt-4 font-display text-white">
            COACHES
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-text-secondary">
            All our coaches have competed and trained at a high level. They
            write the programs, run the sessions, and know how to get results.
          </p>
        </motion.div>

        {/* Coach cards */}
        <motion.div
          className="grid grid-cols-1 gap-12 md:grid-cols-3"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
        >
          {coaches.map((coach) => (
            <motion.div
              key={coach.name}
              variants={itemVariants}
              className="group cursor-pointer"
            >
              {/* Photo */}
              <div className="relative aspect-[3/4] overflow-hidden rounded-2xl mb-6 bg-[#1A1A1A] border border-border-subtle">
                <Image
                  src={coach.image}
                  alt={coach.name}
                  fill
                  className="object-cover grayscale transition-all duration-500 group-hover:grayscale-0 group-hover:scale-105"
                  style={{ objectPosition: coach.position }}
                  sizes="(max-width: 768px) 100vw, 33vw"
                  quality={80}
                />
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end p-8">
                  <div className="text-white">
                    <p className="label-caps mb-2 text-gold" style={{ fontSize: "10px" }}>
                      CONNECT
                    </p>
                    <div className="flex gap-4 text-[13px]">
                      <a href="#" className="text-white/80 hover:text-gold transition-colors duration-200">
                        Instagram
                      </a>
                      <a href="#" className="text-white/80 hover:text-gold transition-colors duration-200">
                        Facebook
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Info */}
              <h3 className="font-display text-2xl font-black uppercase tracking-tight text-white">
                {coach.name}
              </h3>
              <p className="label-caps mt-1 text-gold" style={{ fontSize: "10px" }}>
                {coach.role}
              </p>
              <p className="mt-3 text-[14px] leading-relaxed text-text-secondary">
                {coach.bio}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Gold horizontal rule */}
      <div className="mx-auto mt-24 max-w-6xl px-6 md:mt-32 lg:px-8">
        <hr className="border-0 border-t border-gold" />
      </div>
    </section>
  );
}
