import { CTAFooter } from "@/components/cta-footer";
import { Flywheel } from "@/components/flywheel";
import { Hero } from "@/components/hero";
import { HowItWorks } from "@/components/how-it-works";
import { Navbar } from "@/components/navbar";
import { Analytics } from "@vercel/analytics/next"
export default function Home() {
  return (
    <main className="overflow-x-hidden">
      <Navbar />
      <Hero />
      <HowItWorks />
      <Flywheel />
      <CTAFooter />
      <Analytics />
    </main>
  );
}
