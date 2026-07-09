import React from "react";
import { Plus } from "lucide-react";
import { BrandLogo } from "../ui/brand";
import { usePerkDrawer } from "../ui/PerkDrawer";
import { SearchBar, RequestMembershipModal } from "../ui/perkui";
import { Display, Eyebrow, Chip, Pill, PerkTile, TierLadder, SectionHead } from "../ui/kit";
import { fetchAllPerks, buildTierMap, buildMembershipCatalog, categoryEmoji, requestMembership, BUNDLES } from "../data/catalog";
import { SAMPLE_PERKS } from "../data/perks";
import { supabase } from "../lib/supabase";

/* True when no query, or when the perk matches the search text. */
const matches = (p, query) => {
  const q = (query || "").trim().toLowerCase();
  return !q || [p.title, p.description, p.provider, p.tier, p.category].some((v) => (v || "").toLowerCase().includes(q));
};

/* Keep only the cheapest tier each perk appears in (per provider + title). */
function dedupeCheapest(rows, tierMap) {
  const rank = (p) => tierMap[`${p.provider}|${p.tier}`]?.sort_order ?? (Number(p.price) || 0);
  const byKey = {};
  rows.forEach((p) => { const k = `${p.provider}|${(p.title || "").toLowerCase()}`; if (!byKey[k] || rank(p) < rank(byKey[k])) byKey[k] = p; });
  return Object.values(byKey);
}

/* Titles that also exist in a cheaper tier of the same membership. */
function cheaperTierFlags(rows, allRows, tierMap) {
  const rank = (p) => tierMap[`${p.provider}|${p.tier}`]?.sort_order ?? (Number(p.price) || 0);
  const cheapest = {};
  allRows.forEach((p) => { const k = `${p.provider}|${(p.title || "").toLowerCase()}`; if (!cheapest[k] || rank(p) < rank(cheapest[k])) cheapest[k] = p; });
  const out = {};
  rows.forEach((p) => {
    const c = cheapest[`${p.provider}|${(p.title || "").toLowerCase()}`];
    if (c && c.tier !== p.tier && rank(c) < rank(p)) out[p.perk_id] = `Also in ${c.tier}`;
  });
  return out;
}

const rowCls = "swipe flex gap-2 overflow-x-auto pb-2.5 -mx-4 px-4 items-center";

export default function Perks() {
  const { open } = usePerkDrawer();
  const [perks, setPerks] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [sample, setSample] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [bundle, setBundle] = React.useState(null);
  const [membership, setMembership] = React.useState(null);
  const [tier, setTier] = React.useState(null);
  const [reqOpen, setReqOpen] = React.useState(false);
  const [reqBusy, setReqBusy] = React.useState(false);
  const [reqDone, setReqDone] = React.useState(false);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const p = await fetchAllPerks();
        if (!alive) return;
        if (!p.length) { setPerks(SAMPLE_PERKS); setSample(true); } else setPerks(p);
      } catch { if (alive) { setPerks(SAMPLE_PERKS); setSample(true); } }
      finally { if (alive) setLoading(false); }
    })();
    return () => { alive = false; };
  }, []);

  const tierMap = React.useMemo(() => buildTierMap(perks), [perks]);
  const catalog = React.useMemo(() => buildMembershipCatalog(perks, tierMap), [perks, tierMap]);
  const selected = React.useMemo(() => catalog.find((c) => `${c.provider}|${c.membership}` === membership) || null, [catalog, membership]);

  /* Filter pipeline: search → bundle (moment) → membership → tier → dedupe */
  const searched = React.useMemo(() => perks.filter((p) => matches(p, query)), [perks, query]);
  const bundleDef = BUNDLES.find((b) => b.key === bundle);
  const inBundle = React.useMemo(() => bundleDef ? searched.filter((p) => bundleDef.categories.includes(p.category)) : searched, [searched, bundleDef]);
  const inMembership = React.useMemo(() => selected ? inBundle.filter((p) => p.provider === selected.provider && p.membership === selected.membership) : inBundle, [inBundle, selected]);
  const visible = React.useMemo(() => {
    let rows = tier ? inMembership.filter((p) => p.tier === tier) : dedupeCheapest(inMembership, tierMap);
    return rows.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
  }, [inMembership, tier, tierMap]);
  const flags = React.useMemo(() => tier ? cheaperTierFlags(visible, perks, tierMap) : {}, [visible, perks, tierMap, tier]);

  /* Chip data with live counts */
  const bundleChips = React.useMemo(() => BUNDLES.map((b) => ({ ...b, count: dedupeCheapest(searched.filter((p) => b.categories.includes(p.category)), tierMap).length })).filter((b) => b.count > 0), [searched, tierMap]);
  const membershipChips = React.useMemo(() => catalog.filter((c) => inBundle.some((p) => p.provider === c.provider && p.membership === c.membership)), [catalog, inBundle]);
  const tierChips = React.useMemo(() => selected ? selected.tiers : [], [selected]);

  React.useEffect(() => { if (membership && !membershipChips.some((c) => `${c.provider}|${c.membership}` === membership)) { setMembership(null); setTier(null); } }, [membershipChips, membership]);
  React.useEffect(() => { if (tier && !tierChips.some((t) => t.tier === tier)) setTier(null); }, [tierChips, tier]);

  const openPerk = (p) => open(p, { mode: "marketplace", scope: perks, tierMap });

  /* Ladder helpers: what each tier ADDS over the one below (hierarchical), or contains (variant). */
  const ladderAdds = (t) => {
    if (!selected) return [];
    return perks.filter((p) => p.provider === selected.provider && p.membership === selected.membership && p.tier === t.tier)
      .sort((a, b) => (a.title || "").localeCompare(b.title || "")).map((p) => p.title);
  };
  const ladderKind = selected && tierMap[`${selected.provider}|${selected.tiers[0]?.tier}`]?.kind;

  async function submitRequest({ name, description }) {
    setReqBusy(true);
    try {
      if (supabase) { const { data } = await supabase.auth.getUser(); await requestMembership({ userId: data?.user?.id, name, description }); }
      setReqDone(true);
    } catch { setReqDone(true); } finally { setReqBusy(false); }
  }

  return (
    <section className="py-6">
      <div className="flex items-end justify-between gap-3 mb-2">
        <div>
          <Display size="lg">Every perk, one shelf.</Display>
          <p className="text-muted text-sm mt-2">{perks.length} verified perks across {new Set(perks.map((p) => p.provider)).size} UK providers. Filter by moment, membership or tier.</p>
          {sample && <p className="text-xs text-muted mt-1">Showing sample data — connect Supabase for the live catalogue.</p>}
        </div>
        <Pill as="button" variant="ghost" className="!min-h-[42px] !px-4 text-sm shrink-0" onClick={() => { setReqDone(false); setReqOpen(true); }}>
          <Plus className="w-4 h-4" />Request
        </Pill>
      </div>

      <div className="my-4"><SearchBar value={query} onChange={setQuery} placeholder="Search perks, memberships, tiers…" /></div>

      {/* Sticky chip rows: moment → membership → tier */}
      <div className="sticky top-[68px] z-10 bg-ink pt-1 -mx-4 px-4 border-b border-snow/10">
        <div className={rowCls}>
          <span className="text-[11px] font-extrabold uppercase tracking-[0.1em] text-golddeep shrink-0">Moment</span>
          <Chip active={bundle == null} onClick={() => setBundle(null)}>All</Chip>
          {bundleChips.map((b) => <Chip key={b.key} active={bundle === b.key} count={b.count} onClick={() => setBundle(bundle === b.key ? null : b.key)}><span aria-hidden="true">{b.icon}</span>{b.name}</Chip>)}
        </div>
        <div className={rowCls}>
          <span className="text-[11px] font-extrabold uppercase tracking-[0.1em] text-golddeep shrink-0">Membership</span>
          <Chip active={membership == null} onClick={() => { setMembership(null); setTier(null); }}>All</Chip>
          {membershipChips.map((c) => { const key = `${c.provider}|${c.membership}`; return (
            <Chip key={key} active={membership === key} onClick={() => { setMembership(membership === key ? null : key); setTier(null); }} className="!pl-2">
              <BrandLogo provider={c.provider} className="w-6 h-6" />{c.provider}
            </Chip>
          ); })}
        </div>
        {selected && (
          <div className={rowCls}>
            <span className="text-[11px] font-extrabold uppercase tracking-[0.1em] text-golddeep shrink-0">Tier</span>
            <Chip active={tier == null} onClick={() => setTier(null)}>All tiers</Chip>
            {tierChips.map((t) => <Chip key={t.tier} active={tier === t.tier} onClick={() => setTier(tier === t.tier ? null : t.tier)}>{t.tier}{t.price_label ? ` · ${t.price_label}` : ""}</Chip>)}
          </div>
        )}
      </div>

      {/* Tier ladder — replaces the old Compare mode */}
      {selected && tierChips.length > 1 && (
        <div className="mt-5">
          <Eyebrow>Compare tiers</Eyebrow>
          <h2 className="font-display font-extrabold text-xl mt-1 mb-1">{selected.provider}, laid flat</h2>
          <p className="text-muted text-xs mb-3">{ladderKind === "variant" ? "Parallel plans — pick the one that fits, nothing is inherited." : "Each rung shows what that tier adds on top of the ones below."}</p>
          <TierLadder provider={selected.provider} tiers={tierChips} addsFor={ladderAdds} />
        </div>
      )}

      {/* Card grid */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="aspect-[3/4] rounded-modal bg-ink2 border border-snow/10 animate-pulse" />)}</div>
      ) : visible.length === 0 ? (
        <p className="text-center text-muted text-sm py-16">No perks match your filters.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
          {visible.map((p, i) => (
            <PerkTile key={p.perk_id} perk={{ ...p, tier: tier ? p.tier : `from ${p.tier}` }} seed={i} flag={flags[p.perk_id]} onClick={() => openPerk(p)} className="!w-auto" />
          ))}
        </div>
      )}

      <RequestMembershipModal open={reqOpen} onClose={() => setReqOpen(false)} onSubmit={submitRequest} busy={reqBusy} done={reqDone} />
    </section>
  );
}
