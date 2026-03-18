import { Navbar } from "@/components/navbar";
import { Hero } from "@/components/hero";
import { Marquee } from "@/components/marquee";
import { Problem } from "@/components/problem";
import { HowItWorks } from "@/components/how-it-works";
import { Flywheel } from "@/components/flywheel";
import { WhyClawdBet } from "@/components/why-clawdbet";
import { AgentIdentity } from "@/components/agent-identity";
import { CTAFooter } from "@/components/cta-footer";

export default function Home() {
  return (
    <main>
      <Navbar />
      <Hero />
      <Marquee />
      <Problem />
      <HowItWorks />
      <Flywheel />
      <WhyClawdBet />
      <AgentIdentity />
      <CTAFooter />
    </main>
  );
}
