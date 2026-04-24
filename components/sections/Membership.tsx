"use client";

import { motion } from "framer-motion";

const plans = [
  { name: "Day Pass", duration: "Single Entry", price: 200, tag: "Drop-in" },
  { name: "1 Month", duration: "30 Days", price: 1000, tag: null },
  { name: "3 Months", duration: "90 Days", price: 2700, tag: null },
  { name: "6 Months", duration: "180 Days", price: 5100, tag: "Popular" },
  { name: "12 Months", duration: "365 Days", price: 9600, tag: "Best Value" },
];

export function Membership() {
  return (
    <section id="membership" className="section-shell bg-page-bg py-24 md:py-32 relative">
      {/* Abstract Background Glows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[20%] -right-[10%] w-[50vw] h-[50vw] rounded-full bg-white/5 blur-[120px]" />
        <div className="absolute bottom-[10%] -left-[10%] w-[40vw] h-[40vw] rounded-full bg-white/5 blur-[100px]" />
      </div>

      <div className="mx-auto max-w-7xl px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_2.5fr] gap-16 lg:gap-20">
          
          {/* Left Column: Sticky Editorial Header */}
          <div className="relative">
            <div className="lg:sticky lg:top-32">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-1.5 w-1.5 bg-white rounded-full" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/60">
                    Pricing
                  </span>
                </div>
                
                <h2 className="font-display text-5xl md:text-6xl lg:text-7xl font-black uppercase tracking-tighter text-white leading-[0.9]">
                  Rates
                </h2>
                
                <div className="mt-10 h-px w-full max-w-[120px] bg-border-subtle" />
              
              </motion.div>
            </div>
          </div>

          {/* Right Column: Interactive List View */}
          <div className="flex flex-col border-t border-border-subtle">
            {plans.map((plan, index) => (
              <motion.a
                href="#contact"
                key={plan.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: index * 0.1, ease: "easeOut" }}
                className="group relative flex flex-col justify-center border-b border-border-subtle py-8 md:py-12 transition-colors hover:border-white/30"
              >
                {/* Subtle Hover Background */}
                <div className="absolute inset-0 -z-10 bg-gradient-to-r from-transparent via-white/[0.02] to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 md:gap-12 relative z-10 overflow-hidden px-2">
                  
                  {/* Name & Metadata */}
                  <div className="flex flex-col items-start gap-3">
                    <h3 className="font-display text-4xl md:text-5xl font-black uppercase text-white transition-transform duration-500 ease-out group-hover:translate-x-4">
                      {plan.name}
                    </h3>
                    
                    <div className="flex items-center gap-4 transition-transform duration-500 ease-out group-hover:translate-x-4">
                      <span className="text-[11px] text-white/40 uppercase tracking-[0.2em] font-medium">
                        {plan.duration}
                      </span>
                      {plan.tag && (
                        <span className={`text-[9px] font-bold uppercase tracking-[0.2em] px-2 py-0.5 ${
                          plan.tag === 'Best Value' 
                            ? 'bg-white text-black' 
                            : 'border border-white/20 text-white/60'
                        }`}>
                          {plan.tag}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Price & Arrow Area */}
                  <div className="relative flex items-center justify-start md:justify-end">
                    {/* Price block shifts left on hover on desktop to make room for arrow */}
                    <div className="font-display text-4xl md:text-5xl font-black text-white transition-transform duration-500 ease-out md:group-hover:-translate-x-16">
                      <span className="text-2xl md:text-3xl text-white/30 font-medium mr-1.5">₱</span>
                      {plan.price.toLocaleString()}
                    </div>
                    
                    {/* Arrow slides in from right */}
                    <div className="absolute right-0 opacity-0 translate-x-8 transition-all duration-500 ease-out group-hover:opacity-100 group-hover:translate-x-0 hidden md:block">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white text-black">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M5 12h14" />
                          <path d="m12 5 7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mobile CTA */}
                <div className="mt-6 px-2 md:hidden flex items-center text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 group-hover:text-white transition-colors">
                  Select Plan &rarr;
                </div>
              </motion.a>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}
