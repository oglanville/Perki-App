import React from "react";
import { HeartHandshake } from "lucide-react";
import { Button, GlassCard } from "../ui/components";

/* Static page — Perki is free. No premium features, no upsells. */
export default function Pricing() {
  return (
    <section className="py-16 text-center min-h-[60vh] grid place-items-center">
      <GlassCard className="max-w-lg mx-auto">
        <span className="grid place-items-center w-14 h-14 rounded-btn bg-gold/20 text-golddeep mx-auto mb-6"><HeartHandshake className="w-7 h-7" /></span>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Perki is completely free</h1>
        <p className="text-snow/80 text-lg leading-8 mt-4">
          We don't charge for access. All revenue comes from optional membership or tier upgrades.
        </p>
        <div className="mt-8"><Button to="/perks" className="!px-8 !py-3.5 !min-h-[52px]">Explore perks</Button></div>
      </GlassCard>
    </section>
  );
}
