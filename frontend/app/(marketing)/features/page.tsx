import { Hero } from "@/components/marketing/hero";
import { Section } from "@/components/marketing/section";
import { FeatureCard } from "@/components/marketing/feature-card";
import { CtaBanner } from "@/components/marketing/cta-banner";
import { FolderKanban, Files, Truck, Workflow, BarChart3 } from "lucide-react";

const features = [
  {
    icon: FolderKanban,
    eyebrow: "Projects",
    title: "Every job, in one card.",
    description:
      "Create a project in seconds. Track status, budget, and schedule without spreadsheets or email chains.",
    bullets: [
      "Status lifecycle: draft → procurement → active → on hold → completed",
      "Per-project budget rollups from inventory",
      "Schedule windows with start and end dates",
      "Inline editing from the detail page",
    ],
  },
  {
    icon: Files,
    eyebrow: "Documents",
    title: "Find what you filed in two clicks.",
    description:
      "Upload permits, contracts, and receipts. Search by name, filter by category, and open inline.",
    bullets: [
      "PDF, image, and Office document upload",
      "Category-based filtering",
      "Inline open in a new tab",
      "Delete with a single click (with confirmation)",
    ],
  },
  {
    icon: Truck,
    eyebrow: "Inventory",
    title: "See exactly what's on every site.",
    description:
      "Log deliveries by item and location. Watch totals update in real time as you add and remove stock.",
    bullets: [
      "Item, quantity, cost-per-unit, unit, location",
      "Per-project filtering",
      "Total value footer",
      "Empty state guidance for first-time users",
    ],
  },
  {
    icon: Workflow,
    eyebrow: "Workflows",
    title: "Status that means something.",
    description:
      "Every project flows through a clear lifecycle. No more guessing what 'in progress' really means.",
    bullets: [
      "Six named statuses with semantic colors",
      "Lifecycle legend on each card",
      "Optional server-side transition rules",
      "Designed for handoff between PMs and field crews",
    ],
  },
  {
    icon: BarChart3,
    eyebrow: "Insights",
    title: "A dashboard that earns its place.",
    description:
      "Open the dashboard and see what's moving — and what's stuck. Sparklines, donuts, timelines, and a smart insight banner.",
    bullets: [
      "7-day / 30-day / All-time toggle filters every card",
      "Project status donut — click a slice to filter /projects",
      "Document uploads per day (last 14)",
      "Inventory value by warehouse, on site, and in transit",
      "Active project timelines with progress bars",
    ],
  },
];

export default function FeaturesPage() {
  return (
    <>
      <Hero
        eyebrow="Features"
        title="Everything you need to run a job site."
        subtitle="Four big tools. Zero busywork. Built for the people who actually build things."
        primaryHref="/register"
        primaryLabel="Start free"
        secondaryHref="/pricing"
        secondaryLabel="See pricing"
      />

      <Section className="pt-8">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {features.map((f) => (
            <FeatureCard
              key={f.title}
              icon={f.icon}
              title={f.title}
              description={f.description}
            />
          ))}
        </div>
      </Section>

      {features.map((f, i) => (
        <Section
          key={f.title}
          eyebrow={f.eyebrow}
          title={f.title}
          description={f.description}
          align={i % 2 === 0 ? "left" : "left"}
        >
          <div className="mt-10 grid gap-3 md:grid-cols-2">
            {f.bullets.map((b) => (
              <div
                key={b}
                className="flex items-start gap-3 rounded-md border border-border bg-gcpallet-card p-4 text-left text-body text-gcpallet-card-foreground shadow-sm"
              >
                <span className="mt-1 inline-block h-2 w-2 shrink-0 rounded-full bg-gcpallet-primary" />
                <span>{b}</span>
              </div>
            ))}
          </div>
        </Section>
      ))}

      <Section className="pb-24">
        <CtaBanner
          title="Ready to try it on a real project?"
          primaryHref="/register"
          primaryLabel="Start free"
          secondaryHref="/pricing"
          secondaryLabel="See pricing"
        />
      </Section>
    </>
  );
}