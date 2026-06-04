import React from "react";
import { X, CheckCircle2, Ban, RotateCw, CalendarClock, History, ArrowUpRight } from "lucide-react";
import { BrandLogo } from "./brand";
import {
  categoryLabel, categoryEmoji, resetHuman,
  getUserPerkState, markPerkUsed, markPerkWontUse, featureThenAlpha,
} from "../data/catalog";
import { supabase } from "../lib/supabase";

const Ctx = React.createContext({ open: () => {} });
export const usePerkDrawer = () => React.useContext(Ctx);

function fmt(d) { if (!d) return null; try { return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }); } catch { return null; } }
const tierRank = (tierMap, provider, tier) => tierMap?.[`${provider}|${tier}`]?.sort_order ?? 0;

export function PerkDrawerProvider({ children }) {
  const [perk, setPerk] = React.useState(null);
  const [opts, setOpts] = React.useState({ mode: "marketplace" });
  const [visible, setVisible] = React.useState(false);
  const [state, setState] = React.useState(null);
  const [user, setUser] = React.useState(null);
  const [busy, setBusy] = React.useState("");
  const [err, setErr] = React.useState("");

  // open(perk, { mode, scope, tierMap })
  const open = React.useCallback(async (p, options = {}) => {
    setPerk(p); setOpts({ mode: "marketplace", ...options }); setVisible(true);
    setState(null); setErr(""); setBusy("");
    if (options.mode === "profile" && supabase) {
      const { data } = await supabase.auth.getUser();
      const u = data?.user || null; setUser(u);
      if (u) { try { setState(await getUserPerkState(u.id, p.perk_id)); } catch { /* ignore */ } }
    }
  }, []);
  const close = React.useCallback(() => { setVisible(false); setTimeout(() => setPerk(null), 300); }, []);

  React.useEffect(() => {
    const onKey = (e) => e.key === "Escape" && close();
    if (visible) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [visible, close]);

  async function onUsed() {
    if (!user) { setErr("Sign in to track your perks."); return; }
    setBusy("used"); setErr("");
    try { setState(await markPerkUsed(user.id, perk)); window.dispatchEvent(new CustomEvent("perki:perkstate")); } catch { setErr("Couldn't save. Try again."); } finally { setBusy(""); }
  }
  async function onWont() {
    if (!user) { setErr("Sign in to track your perks."); return; }
    setBusy("wont"); setErr("");
    try { setState(await markPerkWontUse(user.id, perk.perk_id)); window.dispatchEvent(new CustomEvent("perki:perkstate")); } catch { setErr("Couldn't save. Try again."); } finally { setBusy(""); }
  }

  // Marketplace computations — DEFAULT TO CHEAPEST tier the clicked item appears in
  const marketplace = React.useMemo(() => {
    if (!perk || opts.mode !== "marketplace" || !opts.scope) return null;
    const tm = opts.tierMap || {};
    const scope = opts.scope.filter((p) => p.provider === perk.provider && p.membership === perk.membership);
    const rk = (p) => tierRank(tm, p.provider, p.tier);
    // every tier the clicked title appears in, cheapest first
    const sameTitle = scope.filter((p) => (p.title || "").toLowerCase() === (perk.title || "").toLowerCase()).sort((a, b) => rk(a) - rk(b));
    const cheapest = sameTitle[0] || perk;
    const cheapestRank = rk(cheapest);
    const cheapestTier = cheapest.tier;
    const cheapestLabel = tm[`${cheapest.provider}|${cheapestTier}`]?.price_label || "Free";
    const clickedHigher = rk(perk) > cheapestRank; // user clicked a pricier instance
    // included = everything at the cheapest tier and below, de-duped to the cheapest instance
    const atOrBelow = scope.filter((p) => rk(p) <= cheapestRank);
    const byTitle = {};
    atOrBelow.forEach((p) => {
      const k = (p.title || "").toLowerCase();
      if (!byTitle[k] || rk(p) < rk(byTitle[k])) byTitle[k] = p;
    });
    const included = Object.values(byTitle).sort(featureThenAlpha);
    // higher tiers where this same title also appears
    const higher = [...new Set(sameTitle.filter((p) => rk(p) > cheapestRank).map((p) => p.tier))];
    return { cheapestTier, cheapestLabel, clickedHigher, included, higher };
  }, [perk, opts]);

  const isProfile = opts.mode === "profile";
  const lastUsed = state?.last_used_at || state?.used_at;
  const nextReset = state?.next_reset_date;

  return (
    <Ctx.Provider value={{ open }}>
      {children}
      {perk && (
        <div className={`fixed inset-0 z-50 ${visible ? "" : "pointer-events-none"}`} aria-hidden={!visible}>
          <div onClick={close} className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${visible ? "opacity-100" : "opacity-0"}`} />
          <aside role="dialog" aria-modal="true" aria-label={perk.title}
            className={`absolute top-0 right-0 h-full w-full max-w-md glass border-l border-snow/10 shadow-xl flex flex-col transition-transform duration-300 ease-fluid ${visible ? "translate-x-0" : "translate-x-full"}`}>
            <header className="flex items-center justify-between p-5 border-b border-snow/10">
              <div className="flex items-center gap-3 min-w-0">
                <BrandLogo provider={perk.provider} className="w-9 h-9" />
                <div className="min-w-0">
                  <p className="font-semibold truncate">{perk.provider} {perk.tier}</p>
                  <span className="rounded-full bg-snow/10 text-snow/75 text-[11px] font-medium px-2 py-0.5">{categoryLabel(perk.feature)}</span>
                </div>
              </div>
              <button aria-label="Close" onClick={close} className="grid place-items-center w-9 h-9 rounded-btn cursor-pointer text-muted hover:text-snow focus:outline-none focus:ring-[3px] focus:ring-purple/40"><X className="w-5 h-5" /></button>
            </header>

            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {/* 1. Synopsis (both modes) */}
              <section>
                <div className="flex items-center gap-2 mb-1"><span className="text-xl" aria-hidden="true">{categoryEmoji(perk.category)}</span><h2 className="text-xl font-bold">{perk.title}</h2></div>
                <p className="text-snow/80 leading-7">{perk.description || "No description available."}</p>
                <p className="text-sm text-muted mt-2">{perk.provider} · {perk.tier}</p>
              </section>

              {/* PROFILE: renewal tracking */}
              {isProfile && (
                <section className="space-y-2">
                  <h3 className="text-sm uppercase tracking-wide text-muted">Renewal</h3>
                  <div className="flex items-center gap-2 text-snow/90"><RotateCw className="w-4 h-4 text-gold" />Renews: <span className="font-medium">{resetHuman(perk.reset_period)}</span></div>
                  {nextReset && <div className="flex items-center gap-2 text-snow/90"><CalendarClock className="w-4 h-4 text-gold" />Next reset: <span className="font-medium">{fmt(nextReset)}</span></div>}
                  {lastUsed && <div className="flex items-center gap-2 text-snow/90"><History className="w-4 h-4 text-gold" />Last used: <span className="font-medium">{fmt(lastUsed)}</span></div>}
                  {state?.will_not_use && <p className="text-sm text-muted">You marked this as one you won't use.</p>}
                </section>
              )}

              {/* MARKETPLACE: tier price (prominent) + included (same + lower tiers) */}
              {!isProfile && marketplace && (
                <section>
                  <div className="glass rounded-card flex items-baseline justify-between px-4 py-3 mb-3">
                    <span className="text-sm text-muted">From the {marketplace.cheapestTier} tier</span>
                    <span className="text-2xl font-bold text-gold">{marketplace.cheapestLabel}<span className="text-sm font-normal text-muted">/mo</span></span>
                  </div>
                  {marketplace.clickedHigher && (
                    <div className="rounded-card border border-gold/60 bg-gold/10 text-golddeep px-4 py-2.5 mb-4 text-sm font-medium flex items-center gap-2">
                      <ArrowUpRight className="w-4 h-4 shrink-0 rotate-180" />Also available in a cheaper tier — get it from {marketplace.cheapestTier} ({marketplace.cheapestLabel}/mo).
                    </div>
                  )}
                  <h3 className="text-sm uppercase tracking-wide text-muted mb-2">Included with {marketplace.cheapestTier} &amp; below</h3>
                  <ul className="space-y-2">
                    {marketplace.included.map((p) => (
                      <li key={p.perk_id} className="glass rounded-btn flex items-center gap-2 px-3 py-2 text-sm">
                        <span aria-hidden="true">{categoryEmoji(p.category)}</span>
                        <span className="truncate flex-1">{p.title}</span>
                        <span className="text-xs text-muted shrink-0">{p.tier}</span>
                        <span className="rounded-full bg-snow/10 text-snow/70 text-[10px] px-1.5 py-0.5 shrink-0">{categoryLabel(p.feature)}</span>
                      </li>
                    ))}
                  </ul>
                  {marketplace.higher.length > 0 && (
                    <p className="mt-4 text-sm text-snow/80 flex items-start gap-1.5"><ArrowUpRight className="w-4 h-4 text-gold mt-0.5 shrink-0" />Also available in: <span className="text-golddeep font-medium">{marketplace.higher.join(", ")}</span></p>
                  )}
                </section>
              )}

              {err && <p className="text-sm text-red-400">{err}</p>}
            </div>

            {/* PROFILE: actions */}
            {isProfile && (
              <footer className="p-5 border-t border-snow/10 flex gap-3">
                <button onClick={onUsed} disabled={busy === "used"} className="flex-1 inline-flex items-center justify-center gap-2 bg-purple text-white font-semibold px-4 min-h-[48px] rounded-btn cursor-pointer transition-all duration-200 hover:opacity-90 disabled:opacity-60 focus:outline-none focus:ring-[3px] focus:ring-purple/50"><CheckCircle2 className="w-5 h-5" />{busy === "used" ? "Saving…" : "Mark as Used"}</button>
                <button onClick={onWont} disabled={busy === "wont"} className="flex-1 inline-flex items-center justify-center gap-2 bg-transparent border-2 border-snow/20 text-snow/90 font-semibold px-4 min-h-[48px] rounded-btn cursor-pointer transition-all duration-200 hover:bg-snow/5 disabled:opacity-60 focus:outline-none focus:ring-[3px] focus:ring-snow/20"><Ban className="w-5 h-5" />{busy === "wont" ? "Saving…" : "Will Not Use"}</button>
              </footer>
            )}
          </aside>
        </div>
      )}
    </Ctx.Provider>
  );
}
