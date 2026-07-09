import React from "react";
import { Link } from "react-router-dom";
import { AlertCircle, CalendarDays, CreditCard, CheckCircle2, ThumbsUp, LogIn, Trash2, Plus, LayoutGrid, Sparkles, ChevronDown, X, ArrowLeft } from "lucide-react";
import { GlassCard, TopNav } from "../ui/components";
import { BrandLogo } from "../ui/brand";
import { PerkList, MembershipRow, ConfirmModal, SearchBar } from "../ui/perkui";
import { supabase } from "../lib/supabase";
import { VerdictCard, cheapestCoveringTier } from "../ui/kit";
import {
  fetchAllPerks, buildTierMap, buildMembershipCatalog, fetchUserMemberships,
  addMembership, removeMembership, monthlyCostOf,
} from "../data/catalog";

const fmtDate = (iso) => { try { return new Date(iso).toLocaleDateString("en-GB", { month: "long", year: "numeric" }); } catch { return "—"; } };

function Skeleton() {
  return (<div className="animate-pulse">
    <div className="flex items-center gap-4 mb-8"><div className="w-16 h-16 rounded-full bg-snow/10" /><div className="flex-1 space-y-2"><div className="h-5 w-40 bg-snow/10 rounded" /><div className="h-4 w-52 bg-snow/10 rounded" /></div></div>
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-8">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-24 bg-snow/10 rounded-card" />)}</div>
  </div>);
}
function Stat({ Icon, label, value, accent = "text-gold" }) {
  return <GlassCard className="!p-4 text-center"><Icon className={`w-5 h-5 mx-auto mb-1.5 ${accent}`} /><div className="text-2xl font-bold tabular-nums">{value}</div><div className="text-[11px] leading-tight text-muted mt-0.5">{label}</div></GlassCard>;
}

export default function Profile() {
  const [status, setStatus] = React.useState("loading");
  const [errCode, setErrCode] = React.useState("");
  const [user, setUser] = React.useState(null);
  const [profile, setProfile] = React.useState(null);
  const [perks, setPerks] = React.useState([]);
  const [memberships, setMemberships] = React.useState([]);
  const [stateRows, setStateRows] = React.useState([]);
  const [query, setQuery] = React.useState("");
  const [confirm, setConfirm] = React.useState(null);
  const [busy, setBusy] = React.useState(false);
  const [addOpen, setAddOpen] = React.useState(false);

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
  const heldKeys = React.useMemo(() => new Set(memberships.map((m) => `${m.provider}|${m.membership}`)), [memberships]);

  const monthlyCost = monthlyCostOf(memberships, tierMap);

  // Highest selected tier per membership = exact provider|tier in user_memberships
  const activeSet = React.useMemo(() => new Set(memberships.map((m) => `${m.provider}|${m.tier}`)), [memberships]);
  const unlockedPerks = React.useMemo(() => perks.filter((p) => activeSet.has(`${p.provider}|${p.tier}`)), [perks, activeSet]);
  const dedupeByTitle = (list) => { const m = {}; list.forEach((p) => { const k = `${p.provider}|${(p.title || "").toLowerCase()}`; if (!m[k]) m[k] = p; }); return Object.values(m); };
  const availablePerks = React.useMemo(() => dedupeByTitle(unlockedPerks), [unlockedPerks]);

  const usedIds = React.useMemo(() => new Set(stateRows.filter((s) => s.used).map((s) => s.perk_id)), [stateRows]);
  // All types active when marked used (features now toggle like perks)
  const isActive = (p) => usedIds.has(p.perk_id);

  const q = query.trim().toLowerCase();
  const match = (p) => !q || [p.title, p.description, p.provider, p.tier].some((v) => (v || "").toLowerCase().includes(q));
  const ofType = (type, active) => availablePerks.filter((p) => (p.feature || "perk") === type && isActive(p) === active && match(p));

  // Dashboard counts
  const nonFeature = availablePerks.filter((p) => (p.feature || "perk") !== "feature");
  const totalAvailableNF = nonFeature.length;
  const totalActiveNF = nonFeature.filter((p) => usedIds.has(p.perk_id)).length;
  const activeFeaturesCount = availablePerks.filter((p) => p.feature === "feature" && usedIds.has(p.perk_id)).length;

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

  // Membership lists
  const memMatch = (c) => !q || [c.provider, c.membership, ...c.tiers.map((t) => t.tier)].some((v) => (v || "").toLowerCase().includes(q));
  const activeList = catalog.filter((c) => activeMap[`${c.provider}|${c.membership}`] != null && memMatch(c));
  const potentialList = catalog.map((c) => {
    const cur = activeMap[`${c.provider}|${c.membership}`];
    if (cur == null) return null;
    const curSort = tierMap[`${c.provider}|${cur}`]?.sort_order ?? 0;
    const higher = c.tiers.filter((t) => t.sort_order > curSort);
    return higher.length ? { ...c, upgradeTiers: higher } : null;
  }).filter((c) => c && memMatch(c));

  async function applyChange(provider, membership, tier) { setBusy(true); try { await addMembership(user.id, provider, membership, tier); await load(); } finally { setBusy(false); setConfirm(null); } }
  async function applyRemove(provider, membership) { setBusy(true); try { await removeMembership(user.id, provider, membership); await load(); } finally { setBusy(false); setConfirm(null); } }
  async function addNew(provider, membership, tier) { setBusy(true); try { await addMembership(user.id, provider, membership, tier); await load(); setAddOpen(false); } finally { setBusy(false); } }

  const Sub = ({ title, type, active }) => {
    const list = ofType(type, active);
    const [open, setOpen] = React.useState(false);
    const isOpen = q ? true : open;
    return (
      <div className={`rounded-card border-2 ${active ? "border-gold/40 bg-gold/[0.04]" : "border-snow/15 bg-snow/[0.02]"} p-3 sm:p-4 mb-3 shadow-md`}>
        <button
          onClick={() => setOpen((o) => !o)}
          aria-expanded={isOpen}
          className="w-full flex items-center gap-2 cursor-pointer min-h-[44px] focus:outline-none focus:ring-[3px] focus:ring-purple/40 rounded-btn">
          <ChevronDown className={`w-5 h-5 shrink-0 transition-transform duration-200 ${active ? "text-gold" : "text-muted"} ${isOpen ? "" : "-rotate-90"}`} />
          <h4 className="font-semibold">{title}</h4>
          <span className={`rounded-full text-xs px-2 py-0.5 ${active ? "bg-gold/20 text-golddeep" : "bg-snow/10 text-muted"}`}>{list.length}</span>
        </button>
        {isOpen && <div className="mt-3"><PerkList perks={list} mode="profile" scope={unlockedPerks} tierMap={tierMap} emptyLabel="None." /></div>}
      </div>
    );
  };

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
            {errCode === "NOT_SIGNED_IN" && <Link to="/login" className="inline-flex items-center gap-2 bg-purple text-white font-semibold px-6 py-3 rounded-btn min-h-[44px] cursor-pointer hover:opacity-90"><LogIn className="w-5 h-5" />Sign in</Link>}
          </GlassCard>
        )}

        {status === "ready" && profile && (
          <>
            <header className="flex items-center gap-3 mb-5">
              {profile.avatar_url ? <img src={profile.avatar_url} alt="" className="w-12 h-12 rounded-full object-cover" /> : <span className="grid place-items-center w-12 h-12 rounded-full bg-purple/20 text-snow font-bold">{(profile.full_name || "?").slice(0, 1).toUpperCase()}</span>}
              <div className="min-w-0">
                <h2 className="font-display font-bold text-lg leading-tight truncate">{profile.full_name}</h2>
                <p className="text-muted text-xs truncate flex items-center gap-1"><CalendarDays className="w-3.5 h-3.5 shrink-0" />{profile.email || "No email on file"} · since {fmtDate(profile.created_at)}</p>
              </div>
            </header>

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

            {/* Active memberships */}
            <section className="mt-8">
              <div className="flex items-center justify-between mb-3 gap-3">
                <h2 className="text-xl font-semibold">Active memberships</h2>
                <button onClick={() => setAddOpen(true)} className="inline-flex items-center gap-1.5 bg-purple text-white text-sm font-semibold px-3 min-h-[40px] rounded-btn cursor-pointer hover:opacity-90 focus:outline-none focus:ring-[3px] focus:ring-purple/40 shrink-0"><Plus className="w-4 h-4" />Add Membership</button>
              </div>
              {activeList.length === 0 ? <GlassCard className="!py-5 text-center text-sm text-muted">No active memberships yet.</GlassCard> : (
                <div className="space-y-2">{activeList.map((c) => (
                  <MembershipRow key={`${c.provider}|${c.membership}`} membership={c} tiers={c.tiers} currentTier={activeMap[`${c.provider}|${c.membership}`]}
                    onTierChange={(t) => setConfirm({ type: "change", provider: c.provider, membership: c.membership, tier: t, title: "Change tier", message: `Switch ${c.provider} to the ${t} tier?`, label: "Change tier" })}
                    action={<div className="flex items-center gap-2">{(() => { const b = engineBadges[`${c.provider}|${c.membership}`]; return <span className={`hidden sm:inline-block text-[11px] font-bold rounded-full px-2.5 py-1 whitespace-nowrap ${b ? "bg-purple text-white" : "bg-goldlight text-golddeep"}`}>{b ? `Save £${b.saving}/mo` : "Right-sized"}</span>; })()}<button aria-label="Remove" onClick={() => setConfirm({ type: "remove", provider: c.provider, membership: c.membership, title: "Remove membership", message: `Remove ${c.provider} (${c.membership})?`, label: "Remove" })} className="grid place-items-center w-10 h-10 rounded-btn text-red-400 hover:bg-red-400/10 cursor-pointer focus:outline-none focus:ring-[3px] focus:ring-red-400/30"><Trash2 className="w-5 h-5" /></button></div>} />
                ))}</div>
              )}
            </section>

            {/* Potential memberships */}
            <section className="mt-8">
              <h2 className="text-xl font-semibold mb-3">Unused Tiers</h2>
              {potentialList.length === 0 ? <GlassCard className="!py-5 text-center text-sm text-muted">You've added everything available.</GlassCard> : (
                <div className="space-y-2">{potentialList.map((c) => (
                  <PotentialRow key={`${c.provider}|${c.membership}`} c={c}
                    onSelect={(t) => setConfirm({ type: "change", provider: c.provider, membership: c.membership, tier: t, title: "Add membership", message: `Add ${c.provider} on the ${t} tier?`, label: "Select" })} />
                ))}</div>
              )}
            </section>

            {/* Search */}
            <div className="mt-8"><SearchBar value={query} onChange={setQuery} placeholder="Search perks, features, memberships, tiers…" /></div>

            {/* Active vs Inactive split */}
            <div className="mt-8 grid md:grid-cols-2 gap-x-8 gap-y-2">
              <div>
                <h2 className="text-xl font-semibold mb-4 text-gold">Active</h2>
                <Sub title="Active Features" type="feature" active={true} />
                <Sub title="Active Perks" type="perk" active={true} />
                <Sub title="Used Discounts" type="discount" active={true} />
                <Sub title="Entered Competitions" type="competition" active={true} />
              </div>
              <div>
                <h2 className="text-xl font-semibold mb-4 text-muted">Inactive</h2>
                <Sub title="Inactive Features" type="feature" active={false} />
                <Sub title="Inactive Perks" type="perk" active={false} />
                <Sub title="Unused Discounts" type="discount" active={false} />
                <Sub title="Unentered Competitions" type="competition" active={false} />
              </div>
            </div>
          </>
        )}
      </main>

      <AddMembershipModal open={addOpen} onClose={() => setAddOpen(false)} catalog={catalog} heldKeys={heldKeys} onAdd={addNew} busy={busy} />

      <ConfirmModal open={!!confirm} onClose={() => setConfirm(null)} title={confirm?.title || ""} message={confirm?.message || ""} confirmLabel={confirm?.label || "Confirm"} busy={busy}
        onConfirm={() => confirm?.type === "remove" ? applyRemove(confirm.provider, confirm.membership) : applyChange(confirm.provider, confirm.membership, confirm.tier)} />
    </div>
  );
}

function PotentialRow({ c, onSelect }) {
  const [tier, setTier] = React.useState(c.upgradeTiers[0]?.tier || "");
  return (
    <MembershipRow membership={c} tiers={c.upgradeTiers} currentTier={tier} onTierChange={setTier}
      action={<button onClick={() => onSelect(tier)} className="inline-flex items-center gap-1.5 bg-purple text-white text-sm font-semibold px-3 min-h-[40px] rounded-btn cursor-pointer hover:opacity-90 focus:outline-none focus:ring-[3px] focus:ring-purple/40"><Plus className="w-4 h-4" />Select</button>} />
  );
}

function AddMembershipModal({ open, onClose, catalog, heldKeys, onAdd, busy }) {
  const [step, setStep] = React.useState(1);
  const [q, setQ] = React.useState("");
  const [sel, setSel] = React.useState(null);
  React.useEffect(() => { if (open) { setStep(1); setQ(""); setSel(null); } }, [open]);
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  const ql = q.trim().toLowerCase();
  const list = [...catalog]
    .sort((a, b) => (a.provider || "").localeCompare(b.provider) || (a.membership || "").localeCompare(b.membership))
    .filter((c) => !ql || `${c.provider} ${c.membership}`.toLowerCase().includes(ql));
  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4" role="dialog" aria-modal="true" aria-label="Add membership">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="glass relative w-full max-w-md rounded-modal p-5 shadow-xl max-h-[85vh] flex flex-col">
        {step === 1 ? (
          <>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xl font-semibold">Add membership</h2>
              <button aria-label="Close" onClick={onClose} className="grid place-items-center w-9 h-9 rounded-btn text-muted hover:text-snow cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <SearchBar value={q} onChange={setQ} placeholder="Search memberships…" />
            <ul className="mt-3 space-y-1.5 overflow-y-auto">
              {list.length === 0 ? (
                <li className="text-sm text-muted text-center py-6">No memberships match.</li>
              ) : list.map((c) => {
                const held = heldKeys.has(`${c.provider}|${c.membership}`);
                return (
                  <li key={`${c.provider}|${c.membership}`}>
                    <button onClick={() => { setSel(c); setStep(2); }} className="w-full glass rounded-btn flex items-center gap-3 px-3 py-2.5 min-h-[48px] hover:bg-snow/[0.04] cursor-pointer text-left">
                      <BrandLogo provider={c.provider} className="w-7 h-7" />
                      <span className="flex-1 min-w-0">
                        <span className="font-medium truncate block">{c.membership}</span>
                        {c.membership !== c.provider && <span className="text-xs text-muted truncate block">{c.provider}</span>}
                      </span>
                      {held && <span className="text-[10px] font-semibold text-golddeep bg-gold/15 rounded-full px-2 py-0.5 shrink-0">Added</span>}
                    </button>
                  </li>
                );
              })}
            </ul>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-3">
              <button aria-label="Back" onClick={() => setStep(1)} className="grid place-items-center w-9 h-9 rounded-btn text-muted hover:text-snow cursor-pointer"><ArrowLeft className="w-5 h-5" /></button>
              <div className="min-w-0">
                <h2 className="text-lg font-semibold truncate">{sel.membership}</h2>
                <p className="text-xs text-muted">Choose a tier</p>
              </div>
            </div>
            <ul className="space-y-1.5 overflow-y-auto">
              {sel.tiers.map((t) => (
                <li key={t.tier}>
                  <button disabled={busy} onClick={() => onAdd(sel.provider, sel.membership, t.tier)} className="w-full glass rounded-btn flex items-center justify-between px-4 py-3 min-h-[48px] hover:bg-snow/[0.04] cursor-pointer disabled:opacity-60">
                    <span className="font-medium">{t.tier}</span>
                    <span className="text-sm text-golddeep">{t.price_label}</span>
                  </button>
                </li>
              ))}
              <li>
                <button disabled={busy} onClick={() => onAdd(sel.provider, sel.membership, "")} className="w-full rounded-btn flex items-center justify-between px-4 py-3 min-h-[48px] border-2 border-snow/15 hover:bg-snow/5 cursor-pointer disabled:opacity-60">
                  <span className="font-medium text-snow/90">No tier</span>
                  <span className="text-xs text-muted">Add without a tier</span>
                </button>
              </li>
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
