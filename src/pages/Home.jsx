import React from "react";
import { useNavigate } from "react-router-dom";
import { StickyCta } from "../ui/components";
import { BrandLogo } from "../ui/brand";
import { usePerkDrawer } from "../ui/PerkDrawer";
import { Eyebrow, Display, SectionHead, Pill, Shelf, PerkTile, InkBand, StatBig, QuoteCard } from "../ui/kit";
import { fetchAllPerks, buildTierMap, BUNDLES } from "../data/catalog";
import { SAMPLE_PERKS } from "../data/perks";

const HERO_LOGOS = ["Monzo", "Revolut", "Amazon", "Spotify", "Deliveroo", "Tesco"];

/* Keep the cheapest tier each perk appears in, then take the liveliest few. */
function shelfPicks(perks, tierMap, categories, n = 8) {
  const inCats = perks.filter((p) => categories.includes(p.category));
  const rank = (p) => tierMap[`${p.provider}|${p.tier}`]?.sort_order ?? 0;
  const byKey = {};
  inCats.forEach((p) => { const k = `${p.provider}|${(p.title || "").toLowerCase()}`; if (!byKey[k] || rank(p) < rank(byKey[k])) byKey[k] = p; });
  const rows = Object.values(byKey);
  /* one per provider first, so the rail reads varied */
  const seen = new Set(); const first = []; const rest = [];
  rows.forEach((p) => { if (seen.has(p.provider)) rest.push(p); else { seen.add(p.provider); first.push(p); } });
  return [...first, ...rest].slice(0, n);
}

function Check({ children }) {
  return (
    <li className="flex items-start gap-2.5 text-[15px] font-medium">
      <span className="grid place-items-center w-[22px] h-[22px] rounded-full bg-goldlight border-[1.5px] border-gold text-golddeep text-xs font-extrabold shrink-0 mt-0.5">✓</span>
      {children}
    </li>
  );
}

function HeroTile({ tone = "raised", cap, big, sub, children }) {
  const tones = {
    raised: "bg-ink2 border-snow/10",
    ink: "bg-purple border-purple text-white",
    gold: "bg-goldlight border-gold",
  }[tone];
  return (
    <div className={`aspect-square rounded-modal border p-4 flex flex-col justify-between overflow-hidden ${tones}`}>
      <span className={`text-xs font-semibold ${tone === "ink" ? "text-gold" : tone === "gold" ? "text-golddeep" : "text-muted"}`}>{cap}</span>
      {big && <span className={`font-display font-black leading-[0.95] ${String(big).length > 12 ? "text-xl" : "text-4xl"} ${tone === "gold" ? "text-golddeep" : ""}`}>{big}</span>}
      {children}
      {sub && <span className={`text-xs font-medium ${tone === "ink" ? "opacity-75" : tone === "gold" ? "text-golddeep/80" : "text-muted"}`}>{sub}</span>}
    </div>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const { open } = usePerkDrawer();
  const [perks, setPerks] = React.useState([]);
  const [email, setEmail] = React.useState("");

  React.useEffect(() => {
    let alive = true;
    (async () => {
      try { const p = await fetchAllPerks(); if (alive) setPerks(p.length ? p : SAMPLE_PERKS); }
      catch { if (alive) setPerks(SAMPLE_PERKS); }
    })();
    return () => { alive = false; };
  }, []);

  const tierMap = React.useMemo(() => buildTierMap(perks), [perks]);
  const providerCount = React.useMemo(() => new Set(perks.map((p) => p.provider)).size, [perks]);
  const cinema = React.useMemo(() => shelfPicks(perks, tierMap, BUNDLES.find((b) => b.key === "cinema").categories), [perks, tierMap]);
  const holiday = React.useMemo(() => shelfPicks(perks, tierMap, BUNDLES.find((b) => b.key === "holiday").categories), [perks, tierMap]);
  const openPerk = (p) => open(p, { mode: "marketplace", scope: perks, tierMap });

  return (
    <div className="pb-6">
      {/* HERO — noun-payoff headline, three checks, data tiles instead of stock photos */}
      <section className="grid md:grid-cols-2 gap-10 items-center pt-6 pb-10 sm:pt-12">
        <div>
          <Display size="xl">Your memberships, working harder.</Display>
          <p className="text-muted text-base leading-relaxed mt-4 max-w-[36ch]">
            Perki finds every perk, discount and freebie inside the memberships you already pay for, then tells you each morning which ones to use.
          </p>
          <ul className="space-y-2.5 mt-5 mb-7">
            <Check>See all {perks.length || "500+"} perks across {providerCount || 24} UK providers</Check>
            <Check>Save money by right-sizing your tiers</Check>
            <Check>One free email at 7am, no app required</Check>
          </ul>
          <div className="flex flex-wrap gap-2.5">
            <Pill to="/signup">Get the daily email</Pill>
            <Pill to="/perks" variant="ghost">Browse the perks</Pill>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <HeroTile tone="ink" cap="Found for members" big="£31/mo" sub="in savings, on average, across ten memberships" />
          <HeroTile cap="Your providers">
            <div className="flex flex-wrap gap-1.5">{HERO_LOGOS.map((p) => <BrandLogo key={p} provider={p} className="w-8 h-8 !rounded-lg border border-snow/10" />)}</div>
            <span className="text-xs text-muted font-medium">+ {Math.max((providerCount || 24) - HERO_LOGOS.length, 0)} more UK providers</span>
          </HeroTile>
          <HeroTile tone="gold" cap="Ready today" big="7" sub="perks worth a tap before they reset" />
          <HeroTile cap="Doubling up?" big="Travel cover from 2 providers" sub="We flag it. You decide." />
        </div>
      </section>

      {/* SHELF 1 — instant utility */}
      <section className="pt-2">
        <SectionHead title="Tonight, sorted" count={cinema.length} sub="Perks people already hold for a night in front of a screen." />
        <Shelf className="sm:grid sm:grid-cols-4 sm:overflow-visible sm:mx-0 sm:px-0">
          {cinema.map((p, i) => <PerkTile key={p.perk_id} perk={p} seed={i} onClick={() => openPerk(p)} className="sm:w-auto" />)}
        </Shelf>
      </section>

      {/* EDITORIAL interstitial */}
      <section className="py-12">
        <Display as="h2" size="lg" className="max-w-[16ch]">You are already paying for more than you think.</Display>
        <p className="text-muted leading-relaxed mt-4 max-w-[44ch]">
          The average member holds ten memberships. Banks, supermarkets, streaming, energy. Each one quietly bundles perks most people never open. We surface them, one morning at a time.
        </p>
      </section>

      {/* SHELF 2 — holiday bundle */}
      <section>
        <SectionHead title="Going away, covered" count={holiday.length} sub="Lounge passes, travel cover and currency perks you may already hold." />
        <Shelf className="sm:grid sm:grid-cols-4 sm:overflow-visible sm:mx-0 sm:px-0">
          {holiday.map((p, i) => <PerkTile key={p.perk_id} perk={p} seed={i + 1} onClick={() => openPerk(p)} className="sm:w-auto" />)}
        </Shelf>
      </section>

      {/* INK BAND — proof */}
      <InkBand>
        <Display as="h2" size="lg" className="max-w-[15ch] text-white">Built for people who hate wasting money.</Display>
        <div className="flex flex-wrap gap-x-10 gap-y-6 mt-8">
          <StatBig n={perks.length || "500+"} label="verified perks tracked" />
          <StatBig n={providerCount || 24} label="UK providers" />
          <StatBig n="7am" label="daily email, every day" />
        </div>
        <div className="swipe flex gap-3.5 overflow-x-auto mt-8 -mx-4 px-4 pb-1">
          <QuoteCard quote="I moved my bank tier down and kept every perk I actually use. Perki paid for itself in week one, and it's free." who="Sam, London" />
          <QuoteCard quote="The 7am email is the only newsletter I open every single day. Two minutes, and I know what to grab." who="Priya, Manchester" />
          <QuoteCard quote="Found out my bank and my energy provider both cover my boiler. Cancelled one. Dinner's on Perki." who="Josh, Leeds" />
        </div>
      </InkBand>

      {/* ENGINES split — mirrors the daily email */}
      <section>
        <SectionHead title="Two engines, one job" sub="Every morning we run your memberships through both." />
        <div className="grid sm:grid-cols-2 gap-3.5">
          <div className="rounded-modal border border-snow/10 bg-ink2 p-6">
            <Eyebrow>Savings engine</Eyebrow>
            <h3 className="font-display font-extrabold text-xl mt-1.5 mb-2">Move this, save that</h3>
            <p className="text-muted text-sm leading-relaxed">We find the cheapest tier that still covers every perk you actually use, and tell you exactly what to move. Never generic. Always your data.</p>
          </div>
          <div className="rounded-modal border border-gold bg-goldlight p-6">
            <Eyebrow>Consolidation engine</Eyebrow>
            <h3 className="font-display font-extrabold text-xl mt-1.5 mb-2">Stop doubling up</h3>
            <p className="text-muted text-sm leading-relaxed">Two providers covering the same thing? We flag genuine overlaps in insurance and travel cover, so you never pay twice for one umbrella.</p>
          </div>
        </div>
      </section>

      {/* EMAIL CAPTURE */}
      <section className="rounded-modal border border-snow/10 bg-ink2 p-7 mt-10 mb-4">
        <h2 className="font-display font-extrabold text-2xl">Mornings, sorted</h2>
        <p className="text-muted text-sm mt-1.5">One email at 7am. Your perks, your savings, your day. Free forever.</p>
        <form className="flex flex-wrap gap-2.5 mt-5" onSubmit={(e) => { e.preventDefault(); navigate(`/signup${email ? `?email=${encodeURIComponent(email)}` : ""}`); }}>
          <input
            type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="you@email.co.uk" aria-label="Email address"
            className="flex-1 min-w-[200px] h-12 rounded-full border-[1.5px] border-snow/15 bg-white px-5 text-[15px] focus:outline-none focus:ring-[3px] focus:ring-purple/40" />
          <Pill as="button" type="submit">Get the daily email</Pill>
        </form>
        <p className="text-muted text-xs mt-3">Your email address is safe with us. Read-only, always: Perki recommends and links, never moves your money.</p>
      </section>

      <StickyCta to="/signup" label="Get the daily email" />
    </div>
  );
}
