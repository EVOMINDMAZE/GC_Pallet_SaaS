"use client";

import * as React from "react";
import { PricingTier, type PricingTierData } from "@/components/marketing/pricing-tier";
import { PricingToggle } from "@/components/marketing/pricing-toggle";
import { ComparisonTable } from "@/components/marketing/comparison-table";
import { FAQ } from "@/components/marketing/faq";
import { Hero } from "@/components/marketing/hero";
import { CtaBanner } from "@/components/marketing/cta-banner";
import { Section } from "@/components/marketing/section";

const tiers: PricingTierData[] = [
  {
    id: "starter",
    name: "Starter",
    tagline: "For solo contractors getting started.",
    monthlyPrice: 0,
    yearlyPrice: 0,
    ctaLabel: "Start free",
    ctaHref: "/register",
    features: [
      "1 user",
      "Up to 3 active projects",
      "Up to 50 documents",
      "Inventory tracking",
      "Email support",
    ],
  },
  {
    id: "crew",
    name: "Crew",
    tagline: "For growing teams juggling multiple sites.",
    monthlyPrice: 19,
    yearlyPrice: 15,
    ctaLabel: "Start a 14-day trial",
    ctaHref: "/register",
    highlighted: true,
    features: [
      "Up to 10 users",
      "Unlimited projects",
      "Unlimited documents",
      "Inventory + categories",
      "Bulk CSV import",
      "Priority email support",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    tagline: "For established contractors running many jobs.",
    monthlyPrice: 49,
    yearlyPrice: 39,
    ctaLabel: "Talk to sales",
    ctaHref: "/contact",
    features: [
      "Unlimited users",
      "Custom workflows",
      "Advanced audit log",
      "API + webhooks",
      "Custom roles + permissions",
      "Dedicated success manager",
    ],
  },
];

const comparisonColumns = [
  { name: "Starter" },
  { name: "Crew", highlight: true },
  { name: "Pro" },
];

const comparisonRows = [
  { feature: "Active projects", cells: ["3", "Unlimited", "Unlimited"] },
  { feature: "Documents per project", cells: ["50", "Unlimited", "Unlimited"] },
  { feature: "Team members", cells: ["1", "10", "Unlimited"] },
  { feature: "Inventory tracking", cells: [true, true, true] },
  { feature: "Categories", cells: [false, true, true] },
  { feature: "CSV import/export", cells: [false, true, true] },
  { feature: "Custom roles", cells: [false, false, true] },
  { feature: "API + webhooks", cells: [false, false, true] },
  { feature: "Audit log", cells: ["Basic", "Standard", "Advanced"] },
  { feature: "Support", cells: ["Email", "Priority email", "Dedicated CSM"] },
];

const faqItems = [
  {
    q: "Do I need a credit card to start?",
    a: "No. The Starter plan is free forever — no card required. Crew and Pro start with a 14-day trial; you can cancel anytime.",
  },
  {
    q: "Can I change plans later?",
    a: "Yes. Upgrade or downgrade from Settings → Billing. Changes take effect at the start of your next billing cycle.",
  },
  {
    q: "What counts as a project?",
    a: "An active project is anything not in the Draft or Completed state. Archived projects don't count toward your limit.",
  },
  {
    q: "Do you offer non-profit discounts?",
    a: "Yes — 50% off Crew and Pro for registered non-profits and trade schools. Email support@gcpallet.example.",
  },
];

export default function PricingPage() {
  const [period, setPeriod] = React.useState<"monthly" | "yearly">("monthly");
  return (
    <>
      <Hero
        eyebrow="Pricing"
        title="Simple plans. Honest pricing."
        subtitle="Start free. Upgrade when your team grows. No setup fees, no per-document surcharges."
        primaryHref="/register"
        primaryLabel="Start free"
        secondaryHref="/contact"
        secondaryLabel="Talk to sales"
      />

      <Section>
        <div className="mb-10 flex justify-center">
          <PricingToggle value={period} onChange={setPeriod} />
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {tiers.map((t) => (
            <PricingTier key={t.id} tier={t} period={period} />
          ))}
        </div>
      </Section>

      <Section eyebrow="Compare" title="What's in each plan">
        <div className="mt-12">
          <ComparisonTable columns={comparisonColumns} rows={comparisonRows} />
        </div>
      </Section>

      <Section eyebrow="FAQ" title="Pricing questions">
        <div className="mx-auto mt-10 max-w-3xl">
          <FAQ items={faqItems} />
        </div>
      </Section>

      <Section className="pb-24">
        <CtaBanner
          eyebrow="Still deciding?"
          title="Try the Starter plan. It's free."
          description="Spin up a workspace in under a minute. Upgrade when you're ready."
          primaryHref="/register"
          primaryLabel="Start free"
          secondaryHref="/contact"
          secondaryLabel="Ask a question"
        />
      </Section>
    </>
  );
}