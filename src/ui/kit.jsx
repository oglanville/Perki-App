/* Perki mob-style UI kit — shelves, pills, tiles, ink bands, ladders.
   Weight does the shouting: Outfit 800/900 crushed for display, sentence case everywhere. */
import React from "react";
import { Link } from "react-router-dom";
import { BrandLogo } from "./brand";
import { categoryEmoji, cadenceLabel, categoryLabel } from "../data/catalog";
import { perkImage } from "../data/stockImages";

/* ── Type ────────────────────────────────────────────────────────────── */
export function Eyebrow({ children, className = "" }) {
  return <div className={`text-[11px] font-extrabold uppercase tracking-[0.12em] text-golddeep ${className}`}>{children}</div>;
}

export function Display({ as: Tag = "h1", size = "lg", className = "", children }) {
  const sizes = { xl: "text-5xl sm:text-6xl", lg: "text-4xl sm:text-5xl", md: "text-3xl sm:text-4xl", sm: "text-2xl sm:text-3xl" };
  return <Tag className={`font-display font-extrabold leading-[0.95] tracking-tight ${sizes[size]} ${className}`}>{children}</Tag>;
}

export function SectionHead({ title, count, sub, action }) {
  return (
    <div className="mb-4">
      <div className="flex items-baseline gap-3">
        <h2 className="font-display font-extrabold text-2xl sm:text-3xl leading-tight">{title}</h2>
        {count != null && <span className="rounded-full bg-goldlight text-golddeep text-xs font-bold px-2.5 py-0.5">{count}</span>}
        {action && <div className="ml-auto">{action}</div>}
      </div>
      {sub && <p className="text-muted text-sm mt-1">{sub}</p>}
    </div>
  );
}

/* ── Pills + chips ───────────────────────────────────────────────────── */
export function Pill({ to, as = "button", variant = "primary", className = "", children, ...rest }) {
  const base = "inline-flex items-center justify-center gap-2 rounded-full min-h-[48px] px-7 font-semibold text-[15px] cursor-pointer transition-colors duration-200 focus:outline-none focus:ring-[3px] focus:ring-purple/40";
  const styles = {
    primary: "bg-purple text-white hover:bg-[#3A388F]",
    ghost: "border-[1.5px] border-snow/20 text-snow hover:border-snow/40",
    gold: "bg-gold text-snow hover:brightness-105",
  }[variant];
  const cls = `${base} ${styles} ${className}`;
  if (to) return <Link to={to} className={cls} {...rest}>{children}</Link>;
  const Tag = as;
  return <Tag className={cls} {...rest}>{children}</Tag>;
}

export function Chip({ active, count, className = "", children, ...rest }) {
  return (
    <button
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full min-h-[38px] px-4 text-[13px] font-semibold cursor-pointer transition-colors duration-200 border-[1.5px] ${active ? "bg-purple text-white border-purple" : "bg-ink2 text-snow/80 border-snow/15 hover:text-snow"} ${className}`}
      aria-pressed={!!active}
      {...rest}>
      {children}
      {count != null && <span className={`text-[10.5px] font-extrabold rounded-full px-1.5 py-px ${active ? "bg-white/20 text-gold" : "bg-goldlight text-golddeep"}`}>{count}</span>}
    </button>
  );
}

/* ── Shelf rail (cards bleed off the right edge) ─────────────────────── */
export function Shelf({ className = "", children }) {
  return <div className={`swipe flex gap-3.5 overflow-x-auto pb-4 -mx-4 px-4 ${className}`}>{children}</div>;
}

/* ── Perk tile: 1:1 glyph tile, logo overlay, text below (never on) ──── */
const TILE_BGS = ["bg-goldlight", "bg-[#EEF2FF]", "bg-[#ECFDF5]", "bg-[#FFF1F2]"];
export const tileBg = (seed = 0) => TILE_BGS[Math.abs(seed) % TILE_BGS.length];

export function Tag2({ tone = "plain", children }) {
  const cls = {
    plain: "border-snow/15 text-muted",
    gold: "bg-goldlight border-gold text-golddeep",
    ink: "bg-purple border-purple text-white",
  }[tone];
  return <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${cls}`}>{children}</span>;
}

export function PerkTile({ perk, seed = 0, flag, onClick, className = "" }) {
  const [broken, setBroken] = React.useState(false);
  const img = perkImage(perk);
  return (
    <article
      role="button" tabIndex={0} onClick={onClick}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onClick?.(e)}
      className={`shrink-0 snap-start w-[236px] sm:w-auto bg-ink2 border border-snow/10 rounded-modal overflow-hidden shadow-sm cursor-pointer transition-transform duration-200 ease-fluid hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-[3px] focus:ring-purple/40 ${className}`}>
      <div className={`relative aspect-square grid place-items-center text-6xl ${tileBg(seed)}`}>
        {img && !broken
          ? <img src={img} alt="" loading="lazy" onError={() => setBroken(true)} className="absolute inset-0 w-full h-full object-cover" />
          : <span aria-hidden="true">{categoryEmoji(perk.category)}</span>}
        <BrandLogo provider={perk.provider} className="w-9 h-9 absolute top-3 right-3 !rounded-xl border border-snow/10 shadow-sm" />
      </div>
      <div className="p-4 border-t border-snow/10">
        <h3 className="font-display font-semibold text-[15px] leading-snug line-clamp-2">{perk.title}</h3>
        <p className="text-muted text-xs mt-1 truncate">{perk.provider} · {perk.tier}</p>
        <div className="flex flex-wrap gap-1.5 mt-2.5">
          <Tag2 tone={perk.feature === "feature" ? "gold" : "plain"}>{categoryLabel(perk.feature)}</Tag2>
          <Tag2>{cadenceLabel(perk.reset_period)}</Tag2>
          {flag && <Tag2 tone="ink">{flag}</Tag2>}
        </div>
      </div>
    </article>
  );
}

/* ── Full-bleed indigo band ──────────────────────────────────────────── */
export function InkBand({ className = "", children }) {
  return (
    <section className={`relative left-1/2 -translate-x-1/2 w-screen bg-purple text-white my-10 ${className}`}>
      <div className="max-w-content mx-auto px-4 py-14">{children}</div>
    </section>
  );
}

export function StatBig({ n, label }) {
  return (
    <div>
      <div className="font-display font-extrabold text-4xl sm:text-5xl text-gold leading-none">{n}</div>
      <div className="text-[13px] opacity-75 mt-1">{label}</div>
    </div>
  );
}

export function QuoteCard({ quote, who }) {
  return (
    <div className="shrink-0 snap-start w-[300px] rounded-modal border border-white/15 bg-white/[0.07] p-5">
      <p className="text-[14.5px] leading-relaxed">“{quote}”</p>
      <p className="text-gold font-bold text-[13px] mt-3">{who}</p>
    </div>
  );
}

/* ── Verdict card (profile hero) ─────────────────────────────────────── */
export function VerdictCard({ eyebrow, headline, tiles = [] }) {
  return (
    <section className="bg-purple text-white rounded-modal p-6 sm:p-7">
      <Eyebrow className="!text-gold">{eyebrow}</Eyebrow>
      <div className="font-display font-extrabold text-2xl sm:text-3xl leading-tight mt-2 mb-5">{headline}</div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {tiles.map((t) => (
          <div key={t.label} className="rounded-card border border-white/15 bg-white/[0.07] text-center py-3.5 px-1">
            <div className="font-display font-extrabold text-2xl text-gold tabular-nums">{t.value}</div>
            <div className="text-[10.5px] font-semibold opacity-75 mt-0.5">{t.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ── Tier ladder ─────────────────────────────────────────────────────── */
export function TierLadder({ provider, tiers, heldTier, addsFor, verdictFor }) {
  return (
    <div className="swipe flex gap-2.5 overflow-x-auto pb-3 -mx-4 px-4">
      {tiers.map((t) => {
        const held = heldTier === t.tier;
        const verdict = verdictFor?.(t);
        const adds = addsFor?.(t) || [];
        return (
          <div key={t.tier} className={`shrink-0 snap-start w-[190px] rounded-modal border-[1.5px] p-4 ${held ? "bg-purple border-purple text-white" : "bg-white border-snow/15"}`}>
            <div className="font-display font-extrabold text-base">{t.tier}</div>
            <div className="font-display font-black text-2xl mt-0.5 mb-2">{t.price_label ?? (t.price === 0 ? "Free" : `£${t.price}`)}<span className="text-xs font-medium opacity-60">/mo</span></div>
            <ul className="text-xs leading-7">
              {adds.slice(0, 4).map((a) => <li key={a} className="truncate"><span className={held ? "text-gold font-extrabold" : "text-golddeep font-extrabold"}>✓ </span>{a}</li>)}
              {adds.length > 4 && <li className="opacity-60">+ {adds.length - 4} more</li>}
            </ul>
            {(held || verdict) && (
              <span className={`inline-block mt-2.5 text-[11px] font-bold rounded-full px-2.5 py-1 ${held ? "bg-white/15 text-gold" : "bg-goldlight text-golddeep"}`}>
                {held ? "You hold this" : verdict}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ── Savings helper: cheapest tier covering everything the user uses ──── */
export function cheapestCoveringTier(provider, membership, heldTier, perks, tierMap, usedIds) {
  const cur = tierMap[`${provider}|${heldTier}`];
  if (!cur || cur.kind === "variant" || (cur.price ?? 0) <= 0) return null;
  const mine = perks.filter((p) => p.provider === provider && p.membership === membership);
  const usedTitles = new Set(mine.filter((p) => usedIds.has(p.perk_id)).map((p) => (p.title || "").toLowerCase()));
  const tierTitles = {};
  mine.forEach((p) => { (tierTitles[p.tier] ??= new Set()).add((p.title || "").toLowerCase()); });
  let best = null;
  for (const t of Object.keys(tierTitles)) {
    const price = tierMap[`${provider}|${t}`]?.price ?? 0;
    if (price >= cur.price) continue;
    let covers = true;
    for (const u of usedTitles) if (!tierTitles[t].has(u)) { covers = false; break; }
    if (covers && (!best || price < best.price)) best = { tier: t, price };
  }
  if (!best) return null;
  const saving = Math.round((cur.price - best.price) * 100) / 100;
  return saving > 0 ? { tier: best.tier, saving } : null;
}
