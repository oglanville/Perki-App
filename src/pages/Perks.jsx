import React from "react";
import { Plus } from "lucide-react";
import { Button } from "../ui/components";
import { BrandLogo } from "../ui/brand";
import { SearchBar, RequestMembershipModal, PerkList } from "../ui/perkui";
import { fetchAllPerks, buildTierMap, buildMembershipCatalog, categoryEmoji, requestMembership } from "../data/catalog";
import { SAMPLE_PERKS } from "../data/perks";
import { supabase } from "../lib/supabase";

const byTitle = (a, b) => (a.title || "").localeCompare(b.title || "");

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

const chipCls = (active) => `whitespace-nowrap rounded-full px-4 min-h-[40px] text-sm font-medium cursor-pointer transition-colors duration-200 ${active ? "bg-purple text-white" : "glass text-snow/80 hover:text-snow"}`;

/* One self-contained marketplace: its own membership / tier / category filters + list.
   `query` is shared from the parent so Compare can drive both panes from a single search.
   `children` (optional) renders between the filters and the list — used to host the
   search bar in single-pane mode. `bleed` controls full-width chip rows (off inside Compare cards). */
function MarketplacePane({ perks, tierMap, catalog, query, bleed = true, children }) {
  const [membership, setMembership] = React.useState(null);
  const [tier, setTier] = React.useState(null);
  const [category, setCategory] = React.useState(null);

  const selected = React.useMemo(() => catalog.find((c) => `${c.provider}|${c.membership}` === membership) || null, [catalog, membership]);

  const baseRows = React.useMemo(() => selected ? perks.filter((p) => p.provider === selected.provider && p.membership === selected.membership) : perks, [perks, selected]);

  const membershipChips = React.useMemo(
    () => catalog.filter((c) => perks.some((p) => p.provider === c.provider && p.membership === c.membership && matches(p, query) && (!tier || p.tier === tier))),
    [catalog, perks, query, tier]
  );
  const tierChips = React.useMemo(() => {
    const seen = {};
    baseRows.filter((p) => matches(p, query)).forEach((p) => { const k = `${p.provider}|${p.tier}`; const so = tierMap[k]?.sort_order ?? 0; if (!(p.tier in seen) || so < seen[p.tier].so) seen[p.tier] = { so, label: tierMap[k]?.price_label }; });
    return Object.keys(seen).sort((a, b) => seen[a].so - seen[b].so).map((t) => ({ tier: t, label: seen[t].label }));
  }, [baseRows, tierMap, query]);
  const categoryChips = React.useMemo(() => [...new Set(baseRows.filter((p) => matches(p, query)).map((p) => p.category).filter(Boolean))].sort(), [baseRows, query]);

  React.useEffect(() => { if (membership && !membershipChips.some((c) => `${c.provider}|${c.membership}` === membership)) setMembership(null); }, [membershipChips, membership]);
  React.useEffect(() => { if (tier && !tierChips.some((t) => t.tier === tier)) setTier(null); }, [tierChips, tier]);
  React.useEffect(() => { if (category && !categoryChips.includes(category)) setCategory(null); }, [categoryChips, category]);

  const visible = React.useMemo(() => {
    let rows = baseRows;
    if (tier) rows = rows.filter((p) => p.tier === tier);
    if (category) rows = rows.filter((p) => p.category === category);
    if (!tier) rows = dedupeCheapest(rows, tierMap);
    if (query.trim()) rows = rows.filter((p) => matches(p, query));
    return rows;
  }, [baseRows, tier, category, query, tierMap]);

  const row = `swipe flex gap-2 overflow-x-auto pb-2 mb-2${bleed ? " -mx-4 px-4" : ""}`;
  const rowLast = `swipe flex gap-2 overflow-x-auto pb-2 mb-4${bleed ? " -mx-4 px-4" : ""}`;

  return (
    <div>
      <div className={row}>
        <button onClick={() => setMembership(null)} className={chipCls(membership == null)}>All</button>
        {membershipChips.map((c) => { const key = `${c.provider}|${c.membership}`; return (
          <button key={key} onClick={() => setMembership(key)} className={`${chipCls(membership === key)} flex items-center gap-2`}><BrandLogo provider={c.provider} className="w-6 h-6" />{c.provider}</button>
        ); })}
      </div>

      <div className={row}>
        <button onClick={() => setTier(null)} className={chipCls(tier == null)}>All tiers</button>
        {tierChips.map((t) => <button key={t.tier} onClick={() => setTier(t.tier)} className={chipCls(tier === t.tier)}>{t.tier}{t.label ? ` · ${t.label}` : ""}</button>)}
      </div>

      <div className={rowLast}>
        <button onClick={() => setCategory(null)} className={chipCls(category == null)}>All categories</button>
        {categoryChips.map((c) => <button key={c} onClick={() => setCategory(c)} className={`${chipCls(category === c)} flex items-center gap-1.5`}><span aria-hidden="true">{categoryEmoji(c)}</span>{c}</button>)}
      </div>

      {children}

      <PerkList perks={visible} comparator={byTitle} mode="marketplace" scope={perks} tierMap={tierMap} emptyLabel="No perks match your filters." />
    </div>
  );
}

export default function Perks() {
  const [perks, setPerks] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [sample, setSample] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [compareMode, setCompareMode] = React.useState(false);
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

  async function submitRequest({ name, description }) {
    setReqBusy(true);
    try {
      if (supabase) { const { data } = await supabase.auth.getUser(); await requestMembership({ userId: data?.user?.id, name, description }); }
      setReqDone(true);
    } catch { setReqDone(true); } finally { setReqBusy(false); }
  }

  const paneProps = { perks, tierMap, catalog, query };

  return (
    <section className="py-6">
      <div className="flex items-start justify-between gap-3 mb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Marketplace</h1>
          {sample && <p className="text-xs text-muted mt-1">Showing sample data — connect Supabase for the live catalogue.</p>}
        </div>
        <div className="flex flex-col items-stretch gap-2 shrink-0">
          <Button as="button" onClick={() => { setReqDone(false); setReqOpen(true); }} className="!min-h-[44px] !px-4 text-sm"><Plus className="w-4 h-4" />Request</Button>
          <button
            onClick={() => setCompareMode((v) => !v)}
            aria-pressed={compareMode}
            className={`min-h-[44px] px-4 text-sm rounded-btn font-medium cursor-pointer transition-colors duration-200 ${compareMode ? "bg-purple text-white" : "glass text-snow/85 hover:text-snow"}`}>
            {compareMode ? "Exit compare" : "Compare"}
          </button>
        </div>
      </div>

      {loading ? (
        <ul className="space-y-2">{Array.from({ length: 8 }).map((_, i) => <li key={i} className="glass rounded-btn h-12 animate-pulse" />)}</ul>
      ) : compareMode ? (
        <div>
          <div className="mb-5"><SearchBar value={query} onChange={setQuery} placeholder="Search both sides — perks, memberships, tiers…" /></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="glass rounded-card p-3 sm:p-4 md:max-h-[74vh] md:overflow-y-auto"><MarketplacePane {...paneProps} bleed={false} /></div>
            <div className="glass rounded-card p-3 sm:p-4 md:max-h-[74vh] md:overflow-y-auto"><MarketplacePane {...paneProps} bleed={false} /></div>
          </div>
        </div>
      ) : (
        <MarketplacePane {...paneProps} bleed>
          <div className="mb-5"><SearchBar value={query} onChange={setQuery} placeholder="Search perks, memberships, tiers…" /></div>
        </MarketplacePane>
      )}

      <RequestMembershipModal open={reqOpen} onClose={() => setReqOpen(false)} onSubmit={submitRequest} busy={reqBusy} done={reqDone} />
    </section>
  );
}
