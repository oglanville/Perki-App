import { cadenceLabel } from "../data/catalog";
import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Sparkles, ArrowRight, ChevronRight, RotateCw, Infinity as InfinityIcon,
  Home as HomeIcon, LayoutGrid, Tag, User, Menu, X,
} from "lucide-react";
import { PROVIDERS, RESET_LABEL } from "../data/perks";

/* ── Button ──────────────────────────────────────────────────────────── */
export function Button({ as = "button", to, variant = "primary", className = "", children, ...rest }) {
  const base =
    "inline-flex items-center justify-center gap-2 font-semibold rounded-btn min-h-[44px] px-6 py-3 cursor-pointer transition-all duration-200 ease-fluid focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed";
  const styles = {
    primary: "bg-purple text-white hover:opacity-90 hover:-translate-y-px focus:ring-[3px] focus:ring-purple/50",
    secondary: "bg-transparent text-purple border-2 border-purple hover:bg-purple/10 focus:ring-[3px] focus:ring-purple/40",
  }[variant];
  const cls = `${base} ${styles} ${className}`;
  if (to) return <Link to={to} className={cls} {...rest}>{children}</Link>;
  const Tag = as;
  return <Tag className={cls} {...rest}>{children}</Tag>;
}

/* ── Glass card ──────────────────────────────────────────────────────── */
export function GlassCard({ className = "", interactive = false, children, ...rest }) {
  return (
    <div
      className={`glass rounded-card p-6 shadow-md ${interactive ? "cursor-pointer transition-[box-shadow,transform] duration-200 ease-fluid hover:shadow-lg hover:-translate-y-0.5" : ""} ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}

/* ── Tier pill ───────────────────────────────────────────────────────── */
export function TierPill({ children }) {
  return <span className="rounded-full bg-goldlight text-golddeep text-sm font-medium px-2.5 py-0.5">{children}</span>;
}

/* ── Provider mark (SVG, never emoji) ────────────────────────────────── */
import * as Icons from "lucide-react";
export function ProviderMark({ provider, className = "w-5 h-5 text-gold" }) {
  const name = PROVIDERS[provider]?.icon || "circle";
  const comp = name.split("-").map((p) => p[0].toUpperCase() + p.slice(1)).join("");
  const Ico = Icons[comp] || Icons.Circle;
  return <Ico className={className} aria-hidden="true" />;
}

/* ── Perk card ───────────────────────────────────────────────────────── */
export function PerkCard({ perk, onClick }) {
  const reset = cadenceLabel(perk.reset_period);
  const ResetIcon = perk.reset_period && perk.reset_period !== "NONE" ? RotateCw : InfinityIcon;
  return (
    <GlassCard interactive role="button" tabIndex={0} onClick={onClick}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onClick?.(e)}
      className="focus:outline-none focus:ring-[3px] focus:ring-purple/40">
      <div className="flex items-center justify-between mb-4">
        <span className="flex items-center gap-2 font-semibold"><ProviderMark provider={perk.provider} />{perk.provider}</span>
        <TierPill>{perk.tier}</TierPill>
      </div>
      <h3 className="text-xl font-semibold mb-1">{perk.title}</h3>
      <p className="text-snow/75 mb-4 leading-7">{perk.description}</p>
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 text-sm text-muted"><ResetIcon className="w-4 h-4" aria-hidden="true" />{reset}</span>
        <ChevronRight className="w-5 h-5 text-muted" aria-hidden="true" />
      </div>
    </GlassCard>
  );
}

/* ── Brand ───────────────────────────────────────────────────────────── */
export function Brand({ size = "lg" }) {
  return (
    <Link to="/" className="flex items-center gap-2 cursor-pointer">
      <span className="grid place-items-center w-8 h-8"><svg viewBox="0 0 512 512" className="w-8 h-8" aria-hidden="true"><rect x="36" y="36" width="440" height="440" rx="128" fill="#2B2A6E"/><g fill="none" stroke="#E0A93B" strokeWidth="56" strokeLinecap="round"><path d="M211 150 V374"/><path d="M239 154 A62 62 0 0 1 239 278"/></g></svg></span>
      <span className={`font-bold tracking-tight ${size === "lg" ? "text-lg" : "text-base"}`}>Perki</span>
    </Link>
  );
}

/* ── Floating top nav (marketing) ────────────────────────────────────── */
export function TopNav() {
  const [open, setOpen] = React.useState(false);
  const links = [
    { to: "/how-it-works", label: "How it works" },
    { to: "/perks", label: "Marketplace" },
    { to: "/app", label: "App" },
  ];
  return (
    <header className="fixed top-3 inset-x-3 z-20 max-w-content mx-auto">
      <nav className="glass rounded-btn px-4 py-2.5 flex items-center justify-between">
        <Brand />
        <div className="hidden md:flex items-center gap-6">
          {links.map((l) => <Link key={l.to} to={l.to} className="text-sm text-snow/80 hover:text-snow cursor-pointer transition-colors duration-200">{l.label}</Link>)}
          <Button to="/app/account" variant="secondary" className="!min-h-[40px] !py-2 text-sm">Profile</Button>
          <Button to="/signup" className="!min-h-[40px] !py-2 text-sm">Get Perki</Button>
        </div>
        <div className="md:hidden flex items-center gap-2">
          <Link to="/app/account" aria-label="Profile" className="grid place-items-center w-10 h-10 rounded-btn glass text-snow cursor-pointer focus:outline-none focus:ring-[3px] focus:ring-purple/40"><User className="w-5 h-5" /></Link>
          <Button to="/signup" className="!min-h-[40px] !py-2 text-sm">Get Perki</Button>
          <button aria-label={open ? "Close menu" : "Open menu"} onClick={() => setOpen(!open)}
            className="grid place-items-center w-10 h-10 rounded-btn cursor-pointer text-snow focus:outline-none focus:ring-[3px] focus:ring-purple/40">
            {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </nav>
      {open && (
        <div className="md:hidden glass rounded-card mt-2 p-2">
          {links.map((l) => <Link key={l.to} to={l.to} onClick={() => setOpen(false)} className="block px-4 py-3 rounded-btn text-snow/90 hover:bg-snow/5 cursor-pointer min-h-[44px]">{l.label}</Link>)}
          <Link to="/app/account" onClick={() => setOpen(false)} className="block px-4 py-3 rounded-btn text-snow/90 hover:bg-snow/5 cursor-pointer min-h-[44px]">Profile</Link>
          <Link to="/login" onClick={() => setOpen(false)} className="block px-4 py-3 rounded-btn text-snow/90 hover:bg-snow/5 cursor-pointer min-h-[44px]">Log in</Link>
        </div>
      )}
    </header>
  );
}

/* ── Footer ──────────────────────────────────────────────────────────── */
export function Footer() {
  const col = (title, items) => (
    <div>
      <h4 className="font-semibold text-sm mb-3">{title}</h4>
      <ul className="space-y-2 text-sm text-muted">{items.map((i) => <li key={i.label}><Link to={i.to} className="cursor-pointer hover:text-snow transition-colors duration-200">{i.label}</Link></li>)}</ul>
    </div>
  );
  return (
    <footer className="border-t border-snow/10 mt-8">
      <div className="max-w-content mx-auto px-4 py-10 grid gap-8 sm:grid-cols-4">
        <div className="sm:col-span-1">
          <Brand />
          <p className="text-sm text-muted leading-6 mt-3">Every perk you're already paying for, in one place.</p>
        </div>
        {col("Product", [{ to: "/how-it-works", label: "How it works" }, { to: "/perks", label: "Marketplace" }])}
        {col("Company", [{ to: "/", label: "About" }, { to: "/", label: "Security" }])}
        {col("Account", [{ to: "/login", label: "Log in" }, { to: "/signup", label: "Get Perki" }, { to: "/app", label: "Open app" }])}
      </div>
      <p className="text-center text-xs text-muted pb-24 sm:pb-8">© 2026 Perki. Read-only — we never move your money.</p>
    </footer>
  );
}

/* ── Sticky mobile CTA (reveals on scroll) ───────────────────────────── */
export function StickyCta({ to = "/signup", label = "See my perks" }) {
  const [show, setShow] = React.useState(false);
  React.useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 420);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <div className={`fixed inset-x-3 bottom-3 z-30 sm:hidden transition-transform duration-300 ease-fluid ${show ? "translate-y-0" : "translate-y-24"}`}>
      <Link to={to} className="glass rounded-btn flex items-center justify-center gap-2 bg-purple/90 text-white font-semibold py-3.5 min-h-[52px] cursor-pointer">
        {label} <ArrowRight className="w-5 h-5" />
      </Link>
    </div>
  );
}

/* ── App bottom tab bar (authenticated shell) ────────────────────────── */
export function BottomTabs() {
  const { pathname } = useLocation();
  const tabs = [
    { to: "/app", label: "Home", Icon: HomeIcon },
    { to: "/perks", label: "Marketplace", Icon: LayoutGrid },
    { to: "/pricing", label: "Plans", Icon: Tag },
    { to: "/app/account", label: "Account", Icon: User },
  ];
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 glass border-t border-snow/10 sm:hidden">
      <div className="max-w-content mx-auto grid grid-cols-4">
        {tabs.map(({ to, label, Icon }) => {
          const active = pathname === to;
          return (
            <Link key={to} to={to} className={`flex flex-col items-center justify-center gap-1 py-2.5 min-h-[56px] cursor-pointer ${active ? "text-golddeep" : "text-muted"}`}>
              <Icon className="w-6 h-6" /><span className="text-xs font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
