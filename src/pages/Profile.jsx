import React from "react";
import { Link } from "react-router-dom";
import { AlertCircle, CalendarDays, LogIn, Trash2, Plus } from "lucide-react";
import { GlassCard, TopNav, Footer } from "../ui/components";
import { MembershipRow, ConfirmModal, SearchBar, PerkList, Modal, RequestMembershipModal } from "../ui/perkui";
import { BrandLogo } from "../ui/brand";
import { usePerkDrawer } from "../ui/PerkDrawer";
import { VerdictCard, cheapestCoveringTier, SectionHead, Pill, Shelf, PerkTile } from "../ui/kit";
import { supabase } from "../lib/supabase";
import {
  fetchAllPerks, buildTierMap, buildMembershipCatalog, fetchUserMemberships,
  addMembership, removeMembership, monthlyCostOf, requestMembership,
} from "../data/catalog";

const fmtDate = (iso) => { try { return new Date(iso).toLocaleDateString("en-GB", { month: "long", year: "numeric" }); } catch { return "—"; } };

const PRIORITY_CATS = new Set(["Entertainment", "Lifestyle", "Food", "Wellness", "Fitness", "Streaming", "Shopping"]);

function Skeleton() {
  return (<div className="animate-pulse">
    <div className="h-10 w-56 bg-snow/10 rounded mb-6" />
    <div className="h-44 bg-snow/10 rounded-modal mb-8" />
    <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-16 bg-snow/10 rounded-modal" />)}</div>
  </div>);
}

export default function Profile() {
  const { open } = usePerkDrawer();
  const [status, setStatus] = React.useState("loading");
  const [errCode, setErrCode] = React.useState("");
  const [user, setUser] = React.useState(null);
  const [profile, setProfile] = React.useState(null);
  const [perks, setPerks] = React.useState([]);
  const [memberships, setMemberships] = React.useState([]);
  const [stateRows, setStateRows] = React.useState([]);
  const [query, setQuery] = React.useState("");
  const [addOpen, setAddOpen] = React.useState(false);
  const [reqOpen, setReqOpen] = React.useState(false);
  const [reqBusy, setReqBusy] = React.useState(false);
  const [reqDone, setReqDone] = React.useState(false);
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

  // Deep link from the daily email: /app/account#perks scrolls to the tracker
  React.useEffect(() => {
    if (status === "ready" && window.location.hash === "#perks") {
      setTimeout(() => document.getElementById("perks")?.scrollIntoView({ behavior: "smooth" }), 300);
    }
  }, [status]);

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

  // Perk browser lists — Active/Inactive per type
  const q = query.trim().toLowerCase();
  const match = (p) => !q || [p.title, p.description, p.provider, p.tier, p.category].some((v) => (v || "").toString().toLowerCase().includes(q));
  const ofType = (type, active) => availablePerks.filter((p) => (p.feature || "perk") === type && usedIds.has(p.perk_id) === active && match(p)).sort((a, b) => (a.title || "").localeCompare(b.title || ""));
  const heldKeys = React.useMemo(() => new Set(memberships.map((m) => `${m.provider}|${m.membership}`)), [memberships]);

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
  async function addNew(provider, membership, tier) { setBusy(true); try { await addMembership(user.id, provider, membership, tier); await load(); setAddOpen(false); } finally { setBusy(false); } }
  async function submitRequest({ name, description }) {
    setReqBusy(true);
    try { await requestMembership({ userId: user?.id, name: name || profile?.full_name, description: `[Profile] ${description}` }); setReqDone(true); }
    catch { setReqDone(true); } finally { setReqBusy(false); }
  }

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
                { value: `£${Math.ceil(monthlyCost).toLocaleString()}`, label: "Monthly cost" },
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

            {/* Every perk you hold — Active / Inactive per type */}
            <section id="perks" className="mt-10 scroll-mt-28">
              <SectionHead title="Every perk you hold" sub="Gold means you're using it. Grey means it's waiting." />
              <div className="mb-4"><SearchBar value={query} onChange={setQuery} placeholder="Search perks, features, memberships, tiers…" /></div>
              <div className="grid md:grid-cols-2 gap-x-8 gap-y-2">
                <div>
                  <h2 className="font-display font-extrabold text-xl mb-4 text-golddeep">Active</h2>
                  <TypeBank title="Active Features" list={ofType("feature", true)} active scope={unlockedPerks} tierMap={tierMap} forceOpen={!!q} />
                  <TypeBank title="Active Perks" list={ofType("perk", true)} active scope={unlockedPerks} tierMap={tierMap} forceOpen={!!q} />
                  <TypeBank title="Used Discounts" list={ofType("discount", true)} active scope={unlockedPerks} tierMap={tierMap} forceOpen={!!q} />
                  <TypeBank title="Entered Competitions" list={ofType("competition", true)} active scope={unlockedPerks} tierMap={tierMap} forceOpen={!!q} />
                </div>
                <div>
                  <h2 className="font-display font-extrabold text-xl mb-4 text-muted">Inactive</h2>
                  <TypeBank title="Inactive Features" list={ofType("feature", false)} scope={unlockedPerks} tierMap={tierMap} forceOpen={!!q} />
                  <TypeBank title="Inactive Perks" list={ofType("perk", false)} scope={unlockedPerks} tierMap={tierMap} forceOpen={!!q} />
                  <TypeBank title="Unused Discounts" list={ofType("discount", false)} scope={unlockedPerks} tierMap={tierMap} forceOpen={!!q} />
                  <TypeBank title="Unentered Competitions" list={ofType("competition", false)} scope={unlockedPerks} tierMap={tierMap} forceOpen={!!q} />
                </div>
              </div>
            </section>

            {/* Memberships */}
            <section className="mt-10">
              <SectionHead title="Your memberships" count={activeList.length} sub="The engine badge shows whether each one is right-sized for how you actually use it."
                action={<Pill as="button" onClick={() => setAddOpen(true)} className="!min-h-[42px] !px-4 text-sm"><Plus className="w-4 h-4" />Add membership</Pill>} />
              {activeList.length === 0 ? (
                <GlassCard className="!py-8 text-center">
                  <p className="text-sm text-muted mb-4">No memberships yet — add what you already pay for and the perks appear.</p>
                  <Pill as="button" onClick={() => setAddOpen(true)}><Plus className="w-4 h-4" />Add your first membership</Pill>
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

          </>
        )}
      </main>

      <AddMembershipModal open={addOpen} onClose={() => setAddOpen(false)} catalog={catalog} heldKeys={heldKeys} onAdd={addNew} busy={busy}
        onRequest={() => { setReqDone(false); setReqOpen(true); }} />
      <RequestMembershipModal open={reqOpen} onClose={() => setReqOpen(false)} onSubmit={submitRequest} busy={reqBusy} done={reqDone} />
      <ConfirmModal open={!!confirm} onClose={() => setConfirm(null)} title={confirm?.title || ""} message={confirm?.message || ""} confirmLabel={confirm?.label || "Confirm"} busy={busy}
        onConfirm={() => confirm?.type === "remove" ? applyRemove(confirm.provider, confirm.membership) : applyChange(confirm.provider, confirm.membership, confirm.tier)} />
      <Footer />
    </div>
  );
}

function TypeBank({ title, list, active = false, scope, tierMap, forceOpen = false }) {
  const [open, setOpen] = React.useState(false);
  const isOpen = forceOpen ? true : open;
  return (
    <div className={`rounded-modal border-2 ${active ? "border-gold/40 bg-gold/[0.05]" : "border-snow/15 bg-snow/[0.02]"} p-3 sm:p-4 mb-3`}>
      <button onClick={() => setOpen((o) => !o)} aria-expanded={isOpen}
        className="w-full flex items-center gap-2 cursor-pointer min-h-[44px] focus:outline-none focus:ring-[3px] focus:ring-purple/40 rounded-full">
        <span className={`text-sm transition-transform duration-200 inline-block ${active ? "text-golddeep" : "text-muted"} ${isOpen ? "" : "-rotate-90"}`}>▾</span>
        <h4 className="font-display font-bold text-[15px]">{title}</h4>
        <span className={`rounded-full text-xs font-bold px-2 py-0.5 ${active ? "bg-goldlight text-golddeep" : "bg-snow/10 text-muted"}`}>{list.length}</span>
      </button>
      {isOpen && <div className="mt-3"><PerkList perks={list} mode="profile" scope={scope} tierMap={tierMap} emptyLabel="None." /></div>}
    </div>
  );
}

function AddMembershipModal({ open, onClose, catalog, heldKeys, onAdd, busy, onRequest }) {
  const [q, setQ] = React.useState("");
  const [selKey, setSelKey] = React.useState("");
  const [tier, setTier] = React.useState("");
  React.useEffect(() => { if (open) { setQ(""); setSelKey(""); setTier(""); } }, [open]);
  const ql = q.trim().toLowerCase();
  const list = catalog
    .filter((c) => !heldKeys.has(`${c.provider}|${c.membership}`))
    .filter((c) => !ql || `${c.provider} ${c.membership}`.toLowerCase().includes(ql))
    .sort((a, b) => (a.provider || "").localeCompare(b.provider));
  const sel = catalog.find((c) => `${c.provider}|${c.membership}` === selKey) || null;
  React.useEffect(() => { if (selKey && !list.some((c) => `${c.provider}|${c.membership}` === selKey)) setSelKey(""); }, [ql]); // eslint-disable-line
  const tiers = sel?.tiers || [];
  const chosenTier = tier || tiers[0]?.tier || "";
  return (
    <Modal open={open} onClose={onClose} title="Add membership"
      footer={<>
        <button onClick={onRequest} className="inline-flex items-center justify-center min-h-[44px] px-5 rounded-full border-[1.5px] border-snow/20 text-sm font-semibold cursor-pointer hover:border-snow/40">Request a membership</button>
        <button onClick={() => sel && onAdd(sel.provider, sel.membership, chosenTier)} disabled={!sel || busy}
          className="inline-flex items-center justify-center min-h-[44px] px-6 rounded-full bg-purple text-white text-sm font-semibold cursor-pointer hover:opacity-90 disabled:opacity-50">{busy ? "Adding…" : "Add"}</button>
      </>}>
      <div className="space-y-3">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search memberships…" autoFocus
          className="w-full min-h-[48px] px-5 rounded-full border-[1.5px] border-snow/15 bg-ink2 text-[15px] focus:outline-none focus:ring-[3px] focus:ring-purple/40" />
        <div className="relative">
          <select value={selKey} onChange={(e) => { setSelKey(e.target.value); setTier(""); }} size={Math.min(Math.max(list.length, 3), 7)}
            className="w-full rounded-modal border-[1.5px] border-snow/15 bg-ink2 text-[14px] p-2 focus:outline-none focus:ring-[3px] focus:ring-purple/40">
            {list.length === 0 && <option disabled value="">No memberships match — try Request below.</option>}
            {list.map((c) => { const key = `${c.provider}|${c.membership}`; return <option key={key} value={key} className="py-1.5">{c.provider} — {c.membership}</option>; })}
          </select>
        </div>
        {sel && (
          <div className="flex items-center gap-2.5">
            <BrandLogo provider={sel.provider} className="w-8 h-8" />
            <span className="text-sm font-semibold flex-1 truncate">{sel.provider}</span>
            {tiers.length > 1 ? (
              <select value={chosenTier} onChange={(e) => setTier(e.target.value)}
                className="min-h-[40px] rounded-full border-[1.5px] border-snow/15 bg-ink2 text-sm px-3 focus:outline-none max-w-[10rem]">
                {tiers.map((t) => <option key={t.tier} value={t.tier}>{t.tier}{t.price_label ? ` · ${t.price_label}` : ""}</option>)}
              </select>
            ) : <span className="text-xs text-muted">{tiers[0]?.tier || "No tier"}</span>}
          </div>
        )}
      </div>
    </Modal>
  );
}

function PotentialRow({ c, onSelect }) {
  const [tier, setTier] = React.useState(c.upgradeTiers[0]?.tier || "");
  return (
    <MembershipRow membership={c} tiers={c.upgradeTiers} currentTier={tier} onTierChange={setTier}
      action={<button onClick={() => onSelect(tier)} className="inline-flex items-center gap-1.5 bg-purple text-white text-sm font-semibold px-4 min-h-[40px] rounded-full cursor-pointer hover:opacity-90 focus:outline-none focus:ring-[3px] focus:ring-purple/40"><Plus className="w-4 h-4" />Move up</button>} />
  );
}
