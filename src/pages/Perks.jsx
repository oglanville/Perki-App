import React from "react";
import { Plus } from "lucide-react";
import { Button } from "../ui/components";
import { BrandLogo } from "../ui/brand";
import { PerkList, TierSelector, SearchBar, RequestMembershipModal } from "../ui/perkui";
import { fetchAllPerks, buildTierMap, buildMembershipCatalog, dedupeAcrossTiers, requestMembership } from "../data/catalog";
import { SAMPLE_PERKS } from "../data/perks";
import { supabase } from "../lib/supabase";

export default function Perks() {
  const [perks, setPerks] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [sample, setSample] = React.useState(false);

  const [membership, setMembership] = React.useState(null);
  const [tier, setTier] = React.useState(null);
  const [query, setQuery] = React.useState("");

  const [reqOpen, setReqOpen] = React.useState(false);
  const [reqBusy, setReqBusy] = React.useState(false);
  const [reqDone, setReqDone] = React.useState(false);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const p = await fetchAllPerks();
        if (!alive) return;
        if (!p.length) { setPerks(SAMPLE_PERKS); setSample(true); }
        else setPerks(p);
      } catch { if (alive) { setPerks(SAMPLE_PERKS); setSample(true); } }
      finally { if (alive) setLoading(false); }
    })();
    return () => { alive = false; };
  }, []);

  const tierMap = React.useMemo(() => buildTierMap(perks), [perks]);
  const catalog = React.useMemo(() => buildMembershipCatalog(perks, tierMap), [perks, tierMap]);
  const selected = React.useMemo(() => catalog.find((c) => `${c.provider}|${c.membership}` === membership) || null, [catalog, membership]);

  React.useEffect(() => { setTier(null); }, [membership]);

  const visible = React.useMemo(() => {
    let rows = perks;
    if (selected) rows = rows.filter((p) => p.provider === selected.provider && p.membership === selected.membership);
    if (tier) rows = rows.filter((p) => p.tier === tier);
    // "All tiers": show every tier (no dedupe across tiers)
    if (query.trim()) {
      const q = query.toLowerCase();
      rows = rows.filter((p) =>
        (p.title || "").toLowerCase().includes(q) ||
        (p.description || "").toLowerCase().includes(q) ||
        (p.provider || "").toLowerCase().includes(q) ||
        (p.tier || "").toLowerCase().includes(q));
    }
    return rows;
  }, [perks, selected, tier, query, tierMap]);

  async function submitRequest({ name, description }) {
    setReqBusy(true);
    try {
      if (supabase) { const { data } = await supabase.auth.getUser(); await requestMembership({ userId: data?.user?.id, name, description }); }
      setReqDone(true);
    } catch { setReqDone(true); } finally { setReqBusy(false); }
  }

  return (
    <section className="py-6">
      <div className="flex items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Potential Perks / Marketplace</h1>
          {sample && <p className="text-xs text-muted mt-1">Showing sample data — connect Supabase for the live catalogue.</p>}
        </div>
        <Button as="button" onClick={() => { setReqDone(false); setReqOpen(true); }} className="!min-h-[44px] !px-4 text-sm shrink-0"><Plus className="w-4 h-4" />Request</Button>
      </div>

      {/* 1. Membership selector (brand logos) */}
      <div className="swipe flex gap-2 overflow-x-auto -mx-4 px-4 pb-2 mb-3">
        <button onClick={() => setMembership(null)} className={`whitespace-nowrap rounded-full px-4 min-h-[44px] text-sm font-medium cursor-pointer transition-colors duration-200 ${membership == null ? "bg-purple text-white" : "glass text-snow/80 hover:text-snow"}`}>All</button>
        {catalog.map((c) => {
          const key = `${c.provider}|${c.membership}`;
          return (
            <button key={key} onClick={() => setMembership(key)} className={`whitespace-nowrap rounded-full pl-2 pr-4 min-h-[44px] text-sm font-medium cursor-pointer transition-colors duration-200 flex items-center gap-2 ${membership === key ? "bg-purple text-white" : "glass text-snow/80 hover:text-snow"}`}>
              <BrandLogo provider={c.provider} className="w-7 h-7" />{c.provider}
            </button>
          );
        })}
      </div>

      {/* 2. Tier selector (logo + price) */}
      {selected && <div className="mb-3"><TierSelector provider={selected.provider} tiers={selected.tiers} value={tier} onChange={setTier} /></div>}

      {/* 3. Search bar */}
      <div className="mb-5"><SearchBar value={query} onChange={setQuery} placeholder="Search perks, memberships, tiers…" /></div>

      {/* Perks list (vertical) */}
      {loading ? (
        <ul className="space-y-2">{Array.from({ length: 8 }).map((_, i) => <li key={i} className="glass rounded-btn h-12 animate-pulse" />)}</ul>
      ) : (
        <PerkList perks={visible} mode="marketplace" scope={perks} tierMap={tierMap} groupByCategory emptyLabel={selected ? "No perks match your filters." : "Pick a membership to explore its perks."} />
      )}

      <RequestMembershipModal open={reqOpen} onClose={() => setReqOpen(false)} onSubmit={submitRequest} busy={reqBusy} done={reqDone} />
    </section>
  );
}
