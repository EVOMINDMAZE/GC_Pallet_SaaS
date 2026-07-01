"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { Hero } from "@/components/marketing/hero";
import { Section } from "@/components/marketing/section";
import { FeatureCard } from "@/components/marketing/feature-card";
import { CtaBanner } from "@/components/marketing/cta-banner";
import { ProductMockup } from "@/components/marketing/product-mockup";
import { FAQ } from "@/components/marketing/faq";
import { useAuth } from "@/hooks/useAuth";
import { FolderKanban, Files, Truck, Workflow } from "lucide-react";

export default function MarketingHome() {
  const router = useRouter();
  // If signed in, push to the dashboard. Supabase stores the session
  // in cookies (set by the SSR client) so we can check on the client
  // once the AuthProvider has hydrated.
  const { isAuthenticated, isLoading } = useAuth();
  React.useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [router, isLoading, isAuthenticated]);

  return (
    <>
      <Hero
        eyebrow="Built for general contractors"
        title="Run every job site from one operations hub."
        subtitle="GC Pallet keeps projects, documents, and inventory in one place — so the people who actually build things spend less time chasing paperwork."
        primaryHref="/register"
        primaryLabel="Start free"
        secondaryHref="/features"
        secondaryLabel="See features"
        illustration={<ProductMockup />}
      />

      <Section
        eyebrow="What you get"
        title="Three tools, one source of truth"
        description="Replace scattered spreadsheets and email threads with a single workspace your whole team can use."
      >
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          <FeatureCard
            icon={FolderKanban}
            title="Projects"
            description="Track each job from kickoff to closeout with status, budget, and schedule in one card."
            href="/features"
          />
          <FeatureCard
            icon={Files}
            title="Documents"
            description="Upload permits, contracts, and receipts. Find them again in two clicks."
            href="/features"
          />
          <FeatureCard
            icon={Truck}
            title="Inventory"
            description="See exactly what's on every site, what it costs, and when to reorder."
            href="/features"
          />
        </div>
      </Section>

      <Section
        eyebrow="How it works"
        title="From kickoff to closeout"
        description="A simple lifecycle your team can follow without training."
      >
        <ol className="mx-auto mt-12 grid max-w-3xl gap-6 text-left md:grid-cols-3">
          {[
            { n: 1, h: "Create the project", b: "Add a name, address, and budget. Pick a status and you're rolling." },
            { n: 2, h: "Upload documents", b: "Permits, contracts, and receipts go straight to the project record." },
            { n: 3, h: "Track inventory", b: "Log deliveries by item and location. Watch totals update in real time." },
          ].map((s) => (
            <li key={s.n} className="rounded-lg border border-border bg-gcpallet-card p-6 shadow-sm">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gcpallet-primary text-body-strong text-gcpallet-primary-foreground">
                {s.n}
              </span>
              <h3 className="mt-4 text-h3 font-semibold text-gcpallet-card-foreground">{s.h}</h3>
              <p className="mt-2 text-body text-gcpallet-muted-foreground">{s.b}</p>
            </li>
          ))}
        </ol>
      </Section>

      <Section eyebrow="FAQ" title="Frequently asked questions">
        <div className="mx-auto mt-10 max-w-3xl">
          <FAQ
            items={[
              {
                q: "Is GC Pallet really free to start?",
                a: "Yes — the Starter plan is free forever for one user with up to three projects. Upgrade when your team grows.",
              },
              {
                q: "Where is my data stored?",
                a: "On Supabase Postgres with row-level security, hosted in the US East region. Files are stored in Supabase Storage. You can export everything at any time.",
              },
              {
                q: "Can I import existing projects?",
                a: "Yes. The Crew and Pro plans support CSV import for projects, inventory, and documents.",
              },
              {
                q: "Do you have a mobile app?",
                a: "The web app is mobile-first and works offline for inventory updates. Native iOS/Android apps are on the roadmap.",
              },
              {
                q: "How do I get help?",
                a: "Email support@gcpallet.example or use the contact form. We reply within one business day on the Crew plan.",
              },
              {
                q: "Can I cancel anytime?",
                a: "Yes. Cancel from Settings → Billing. Your data stays accessible for 30 days.",
              },
            ]}
          />
        </div>
      </Section>

      <Section className="pb-24">
        <CtaBanner
          eyebrow="Ready when you are"
          title="Ready to ship less paper?"
          description="Spin up a workspace in under a minute. No credit card required."
          primaryHref="/register"
          primaryLabel="Start free"
          secondaryHref="/pricing"
          secondaryLabel="See pricing"
        />
      </Section>
    </>
  );
}
