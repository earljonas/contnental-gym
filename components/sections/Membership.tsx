"use client";

import { motion } from "framer-motion";

const tiers = [
  {
    name: "BASIC",
    price: "PHP 1,500",
    period: "/month",
    features: [
      "Full gym floor access",
      "Locker room and showers",
      "Open daily 6AM - 10PM",
      "Equipment walkthrough on signup",
    ],
    featured: false,
  },
  {
    name: "ELITE",
    price: "PHP 2,500",
    period: "/month",
    features: [
      "Everything in Basic",
      "Group training sessions",
      "Coached technique clinics",
      "Priority equipment booking",
      "1 guest pass per month",
    ],
    featured: true,
  },
  {
    name: "PREMIUM",
    price: "PHP 4,000",
    period: "/month",
    features: [
      "Everything in Elite",
      "Monthly personal programming",
      "Body composition check-ins",
      "24/7 facility access",
      "Recovery area access",
    ],
    featured: false,
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

export function Membership() {
  return (
    <section id="membership" className="section-shell bg-page-bg">
      <div className="mx-auto max-w-6xl px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mb-16"
        >
          <span className="label-caps text-text-secondary">PRICING</span>
          <h2 className="section-title mt-4 font-display text-white">
            MEMBERSHIP
          </h2>
          <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-text-secondary">
            Three plans depending on how you want to train. All memberships
            include full access to the gym floor and facilities.
          </p>
        </motion.div>

        <motion.div
          className="grid gap-6 md:grid-cols-3"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
        >
          {tiers.map((tier) => (
            <motion.div
              key={tier.name}
              variants={itemVariants}
              className={`flex flex-col border bg-surface p-8 ${
                tier.featured ? "border-white" : "border-border-subtle"
              }`}
              style={{ borderRadius: 0 }}
            >
              {tier.featured && (
                <span className="label-caps mb-4 inline-block self-start border border-white px-3 py-1 text-white">
                  MOST POPULAR
                </span>
              )}

              <h3 className="font-display text-2xl font-black uppercase tracking-tight text-white">
                {tier.name}
              </h3>

              <div className="mt-4 flex items-baseline gap-1">
                <span className="font-display text-[40px] font-black leading-none text-white">
                  {tier.price}
                </span>
                <span className="text-sm text-text-secondary">
                  {tier.period}
                </span>
              </div>

              <ul className="mt-8 flex flex-col gap-3 text-[14px] leading-relaxed text-text-secondary">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      className="mt-0.5 shrink-0"
                    >
                      <path
                        d="M3 8L6.5 11.5L13 5"
                        stroke="#888"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>

              <a
                href="#contact"
                className={`mt-auto inline-flex h-11 items-center justify-center px-6 text-[12px] font-medium uppercase tracking-[0.15em] transition-colors duration-200 ${
                  tier.featured
                    ? "mt-8 border border-white bg-white text-black hover:bg-white/90"
                    : "mt-8 border border-border-subtle text-white hover:border-white hover:bg-white/5"
                }`}
                style={{ borderRadius: 0 }}
              >
                GET STARTED
              </a>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
