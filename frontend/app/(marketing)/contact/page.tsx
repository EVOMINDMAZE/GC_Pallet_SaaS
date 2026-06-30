"use client";

import * as React from "react";
import { z } from "zod";
import { Mail, MessageSquare, Clock } from "lucide-react";
import { Hero } from "@/components/marketing/hero";
import { Section } from "@/components/marketing/section";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toaster";

const contactSchema = z.object({
  name: z.string().min(1, "Name is required").max(120),
  email: z.string().email("Enter a valid email").max(160),
  message: z.string().min(10, "Tell us a bit more").max(2000),
});

export default function ContactPage() {
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [submitting, setSubmitting] = React.useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});
    const parsed = contactSchema.safeParse({ name, email, message });
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        next[issue.path.join(".")] = issue.message;
      }
      setErrors(next);
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/pb/api/collections/contact_messages/records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `Request failed with ${res.status}`);
      }
      toast({
        title: "Message sent",
        description: "We'll get back to you within one business day.",
        variant: "success",
      });
      setName("");
      setEmail("");
      setMessage("");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      toast({ title: "Couldn't send message", description: msg, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Hero
        eyebrow="Contact"
        title="We'd love to hear from you."
        subtitle="Bug reports, feature requests, sales questions — we read every message."
      />

      <Section className="pt-8">
        <div className="grid gap-8 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-gcpallet-primary" /> Email
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-body text-gcpallet-muted-foreground">
              <p>
                <a href="mailto:support@gcpallet.example" className="text-gcpallet-primary hover:underline">
                  support@gcpallet.example
                </a>
              </p>
              <p>For questions, feature requests, or anything else.</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-gcpallet-primary" /> Live chat
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-body text-gcpallet-muted-foreground">
              <p>Available Monday–Friday for Crew and Pro customers.</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gcpallet-primary" /> Response time
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-body text-gcpallet-muted-foreground">
              <p>One business day on Starter. Four hours on Crew. One hour on Pro.</p>
            </CardContent>
          </Card>
        </div>
      </Section>

      <Section eyebrow="Form" title="Send us a message" className="pb-24">
        <form
          onSubmit={onSubmit}
          className="mx-auto mt-10 grid max-w-2xl gap-5 rounded-lg border border-border bg-gcpallet-card p-6 text-left shadow-sm md:p-8"
        >
          <div className="grid gap-2">
            <Label htmlFor="contact-name">Name</Label>
            <Input
              id="contact-name"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="contact-email">Email</Label>
            <Input
              id="contact-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="contact-message">Message</Label>
            <Textarea
              id="contact-message"
              rows={6}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Tell us what's on your mind…"
              required
            />
            {errors.message && <p className="text-xs text-destructive">{errors.message}</p>}
          </div>
          <div className="flex justify-end">
            <Button type="submit" variant="primary" disabled={submitting}>
              {submitting ? "Sending…" : "Send message"}
            </Button>
          </div>
        </form>
      </Section>
    </>
  );
}