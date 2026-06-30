import { Section } from "@/components/marketing/section";

export const metadata = {
  title: "Terms — GC Pallet",
};

export default function TermsPage() {
  return (
    <>
      <Section eyebrow="Legal" align="left">
        <h1 className="text-h1 mt-3 font-bold tracking-tight text-foreground">
          Terms of service
        </h1>
        <div className="mx-auto mt-10 max-w-2xl space-y-6 text-left text-body text-gcpallet-card-foreground">
          <p className="text-label uppercase tracking-wider text-gcpallet-muted-foreground">
            Last updated: January 1, 2026
          </p>
          <p>
            These are placeholder terms of service for GC Pallet. By using the service you agree
            to use it lawfully and not to upload content you don't have the right to share.
          </p>
          <h2 className="text-h3 font-semibold">Plans and billing</h2>
          <p>
            Paid plans are billed monthly or annually in advance. You can cancel anytime from
            Settings → Billing; access continues to the end of the current billing cycle.
          </p>
          <h2 className="text-h3 font-semibold">Service availability</h2>
          <p>
            We target 99.9% monthly availability on Crew and Pro plans. Planned maintenance is
            announced at least 48 hours in advance when possible.
          </p>
          <h2 className="text-h3 font-semibold">Liability</h2>
          <p>
            To the maximum extent permitted by law, GC Pallet is provided "as is" without
            warranties of any kind. Our aggregate liability is limited to the amount paid in the
            preceding 12 months.
          </p>
          <p className="text-gcpallet-muted-foreground">
            This page is a placeholder. The production terms will be reviewed by counsel.
          </p>
        </div>
      </Section>
    </>
  );
}