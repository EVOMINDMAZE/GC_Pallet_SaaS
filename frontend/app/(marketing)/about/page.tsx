import { Hero } from "@/components/marketing/hero";
import { Section } from "@/components/marketing/section";
import { CtaBanner } from "@/components/marketing/cta-banner";

const values = [
  {
    title: "Reliability",
    body: "Field crews don't get a second chance at a delivery. We design for that — backups, audit logs, and a clean rollback path on every change.",
  },
  {
    title: "Clarity",
    body: "Status means the same thing to a project manager in an office and a foreman on a job site. We name things plainly and never hide behind jargon.",
  },
  {
    title: "Speed",
    body: "The fastest way is usually the right way. We ship the smallest thing that solves the problem, then iterate based on what contractors actually do with it.",
  },
];

const timeline = [
  { year: "2024", body: "GC Pallet starts as a single-tool inventory tracker for a regional framing crew." },
  { year: "2025", body: "Projects and documents ship. First 50 paying customers across 12 states." },
  { year: "2026", body: "Self-host option launches. Crew and Pro plans open to the public." },
];

export default function AboutPage() {
  return (
    <>
      <Hero
        eyebrow="About"
        title="Built for the people who actually build things."
        subtitle="GC Pallet is an Operations Hub for general contractors — designed by people who've walked job sites, written change orders at 6am, and argued with inspectors."
        primaryHref="/features"
        primaryLabel="See what we built"
        secondaryHref="/contact"
        secondaryLabel="Get in touch"
      />

      <Section eyebrow="Values" title="What we care about">
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {values.map((v) => (
            <div
              key={v.title}
              className="rounded-lg border border-border bg-gcpallet-card p-6 text-left shadow-sm"
            >
              <h3 className="text-h3 font-semibold text-gcpallet-card-foreground">{v.title}</h3>
              <p className="mt-3 text-body text-gcpallet-muted-foreground">{v.body}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section eyebrow="Story" title="Where we came from">
        <ol className="mx-auto mt-10 max-w-2xl space-y-6 border-l border-border pl-6 text-left">
          {timeline.map((t) => (
            <li key={t.year} className="relative">
              <span className="absolute -left-[27px] top-1.5 inline-block h-3 w-3 rounded-full bg-gcpallet-primary" />
              <p className="text-label uppercase tracking-wider text-gcpallet-primary">{t.year}</p>
              <p className="mt-1 text-body text-gcpallet-card-foreground">{t.body}</p>
            </li>
          ))}
        </ol>
      </Section>

      <Section className="pb-24">
        <CtaBanner
          title="Want to see how it fits your shop?"
          primaryHref="/register"
          primaryLabel="Start free"
          secondaryHref="/features"
          secondaryLabel="See features"
        />
      </Section>
    </>
  );
}