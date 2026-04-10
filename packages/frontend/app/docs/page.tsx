import { CTAFooter } from "@/components/cta-footer";
import { Navbar } from "@/components/navbar";

const coreSections = [
  {
    eyebrow: "Overview",
    title: "What OpenBet is",
    copy:
      "OpenBet is a prediction market product on Base focused on clear market prompts, faster market launch, and a cleaner trading surface. The product is designed to make market context readable before capital moves.",
  },
  {
    eyebrow: "Creation",
    title: "How markets get created",
    copy:
      "A market starts with a prompt, a clear end condition, and a resolution source. The creation flow is built to structure that input, check that the market is objectively resolvable, and prepare it for onchain launch.",
  },
  {
    eyebrow: "Trading",
    title: "How trading works",
    copy:
      "Each market exposes a Yes side and a No side. Traders can enter, exit, and monitor pricing directly from the market page, with the interface tuned for quick read-through rather than noisy dashboards.",
  },
  {
    eyebrow: "Resolution",
    title: "How markets settle",
    copy:
      "When a market reaches its end condition, the product resolves it against the published source and final rules. The goal is for users to understand the settlement path before the market is active, not after.",
  },
];

const operatingNotes = [
  "Network: Base mainnet",
  "Market format: binary prediction markets with Yes and No outcomes",
  "Launch flow: structured prompt, end time, and resolution source",
  "Trading flow: wallet-based interaction with onchain positions",
];

const principles = [
  "Clarity before hype: every market should be readable at a glance.",
  "Resolvable questions only: prompts need a clear source and clear end state.",
  "Fast decision loops: market creation and trading should feel immediate.",
  "Clean surfaces: the interface should reduce noise at the point of action.",
];

export default function DocsPage() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#040704] text-white">
      <Navbar />

      <section className="relative overflow-hidden px-4 pb-14 pt-28 sm:px-8 sm:pb-20 md:pt-36">
        <div className="absolute inset-0 bg-grid opacity-[0.05]" />
        <div
          className="blob absolute left-[-80px] top-24 h-[280px] w-[280px] opacity-25"
          style={{ background: "rgba(15, 230, 78, 0.12)" }}
        />
        <div
          className="blob-slow absolute right-[-60px] top-16 h-[320px] w-[320px] opacity-20"
          style={{ background: "rgba(86, 255, 144, 0.1)" }}
        />

        <div className="relative mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <p className="text-[11px] uppercase tracking-[0.28em] text-white/38">Docs</p>
            <h1 className="mt-4 font-display text-[2.8rem] leading-[0.95] tracking-[-0.05em] text-white sm:text-[4.5rem]">
              Product docs for how OpenBet launches, trades, and settles markets.
            </h1>
            <p className="mt-5 max-w-2xl text-[15px] leading-7 text-white/62 sm:text-lg sm:leading-8">
              This page is the product reference for the core OpenBet flow: what the platform is,
              how markets are created, how trading works, and how resolution is handled.
            </p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-4">
            {operatingNotes.map((item) => (
              <div
                key={item}
                className="rounded-[24px] border border-white/10 bg-white/[0.03] px-5 py-5 backdrop-blur-xl"
              >
                <p className="text-sm leading-6 text-white/74">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-8 sm:px-8 sm:py-12">
        <div className="mx-auto grid max-w-6xl gap-4 md:grid-cols-2">
          {coreSections.map((section) => (
            <article
              key={section.title}
              className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.24)] backdrop-blur-xl sm:p-7"
            >
              <p className="text-[11px] uppercase tracking-[0.28em] text-emerald-200/72">
                {section.eyebrow}
              </p>
              <h2 className="mt-3 font-display text-3xl tracking-[-0.04em] text-white">
                {section.title}
              </h2>
              <p className="mt-4 text-[15px] leading-7 text-white/62 sm:text-base sm:leading-8">
                {section.copy}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="px-4 py-8 sm:px-8 sm:py-12">
        <div className="mx-auto max-w-6xl rounded-[30px] border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl sm:p-8">
          <div className="max-w-2xl">
            <p className="text-[11px] uppercase tracking-[0.28em] text-white/38">Principles</p>
            <h2 className="mt-4 font-display text-[2.2rem] leading-[1] tracking-[-0.04em] text-white sm:text-5xl">
              The product standards behind the interface.
            </h2>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {principles.map((principle) => (
              <div
                key={principle}
                className="rounded-[22px] border border-white/8 bg-black/20 px-5 py-5"
              >
                <p className="text-base leading-7 text-white/72">{principle}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <CTAFooter />
    </main>
  );
}
