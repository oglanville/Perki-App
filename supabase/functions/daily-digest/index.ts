// supabase/functions/daily-digest/index.ts
// Perki Daily Email Digest v4 — identical action boxes, question-driven themes, mobile-first.
// Triggered once per day via pg_cron.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const FROM_EMAIL = Deno.env.get("FROM_EMAIL") ?? "Perki <digest@perki.app>";


const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const resend = new Resend(RESEND_API_KEY);

/* ═══════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════ */

interface Perk {
  perk_id: string;
  provider: string;
  membership: string;
  tier: string;
  title: string;
  titlegroup: string | null;
  feature: "feature" | "perk" | "competition" | "discount";
  category: string | null;
  reset_period: "NONE" | "WEEKLY" | "MONTHLY" | "ANNUALLY" | "YEARLY";
  next_reset_date: string | null;
  description: string | null;
  price: number | null;
  tier_rank: number | null;
  tier_kind: "hierarchical" | "variant" | null;
}

interface EnrichedPerk extends Perk {
  used: boolean;
  dismissed: boolean;
}

interface UserMembership {
  provider: string;
  membership: string;
  tier: string;
}

interface PerkState {
  perk_id: string;
  used: boolean;
  dismissed: boolean;
  last_used_at?: string | null;
}

/* ═══════════════════════════════════════════════════════
   REFERENCE DATA
   ═══════════════════════════════════════════════════════ */

const CATEGORIES: Record<string, { label: string; icon: string }> = {
  Banking: { label: "Banking", icon: "🏦" },
  Protection: { label: "Protection", icon: "🛡️" },
  Savings: { label: "Savings", icon: "💰" },
  Credit: { label: "Credit", icon: "📊" },
  Tools: { label: "Tools", icon: "🔧" },
  Security: { label: "Security", icon: "🔒" },
  Budgeting: { label: "Budgeting", icon: "📋" },
  Travel: { label: "Travel", icon: "🌍" },
  Investments: { label: "Investments", icon: "📈" },
  Lifestyle: { label: "Lifestyle", icon: "✨" },
  Entertainment: { label: "Entertainment", icon: "🎬" },
  Insurance: { label: "Insurance", icon: "🛡️" },
  Rewards: { label: "Rewards", icon: "🎁" },
  Family: { label: "Family", icon: "👨‍👩‍👧" },
  Currency: { label: "Currency", icon: "💱" },
  Card: { label: "Card", icon: "💳" },
  Transfers: { label: "Transfers", icon: "🔄" },
  Wellness: { label: "Wellness", icon: "🧘" },
  Fitness: { label: "Fitness", icon: "💪" },
  Creativity: { label: "Creativity", icon: "🎨" },
  Productivity: { label: "Productivity", icon: "⚡" },
  News: { label: "News", icon: "📰" },
  Workspace: { label: "Workspace", icon: "🖥️" },
  Education: { label: "Education", icon: "📚" },
  Sports: { label: "Sports", icon: "⚽" },
  Streaming: { label: "Streaming", icon: "📺" },
  Hardware: { label: "Hardware", icon: "🖥️" },
  Broadband: { label: "Broadband", icon: "📡" },
  Automotive: { label: "Automotive", icon: "🚗" },
  Food: { label: "Food", icon: "🍔" },
  Shopping: { label: "Shopping", icon: "🛒" },
};

const PROVIDER_META: Record<string, { color: string; initials: string }> = {
  "OVO Energy": { color: "#00C86F", initials: "OV" },
  Monzo: { color: "#FF5C5C", initials: "MZ" },
  Revolut: { color: "#6C63FF", initials: "RV" },
  "American Express": { color: "#0077C8", initials: "AX" },
};

function providerColor(provider: string): string {
  return PROVIDER_META[provider]?.color ?? "#2B2A6E";
}

function providerInitials(provider: string): string {
  return PROVIDER_META[provider]?.initials ?? provider.slice(0, 2).toUpperCase();
}

/** Single-letter provider initial for perk rows */
function providerLetter(provider: string): string {
  return provider.charAt(0).toUpperCase();
}

function categoryIcon(cat: string | null): string {
  return cat && CATEGORIES[cat] ? CATEGORIES[cat].icon : "📦";
}

/* ═══════════════════════════════════════════════════════
   TIER HIERARCHY
   ═══════════════════════════════════════════════════════ */

type TierPriceMap = Record<string, { price: number; rank: number; kind: string }>;

function buildTierPriceMap(perks: Perk[]): TierPriceMap {
  const m: TierPriceMap = {};
  for (const p of perks) {
    const key = `${p.provider}|${p.tier}`;
    if (!m[key]) m[key] = { price: p.price ?? 999, rank: p.tier_rank ?? p.price ?? 999, kind: p.tier_kind ?? "hierarchical" };
  }
  return m;
}

function getProviderTierOrder(provider: string, tp: TierPriceMap): string[] {
  return Object.entries(tp)
    .filter(([k]) => k.startsWith(`${provider}|`))
    .map(([k, v]) => ({ tier: k.split("|")[1], rank: v.rank ?? v.price }))
    .sort((a, b) => a.rank - b.rank)
    .map((e) => e.tier);
}

function getHighestTier(provider: string, tiers: string[], tp: TierPriceMap): string {
  const order = getProviderTierOrder(provider, tp);
  let highIdx = -1;
  let highTier = tiers[0];
  for (const t of tiers) {
    const i = order.indexOf(t);
    if (i > highIdx) { highIdx = i; highTier = t; }
  }
  return highTier;
}

function getEffectiveTiers(provider: string, tier: string, tp: TierPriceMap): string[] {
  // Variant tiers are parallel products and never inherit from cheaper siblings.
  if (tp[`${provider}|${tier}`]?.kind === "variant") return [tier];
  const order = getProviderTierOrder(provider, tp);
  const idx = order.indexOf(tier);
  if (idx < 0) return [tier];
  return order.slice(0, idx + 1);
}

function isHigherTier(candidate: Perk, existing: Perk, tp: TierPriceMap): boolean {
  const order = getProviderTierOrder(candidate.provider, tp);
  return order.indexOf(candidate.tier) > order.indexOf(existing.tier);
}

/* ═══════════════════════════════════════════════════════
   USER DATA ASSEMBLY
   ═══════════════════════════════════════════════════════ */

function getUserPerks(memberships: UserMembership[], allPerks: Perk[], tp: TierPriceMap): Perk[] {
  const byProvider: Record<string, UserMembership[]> = {};
  for (const m of memberships) (byProvider[m.provider] ??= []).push(m);
  const result: Perk[] = [];
  for (const [provider, ms] of Object.entries(byProvider)) {
    const highestTier = getHighestTier(provider, ms.map((m) => m.tier), tp);
    const effectiveTiers = new Set(getEffectiveTiers(provider, highestTier, tp));
    const providerPerks = allPerks.filter((p) => p.provider === provider && effectiveTiers.has(p.tier));
    const deduped: Record<string, Perk> = {};
    for (const p of providerPerks) {
      const key = p.titlegroup || p.title;
      if (!deduped[key]) deduped[key] = p;
      else if (isHigherTier(p, deduped[key], tp)) deduped[key] = p;
    }
    result.push(...Object.values(deduped));
  }
  result.sort((a, b) => a.title.localeCompare(b.title));
  return result;
}

function enrichPerks(perks: Perk[], states: PerkState[]): EnrichedPerk[] {
  const stateMap: Record<string, PerkState> = {};
  for (const s of states) stateMap[s.perk_id] = s;
  return perks.map((p) => ({
    ...p,
    used: stateMap[p.perk_id]?.used ?? false,
    dismissed: stateMap[p.perk_id]?.dismissed ?? false,
  }));
}

/* ═══════════════════════════════════════════════════════
   FEATURE-TYPE RANKING
   ═══════════════════════════════════════════════════════ */

const FEATURE_RANK: Record<string, number> = { perk: 0, feature: 1, competition: 2, discount: 3 };

function featureRankSort(a: EnrichedPerk, b: EnrichedPerk): number {
  const ra = FEATURE_RANK[a.feature] ?? 9;
  const rb = FEATURE_RANK[b.feature] ?? 9;
  if (ra !== rb) return ra - rb;
  return a.title.localeCompare(b.title);
}

/* ═══════════════════════════════════════════════════════
   "WHAT TO USE TODAY" BUILDER
   ═══════════════════════════════════════════════════════ */

const PRIORITY_CATS = new Set(["Entertainment", "Lifestyle", "Food", "Wellness", "Fitness", "Streaming", "Shopping"]);

function buildWhatToUseToday(perks: EnrichedPerk[]): EnrichedPerk[] {
  const available = perks.filter((p) => !p.used && !p.dismissed && (p.feature === "perk" || p.feature === "feature"));
  const scored = available.map((p) => {
    let score = 0;
    if (p.reset_period === "WEEKLY") score += 20;
    if (p.reset_period === "MONTHLY") score += 10;
    if (PRIORITY_CATS.has(p.category ?? "")) score += 15;
    if (p.feature === "perk") score += 10;
    if (p.feature === "feature") score += 5;
    if (p.next_reset_date) {
      const daysUntil = (new Date(p.next_reset_date).getTime() - Date.now()) / 864e5;
      if (daysUntil >= 0 && daysUntil <= 1) score += 25;
      else if (daysUntil <= 3) score += 15;
      else if (daysUntil <= 7) score += 5;
    }
    return { perk: p, score };
  });
  scored.sort((a, b) => b.score - a.score);
  const result: EnrichedPerk[] = [];
  const providerCount: Record<string, number> = {};
  for (const { perk } of scored) {
    if (result.length >= 10) break;
    const pc = providerCount[perk.provider] ?? 0;
    if (pc >= 3) continue;
    providerCount[perk.provider] = pc + 1;
    result.push(perk);
  }
  return result;
}

/* ═══════════════════════════════════════════════════════
   "WHERE TO USE NEXT" — question-driven themed boxes
   ═══════════════════════════════════════════════════════ */

const ALL_THEMES: { name: string; question: string; emoji: string; categories: string[] }[] = [
  { name: "Insurance & Protection", question: "Are you fully covered?", emoji: "🛡️", categories: ["Insurance", "Protection", "Security"] },
  { name: "Entertainment & Streaming", question: "What are you watching tonight?", emoji: "🎬", categories: ["Entertainment", "Streaming", "Sports"] },
  { name: "Food & Shopping", question: "Fancy something tasty or new?", emoji: "🍔", categories: ["Food", "Shopping"] },
  { name: "Wellness & Fitness", question: "Feeling active today?", emoji: "🧘", categories: ["Wellness", "Fitness"] },
  { name: "Travel & Lifestyle", question: "Planning a trip soon?", emoji: "✈️", categories: ["Travel", "Lifestyle"] },
  { name: "Finance & Rewards", question: "Making your money work?", emoji: "💰", categories: ["Banking", "Savings", "Investments", "Rewards", "Credit"] },
  { name: "Productivity & Work", question: "Need to get things done?", emoji: "⚡", categories: ["Productivity", "Workspace", "Tools", "Broadband", "Hardware"] },
  { name: "Family & Education", question: "Something for the family?", emoji: "📚", categories: ["Family", "Education"] },
  { name: "Cards & Transfers", question: "Sending money anywhere?", emoji: "💳", categories: ["Card", "Currency", "Transfers"] },
  { name: "Creative & News", question: "Feeling creative today?", emoji: "🎨", categories: ["Creativity", "News"] },
];

interface MomentBox {
  question: string;
  emoji: string;
  items: EnrichedPerk[];
}

function buildMomentBoxes(perks: EnrichedPerk[], today: Date): MomentBox[] {
  // Perks + features only, both used and unused
  const eligible = perks.filter((p) => p.feature === "perk" || p.feature === "feature");
  const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 864e5);
  const offset = dayOfYear % ALL_THEMES.length;

  const boxes: MomentBox[] = [];
  for (let i = 0; i < ALL_THEMES.length && boxes.length < 5; i++) {
    const theme = ALL_THEMES[(offset + i) % ALL_THEMES.length];
    const catSet = new Set(theme.categories);
    const matching = eligible
      .filter((p) => catSet.has(p.category ?? ""))
      .sort((a, b) => {
        if (a.used && !b.used) return -1;
        if (!a.used && b.used) return 1;
        return featureRankSort(a, b);
      })
      .slice(0, 10);
    if (matching.length > 0) {
      boxes.push({ question: theme.question, emoji: theme.emoji, items: matching });
    }
  }
  return boxes;
}

/* ═══════════════════════════════════════════════════════
   "MISSING OUT" — unselected membership summaries only
   ═══════════════════════════════════════════════════════ */

interface MissingMembership {
  provider: string;
  tier: string;
  perkCount: number;
  topCategories: string[];
}

function buildMissingMemberships(
  userMemberships: UserMembership[],
  allPerks: Perk[],
  tp: TierPriceMap,
): MissingMembership[] {
  const selectedProviders = new Set(userMemberships.map((m) => m.provider));
  const allProviders = [...new Set(allPerks.map((p) => p.provider))];
  const unselected = allProviders.filter((p) => !selectedProviders.has(p));

  return unselected.map((provider) => {
    const tiers = getProviderTierOrder(provider, tp);
    const bestTier = tiers.length > 0 ? tiers[tiers.length - 1] : "";
    const tierPerks = allPerks.filter((p) => p.provider === provider && p.tier === bestTier && (p.feature === "perk" || p.feature === "feature"));
    const cats = [...new Set(tierPerks.map((p) => p.category).filter(Boolean))] as string[];
    return { provider, tier: bestTier, perkCount: tierPerks.length, topCategories: cats.slice(0, 3) };
  })
  .filter((m) => m.perkCount > 0)
  .sort((a, b) => b.perkCount - a.perkCount)
  .slice(0, 6);
}

/* ═══════════════════════════════════════════════════════
   TOP NOT-SELECTED MEMBERSHIPS (for the standalone section)
   ═══════════════════════════════════════════════════════ */

interface TopUnselectedMembership {
  provider: string;
  tier: string;
  perkCount: number;
  topCategories: string[];
  color: string;
}

function buildTopUnselectedMemberships(
  userMemberships: UserMembership[],
  userPerks: EnrichedPerk[],
  allPerks: Perk[],
  tp: TierPriceMap,
): TopUnselectedMembership[] {
  const selectedProviders = new Set(userMemberships.map((m) => m.provider));
  const allProviders = [...new Set(allPerks.map((p) => p.provider))];
  const unselected = allProviders.filter((p) => !selectedProviders.has(p));
  const userCategories = new Set(userPerks.filter((p) => p.used && p.category).map((p) => p.category!));

  return unselected.map((provider) => {
    const providerTiers = getProviderTierOrder(provider, tp);
    const bestTier = providerTiers.length > 0 ? providerTiers[providerTiers.length - 1] : "";
    const tierPerks = allPerks.filter((p) => p.provider === provider && p.tier === bestTier && p.feature === "perk");
    const perkCount = tierPerks.length;
    const cats = [...new Set(tierPerks.map((p) => p.category).filter(Boolean))] as string[];
    const overlapCount = cats.filter((c) => userCategories.has(c)).length;
    const score = perkCount + overlapCount * 3;
    return { provider, tier: bestTier, perkCount, topCategories: cats.slice(0, 3), color: providerColor(provider), score };
  })
  .filter((m) => m.perkCount > 0)
  .sort((a, b) => b.score - a.score)
  .slice(0, 5)
  .map(({ score: _s, ...rest }) => rest);
}

/* ═══════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════ */

function escHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/** Truncate to maxLen characters, adding … if needed */
function trunc(s: string, maxLen = 28): string {
  return s.length <= maxLen ? s : s.slice(0, maxLen - 1) + "…";
}

function todayFormatted(d: Date): string {
  return d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

function firstName(fullName: string | null, email: string): string {
  if (fullName) {
    const parts = fullName.trim().split(/\s+/);
    if (parts[0]) return parts[0].charAt(0).toUpperCase() + parts[0].slice(1).toLowerCase();
  }
  return email.split("@")[0] ?? "there";
}

function featureTypeLabel(f: string): string {
  return { feature: "Feature", perk: "Perk", competition: "Comp", discount: "Discount" }[f] ?? f;
}

/* ═══════════════════════════════════════════════════════
   perkRow() — GLOBAL standardised row
   Layout: [✅🏦] [Title] [TAG] [12 Jun] [M]
   All elements on one line. Provider initial right-aligned.
   ═══════════════════════════════════════════════════════ */

function perkRow(p: EnrichedPerk, showDate = false): string {
  const dim = p.used || p.dismissed;
  const op = dim ? "0.5" : "1";
  const strike = p.used ? "line-through" : "none";
  const isFeature = p.feature === "feature";
  const chip = `<span style="font-family:'Work Sans','Helvetica Neue',Arial,sans-serif;font-size:10px;font-weight:600;color:${isFeature ? "#2B2A6E" : "#6B6757"};border:1px solid ${isFeature ? "#E0A93B" : "#E4DDCB"};background:${isFeature ? "#F7ECD4" : "transparent"};border-radius:20px;padding:2px 8px;margin-left:8px;white-space:nowrap;">${escHtml(featureTypeLabel(p.feature))}</span>`;
  const dateTd = showDate && p.next_reset_date
    ? `<td align="right" style="font-family:'Work Sans','Helvetica Neue',Arial,sans-serif;font-size:11px;color:#6B6757;white-space:nowrap;vertical-align:middle;">${escHtml(new Date(p.next_reset_date).toLocaleDateString("en-GB", { day: "numeric", month: "short" }))}</td>`
    : "";
  return `<tr><td style="padding:6px 16px;opacity:${op};">
    <table cellpadding="0" cellspacing="0" border="0" width="100%"><tr>
      <td style="vertical-align:middle;font-family:'Work Sans','Helvetica Neue',Arial,sans-serif;font-size:13px;color:#23202A;text-decoration:${strike};">${escHtml(trunc(p.title, 34))}${chip}</td>
      ${dateTd}
    </tr></table>
  </td></tr>`;
}

/* ── ENGINES ── */

interface SavingsMove { title: string; sub: string; saving: number; }

/* Real savings: for each held membership, the cheapest tier that still covers every
   perk the user has actually used, and only if it is cheaper than what they hold now. */
function buildSavingsMoves(userMemberships: UserMembership[], perks: EnrichedPerk[], allPerks: Perk[], tierPrices: TierPriceMap): SavingsMove[] {
  const moves: SavingsMove[] = [];
  const seen = new Set<string>();
  for (const m of userMemberships) {
    const key = `${m.provider}|${m.membership}`;
    if (seen.has(key)) continue;
    seen.add(key);
    // Variant providers (Spotify plans, Railcards etc) are parallel products; tier moves do not apply.
    if (tierPrices[`${m.provider}|${m.tier}`]?.kind === "variant") continue;
    const curPrice = tierPrices[`${m.provider}|${m.tier}`]?.price ?? 0;
    if (curPrice <= 0) continue;
    const usedTitles = new Set(
      perks.filter((p) => p.provider === m.provider && p.membership === m.membership && p.used)
           .map((p) => (p.title || "").toLowerCase()),
    );
    const tierTitles: Record<string, Set<string>> = {};
    for (const p of allPerks) {
      if (p.provider !== m.provider || p.membership !== m.membership) continue;
      (tierTitles[p.tier] ??= new Set()).add((p.title || "").toLowerCase());
    }
    let best: { tier: string; price: number } | null = null;
    for (const t of Object.keys(tierTitles)) {
      const price = tierPrices[`${m.provider}|${t}`]?.price ?? 0;
      if (price >= curPrice) continue;
      let covers = true;
      for (const ut of usedTitles) { if (!tierTitles[t].has(ut)) { covers = false; break; } }
      if (!covers) continue;
      if (!best || price < best.price) best = { tier: t, price };
    }
    if (best) {
      const saving = Math.round((curPrice - best.price) * 100) / 100;
      if (saving > 0) {
        const sub = usedTitles.size === 0
          ? `You have not used any ${m.provider} perks lately.`
          : `Keeps every ${m.provider} perk you actually use.`;
        moves.push({ title: `Move ${m.provider} ${m.tier} to ${best.tier}`, sub, saving });
      }
    }
  }
  moves.sort((a, b) => b.saving - a.saving);
  return moves.slice(0, 2);
}

/* Conservative consolidation: only flag genuine category overlap (insurance, travel)
   across two or more providers. Never asserts the user is definitely paying twice. */
function buildConsolidation(perks: EnrichedPerk[]): { dup: boolean; title: string; detail: string } {
  const DUP = ["Insurance", "Travel"];
  for (const cat of DUP) {
    const providers = [...new Set(perks.filter((p) => p.category === cat && !p.dismissed).map((p) => p.provider))];
    if (providers.length >= 2) {
      return {
        dup: true,
        title: `Possible overlap in ${cat.toLowerCase()}.`,
        detail: `You hold ${cat.toLowerCase()} cover from ${providers.slice(0, 3).join(", ")}. Worth checking you are not paying for the same thing twice.`,
      };
    }
  }
  return { dup: false, title: "No obvious duplicates.", detail: "Your line-up looks lean, nothing doubling up right now." };
}

/* ═══════════════════════════════════════════════════════
   EMAIL TEMPLATE V2 — WHOOP-style modular blocks.
   Four daily variants cycle by date:
   0 Verdict day · 1 Savings day · 2 Bundle day · 3 Momentum day
   ═══════════════════════════════════════════════════════ */

const F_DISP = "font-family:'Outfit','Helvetica Neue',Arial,sans-serif;";
const F_BODY = "font-family:'Work Sans','Helvetica Neue',Arial,sans-serif;";
const gold = (s: string) => `<strong style="color:#E0A93B;">${s}</strong>`;

interface WeekDayUsage { label: string; count: number; }

interface EmailDataV2 {
  name: string;
  dateStr: string;
  variant: number;
  available: number;
  used: number;
  willNotUse: number;
  membershipCount: number;
  resettingSoon: number;
  savingsMoves: SavingsMove[];
  savingsTotal: number;
  consolidation: { dup: boolean; title: string; detail: string };
  membershipRows: { provider: string; tier: string; verdict: string; save: boolean }[];
  useToday: EnrichedPerk[];
  featuredBundle: MomentBox | null;
  weekUsage: WeekDayUsage[];
  weekTotal: number;
}

function cadenceWord(p: EnrichedPerk): string {
  return p.reset_period === "WEEKLY" ? "Weekly" : p.reset_period === "MONTHLY" ? "Monthly" : "One-off";
}

function ebHero(eyebrow: string, headline: string, intro: string): string {
  return `<tr><td class="px" align="center" style="padding:34px 24px 8px;">
    <div style="${F_BODY}font-size:11px;font-weight:800;letter-spacing:2px;text-transform:uppercase;color:#B07C1A;">${escHtml(eyebrow)}</div>
    <div class="hero-h" style="${F_DISP}font-size:32px;line-height:36px;font-weight:900;color:#23202A;padding-top:10px;">${headline}</div>
    <div style="${F_BODY}font-size:15px;line-height:23px;color:#6B6757;padding-top:10px;">${intro}</div>
  </td></tr>`;
}

function ebSectionPill(label: string, tone: "gold" | "indigo"): string {
  const bg = tone === "gold" ? "#E0A93B" : "#2B2A6E";
  const col = tone === "gold" ? "#23202A" : "#FCFAF4";
  return `<tr><td class="px" style="padding:24px 24px 12px;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${bg};border-radius:999px;"><tr>
      <td align="center" style="padding:10px;"><span style="${F_DISP}font-size:16px;font-weight:800;color:${col};">${escHtml(label)}</span></td>
    </tr></table></td></tr>`;
}

function ebSummaryCard(rows: { icon: string; html: string }[]): string {
  const items = rows.map((r, i) => `<tr><td align="center" style="padding:${i === 0 ? "4px" : "12px"} 26px ${i === rows.length - 1 ? "16px" : "0"};">
      <div style="font-size:20px;padding-bottom:2px;">${r.icon}</div>
      <div style="${F_BODY}font-size:14.5px;line-height:22px;color:#E8E6F4;">${r.html}</div>
    </td></tr>`).join("");
  return `<tr><td class="px" style="padding:22px 24px 6px;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" bgcolor="#2B2A6E" style="background:#2B2A6E;border-radius:16px;">
      <tr><td align="center" style="padding:24px 22px 6px;"><span style="${F_DISP}font-size:20px;font-weight:800;color:#FCFAF4;">Here's how it stands</span></td></tr>
      ${items}
    </table></td></tr>`;
}

function ebMetricRow(icon: string, mainHtml: string, meta: string): string {
  return `<tr>
    <td width="52" style="vertical-align:top;padding:8px 0;"><div style="width:42px;height:42px;border-radius:21px;background:#F7ECD4;border:1px solid #E0A93B;text-align:center;line-height:42px;font-size:18px;">${icon}</div></td>
    <td style="vertical-align:middle;padding:8px 0 8px 12px;">
      <div style="${F_BODY}font-size:14.5px;line-height:21px;color:#23202A;">${mainHtml}</div>
      <div style="${F_BODY}font-size:12px;color:#6B6757;padding-top:2px;">${escHtml(meta)}</div>
    </td></tr>`;
}

function ebRowsBlock(rowsHtml: string): string {
  return `<tr><td class="px" style="padding:0 24px;"><table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">${rowsHtml}</table></td></tr>`;
}

function ebUseToday(d: EmailDataV2): string {
  if (d.useToday.length === 0) return "";
  const rows = d.useToday.slice(0, 5).map((p) => {
    const status = p.used ? "Have used" : p.dismissed ? "Will not use" : "Have not used";
    return ebMetricRow(categoryIcon(p.category), `<strong>${escHtml(trunc(p.title, 40))}</strong> from ${escHtml(p.provider)}. ${escHtml(trunc(p.description ?? "", 70))}`, `${p.membership} · ${cadenceWord(p)} · ${status}`);
  }).join("");
  return ebSectionPill("Use today", "gold") + ebRowsBlock(rows);
}

function ebBundle(d: EmailDataV2): string {
  const b = d.featuredBundle;
  if (!b || b.items.length === 0) return "";
  const rows = b.items.slice(0, 4).map((p) => {
    const status = p.used ? "Have used" : p.dismissed ? "Will not use" : "Have not used";
    return ebMetricRow(categoryIcon(p.category), `<strong>${escHtml(trunc(p.title, 40))}</strong> from ${escHtml(p.provider)}.`, `${p.membership} · ${cadenceWord(p)} · ${status}`);
  }).join("");
  return ebSectionPill(`${b.emoji} ${b.question}`, "gold") + ebRowsBlock(rows);
}

function ebEngines(d: EmailDataV2): string {
  const movesHtml = d.savingsMoves.length
    ? d.savingsMoves.slice(0, 1).map((mv) => `<div style="border:1px solid #E4DDCB;border-radius:10px;padding:10px 12px;">
        <div style="${F_BODY}font-size:13px;font-weight:700;color:#23202A;">${escHtml(mv.title)}</div>
        <div style="${F_BODY}font-size:11.5px;line-height:17px;color:#6B6757;padding:3px 0 6px;">${escHtml(mv.sub)}</div>
        <span style="${F_BODY}font-size:11px;font-weight:700;color:#B07C1A;background:#F7ECD4;border-radius:8px;padding:3px 8px;">Save £${mv.saving} / mo</span>
      </div>`).join("")
    : `<div style="${F_BODY}font-size:12px;line-height:18px;color:#6B6757;">Your tiers look right-sized. No easy savings spotted today.</div>`;
  return `<tr><td class="px" style="padding:22px 24px 6px;font-size:0;text-align:center;">
    <!--[if mso]><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td width="50%" valign="top" style="padding-right:5px;"><![endif]-->
    <div style="display:inline-block;width:100%;max-width:270px;vertical-align:top;text-align:left;margin:0 3px 10px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" bgcolor="#FCFAF4" style="background:#FCFAF4;border:1px solid #E4DDCB;border-radius:16px;"><tr><td style="padding:16px;">
          <div style="${F_DISP}font-size:11px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;color:#B07C1A;">Savings engine</div>
          <div style="${F_DISP}font-size:30px;font-weight:900;color:#23202A;padding:6px 0 2px;">£${d.savingsTotal}<span style="font-size:14px;font-weight:600;color:#6B6757;">/mo</span></div>
          <div style="${F_BODY}font-size:13px;line-height:19px;color:#6B6757;padding-bottom:10px;">${d.savingsTotal > 0 ? "still on the table" : "nothing left on the table"}</div>
          ${movesHtml}
        </td></tr></table>
    </div><!--[if mso]></td><td width="50%" valign="top" style="padding-left:5px;"><![endif]--><div style="display:inline-block;width:100%;max-width:270px;vertical-align:top;text-align:left;margin:0 3px 10px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" bgcolor="#F7ECD4" style="background:#F7ECD4;border:1px solid #E0A93B;border-radius:16px;"><tr><td style="padding:16px;">
          <div style="${F_DISP}font-size:11px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;color:#B07C1A;">Consolidation engine</div>
          <div style="${F_DISP}font-size:30px;font-weight:900;color:#23202A;padding:6px 0 2px;">${d.consolidation.dup ? 1 : 0}<span style="font-size:14px;font-weight:600;color:#6B6757;"> overlap${d.consolidation.dup ? "" : "s"}</span></div>
          <div style="${F_BODY}font-size:13px;line-height:19px;color:#6B6757;padding-bottom:10px;">${d.consolidation.dup ? "worth a look" : "all clear"}</div>
          <div style="${F_BODY}font-size:13px;font-weight:700;color:#23202A;padding-bottom:4px;">${escHtml(d.consolidation.title)}</div>
          <div style="${F_BODY}font-size:12px;line-height:18px;color:#6B6757;">${escHtml(d.consolidation.detail)}</div>
        </td></tr></table>
    </div>
    <!--[if mso]></td></tr></table><![endif]-->
  </td></tr>`;
}

function ebWeekChart(d: EmailDataV2): string {
  if (d.weekUsage.length === 0) return "";
  const max = Math.max(1, ...d.weekUsage.map((w) => w.count));
  const bars = d.weekUsage.map((w) => {
    const width = w.count === 0 ? 6 : Math.max(10, Math.round((w.count / max) * 94));
    const colr = w.count === 0 ? "#EAD9AE" : "#E0A93B";
    return `<tr>
      <td width="34" style="${F_BODY}font-size:11px;font-weight:700;color:#6B6757;padding:4px 0;">${escHtml(w.label)}</td>
      <td style="padding:4px 0;"><table cellpadding="0" cellspacing="0" border="0" width="${width}%"><tr><td style="background:${colr};border-radius:6px;height:14px;font-size:1px;line-height:1px;">&nbsp;</td></tr></table></td>
      <td width="26" align="right" style="${F_DISP}font-size:13px;font-weight:800;color:#23202A;">${w.count}</td>
    </tr>`;
  }).join("");
  return ebSectionPill("Your week so far", "indigo") + `<tr><td class="px" style="padding:0 24px;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" bgcolor="#FCFAF4" style="background:#FCFAF4;border:1px solid #E4DDCB;border-radius:16px;"><tr><td style="padding:20px 18px 14px;">
      <div style="${F_BODY}font-size:11px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;color:#B07C1A;padding-bottom:12px;">Perks ticked off, by day</div>
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">${bars}</table>
      <div style="${F_BODY}font-size:12px;line-height:18px;color:#6B6757;padding-top:12px;">${d.weekTotal > 0 ? `${d.weekTotal} ticked off in the last week. Weekly perks reset on Mondays, so early week is the time to grab them.` : "Nothing ticked off yet this week. Today's a good day to start."}</div>
    </td></tr></table></td></tr>`;
}

function ebMemberships(d: EmailDataV2): string {
  if (d.membershipRows.length === 0) return "";
  const shown = d.membershipRows.slice(0, 3);
  const extra = d.membershipRows.length - shown.length;
  const rows = shown.map((m, i) => `<tr><td style="padding:13px 16px;${i < shown.length - 1 ? "border-bottom:1px solid #EFE9DA;" : ""}">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"><tr>
        <td style="${F_BODY}font-size:14px;font-weight:600;color:#23202A;">${escHtml(m.provider)} · ${escHtml(m.tier)}${i === shown.length - 1 && extra > 0 ? ` <span style="color:#6B6757;font-weight:400;">+ ${extra} more</span>` : ""}</td>
        <td align="right" style="white-space:nowrap;"><span style="${F_BODY}font-size:11px;font-weight:700;color:${m.save ? "#FCFAF4" : "#B07C1A"};background:${m.save ? "#2B2A6E" : "#F7ECD4"};border-radius:20px;padding:3px 10px;">${escHtml(m.verdict)}</span></td>
      </tr></table>
    </td></tr>`).join("");
  return ebSectionPill("Your memberships", "indigo") + `<tr><td class="px" style="padding:0 24px;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" bgcolor="#FCFAF4" style="background:#FCFAF4;border:1px solid #E4DDCB;border-radius:16px;">${rows}</table></td></tr>`;
}

function ebTrackerCta(): string {
  /* Gold, deliberately different from the indigo closing CTA. Lands on the perk tracker. */
  return `<tr><td align="center" style="padding:18px 24px 2px;">
    <table role="presentation" align="center" cellpadding="0" cellspacing="0" border="0"><tr>
      <td align="center" bgcolor="#E0A93B" style="border-radius:999px;">
        <a href="https://perki-app.vercel.app/app/account#perks" style="${F_BODY}font-size:14px;font-weight:800;color:#23202A;text-decoration:none;display:inline-block;padding:13px 28px;">Update your perk tracker</a>
      </td>
    </tr></table>
  </td></tr>`;
}

function buildVerdict(d: EmailDataV2): { headline: string; intro: string } {
  const first = escHtml(d.name);
  switch (d.variant) {
    case 1:
      return d.savingsTotal > 0
        ? { headline: `£${d.savingsTotal} a month,<br>hiding in plain sight.`, intro: `Morning, ${first}. The savings engine went through all ${d.membershipCount} of your memberships overnight. ${gold(`£${d.savingsTotal} a month`)} is sitting there without losing a single perk you use.` }
        : { headline: `Your tiers look<br>right-sized.`, intro: `Morning, ${first}. The savings engine went through all ${d.membershipCount} of your memberships overnight and found nothing to trim. That is the goal.` };
    case 2: {
      const b = d.featuredBundle;
      if (b) return { headline: escHtml(b.question), intro: `Morning, ${first}. Your memberships hold ${gold(`${b.items.length} ${b.items.length === 1 ? "perk" : "perks"}`)} for exactly this moment. Here they are, lined up.` };
      return { headline: `${d.available} perks ready<br>this morning.`, intro: `Morning, ${first}. Two minutes now, real value back.` };
    }
    case 3:
      return d.weekTotal > 0
        ? { headline: `${d.weekTotal} ${d.weekTotal === 1 ? "perk" : "perks"} ticked off<br>this week.`, intro: `Morning, ${first}. Momentum counts. You have used ${gold(`${d.used} perks`)} overall, with ${gold(`${d.available} still ready`)} to go.` }
        : { headline: `A clean slate<br>this week.`, intro: `Morning, ${first}. Nothing ticked off in the last seven days, and ${gold(`${d.available} perks`)} are sitting ready. Start with one.` };
    default:
      return { headline: `${d.available} ${d.available === 1 ? "perk" : "perks"} ready<br>this morning.`, intro: `Morning, ${first}. Across your ${d.membershipCount} memberships there ${d.available === 1 ? "is" : "are"} ${gold(`${d.available} ${d.available === 1 ? "perk" : "perks"}`)} waiting${d.resettingSoon > 0 ? `, and ${gold(`${d.resettingSoon} reset`)} this week` : ""}. Two minutes now, real value back.` };
  }
}

function buildEmailHtmlV2(d: EmailDataV2): string {
  const verdict = buildVerdict(d);
  const summary = ebSummaryCard([
    { icon: "🎁", html: `You have ${gold(`${d.available} ${d.available === 1 ? "perk" : "perks"} available`)} across ${gold(`${d.membershipCount} memberships`)}${d.resettingSoon > 0 ? `, with ${gold(`${d.resettingSoon} resetting`)} this week` : ""}.` },
    { icon: "✅", html: `You have used ${gold(`${d.used} ${d.used === 1 ? "perk" : "perks"}`)} so far, and set aside ${gold(String(d.willNotUse))} you will not use.` },
    { icon: "💷", html: d.savingsTotal > 0 ? `The savings engine sees ${gold(`£${d.savingsTotal} a month`)} you could keep without losing a perk you use.` : `The savings engine finds your tiers ${gold("right-sized")} today.` },
  ]);
  const blocks: string[] = [ebHero(`${d.dateStr} · Your daily Perki`, verdict.headline, verdict.intro), ebTrackerCta()];
  switch (d.variant) {
    case 1: blocks.push(ebEngines(d), ebUseToday(d), summary, ebMemberships(d)); break;
    case 2: blocks.push(ebBundle(d), summary, ebEngines(d), ebMemberships(d)); break;
    case 3: blocks.push(ebWeekChart(d), summary, ebUseToday(d), ebEngines(d)); break;
    default: blocks.push(summary, ebUseToday(d), ebEngines(d), ebWeekChart(d), ebMemberships(d));
  }
  const cta = `<tr><td align="center" style="padding:32px 24px 10px;">
    <table role="presentation" align="center" cellpadding="0" cellspacing="0" border="0"><tr>
      <td align="center" bgcolor="#2B2A6E" style="border-radius:999px;">
        <a href="https://perki-app.vercel.app" style="${F_BODY}font-size:15px;font-weight:700;color:#FCFAF4;text-decoration:none;display:inline-block;padding:15px 34px;">See today's perks</a>
      </td>
    </tr></table>
  </td></tr>`;
  const footer = `<tr><td align="center" style="padding:20px 24px 8px;">
    <div style="${F_BODY}font-size:12px;color:#6B6757;line-height:18px;">Read-only, always. Perki recommends and links, never moves your money.</div>
    <div style="${F_BODY}font-size:12px;color:#6B6757;line-height:20px;padding-top:8px;"><a href="https://perki-app.vercel.app" style="color:#B07C1A;font-weight:600;text-decoration:none;">Manage preferences</a> &nbsp;·&nbsp; <a href="https://perki-app.vercel.app" style="color:#B07C1A;font-weight:600;text-decoration:none;">Unsubscribe</a></div>
    <div style="${F_BODY}font-size:11px;color:#9A9482;padding-top:10px;">Perki · London, UK</div>
  </td></tr>`;
  blocks.push(cta, footer);
  const preheader = d.available > 0 ? `${d.available} perks ready${d.savingsTotal > 0 ? `, £${d.savingsTotal} a month on the table` : ""}. Two minutes, ${d.name}.` : `Your daily Perki is here, ${d.name}.`;
  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<meta name="color-scheme" content="light"/>
<meta name="supported-color-schemes" content="light"/>
<title>Your Perki</title>
<!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
<style>
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@600;800;900&family=Work+Sans:wght@400;500;600;700&display=swap');
  body,table,td,a{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;}
  img{-ms-interpolation-mode:bicubic;border:0;}
  body{margin:0;padding:0;width:100%!important;background:#F4F0E6;}
  a{text-decoration:none;}
  @media only screen and (max-width:600px){
    .container{width:100%!important;}
    .px{padding-left:18px!important;padding-right:18px!important;}
    .stack{display:block!important;width:100%!important;box-sizing:border-box;}
    .stack-mb{margin-bottom:10px!important;}
    .hero-h{font-size:28px!important;line-height:32px!important;}
  }
</style>
</head>
<body bgcolor="#F4F0E6" style="margin:0;padding:0;background:#F4F0E6;">
<span style="display:none!important;visibility:hidden;opacity:0;color:transparent;height:0;width:0;overflow:hidden;">${escHtml(preheader)}</span>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" bgcolor="#F4F0E6" style="background:#F4F0E6;"><tr><td align="center" style="padding:0 0 28px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" bgcolor="#2B2A6E" style="background:#2B2A6E;"><tr>
  <td align="center" style="padding:14px;"><span style="${F_DISP}font-size:20px;font-weight:900;color:#FCFAF4;">Perki<span style="color:#E0A93B;">.</span></span></td>
</tr></table>
<!--[if mso]><table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" align="center"><tr><td><![endif]-->
<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" width="100%" style="max-width:600px;">
${blocks.join("\n")}
</table>
<!--[if mso]></td></tr></table><![endif]-->
</td></tr></table>
</body>
</html>`;
}

/* Per-day usage counts for the last seven days (today last). Uses last_used_at,
   which records the most recent tick per perk. */
function buildWeekUsage(states: PerkState[], today: Date): WeekDayUsage[] {
  const out: WeekDayUsage[] = [];
  for (let i = 6; i >= 0; i--) {
    const day = new Date(today);
    day.setDate(day.getDate() - i);
    const key = day.toISOString().slice(0, 10);
    const label = day.toLocaleDateString("en-GB", { weekday: "short" });
    const count = states.filter((s) => s.used && s.last_used_at && s.last_used_at.slice(0, 10) === key).length;
    out.push({ label, count });
  }
  return out;
}

/* ── PER-USER BUILDER ── */

function buildDigestForUser(
  userId: string,
  userMemberships: UserMembership[],
  allPerks: Perk[],
  tierPrices: TierPriceMap,
  perkStates: PerkState[],
  fullName: string | null,
  email: string,
  today: Date,
): { html: string; name: string } {
  const name = firstName(fullName, email);
  const rawPerks = getUserPerks(userMemberships, allPerks, tierPrices);
  const perks = enrichPerks(rawPerks, perkStates);

  const countable = perks.filter((p) => !p.dismissed);
  const usedCount = countable.filter((p) => p.used).length;
  const availableCount = countable.length - usedCount;
  const willNotUseCount = perks.filter((p) => p.dismissed).length;
  const TYPES = ["feature", "perk", "discount", "competition"] as const;
  const activeByType: Record<string, number> = {};
  const inactiveByType: Record<string, number> = {};
  for (const t of TYPES) {
    activeByType[t] = countable.filter((p) => p.feature === t && p.used).length;
    inactiveByType[t] = countable.filter((p) => p.feature === t && !p.used).length;
  }

  const providersSeen = new Set<string>();
  const membershipSummary = userMemberships
    .filter((m) => { if (providersSeen.has(m.provider)) return false; providersSeen.add(m.provider); return true; })
    .map((m) => ({
      provider: m.provider,
      tier: getHighestTier(m.provider, userMemberships.filter((x) => x.provider === m.provider).map((x) => x.tier), tierPrices),
      color: providerColor(m.provider),
      renewal: "",
    }));

  const savingsMoves = buildSavingsMoves(userMemberships, perks, allPerks, tierPrices);
  const consolidation = buildConsolidation(perks);

  const whatToUseToday = buildWhatToUseToday(perks);
  const momentBoxes = buildMomentBoxes(perks, today);

  /* V2 assembly */
  const savingsTotal = Math.round(savingsMoves.reduce((s, m) => s + m.saving, 0) * 100) / 100;
  const saveByProvider: Record<string, number> = {};
  for (const mv of savingsMoves) {
    const prov = mv.title.replace(/^Move /, "").split(" ")[0];
    saveByProvider[prov] = mv.saving;
  }
  const membershipRows = membershipSummary.map((m) => {
    const save = saveByProvider[m.provider];
    return { provider: m.provider, tier: m.tier, verdict: save ? `Save £${save}/mo` : "Right-sized", save: !!save };
  }).sort((a, b) => (b.save ? 1 : 0) - (a.save ? 1 : 0));
  const resettingSoon = perks.filter((p) => !p.used && !p.dismissed && p.reset_period === "WEEKLY").length;
  const weekUsage = buildWeekUsage(perkStates, today);
  const weekTotal = weekUsage.reduce((s, w) => s + w.count, 0);
  const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 864e5);
  const variant = dayOfYear % 4;

  const html = buildEmailHtmlV2({
    name,
    dateStr: todayFormatted(today),
    variant,
    available: availableCount,
    used: usedCount,
    willNotUse: willNotUseCount,
    membershipCount: membershipSummary.length,
    resettingSoon,
    savingsMoves,
    savingsTotal,
    consolidation,
    membershipRows,
    useToday: whatToUseToday,
    featuredBundle: momentBoxes[0] ?? null,
    weekUsage,
    weekTotal,
  });

  return { html, name };
}

/* ═══════════════════════════════════════════════════════
   MAIN HANDLER
   ═══════════════════════════════════════════════════════ */

Deno.serve(async (req: Request) => {
  try {
    let body: Record<string, unknown> = {};
    try { const text = await req.text(); if (text) body = JSON.parse(text); } catch { /* ok */ }
    const isPreview = body.preview === true;

    if (isPreview) {
      console.log("[daily-digest] Preview mode: skipping auth");
    } else {
      const header = req.headers.get("authorization");
      const envSecret = Deno.env.get("CRON_SECRET");
      let authOk = !!envSecret && header === `Bearer ${envSecret}`;
      if (!authOk && header) {
        // Fall back to the Vault value (service-role-only RPC) so the cron and the function can never drift.
        const { data: vaultSecret } = await supabase.rpc("get_cron_secret");
        authOk = !!vaultSecret && header === `Bearer ${vaultSecret}`;
      }
      console.log("[daily-digest] Auth check — env secret set:", !!envSecret, "header set:", !!header, "ok:", authOk);
      if (!authOk) {
        return new Response("Unauthorized", { status: 401 });
      }
    }

    const today = new Date();
    console.log(`[daily-digest] Starting ${isPreview ? "PREVIEW" : "production"} digest for ${todayFormatted(today)}`);

    // Send only at 07:00 Europe/London. Two UTC crons (06:00 + 07:00) fire; this guard makes one a no-op across DST.
    if (!isPreview && body.force !== true) {
      const londonHour = Number(new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/London", hour: "2-digit", hour12: false }).format(today));
      if (londonHour !== 7) {
        console.log(`[daily-digest] Skipping run: London hour is ${londonHour}, not 7.`);
        return new Response(JSON.stringify({ skipped: true, reason: "not 07:00 Europe/London", londonHour }), { headers: { "Content-Type": "application/json" } });
      }
    }

    const { data: allPerks, error: perksErr } = await supabase.from("perks").select("*").order("title");
    if (perksErr) throw new Error(`Failed to load perks: ${perksErr.message}`);
    const tierPrices = buildTierPriceMap((allPerks as Perk[]) ?? []);

    const { data: membershipsRaw, error: memErr } = await supabase.from("user_memberships").select("user_id, provider, membership, tier");
    if (memErr) throw new Error(`Failed to load memberships: ${memErr.message}`);

    const membershipsByUser: Record<string, UserMembership[]> = {};
    for (const row of membershipsRaw ?? []) {
      (membershipsByUser[row.user_id] ??= []).push({ provider: row.provider, membership: row.membership, tier: row.tier });
    }
    const userIds = Object.keys(membershipsByUser);
    if (userIds.length === 0) {
      return new Response(JSON.stringify({ sent: 0, mode: isPreview ? "preview" : "production" }), { headers: { "Content-Type": "application/json" } });
    }

    if (isPreview) {
      const previewUserId = (body.user_id as string) ?? userIds[0];
      const userMemberships = membershipsByUser[previewUserId];
      if (!userMemberships) {
        return new Response(JSON.stringify({ error: `No memberships for ${previewUserId}`, availableUserIds: userIds.slice(0, 10) }), { status: 404, headers: { "Content-Type": "application/json" } });
      }
      const { data: profileRow } = await supabase.from("profiles").select("full_name").eq("id", previewUserId).maybeSingle();
      let authName: string | null = null;
      let authEmail = "preview@perki.app";
      try {
        const { data: { user: authUser } } = await supabase.auth.admin.getUserById(previewUserId);
        if (authUser?.email) authEmail = authUser.email;
        const meta = authUser?.user_metadata as Record<string, string> | undefined;
        if (meta?.full_name) authName = meta.full_name;
      } catch { /* ok */ }
      const fullName = profileRow?.full_name ?? authName ?? null;
      const { data: perkStatesRaw } = await supabase.from("user_perk_state").select("perk_id, used, dismissed, last_used_at").eq("user_id", previewUserId);
      const perkStates: PerkState[] = (perkStatesRaw ?? []).map((r) => ({ perk_id: r.perk_id, used: r.used ?? false, dismissed: r.dismissed ?? false, last_used_at: r.last_used_at ?? null }));

      const { html, name } = buildDigestForUser(previewUserId, userMemberships, allPerks as Perk[], tierPrices, perkStates, fullName, authEmail, today);
      const sendTo = (body.email as string) ?? authEmail;
      console.log(`[daily-digest] Preview: sending ${name}'s digest to ${sendTo}`);
      try {
        const result = await resend.emails.send({ from: FROM_EMAIL, to: sendTo, subject: `[PREVIEW] Perki for ${name}, ${todayFormatted(today)}`, html });
        const rErr = (result as Record<string, unknown>)?.error;
        if (rErr) {
          return new Response(JSON.stringify({ mode: "preview", error: "Resend rejected the send", detail: rErr }), { status: 502, headers: { "Content-Type": "application/json" } });
        }
        const id = ((result as Record<string, { id?: string }>)?.data)?.id ?? null;
        return new Response(JSON.stringify({ mode: "preview", sent: 1, sentTo: sendTo, id, userId: previewUserId, userName: name }), { headers: { "Content-Type": "application/json" } });
      } catch (sendErr: unknown) {
        const msg = sendErr instanceof Error ? sendErr.message : String(sendErr);
        return new Response(JSON.stringify({ mode: "preview", error: `Failed to send: ${msg}` }), { status: 500, headers: { "Content-Type": "application/json" } });
      }
    }

    // PRODUCTION
    const { data: disabledPrefs } = await supabase.from("email_preferences").select("user_id").eq("daily_digest_enabled", false).in("user_id", userIds);
    const optedOut = new Set((disabledPrefs ?? []).map((r: { user_id: string }) => r.user_id));
    const eligibleUserIds = userIds.filter((id) => !optedOut.has(id));
    if (eligibleUserIds.length === 0) {
      return new Response(JSON.stringify({ sent: 0, optedOut: optedOut.size }), { headers: { "Content-Type": "application/json" } });
    }

    const { data: profiles } = await supabase.from("profiles").select("id, full_name").in("id", eligibleUserIds);
    const profileNameMap: Record<string, string> = {};
    for (const p of profiles ?? []) { if (p.full_name) profileNameMap[p.id] = p.full_name; }

    const { data: { users: authUsers }, error: authErr } = await supabase.auth.admin.listUsers({ perPage: 1000 });
    if (authErr) throw new Error(`Failed to list auth users: ${authErr.message}`);
    const emailMap: Record<string, string> = {};
    const authNameMap: Record<string, string> = {};
    for (const u of authUsers ?? []) {
      if (u.email) emailMap[u.id] = u.email;
      const meta = u.user_metadata as Record<string, string> | undefined;
      if (meta?.full_name) authNameMap[u.id] = meta.full_name;
    }

    const { data: perkStatesRaw } = await supabase.from("user_perk_state").select("user_id, perk_id, used, dismissed, last_used_at").in("user_id", eligibleUserIds);
    const perkStatesByUser: Record<string, PerkState[]> = {};
    for (const row of perkStatesRaw ?? []) {
      (perkStatesByUser[row.user_id] ??= []).push({ perk_id: row.perk_id, used: row.used ?? false, dismissed: row.dismissed ?? false, last_used_at: row.last_used_at ?? null });
    }

    let sentCount = 0;
    const errors: string[] = [];
    for (const userId of eligibleUserIds) {
      const email = emailMap[userId];
      if (!email) continue;
      const { html, name } = buildDigestForUser(userId, membershipsByUser[userId], allPerks as Perk[], tierPrices, perkStatesByUser[userId] ?? [], profileNameMap[userId] ?? authNameMap[userId] ?? null, email, today);
      try {
        const result = await resend.emails.send({ from: FROM_EMAIL, to: email, subject: `Your Perki for ${todayFormatted(today)}`, html });
        const rErr = (result as Record<string, unknown>)?.error;
        if (rErr) {
          console.error(`[daily-digest] Resend rejected ${email}: ${JSON.stringify(rErr)}`);
          errors.push(`${email}: ${JSON.stringify(rErr)}`);
        } else {
          sentCount++;
        }
      } catch (sendErr: unknown) {
        const msg = sendErr instanceof Error ? sendErr.message : String(sendErr);
        console.error(`[daily-digest] Failed to send to ${email}: ${msg}`);
        errors.push(`${email}: ${msg}`);
      }
    }

    console.log(`[daily-digest] Done. Sent: ${sentCount}, Errors: ${errors.length}`);
    return new Response(JSON.stringify({ sent: sentCount, errors: errors.length, errorDetails: errors }), { headers: { "Content-Type": "application/json" } });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[daily-digest] Fatal error: ${msg}`);
    return new Response(JSON.stringify({ error: msg }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
});
