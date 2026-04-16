import { Navbar } from "@/components/sections/Navbar";
import { Hero } from "@/components/sections/Hero";
import { Stats } from "@/components/sections/Stats";
import { About } from "@/components/sections/About";
import { Programs } from "@/components/sections/Programs";
import { Coaches } from "@/components/sections/Coaches";
import { Membership } from "@/components/sections/Membership";
import { Gallery } from "@/components/sections/Gallery";
import { AppPreview } from "@/components/sections/AppPreview";
import { FinalCTA } from "@/components/sections/FinalCTA";
import { Footer } from "@/components/sections/Footer";

export default function Home() {
  return (
    <main>
      <Navbar />
      <Hero />
      <Stats />
      <Programs />
      <Coaches />
      <Membership />
      <Gallery />
      <AppPreview />
      <FinalCTA />
      <Footer />
    </main>
  );
}
