"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";

const galleryItems = [
  { src: "/gym8.jpg", alt: "Contnental Fitness Gym entrance and logo" },
  { src: "/gym9.jpg", alt: "Machine and equipment area" },
  { src: "/mirror.jpg", alt: "Custom backlit mirror" },
  { src: "/gym10.jpg", alt: "Free weights and bench area" },
  { src: "/gym7.jpg", alt: "Contnental Prime sign and gym floor" },
  { src: "/gym11.jpg", alt: "Dumbbell rack and mirrors" },
  { src: "/gym6.jpg", alt: "Bench press and equipment room" },
  { src: "/gym12.jpg", alt: "Squat racks and dumbbell area" },
  { src: "/gym3.jpg", alt: "Squat rack area" },
  { src: "/gym2.jpg", alt: "Gym floor with branding" },
];

export function Gallery() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const animRef = useRef<number | null>(null);

  // Duplicate items for seamless infinite loop
  const items = [...galleryItems, ...galleryItems];

  // Auto-scroll loop
  const animate = useEffectEvent(() => {
    const track = trackRef.current;
    if (track && !isDragging) {
      track.scrollLeft += 0.6;

      // Reset seamlessly when halfway
      const halfWidth = track.scrollWidth / 2;
      if (track.scrollLeft >= halfWidth) {
        track.scrollLeft -= halfWidth;
      }
    }
  });

  useEffect(() => {
    const loop = () => {
      animate();
      animRef.current = requestAnimationFrame(loop);
    };

    animRef.current = requestAnimationFrame(loop);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [isDragging]);

  // Mouse drag handlers
  const onMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartX(e.pageX - (trackRef.current?.offsetLeft || 0));
    setScrollLeft(trackRef.current?.scrollLeft || 0);
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !trackRef.current) return;
    e.preventDefault();
    const x = e.pageX - trackRef.current.offsetLeft;
    trackRef.current.scrollLeft = scrollLeft - (x - startX) * 1.5;
  };
  const onMouseUp = () => setIsDragging(false);

  // Touch drag handlers
  const onTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setStartX(e.touches[0].pageX - (trackRef.current?.offsetLeft || 0));
    setScrollLeft(trackRef.current?.scrollLeft || 0);
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !trackRef.current) return;
    const x = e.touches[0].pageX - trackRef.current.offsetLeft;
    trackRef.current.scrollLeft = scrollLeft - (x - startX) * 1.5;
  };
  const onTouchEnd = () => setIsDragging(false);

  return (
    <section className="bg-section-alt py-20 md:py-28 overflow-hidden">
      {/* Header */}
      <div className="mx-auto max-w-7xl px-6 lg:px-8 mb-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <span className="label-caps text-text-secondary">THE SPACE</span>
          <h2 className="section-title mt-3 font-display text-white">
            INSIDE THE GYM
          </h2>
        </motion.div>
      </div>

      {/* Scrolling gallery — full bleed */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.8 }}
        className="relative w-full"
      >
        <div
          ref={trackRef}
          className={`flex gap-4 overflow-x-hidden px-6 lg:px-8 select-none ${
            isDragging ? "cursor-grabbing" : "cursor-grab"
          }`}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {items.map((item, i) => (
            <div
              key={`${item.src}-${i}`}
              className="relative shrink-0 overflow-hidden rounded-lg"
              style={{
                width: "clamp(260px, 26vw, 380px)",
                aspectRatio: "3 / 4",
              }}
            >
              <Image
                src={item.src}
                alt={item.alt}
                fill
                className="pointer-events-none object-cover"
                sizes="(max-width: 768px) 70vw, 26vw"
                quality={75}
                draggable={false}
              />
            </div>
          ))}
        </div>

        {/* Edge fades for polish */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-[#111111] to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-[#111111] to-transparent" />
      </motion.div>
    </section>
  );
}
