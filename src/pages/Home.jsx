import React from "react";
import { BadgeCheck, ArrowRight, LayoutGrid, Layers, BellRing, Quote, MoveHorizontal } from "lucide-react";
import { Button, GlassCard, PerkCard, StickyCta, ProviderMark } from "../ui/components";
import { SAMPLE_PERKS } from "../data/perks";

const preview = [SAMPLE_PERKS[0], SAMPLE_PERKS[3], SAMPLE_PERKS[8]];
const benefits = [
  { Icon: LayoutGrid, title: "Every perk, one place", body: "All your subscriptions and memberships, surfaced in a single clean view." },
  { Icon: Layers, title: "Tier-aware", body: "We only show what's actually yours — matched to your exact plan and tier." },
  { Icon: BellRing, title: "Never miss one", body: "Reminders before perks reset or expire, so value never slips away." },
];
const testimonials = [
  { initial: "S", name: "Sam", role: "Sky + Monzo user", quote: "Found £140 of Sky perks I completely forgot I had." },
  { initial: "A", name: "Aisha", role: "Revolut Metal", quote: "I had no idea my plan included lounge access. Used it twice already." },
  { initial: "T", name: "Tom", role: "Monzo Perks", quote: "It paid for itself in the first week. The Greggs reminder alone." },
];

function Counter() {
  const ref = React.useRef(null);
  const [val, setVal] = React.useState(0);
  const target = 2400;
  React.useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) { setVal(target); return; }
    const io = new IntersectionObserver((e) => {
      if (e[0].isIntersecting) {
        let n = 0;
        const t = setInterval(() => { n += Math.ceil(target / 40); if (n >= target) { n = target; clearInterval(t); } setVal(n); }, 20);
        io.disconnect();
      }
    });
    if (ref.current) io.observe(ref.current);
    return () => io.disconnect();
  }, []);
  return <div ref={ref} className="text-5xl md:text-6xl font-bold text-gold tabular-nums">£{val.toLocaleString()}</div>;
}

export default function Home() {
  const [done, setDone] = React.useState(false);
  return (
    <>
      {/* HERO */}
      <section className="relative text-center lg:text-left lg:grid lg:grid-cols-2 lg:gap-12 lg:items-center pt-6 pb-12">
        <div className="lg:py-10">
          <span className="inline-flex items-center gap-1.5 glass rounded-full px-3 py-1 text-sm font-medium text-golddeep mb-6">
            <BadgeCheck className="w-4 h-4" /> Cross-provider perk inventory
          </span>
          <h1 className="font-bold tracking-tight text-[40px] leading-[44px] md:text-[56px] md:leading-[60px]">
            £200+ a month in perks.<br /><span className="text-gold">You're using almost none.</span>
          </h1>
          <p className="mt-5 text-lg leading-7 text-snow/90 max-w-md mx-auto lg:mx-0">
            Perki finds every benefit hidden in your subscriptions and memberships — and puts them in one place.
          </p>
          <div className="mt-8 flex flex-col items-center lg:items-start gap-2">
            <Button to="/perks" className="w-full sm:w-auto !px-8 !py-3.5 !min-h-[52px]">See my perks <ArrowRight className="w-5 h-5" /></Button>
            <span className="text-sm text-muted">No card · 2-minute setup</span>
          </div>
        </div>
        <div className="hidden lg:flex relative h-80 items-center justify-center" aria-hidden="true">
          <div className="w-56 h-56 rounded-full opacity-80" style={{ background: "radial-gradient(circle at 30% 30%,#2B2A6E,#E0A93B 70%,transparent 75%)", filter: "blur(6px)" }} />
        </div>
      </section>

      {/* TRUST */}
      <section className="py-8 border-y border-snow/10">
        <p className="text-center text-sm font-medium text-muted tracking-wide uppercase mb-5">Trusted across your wallet</p>
        <div className="flex items-center justify-center gap-7 flex-wrap text-snow/70">
          {["Monzo", "Revolut", "Sky", "OVO"].map((p) => (
            <span key={p} className="flex items-center gap-2 font-semibold"><ProviderMark provider={p} className="w-5 h-5 text-snow/70" />{p}</span>
          ))}
        </div>
      </section>

      {/* BENEFITS (3 max) */}
      <section className="py-12 grid gap-4 md:grid-cols-3">
        {benefits.map(({ Icon, title, body }) => (
          <GlassCard key={title}>
            <span className="grid place-items-center w-11 h-11 rounded-btn bg-gold/20 text-golddeep mb-4"><Icon className="w-6 h-6" /></span>
            <h3 className="text-xl font-semibold mb-1.5">{title}</h3>
            <p className="text-snow/80 leading-7">{body}</p>
          </GlassCard>
        ))}
      </section>

      {/* LIVE PREVIEW */}
      <section className="py-8">
        <div className="flex items-end justify-between mb-5">
          <h2 className="text-2xl font-semibold">Real perks, right now</h2>
          <span className="text-sm text-muted hidden sm:flex items-center gap-1">Swipe <MoveHorizontal className="w-4 h-4" /></span>
        </div>
        <div className="swipe flex gap-4 overflow-x-auto -mx-4 px-4 pb-2 md:grid md:grid-cols-3 md:overflow-visible md:mx-0 md:px-0">
          {preview.map((p) => <div key={p.perk_id} className="min-w-[80%] sm:min-w-[300px] md:min-w-0"><PerkCard perk={p} /></div>)}
        </div>
      </section>

      {/* VALUE COUNTER */}
      <section className="py-12 text-center">
        <p className="text-sm uppercase tracking-wide text-muted mb-2">Unclaimed value waiting for the average user</p>
        <Counter />
        <p className="text-snow/70 mt-2">a year, hiding in subscriptions they already pay for.</p>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-12">
        <h2 className="text-2xl font-semibold text-center mb-8">People keep finding money they forgot they had</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {testimonials.map((t) => (
            <GlassCard key={t.name} as="figure">
              <Quote className="w-6 h-6 text-gold mb-3" />
              <blockquote className="text-snow/90 leading-7">"{t.quote}"</blockquote>
              <figcaption className="mt-4 flex items-center gap-3">
                <span className="w-9 h-9 rounded-full bg-purple/30 grid place-items-center font-semibold">{t.initial}</span>
                <span><span className="block font-semibold text-sm">{t.name}</span><span className="block text-xs text-muted">{t.role}</span></span>
              </figcaption>
            </GlassCard>
          ))}
        </div>
      </section>

      {/* FINAL CTA */}
      <section id="signup" className="py-14 text-center">
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Stop paying for perks<br />you never use.</h2>
        <form className="mt-8 max-w-sm mx-auto flex flex-col gap-3" onSubmit={(e) => { e.preventDefault(); setDone(true); }}>
          <label htmlFor="home-email" className="sr-only">Email address</label>
          <input id="home-email" type="email" required placeholder="you@email.com"
            className="px-4 py-3.5 text-base rounded-btn bg-ink2 border border-snow/15 placeholder-muted focus:border-gold focus:ring-[3px] focus:ring-gold/20 focus:outline-none min-h-[52px]" />
          <Button as="button" type="submit" className="!px-8 !py-3.5 !min-h-[52px]">Get Perki free</Button>
          {done && <p className="text-golddeep text-sm">You're on the list — check your inbox.</p>}
        </form>
      </section>

      <StickyCta to="/perks" />
    </>
  );
}
