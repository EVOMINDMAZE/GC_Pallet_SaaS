import { Section } from "@/components/marketing/section";

export const metadata = {
  title: "Privacy — GC Pallet",
};

export default function PrivacyPage() {
  return (
    <>
      <Section eyebrow="Legal" align="left">
        <h1 className="text-h1 mt-3 font-bold tracking-tight text-foreground">
          Privacy policy
        </h1>
        <div className="mx-auto mt-10 max-w-2xl space-y-6 text-left text-body text-gcpallet-card-foreground">
          <p className="text-label uppercase tracking-wider text-gcpallet-muted-foreground">
            Last updated: January 1, 2026
          </p>
          <p>
            This is a placeholder privacy policy for the GC Pallet operations hub.
            We collect only the information necessary to provide our service, and we never sell
            your data.
          </p>
          <h2 className="text-h3 font-semibold">Information we collect</h2>
          <p>
            Account information (name, email, company name, phone), the content you create
            (projects, documents, inventory), and standard server logs.
          </p>
          <h2 className="text-h3 font-semibold">How we use it</h2>
          <p>
            To provide and improve GC Pallet, to send transactional notifications (e.g. password
            reset emails), and to respond to support requests.
          </p>
          <h2 className="text-h3 font-semibold">Your rights</h2>
          <p>
            You can export or delete your data at any time from Settings. Email
            support@gcpallet.example for assistance with data portability or erasure.
          </p>
          <p className="text-gcpallet-muted-foreground">
            This page is a placeholder. The production policy will be reviewed by counsel.
          </p>
        </div>
      </Section>
    </>
  );
}