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

export default function Perks() {
  const [perks, setPerks] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [sample, setSample] = React.useState(false);
  const [membership, setMembership] = React.useState(null);
  const [tier, setTier] = React.useState(null);
  const [category, setCategory] = React.useState(null);
  const [query, setQuery] = React.useState("");
  const [compareMode, setCompareMode] = React.useState(false);
  const [leftTier, setLeftTier] = React.useState(null);
  const [rightTier, setRightTier] = React.useState(null);
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

  React.useEffect(() => { setTier(null); setCategory(null); }, [membership]);

  const baseRows = React.useMemo(() => selected ? perks.filter((p) => p.provider === selected.provider && p.membership === selected.membership) : perks, [perks, selected]);

  /* When searching, only show membership chips whose provider has a matching perk. */
  const membershipChips = React.useMemo(
    () => catalog.filter((c) => perks.some((p) => p.provider === c.provider && p.membership === c.membership && matches(p, query))),
    [catalog, perks, query]
  );

  const tierChips = React.useMemo(() => {
    const seen = {};
    baseRows.filter((p) => matches(p, query)).forEach((p) => { const k = `${p.provider}|${p.tier}`; const so = tierMap[k]?.sort_order ?? 0; if (!(p.tier in seen) || so < seen[p.tier].so) seen[p.tier] = { so, label: tierMap[k]?.price_label }; });
    return Object.keys(seen).sort((a, b) => seen[a].so - seen[b].so).map((t) => ({ tier: t, label: seen[t].label }));
  }, [baseRows, tierMap, query]);

  const categoryChips = React.useMemo(() => [...new Set(baseRows.filter((p) => matches(p, query)).map((p) => p.category).filter(Boolean))].sort(), [baseRows, query]);

  /* Every tier for the selected membership, unfiltered by search — drives the per-pane Compare selectors. */
  const paneTiers = React.useMemo(() => {
    const seen = {};
    baseRows.forEach((p) => { const k = `${p.provider}|${p.tier}`; const so = tierMap[k]?.sort_order ?? 0; if (!(p.tier in seen) || so < seen[p.tier].so) seen[p.tier] = { so, label: tierMap[k]?.price_label }; });
    return Object.keys(seen).sort((a, b) => seen[a].so - seen[b].so).map((t) => ({ tier: t, label: seen[t].label }));
  }, [baseRows, tierMap]);

  /* Clear any active filter that the search has emptied out, so it can't stay selected while hidden. */
  React.useEffect(() => { if (membership && !membershipChips.some((c) => `${c.provider}|${c.membership}` === membership)) setMembership(null); }, [membershipChips, membership]);
  React.useEffect(() => { if (tier && !tierChips.some((t) => t.tier === tier)) setTier(null); }, [tierChips, tier]);
  React.useEffect(() => { if (category && !categoryChips.includes(category)) setCategory(null); }, [categoryChips, category]);

  /* Seed and re-seed the two Compare panes: left = cheapest tier, right = next tier up. */
  React.useEffect(() => {
    if (!compareMode) return;
    if (!paneTiers.length) { setLeftTier(null); setRightTier(null); return; }
    setLeftTier((prev) => paneTiers.some((t) => t.tier === prev) ? prev : paneTiers[0].tier);
    setRightTier((prev) => paneTiers.some((t) => t.tier === prev) ? prev : (paneTiers[1]?.tier ?? paneTiers[0].tier));
  }, [compareMode, paneTiers]);

  const visible = React.useMemo(() => {
    let rows = baseRows;
    if (tier) rows = rows.filter((p) => p.tier === tier);
    if (category) rows = rows.filter((p) => p.category === category);
    if (!tier) rows = dedupeCheapest(rows, tierMap);
    if (query.trim()) rows = rows.filter((p) => matches(p, query));
    return rows;
  }, [baseRows, tier, category, query, tierMap]);

  /* Rows for one Compare pane: membership scope + shared category/search + this pane's tier. */
  const paneRows = React.useCallback((t) => {
    let rows = baseRows;
    if (category) rows = rows.filter((p) => p.category === category);
    rows = rows.filter((p) => p.tier === t);
    if (query.trim()) rows = rows.filter((p) => matches(p, query));
    return rows;
  }, [baseRows, category, query]);

  function toggleCompare() {
    if (compareMode) { setCompareMode(false); setTier(null); }
    else setCompareMode(true);
  }

  async function submitRequest({ name, description }) {
    setReqBusy(true);
    try {
      if (supabase) { const { data } = await supabase.auth.getUser(); await requestMembership({ userId: data?.user?.id, name, description }); }
      setReqDone(true);
    } catch { setReqDone(true); } finally { setReqBusy(false); }
  }

  const chip = (active) => `whitespace-nowrap rounded-full px-4 min-h-[40px] text-sm font-medium cursor-pointer transition-colors duration-200 ${active ? "bg-purple text-white" : "glass text-snow/80 hover:text-snow"}`;

  const renderPane = (label, tierVal, setTierVal) => {
    const meta = paneTiers.find((t) => t.tier === tierVal);
    return (
      <div className="glass rounded-card p-3 sm:p-4 md:max-h-[72vh] md:overflow-y-auto">
        <div className="flex items-center gap-2.5 mb-3">
          {selected && <BrandLogo provider={selected.provider} className="w-8 h-8" />}
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-wide text-muted">{label}</p>
            <p className="font-semibold truncate">{selected?.provider} {tierVal || ""}{meta?.label ? ` · ${meta.label}` : ""}</p>
          </div>
        </div>
        <div className="swipe flex gap-2 overflow-x-auto pb-2 mb-3">
          {paneTiers.map((t) => <button key={t.tier} onClick={() => setTierVal(t.tier)} className={chip(tierVal === t.tier)}>{t.tier}{t.label ? ` · ${t.label}` : ""}</button>)}
        </div>
        <PerkList perks={paneRows(tierVal)} comparator={byTitle} mode="marketplace" scope={perks} tierMap={tierMap} emptyLabel="No perks match your filters." />
      </div>
    );
  };

  const compareDisabled = !compareMode && membership == null;

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
            onClick={toggleCompare}
            disabled={compareDisabled}
            aria-pressed={compareMode}
            title={compareDisabled ? "Pick a membership to compare its tiers" : undefined}
            className={`min-h-[44px] px-4 text-sm rounded-btn font-medium cursor-pointer transition-colors duration-200 ${compareMode ? "bg-purple text-white" : "glass text-snow/85 hover:text-snow"} disabled:opacity-40 disabled:cursor-not-allowed`}>
            {compareMode ? "Exit compare" : "Compare"}
          </button>
        </div>
      </div>

      {/* Memberships (shared) */}
      <div className="swipe flex gap-2 overflow-x-auto -mx-4 px-4 pb-2 mb-2">
        <button onClick={() => setMembership(null)} className={chip(membership == null)}>All</button>
        {membershipChips.map((c) => { const key = `${c.provider}|${c.membership}`; return (
          <button key={key} onClick={() => setMembership(key)} className={`${chip(membership === key)} flex items-center gap-2`}><BrandLogo provider={c.provider} className="w-6 h-6" />{c.provider}</button>
        ); })}
      </div>

      {/* Tiers (hidden in Compare — tier is chosen per pane) */}
      {!compareMode && (
        <div className="swipe flex gap-2 overflow-x-auto -mx-4 px-4 pb-2 mb-2">
          <button onClick={() => setTier(null)} className={chip(tier == null)}>All tiers</button>
          {tierChips.map((t) => <button key={t.tier} onClick={() => setTier(t.tier)} className={chip(tier === t.tier)}>{t.tier}{t.label ? ` · ${t.label}` : ""}</button>)}
        </div>
      )}

      {/* Categories (shared) */}
      <div className="swipe flex gap-2 overflow-x-auto -mx-4 px-4 pb-2 mb-4">
        <button onClick={() => setCategory(null)} className={chip(category == null)}>All categories</button>
        {categoryChips.map((c) => <button key={c} onClick={() => setCategory(c)} className={`${chip(category === c)} flex items-center gap-1.5`}><span aria-hidden="true">{categoryEmoji(c)}</span>{c}</button>)}
      </div>

      <div className="mb-5"><SearchBar value={query} onChange={setQuery} placeholder="Search perks, memberships, tiers…" /></div>

      {loading ? (
        <ul className="space-y-2">{Array.from({ length: 8 }).map((_, i) => <li key={i} className="glass rounded-btn h-12 animate-pulse" />)}</ul>
      ) : compareMode ? (
        !selected ? (
          <p className="text-sm text-muted text-center py-10">Pick a membership above to compare its tiers.</p>
        ) : (
          <div>
            {paneTiers.length === 1 && <p className="text-xs text-golddeep mb-3">Only one tier available for this membership, so both sides match.</p>}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {renderPane("This option", leftTier, setLeftTier)}
              {renderPane("Compared with", rightTier, setRightTier)}
            </div>
          </div>
        )
      ) : (
        <PerkList perks={visible} comparator={byTitle} mode="marketplace" scope={perks} tierMap={tierMap} emptyLabel="No perks match your filters." />
      )}

      <RequestMembershipModal open={reqOpen} onClose={() => setReqOpen(false)} onSubmit={submitRequest} busy={reqBusy} done={reqDone} />
    </section>
  );
}
