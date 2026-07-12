import React from "react";
import { fetchAllPerks } from "../data/catalog";
import { perkImageDebug } from "../data/stockImages";
import { BrandLogo } from "../ui/brand";

/* Internal photo audit: every unique perk with the photo the live logic picks and which
   rule picked it. Tap tiles to flag, copy the list, hand it to Fable. Unlisted route. */
export default function PhotoReview() {
  const [perks, setPerks] = React.useState([]);
  const [flagged, setFlagged] = React.useState(() => new Set());
  const [copied, setCopied] = React.useState(false);
  const [filter, setFilter] = React.useState("");

  React.useEffect(() => { fetchAllPerks().then(setPerks).catch(() => {}); }, []);

  const unique = React.useMemo(() => {
    const seen = {};
    perks.forEach((p) => { const k = `${p.provider}|${(p.title || "").toLowerCase()}`; if (!seen[k]) seen[k] = p; });
    return Object.values(seen).sort((a, b) => (a.provider + a.title).localeCompare(b.provider + b.title));
  }, [perks]);

  const shown = React.useMemo(() => {
    const q = filter.trim().toLowerCase();
    return q ? unique.filter((p) => [p.provider, p.title, p.category].some((v) => (v || "").toLowerCase().includes(q))) : unique;
  }, [unique, filter]);

  const toggle = (id) => setFlagged((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const copy = async () => {
    const lines = unique.filter((p) => flagged.has(p.perk_id)).map((p) => `${p.perk_id} — ${p.provider} — ${p.title}`);
    try { await navigator.clipboard.writeText(lines.join("\n")); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* ok */ }
  };

  return (
    <div className="min-h-screen bg-ink text-snow p-4 pb-24">
      <div className="max-w-content mx-auto">
        <h1 className="font-display font-extrabold text-2xl mb-1">Photo review</h1>
        <p className="text-muted text-sm mb-4">{unique.length} unique perks. Tap anything that looks wrong; copy the list when done.</p>
        <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Filter by provider, title, category…"
          className="w-full max-w-md min-h-[44px] px-5 mb-5 rounded-full border-[1.5px] border-snow/15 bg-ink2 text-sm focus:outline-none focus:ring-[3px] focus:ring-purple/40" />
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2.5">
          {shown.map((p) => {
            const { url, source } = perkImageDebug(p);
            const bad = flagged.has(p.perk_id);
            return (
              <button key={p.perk_id} onClick={() => toggle(p.perk_id)}
                className={`text-left rounded-card overflow-hidden border-2 cursor-pointer transition-colors ${bad ? "border-red-500" : "border-snow/10"} bg-ink2`}>
                <div className="relative aspect-square bg-goldlight">
                  {url && <img src={url} alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover" />}
                  <BrandLogo provider={p.provider} className="w-6 h-6 absolute top-1.5 right-1.5 !rounded-md" />
                  {bad && <span className="absolute inset-0 grid place-items-center bg-red-500/40 text-white font-extrabold text-2xl">✕</span>}
                </div>
                <div className="p-2">
                  <p className="text-[11px] font-semibold leading-tight line-clamp-2">{p.title}</p>
                  <p className="text-[10px] text-muted truncate">{p.provider} · {p.category}</p>
                  <p className="text-[9px] text-golddeep truncate mt-0.5">{source}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
      <div className="fixed bottom-4 inset-x-4 flex justify-center">
        <button onClick={copy} disabled={!flagged.size}
          className="rounded-full bg-purple text-white font-bold text-sm px-7 min-h-[48px] shadow-lg cursor-pointer disabled:opacity-40">
          {copied ? "Copied ✓" : `Copy ${flagged.size} flagged perk${flagged.size === 1 ? "" : "s"}`}
        </button>
      </div>
    </div>
  );
}
