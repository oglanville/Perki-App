import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertCircle, CalendarDays, LogIn, Trash2, Plus } from "lucide-react";
import { GlassCard, TopNav, Footer } from "../ui/components";
import { MembershipRow, ConfirmModal, SearchBar, PerkList } from "../ui/perkui";
import { usePerkDrawer } from "../ui/PerkDrawer";
import { VerdictCard, cheapestCoveringTier, SectionHead, Pill, Chip, Shelf, PerkTile, Eyebrow } from "../ui/kit";
import { supabase } from "../lib/supabase";
import {
  fetchAllPerks, buildTierMap, buildMembershipCatalog, fetchUserMemberships,
  addMembership, removeMembership, monthlyCostOf,
} from "../data/catalog";

const fmtDate = (iso) => { try { return new Date(iso).toLocaleDateString("en-GB", { month: "long", year: "numeric" }); } catch { return "—"; } };

const TYPE_CHIPS = [
  { key: null, label: "Everything" },
  { key: "feature", label: "Features" },
  { key: "perk", label: "Perks" },
  { key: "discount", label: "Discounts" },
  { key: "competition", label: "Competitions" },
];

const PRIORITY_CATS = new Set(["Entertainment", "Lifestyle", "Food", "Wellness", "Fitness", "Streaming", "Shopping"]);

function Skeleton() {
  return (<div className="animate-pulse">
    <div className="h-10 w-56 bg-snow/10 rounded mb-6" />
    <div className="h-44 bg-snow/10 rounded-modal mb-8" />
    <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-16 bg-snow/10 rounded-modal" />)}</div>
  </div>);
}

export default function Profile() {
  const navigate = useNavigate();
  const { open } = usePerkDrawer();
  const [status, setStatus] = React.useState("loading");
  const [errCode, setErrCode] = React.useState("");
  const [user, setUser] = React.useState(null);
  const [profile, setProfile] = React.useState(null);
  const [perks, setPerks] = React.useState([]);
  const [memberships, setMemberships] = React.useState([]);
  const [stateRows, setStateRows] = React.useState([]);
  const [query, setQuery] = React.useState("");
  const [typeFilter, setTypeFilter] = React.useState(null);
  const [confirm, setConfirm] = React.useState(null);
  const [busy, setBusy] = React.useState(false);

  const load = React.useCallback(async () => {
    if (!supabase) { setErrCode("NOT_CONFIGURED"); setStatus("error"); return; }
    try {
      const { data: ures } = await supabase.auth.getUser();
      const u = ures?.user;
      if (!u) { setErrCode("NOT_SIGNED_IN"); setStatus("error"); return; }
      setUser(u);
      const [allPerks, prof, ums, sres] = await Promise.all([
        fetchAllPerks(),
        supabase.from("profiles").select("full_name,email,avatar_url,created_at").eq("id", u.id).single(),
        fetchUserMemberships(u.id),
        supabase.from("user_perk_state").select("perk_id,used,dismissed,will_not_use").eq("user_id", u.id),
      ]);
      setPerks(allPerks); setMemberships(ums); setStateRows(sres.data || []);
      const meta = u.user_metadata || {};
      setProfile({
        full_name: prof.data?.full_name || meta.full_name || (u.email ? u.email.split("@")[0] : "Your profile"),
        email: prof.data?.email || u.email || null,
        avatar_url: prof.data?.avatar_url || meta.avatar_url || null,
        created_at: prof.data?.created_at || u.created_at || null,
      });
      setStatus("ready");
    } catch (e) { setErrCode(e.message || "ERROR"); setStatus("error"); }
  }, []);
  React.useEffect(() => { load(); }, [load]);

  // Refresh when the drawer writes a perk-state change
  React.useEffect(() => {
    const onChange = () => load();
    window.addEventListener("perki:perkstate", onChange);
    return () => window.removeEventListener("perki:perkstate", onChange);
  }, [load]);

  const tierMap = React.useMemo(() => buildTierMap(perks), [perks]);
  const catalog = React.useMemo(() => buildMembershipCatalog(perks, tierMap), [perks, tierMap]);
  const activeMap = React.useMemo(() => Object.fromEntries(memberships.map((m) => [`${m.provider}|${m.membership}`, m.tier])), [memberships]);

  const monthlyCost = monthlyCostOf(memberships, tierMap);

  // Highest selected tier per membership = exact provider|tier in user_memberships
  const activeSet = React.useMemo(() => new Set(memberships.map((m) => `${m.provider}|${m.tier}`)), [memberships]);
  const unlockedPerks = React.useMemo(() => perks.filter((p) => activeSet.has(`${p.provider}|${p.tier}`)), [perks, activeSet]);
  const dedupeByTitle = (list) => { const m = {}; list.forEach((p) => { const k = `${p.provider}|${(p.title || "").toLowerCase()}`; if (!m[k]) m[k] = p; }); return Object.values(m); };
  const availablePerks = React.useMemo(() => dedupeByTitle(unlockedPerks), [unlockedPerks]);

  const usedIds = React.useMemo(() => new Set(stateRows.filter((s) => s.used).map((s) => s.perk_id)), [stateRows]);
  const dismissedIds = React.useMemo(() => new Set(stateRows.filter((s) => s.dismissed || s.will_not_use).map((s) => s.perk_id)), [stateRows]);

  // Dashboard counts
  const nonFeature = availablePerks.filter((p) => (p.feature || "perk") !== "feature");
  const totalAvailableNF = nonFeature.length;
  const totalActiveNF = nonFeature.filter((p) => usedIds.has(p.perk_id)).length;

  // Savings engine: cheapest tier that still covers everything the user uses
  const engineBadges = React.useMemo(() => {
    const out = {};
    Object.entries(activeMap).forEach(([key, heldTier]) => {
      const [provider, membership] = key.split("|");
      const r = cheapestCoveringTier(provider, membership, heldTier, perks, tierMap, usedIds);
      if (r) out[key] = r;
    });
    return out;
  }, [activeMap, perks, tierMap, usedIds]);
  const savingsTotal = Math.round(Object.values(engineBadges).reduce((t, r) => t + r.saving, 0) * 100) / 100;

  // Worth a tap: unused, undismissed, weekly-first, lifestyle categories first
  const worthATap = React.useMemo(() => {
    const scored = availablePerks
      .filter((p) => !usedIds.has(p.perk_id) && !dismissedIds.has(p.perk_id))
      .map((p) => {
        let s = 0;
        if (p.reset_period === "WEEKLY") s += 20;
        if (p.reset_period === "MONTHLY") s += 10;
        if (PRIORITY_CATS.has(p.category)) s += 15;
        if (p.feature === "perk") s += 10;
        return { p, s };
      }).sort((a, b) => b.s - a.s);
    const out = []; const seen = {};
    for (const { p } of scored) {
      if (out.length >= 6) break;
      if ((seen[p.provider] || 0) >= 2) continue;
      seen[p.provider] = (seen[p.provider] || 0) + 1;
      out.push(p);
    }
    return out;
  }, [availablePerks, usedIds, dismissedIds]);

  // Perk browser lists
  const q = query.trim().toLowerCase();
  const match = (p) => !q || [p.title, p.description, p.provider, p.tier, p.category].some((v) => (v || "").toString().toLowerCase().includes(q));
  const browserBase = availablePerks.filter((p) => match(p) && (!typeFilter || (p.feature || "perk") === typeFilter));
  const stillToUse = browserBase.filter((p) => !usedIds.has(p.perk_id));
  const alreadyUsed = browserBase.filter((p) => usedIds.has(p.perk_id));

  // Membership lists
  const activeList = catalog.filter((c) => activeMap[`${c.provider}|${c.membership}`] != null);
  const potentialList = catalog.map((c) => {
    const cur = activeMap[`${c.provider}|${c.membership}`];
    if (cur == null) return null;
    if (tierMap[`${c.provider}|${cur}`]?.kind === "variant") return null;
    const curSort = tierMap[`${c.provider}|${cur}`]?.sort_order ?? 0;
    const higher = c.tiers.filter((t) => t.sort_order > curSort);
    return higher.length ? { ...c, upgradeTiers: higher } : null;
  }).filter(Boolean);

  async function applyChange(provider, membership, tier) { setBusy(true); try { await addMembership(user.id, provider, membership, tier); await load(); } finally { setBusy(false); setConfirm(null); } }
  async function applyRemove(provider, membership) { setBusy(true); try { await removeMembership(user.id, provider, membership); await load(); } finally { setBusy(false); setConfirm(null); } }

  const openPerk = (p) => open(p, { mode: "profile", scope: unlockedPerks, tierMap });

  return (
    <div className="min-h-screen bg-ink text-snow pb-16 overflow-x-hidden">
      <TopNav />
      <main className="max-w-content mx-auto px-4 pt-24 sm:pt-32">
        <h1 className="font-display font-extrabold text-4xl sm:text-5xl leading-[0.95] tracking-tight mb-6">Your Perki.</h1>
        {status === "loading" && <Skeleton />}
        {status === "error" && (
          <GlassCard className="text-center max-w-sm mx-auto mt-10">
            <AlertCircle className="w-8 h-8 text-gold mx-auto mb-3" />
            <p className="text-snow/90 mb-5">{errCode === "NOT_SIGNED_IN" ? "You need to be signed in to view your profile." : errCode === "NOT_CONFIGURED" ? "Supabase isn't connected in this environment." : "Something went wrong loading your profile."}</p>
            {errCode === "NOT_SIGNED_IN" && <Link to="/login" className="inline-flex items-center gap-2 bg-purple text-white font-semibold px-6 py-3 rounded-full min-h-[44px] cursor-pointer hover:opacity-90"><LogIn className="w-5 h-5" />Sign in</Link>}
          </GlassCard>
        )}

        {status === "ready" && profile && (
          <>
            {/* Identity */}
            <header className="flex items-center gap-3 mb-5">
              {profile.avatar_url ? <img src={profile.avatar_url} alt="" className="w-12 h-12 rounded-full object-cover" /> : <span className="grid place-items-center w-12 h-12 rounded-full bg-purple/20 text-snow font-bold">{(profile.full_name || "?").slice(0, 1).toUpperCase()}</span>}
              <div className="min-w-0">
                <h2 className="font-display font-bold text-lg leading-tight truncate">{profile.full_name}</h2>
                <p className="text-muted text-xs truncate flex items-center gap-1"><CalendarDays className="w-3.5 h-3.5 shrink-0" />{profile.email || "No email on file"} · since {fmtDate(profile.created_at)}</p>
              </div>
            </header>

            {/* Verdict */}
            <VerdictCard
              eyebrow={`Your dashboard · ${new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}`}
              headline={`${totalAvailableNF - totalActiveNF} perks ready to use${savingsTotal > 0 ? `, and £${savingsTotal} a month on the table.` : "."}`}
              tiles={[
                { value: totalAvailableNF - totalActiveNF, label: "Available" },
                { value: totalActiveNF, label: "Have used" },
                { value: `£${monthlyCost.toLocaleString()}`, label: "Monthly cost" },
                { value: memberships.length ? new Set(memberships.map((m) => m.provider)).size : 0, label: "Memberships" },
              ]}
            />

            {/* Worth a tap today */}
            {worthATap.length > 0 && (
              <section className="mt-10">
                <SectionHead title="Worth a tap today" count={worthATap.length} sub="Resetting soonest and easiest to actually use. Tap one to mark it done." />
                <Shelf className="sm:grid sm:grid-cols-3 lg:grid-cols-6 sm:overflow-visible sm:mx-0 sm:px-0">
                  {worthATap.map((p, i) => <PerkTile key={p.perk_id} perk={p} seed={i} onClick={() => openPerk(p)} className="sm:w-auto" />)}
                </Shelf>
              </section>
            )}

            {/* Memberships */}
            <section className="mt-10">
              <SectionHead title="Your memberships" count={activeList.length} sub="The engine badge shows whether each one is right-sized for how you actually use it."
                action={<Pill as="button" onClick={() => navigate("/onboarding")} className="!min-h-[42px] !px-4 text-sm"><Plus className="w-4 h-4" />Add membership</Pill>} />
              {activeList.length === 0 ? (
                <GlassCard className="!py-8 text-center">
                  <p className="text-sm text-muted mb-4">No memberships yet — add what you already pay for and the perks appear.</p>
                  <Pill as="button" onClick={() => navigate("/onboarding")}><Plus className="w-4 h-4" />Set up my memberships</Pill>
                </GlassCard>
              ) : (
                <div className="space-y-2">{activeList.map((c) => (
                  <MembershipRow key={`${c.provider}|${c.membership}`} membership={c} tiers={c.tiers} currentTier={activeMap[`${c.provider}|${c.membership}`]}
                    onTierChange={(t) => setConfirm({ type: "change", provider: c.provider, membership: c.membership, tier: t, title: "Change tier", message: `Switch ${c.provider} to the ${t} tier?`, label: "Change tier" })}
                    action={<div className="flex items-center gap-2">
                      {(() => { const b = engineBadges[`${c.provider}|${c.membership}`]; return <span className={`hidden sm:inline-block text-[11px] font-bold rounded-full px-2.5 py-1 whitespace-nowrap ${b ? "bg-purple text-white" : "bg-goldlight text-golddeep"}`}>{b ? `Save £${b.saving}/mo` : "Right-sized"}</span>; })()}
                      <button aria-label="Remove" onClick={() => setConfirm({ type: "remove", provider: c.provider, membership: c.membership, title: "Remove membership", message: `Remove ${c.provider} (${c.membership})?`, label: "Remove" })} className="grid place-items-center w-10 h-10 rounded-full text-red-400 hover:bg-red-400/10 cursor-pointer focus:outline-none focus:ring-[3px] focus:ring-red-400/30"><Trash2 className="w-5 h-5" /></button>
                    </div>} />
                ))}</div>
              )}
            </section>

            {/* Upgrades on the shelf */}
            {potentialList.length > 0 && (
              <section className="mt-10">
                <SectionHead title="Upgrades on the shelf" count={potentialList.length} sub="Higher tiers you could step up to. Perki never switches anything for you." />
                <div className="space-y-2">{potentialList.map((c) => (
                  <PotentialRow key={`${c.provider}|${c.membership}`} c={c}
                    onSelect={(t) => setConfirm({ type: "change", provider: c.provider, membership: c.membership, tier: t, title: "Change tier", message: `Move ${c.provider} up to the ${t} tier?`, label: "Move up" })} />
                ))}</div>
              </section>
            )}

            {/* Perk browser */}
            <section className="mt-10">
              <SectionHead title="Every perk you hold" count={browserBase.length} sub="Search, filter by type, and tick things off as you use them." />
              <div className="mb-3"><SearchBar value={query} onChange={setQuery} placeholder="Search perks, features, memberships, tiers…" /></div>
              <div className="swipe flex gap-2 overflow-x-auto pb-3 -mx-4 px-4">
                {TYPE_CHIPS.map((t) => <Chip key={t.label} active={typeFilter === t.key} onClick={() => setTypeFilter(t.key)}>{t.label}</Chip>)}
              </div>
              <div className="grid md:grid-cols-2 gap-x-8 gap-y-6 mt-2">
                <div>
                  <Eyebrow className="mb-3">Still to use · {stillToUse.length}</Eyebrow>
                  <PerkList perks={stillToUse} mode="profile" scope={unlockedPerks} tierMap={tierMap} emptyLabel="Nothing left — you're on top of it." />
                </div>
                <div>
                  <Eyebrow className="mb-3 !text-muted">Already used · {alreadyUsed.length}</Eyebrow>
                  <PerkList perks={alreadyUsed} mode="profile" scope={unlockedPerks} tierMap={tierMap} emptyLabel="Nothing ticked off yet. Start above." />
                </div>
              </div>
            </section>
          </>
        )}
      </main>

      <ConfirmModal open={!!confirm} onClose={() => setConfirm(null)} title={confirm?.title || ""} message={confirm?.message || ""} confirmLabel={confirm?.label || "Confirm"} busy={busy}
        onConfirm={() => confirm?.type === "remove" ? applyRemove(confirm.provider, confirm.membership) : applyChange(confirm.provider, confirm.membership, confirm.tier)} />
      <Footer />
    </div>
  );
}

function PotentialRow({ c, onSelect }) {
  const [tier, setTier] = React.useState(c.upgradeTiers[0]?.tier || "");
  return (
    <MembershipRow membership={c} tiers={c.upgradeTiers} currentTier={tier} onTierChange={setTier}
      action={<button onClick={() => onSelect(tier)} className="inline-flex items-center gap-1.5 bg-purple text-white text-sm font-semibold px-4 min-h-[40px] rounded-full cursor-pointer hover:opacity-90 focus:outline-none focus:ring-[3px] focus:ring-purple/40"><Plus className="w-4 h-4" />Move up</button>} />
  );
}
