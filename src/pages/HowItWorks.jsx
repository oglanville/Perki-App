import React from "react";
import { Link2, Layers, BellRing, ShieldCheck } from "lucide-react";
import { Button, GlassCard } from "../ui/components";

const steps = [
  { Icon: Link2, n: "1", title: "Tell us your subscriptions", body: "Add the providers and memberships you already pay for — Monzo, Revolut, Sky, OVO and more." },
  { Icon: Layers, n: "2", title: "Perki maps your exact tier", body: "We match every perk to your specific plan, so you only ever see what's genuinely yours." },
  { Icon: BellRing, n: "3", title: "Claim, track, never miss a reset", body: "Get reminders before perks reset or expire, and watch your unclaimed value drop to zero." },
];

export default function HowItWorks() {
  return (
    <section className="py-6">
      <header className="text-center max-w-xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Three taps to everything you're owed.</h1>
        <p className="text-snow/80 mt-3 text-lg">No spreadsheets. No digging through apps. Just your perks, surfaced.</p>
      </header>

      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {steps.map(({ Icon, n, title, body }) => (
          <GlassCard key={n}>
            <div className="flex items-center gap-3 mb-4">
              <span className="grid place-items-center w-11 h-11 rounded-btn bg-gold/20 text-golddeep"><Icon className="w-6 h-6" /></span>
              <span className="text-3xl font-bold text-snow/20">{n}</span>
            </div>
            <h3 className="text-xl font-semibold mb-1.5">{title}</h3>
            <p className="text-snow/80 leading-7">{body}</p>
          </GlassCard>
        ))}
      </div>

      <GlassCard className="mt-8 flex items-start gap-4 max-w-2xl mx-auto">
        <span className="grid place-items-center w-11 h-11 rounded-btn bg-purple/20 text-purple shrink-0"><ShieldCheck className="w-6 h-6" /></span>
        <div>
          <h3 className="font-semibold mb-1">Read-only. Always.</h3>
          <p className="text-snow/80 leading-7">Perki never moves your money — it just shows you what's already yours. Your data stays yours.</p>
        </div>
      </GlassCard>

      <div className="text-center mt-10"><Button to="/perks" className="!px-8 !py-3.5 !min-h-[52px]">See my perks</Button></div>
    </section>
  );
}
