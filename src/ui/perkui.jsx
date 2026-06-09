import React from "react";
import { X, Search, Trash2, Plus } from "lucide-react";
import { Button } from "./components";
import { BrandLogo } from "./brand";
import { categoryEmoji, categoryLabel, featureThenAlpha } from "../data/catalog";
import { usePerkDrawer } from "./PerkDrawer";

/* ── Reusable modal ──────────────────────────────────────────────────── */
export function Modal({ open, onClose, title, children, footer }) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="glass relative w-full max-w-md rounded-modal p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">{title}</h2>
          <button aria-label="Close" onClick={onClose} className="grid place-items-center w-9 h-9 rounded-btn cursor-pointer text-muted hover:text-snow focus:outline-none focus:ring-[3px] focus:ring-purple/40"><X className="w-5 h-5" /></button>
        </div>
        <div>{children}</div>
        {footer && <div className="mt-6 flex gap-3 justify-end">{footer}</div>}
      </div>
    </div>
  );
}

export function ConfirmModal({ open, onClose, title, message, confirmLabel = "Confirm", onConfirm, busy }) {
  return (
    <Modal open={open} onClose={onClose} title={title}
      footer={<>
        <Button as="button" variant="secondary" onClick={onClose} className="!min-h-[44px]">Cancel</Button>
        <Button as="button" onClick={onConfirm} disabled={busy} className="!min-h-[44px]">{busy ? "Working…" : confirmLabel}</Button>
      </>}>
      <p className="text-snow/85 leading-7">{message}</p>
    </Modal>
  );
}

/* ── Category-label chip ─────────────────────────────────────────────── */
export function CategoryChip({ feature }) {
  return <span className="rounded-full bg-snow/10 text-snow/75 text-[11px] font-medium px-2 py-0.5 shrink-0">{categoryLabel(feature)}</span>;
}

/* ── Single perk row (one line): logo · name · membership+tier · category ── */
export function PerkListItem({ perk, drawerOptions }) {
  const { open } = usePerkDrawer();
  return (
    <li
      role="button" tabIndex={0}
      onClick={() => open(perk, drawerOptions)}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), open(perk, drawerOptions))}
      className="glass rounded-btn flex items-center gap-3 px-3 py-2.5 min-h-[44px] cursor-pointer transition-colors duration-200 hover:bg-snow/[0.04] focus:outline-none focus:ring-[3px] focus:ring-purple/40">
      <BrandLogo provider={perk.provider} className="w-7 h-7" />
      <span className="text-base leading-none shrink-0" aria-hidden="true">{categoryEmoji(perk.category)}</span>
      <span className="font-medium truncate flex-1 min-w-0">{perk.title}</span>
      <span className="text-xs text-muted truncate hidden sm:inline shrink-0 max-w-[9rem]">{perk.provider} {perk.tier}</span>
      <CategoryChip feature={perk.feature} />
    </li>
  );
}

/* ── Shared perk list (applies ordering) ─────────────────────────────── */
export function PerkList({ perks, emptyLabel = "No perks to show.", comparator = featureThenAlpha, mode = "marketplace", scope, tierMap, groupByCategory = false }) {
  const ordered = React.useMemo(() => [...perks].sort(comparator), [perks, comparator]);
  const drawerOptions = React.useMemo(() => ({ mode, scope, tierMap }), [mode, scope, tierMap]);
  if (!ordered.length) return <p className="text-sm text-muted text-center py-6">{emptyLabel}</p>;
  if (!groupByCategory) return <ul className="space-y-2">{ordered.map((p) => <PerkListItem key={p.perk_id} perk={p} drawerOptions={drawerOptions} />)}</ul>;
  const groups = {};
  ordered.forEach((p) => { const c = p.category || "Other"; (groups[c] = groups[c] || []).push(p); });
  return (
    <div className="space-y-6">
      {Object.keys(groups).sort().map((cat) => (
        <div key={cat}>
          <h3 className="flex items-center gap-2 text-sm font-semibold text-snow/90 mb-2">
            <span aria-hidden="true">{categoryEmoji(cat)}</span>{cat}
            <span className="rounded-full bg-snow/10 text-muted text-xs px-2 py-0.5">{groups[cat].length}</span>
          </h3>
          <ul className="space-y-2">{groups[cat].map((p) => <PerkListItem key={p.perk_id} perk={p} drawerOptions={drawerOptions} />)}</ul>
        </div>
      ))}
    </div>
  );
}

/* ── Tier selector (logo + price next to each tier) ──────────────────── */
export function TierSelector({ provider, tiers, value, onChange, includeAll = true }) {
  return (
    <div className="swipe flex gap-2 overflow-x-auto -mx-4 px-4 pb-1">
      {includeAll && (
        <button onClick={() => onChange(null)}
          className={`whitespace-nowrap rounded-full px-4 min-h-[44px] text-sm font-medium cursor-pointer transition-colors duration-200 ${value == null ? "bg-purple text-white" : "glass text-snow/80 hover:text-snow"}`}>
          All tiers
        </button>
      )}
      {tiers.map((t) => (
        <button key={t.tier} onClick={() => onChange(t.tier)}
          className={`whitespace-nowrap rounded-full pl-2 pr-4 min-h-[44px] text-sm font-medium cursor-pointer transition-colors duration-200 flex items-center gap-2 ${value === t.tier ? "bg-purple text-white" : "glass text-snow/80 hover:text-snow"}`}>
          <BrandLogo provider={provider} className="w-6 h-6" />
          {t.tier}<span className={value === t.tier ? "text-white/80" : "text-golddeep"}>{t.price_label}</span>
        </button>
      ))}
    </div>
  );
}

/* ── Search bar ──────────────────────────────────────────────────────── */
export function SearchBar({ value, onChange, placeholder = "Search perks…" }) {
  return (
    <div className="relative">
      <Search className="w-5 h-5 text-muted absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
      <label htmlFor="perk-search" className="sr-only">Search</label>
      <input id="perk-search" type="search" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full pl-10 pr-4 py-3 text-base rounded-btn bg-ink2 border border-snow/15 placeholder-muted focus:border-gold focus:ring-[3px] focus:ring-gold/20 focus:outline-none min-h-[48px]" />
    </div>
  );
}

/* ── Membership row (active + potential share this) — brand logo ─────── */
export function MembershipRow({ membership, currentTier, tiers, onTierChange, action }) {
  return (
    <div className="glass rounded-card flex items-center gap-3 px-4 py-3">
      <BrandLogo provider={membership.provider} className="w-9 h-9" />
      <div className="min-w-0 flex-1">
        <p className="font-medium truncate">{membership.provider} {currentTier || ""}</p>
        <p className="text-xs text-muted truncate">{membership.membership}</p>
      </div>
      <label className="sr-only" htmlFor={`tier-${membership.provider}-${membership.membership}`}>Tier</label>
      <select id={`tier-${membership.provider}-${membership.membership}`} value={currentTier || ""} onChange={(e) => onTierChange(e.target.value)}
        className="bg-ink2 border border-snow/15 rounded-btn px-2 py-2 text-sm min-h-[40px] cursor-pointer focus:border-gold focus:outline-none max-w-[8rem]">
        {tiers.map((t) => <option key={t.tier} value={t.tier}>{t.tier} · {t.price_label}</option>)}
      </select>
      {action}
    </div>
  );
}

/* ── Request Membership modal ────────────────────────────────────────── */
export function RequestMembershipModal({ open, onClose, onSubmit, busy, done }) {
  const [name, setName] = React.useState("");
  const [desc, setDesc] = React.useState("");
  return (
    <Modal open={open} onClose={onClose} title="Request a membership"
      footer={!done && <>
        <Button as="button" variant="secondary" onClick={onClose} className="!min-h-[44px]">Cancel</Button>
        <Button as="button" onClick={() => onSubmit({ name, description: desc })} disabled={busy || !desc.trim()} className="!min-h-[44px]">{busy ? "Sending…" : "Send request"}</Button>
      </>}>
      {done ? <p className="text-golddeep text-center py-4">Thanks — we've logged your request.</p> : (
        <div className="space-y-4">
          <p className="text-snow/80 text-sm">Tell us which provider or membership you'd like Perki to add.</p>
          <div>
            <label htmlFor="req-name" className="block text-sm font-medium mb-1.5">Your name (optional)</label>
            <input id="req-name" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-3 text-base rounded-btn bg-ink2 border border-snow/15 placeholder-muted focus:border-gold focus:ring-[3px] focus:ring-gold/20 focus:outline-none min-h-[48px]" placeholder="Ollie" />
          </div>
          <div>
            <label htmlFor="req-desc" className="block text-sm font-medium mb-1.5">Which membership?</label>
            <textarea id="req-desc" value={desc} onChange={(e) => setDesc(e.target.value)} rows={3} className="w-full px-4 py-3 text-base rounded-btn bg-ink2 border border-snow/15 placeholder-muted focus:border-gold focus:ring-[3px] focus:ring-gold/20 focus:outline-none" placeholder="e.g. Tesco Clubcard, Amazon Prime…" />
          </div>
        </div>
      )}
    </Modal>
  );
}

export { Plus, Trash2 };
