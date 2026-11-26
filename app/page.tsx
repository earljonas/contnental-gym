import { Navbar } from "@/components/sections/Navbar";
import { Hero } from "@/components/sections/Hero";
import { Programs } from "@/components/sections/Programs";
import { Membership } from "@/components/sections/Membership";
import { Gallery } from "@/components/sections/Gallery";
import { AppPreview } from "@/components/sections/AppPreview";
import { FinalCTA } from "@/components/sections/FinalCTA";
import { Footer } from "@/components/sections/Footer";
import { createClient } from "@supabase/supabase-js";
import { getActivePlans } from "@/lib/gym/plans";

export const dynamic = "force-dynamic";

export default async function Home() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const { plans, unavailable } = url && key
    ? await getActivePlans(createClient(url, key, {
        auth: { autoRefreshToken: false, persistSession: false },
        global: { fetch: (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(1500) }) },
      })).catch(() => ({ plans: [], unavailable: true }))
    : { plans: [], unavailable: true };

  return (
    <main>
      <Navbar />
      <Hero />
      <Programs />
      <Membership plans={plans} unavailable={unavailable} />
      <Gallery />
      <AppPreview />
      <FinalCTA />
      <Footer />
    </main>
  );
}
