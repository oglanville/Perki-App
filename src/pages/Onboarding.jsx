import React from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Check, X } from "lucide-react";
import { Brand } from "../ui/components";
import { BrandLogo } from "../ui/brand";
import { Display, Eyebrow, Pill, Chip } from "../ui/kit";
import { RequestMembershipModal } from "../ui/perkui";
import { fetchAllPerks, buildTierMap, buildMembershipCatalog, requestMembership } from "../data/catalog";
import { supabase } from "../lib/supabase";

/* Curated per-category options. `cat` links to a live catalogue provider (unlocks perks + tiers);
   the rest are captured as plain memberships so Perki still knows what you hold. */
const STEPS = [
  { key: "energy", label: "Gas & electric", icon: "⚡", question: "Who provides your gas and electric?",
    options: [{ name: "OVO Energy", cat: "OVO Energy" }, { name: "British Gas", cat: "British Gas" }, { name: "E.On Next", cat: "E.On Next" }, { name: "EDF", cat: "EDF" }, { name: "Octopus Energy", cat: "Octopus Energy" }, { name: "Scottish Power", cat: "Scottish Power" }, { name: "Utilita", cat: "Utilita" }, { name: "Utility Warehouse", cat: "Utility Warehouse" }] },
  { key: "mobile", label: "Mobile", icon: "📱", question: "Who provides your mobile?",
    options: [{ name: "O2", cat: "O2" }, { name: "Vodafone", cat: "Vodafone" }, { name: "EE", cat: "EE" }, { name: "Three", cat: "Three" }, { name: "giffgaff", cat: "giffgaff" }, { name: "Sky Mobile", cat: "Sky Mobile" }, { name: "Tesco Mobile", cat: "Tesco Mobile" }, { name: "Lebara", cat: "Lebara" }, { name: "SMARTY" }] },
  { key: "broadband", label: "Broadband", icon: "📡", question: "Who provides your broadband?",
    options: [{ name: "BT", cat: "BT" }, { name: "Sky Broadband", cat: "Sky Broadband" }, { name: "Virgin Media", cat: "Virgin Media" }, { name: "TalkTalk", cat: "TalkTalk" }, { name: "Plusnet", cat: "Plusnet" }, { name: "Vodafone Broadband", cat: "Vodafone Broadband" }, { name: "Hyperoptic", cat: "Hyperoptic" }, { name: "Community Fibre", cat: "Community Fibre" }] },
  { key: "tv", label: "TV & streaming", icon: "📺", question: "What TV subscriptions do you have?",
    options: [{ name: "Sky TV", cat: "Sky TV" }, { name: "Netflix", cat: "Netflix" }, { name: "Amazon Prime", cat: "Amazon" }, { name: "Disney+", cat: "Disney+" }, { name: "Apple TV+", cat: "Apple TV+" }, { name: "NOW", cat: "NOW" }, { name: "Paramount+", cat: "Paramount+" }, { name: "YouTube Premium", cat: "YouTube Premium" }, { name: "Virgin TV", cat: "Virgin Media" }] },
  { key: "music", label: "Music", icon: "🎧", question: "Who provides your music?",
    options: [{ name: "Spotify", cat: "Spotify" }, { name: "Apple Music", cat: "Apple Music" }, { name: "Amazon Music", cat: "Amazon Music" }, { name: "YouTube Music", cat: "YouTube Music" }, { name: "Tidal", cat: "Tidal" }, { name: "Deezer", cat: "Deezer" }] },
  { key: "credit", label: "Credit card", icon: "💳", question: "Who provides your credit card?",
    options: [{ name: "American Express", cat: "American Express" }, { name: "Barclaycard", cat: "Barclaycard" }, { name: "HSBC", cat: "HSBC" }, { name: "NatWest", cat: "NatWest" }, { name: "Capital One" }, { name: "M&S Bank", cat: "M&S Bank" }, { name: "John Lewis Money", cat: "John Lewis Money" }, { name: "Virgin Money", cat: "Virgin Money" }] },
];

const selectCls = "w-full min-h-[48px] px-5 rounded-full border-[1.5px] border-snow/15 bg-white text-[15px] font-medium appearance-none cursor-pointer focus:outline-none focus:ring-[3px] focus:ring-purple/40";

export default function Onboarding() {
  const navigate = useNavigate();
  const [user, setUser] = React.useState(null);
  const [perks, setPerks] = React.useState([]);
  const [tab, setTab] = React.useState(STEPS[0].key);
  const [choice, setChoice] = React.useState("");
  const [tierChoice, setTierChoice] = React.useState("");
  const [added, setAdded] = React.useState([]);          // { stepKey, provider, tier, hasPerks }
  const [busy, setBusy] = React.useState(false);
  const [reqOpen, setReqOpen] = React.useState(false);
  const [reqBusy, setReqBusy] = React.useState(false);
  const [reqDone, setReqDone] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      if (!supabase) { navigate("/signup"); return; }
      const { data } = await supabase.auth.getUser();
      if (!data?.user) { navigate("/signup"); return; }
      setUser(data.user);
      try { setPerks(await fetchAllPerks()); } catch { /* plain capture still works */ }
      const { data: existing } = await supabase.from("user_memberships").select("provider,membership,tier").eq("user_id", data.user.id);
      if (existing?.length) setAdded(existing.map((m) => ({ stepKey: null, provider: m.provider, tier: m.tier, hasPerks: true })));
    })();
  }, [navigate]);

  const tierMap = React.useMemo(() => buildTierMap(perks), [perks]);
  const catalog = React.useMemo(() => buildMembershipCatalog(perks, tierMap), [perks, tierMap]);
  const step = STEPS.find((s) => s.key === tab);
  const option = step.options.find((o) => o.name === choice) || null;
  const catEntry = option?.cat ? catalog.find((c) => c.provider === option.cat) : null;
  const tiers = catEntry?.tiers?.length > 1 ? catEntry.tiers : null;

  const countFor = (key) => added.filter((a) => a.stepKey === key).length;
  const alreadyIn = (provider, tier) => added.some((a) => a.provider === provider && a.tier === tier);

  async function handleAdd() {
    if (!option || !user) return;
    const provider = catEntry ? catEntry.provider : option.name;
    const membership = catEntry ? catEntry.membership : option.name;
    const tier = catEntry ? (tierChoice || tiers?.[0]?.tier || catEntry.tiers?.[0]?.tier || "") : "";
    if (alreadyIn(provider, tier)) { setChoice(""); setTierChoice(""); return; }
    setBusy(true);
    try {
      await supabase.from("user_memberships").upsert({ user_id: user.id, provider, membership, tier }, { onConflict: "user_id,provider,tier" });
      setAdded((prev) => [...prev, { stepKey: step.key, provider, tier, hasPerks: !!catEntry }]);
      setChoice(""); setTierChoice("");
    } finally { setBusy(false); }
  }

  async function handleRemove(entry) {
    if (!user) return;
    await supabase.from("user_memberships").delete().eq("user_id", user.id).eq("provider", entry.provider).eq("tier", entry.tier);
    setAdded((prev) => prev.filter((a) => !(a.provider === entry.provider && a.tier === entry.tier)));
  }

  async function submitRequest({ name, description }) {
    setReqBusy(true);
    try { await requestMembership({ userId: user?.id, name: name || user?.user_metadata?.full_name, description: `[Onboarding · ${step.label}] ${description}` }); setReqDone(true); }
    catch { setReqDone(true); } finally { setReqBusy(false); }
  }

  function onSelect(v) {
    if (v === "__request") { setReqDone(false); setReqOpen(true); return; }
    setChoice(v); setTierChoice("");
  }

  return (
    <div className="min-h-screen bg-ink text-snow">
      <div className="max-w-xl mx-auto px-4 py-8 pb-32">
        <div className="flex items-center justify-between mb-8">
          <Brand />
          <button onClick={() => navigate("/app/account")} className="text-sm font-semibold text-muted hover:text-snow cursor-pointer">Skip for now</button>
        </div>

        <Eyebrow>Set up · takes about a minute</Eyebrow>
        <Display size="md" className="mt-2">What are you already paying for?</Display>
        <p className="text-muted text-sm mt-3 leading-relaxed">Pick your providers and we'll surface every perk hiding inside them. Add as many as you like per category.</p>

        {/* Category tabs */}
        <div className="swipe flex gap-2 overflow-x-auto py-5 -mx-4 px-4">
          {STEPS.map((s) => (
            <Chip key={s.key} active={tab === s.key} count={countFor(s.key) || null} onClick={() => { setTab(s.key); setChoice(""); setTierChoice(""); }}>
              <span aria-hidden="true">{s.icon}</span>{s.label}
            </Chip>
          ))}
        </div>

        {/* Current category */}
        <div className="bg-ink2 border border-snow/10 rounded-modal p-5 sm:p-6">
          <h2 className="font-display font-extrabold text-lg mb-4">{step.question}</h2>
          <div className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <select value={choice} onChange={(e) => onSelect(e.target.value)} className={selectCls} aria-label={step.question}>
                <option value="">Choose a provider…</option>
                {step.options.map((o) => <option key={o.name} value={o.name}>{o.name}{o.cat ? " ✨" : ""}</option>)}
                <option value="__request">➕ Request another…</option>
              </select>
              <span className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 text-muted text-xs">▾</span>
            </div>
            {tiers && (
              <div className="relative flex-1">
                <select value={tierChoice} onChange={(e) => setTierChoice(e.target.value)} className={selectCls} aria-label="Which tier?">
                  {tiers.map((t) => <option key={t.tier} value={t.tier}>{t.tier}{t.price_label ? ` · ${t.price_label}` : ""}</option>)}
                </select>
                <span className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 text-muted text-xs">▾</span>
              </div>
            )}
            <Pill as="button" onClick={handleAdd} disabled={!option || busy} className="shrink-0 disabled:opacity-50">
              <Plus className="w-4 h-4" />Add
            </Pill>
          </div>
          {option?.cat && <p className="text-golddeep text-xs font-semibold mt-3">✨ In the Perki catalogue — its perks unlock the moment you add it.</p>}
        </div>

        {/* Everything added so far */}
        {added.length > 0 && (
          <div className="mt-6">
            <Eyebrow>Your memberships so far</Eyebrow>
            <div className="flex flex-wrap gap-2 mt-3">
              {added.map((a) => (
                <span key={`${a.provider}|${a.tier}`} className="inline-flex items-center gap-2 rounded-full bg-ink2 border border-snow/15 pl-1.5 pr-2.5 py-1.5 text-[13px] font-semibold">
                  <BrandLogo provider={a.provider} className="w-6 h-6" />
                  {a.provider}{a.tier ? <span className="text-muted font-medium">· {a.tier}</span> : null}
                  {a.hasPerks && <Check className="w-3.5 h-3.5 text-golddeep" />}
                  <button aria-label={`Remove ${a.provider}`} onClick={() => handleRemove(a)} className="grid place-items-center w-5 h-5 rounded-full text-muted hover:text-snow hover:bg-snow/10 cursor-pointer"><X className="w-3.5 h-3.5" /></button>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Sticky finish bar */}
        <div className="fixed inset-x-0 bottom-0 bg-gradient-to-t from-ink via-ink/95 to-transparent pt-8 pb-5">
          <div className="max-w-xl mx-auto px-4 flex items-center gap-3">
            <Pill as="button" onClick={() => navigate("/app/account")} className="flex-1" disabled={busy}>
              {added.length > 0 ? `Finish — see my ${added.length} ${added.length === 1 ? "membership" : "memberships"}` : "Finish"}
            </Pill>
          </div>
          <p className="text-center text-muted text-[11px] mt-2.5">Read-only, always. Perki recommends and links, never moves your money.</p>
        </div>
      </div>

      <RequestMembershipModal open={reqOpen} onClose={() => setReqOpen(false)} onSubmit={submitRequest} busy={reqBusy} done={reqDone} />
    </div>
  );
}
