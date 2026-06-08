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

type TierPriceMap = Record<string, { price: number }>;

function buildTierPriceMap(perks: Perk[]): TierPriceMap {
  const m: TierPriceMap = {};
  for (const p of perks) {
    const key = `${p.provider}|${p.tier}`;
    if (!m[key]) m[key] = { price: p.price ?? 999 };
  }
  return m;
}

function getProviderTierOrder(provider: string, tp: TierPriceMap): string[] {
  return Object.entries(tp)
    .filter(([k]) => k.startsWith(`${provider}|`))
    .map(([k, v]) => ({ tier: k.split("|")[1], price: v.price }))
    .sort((a, b) => a.price - b.price)
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

/* ── EMAIL TEMPLATE ── */

interface EmailData {
  name: string;
  dateStr: string;
  available: number;
  used: number;
  willNotUse: number;
  memberships: { provider: string; tier: string; color: string; renewal: string }[];
  whatToUseToday: EnrichedPerk[];
  momentBoxes: MomentBox[];
  categoryGrouped: { category: string; icon: string; items: EnrichedPerk[] }[];
  missingMemberships: MissingMembership[];
  topUnselectedMemberships: TopUnselectedMembership[];
}

/** Shared card wrapper — both action boxes use this */
function actionBox(icon: string, title: string, subtitle: string, body: string): string {
  return `
  <table cellpadding="0" cellspacing="0" border="0" width="100%"
         style="border-radius:10px;overflow:hidden;border:1.5px solid #FDE68A;background:linear-gradient(180deg,#FFFBEB,#FFFFFF 28px);">
    <tr>
      <td style="padding:8px 8px 3px;">
        <div style="font-size:12px;font-weight:900;color:#92400E;">${icon} ${escHtml(title)}</div>
        <div style="font-size:9px;color:#B45309;margin-top:1px;">${escHtml(subtitle)}</div>
      </td>
    </tr>
    ${body}
    <tr><td style="height:4px;"></td></tr>
  </table>`;
}

function buildEmailHtml(d: EmailData): string {
  const APP = "https://perki.app";
  const card = "background:#FFFFFF;border:1px solid #E4DDCB;border-radius:12px;";
  const h = "font-family:'Outfit','Helvetica Neue',Arial,sans-serif;";
  const b = "font-family:'Work Sans','Helvetica Neue',Arial,sans-serif;";
  const PROVIDER_LOGO: Record<string, string> = { "OVO Energy": "https://logo.clearbit.com/ovoenergy.com", "OVO": "https://logo.clearbit.com/ovoenergy.com" };
  const tileInner = (provider: string) => PROVIDER_LOGO[provider]
    ? `<img src="${PROVIDER_LOGO[provider]}" alt="${escHtml(provider)} logo" width="18" height="18" style="display:inline-block;width:18px;height:18px;object-fit:contain;vertical-align:middle;border:0;"/>`
    : `<span style="${h}font-size:11px;font-weight:800;color:#2B2A6E;">${escHtml(providerInitials(provider))}</span>`;

  /* 2. Dashboard */
  const headline = d.available > 0 ? `${d.available} ${d.available === 1 ? "perk" : "perks"} ready to use` : "You are all caught up";
  const memCount = d.memberships.length;
  const tile = (val: string, label: string, hi: boolean) => `
    <td width="25%" style="padding:4px;vertical-align:top;">
      <div style="background:${hi ? "#F7ECD4" : "#FCFAF4"};border:1px solid ${hi ? "#E0A93B" : "#E4DDCB"};border-radius:10px;text-align:center;padding:12px 4px;">
        <div style="${h}font-size:22px;font-weight:800;color:${hi ? "#B07C1A" : "#2B2A6E"};">${val}</div>
        <div style="${b}font-size:10px;font-weight:600;color:#6B6757;padding-top:2px;">${label}</div>
      </div>
    </td>`;
  const dashboard = `
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="${card}">
      <tr><td style="padding:18px 18px 4px;">
        <div style="${h}font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#B07C1A;">Your dashboard</div>
        <div style="${h}font-size:22px;font-weight:800;color:#23202A;padding-top:3px;">${escHtml(headline)}</div>
        <div style="${b}font-size:13px;color:#6B6757;padding-top:3px;">Across your ${memCount} ${memCount === 1 ? "membership" : "memberships"}.</div>
      </td></tr>
      <tr><td style="padding:10px 14px 18px;">
        <table cellpadding="0" cellspacing="0" border="0" width="100%"><tr>
          ${tile(String(d.available), "Available", true)}
          ${tile(String(d.used), "Used", false)}
          ${tile(String(d.willNotUse), "Set aside", false)}
          ${tile(String(memCount), memCount === 1 ? "Membership" : "Memberships", false)}
        </tr></table>
      </td></tr>
    </table>`;

  /* 3. Your memberships */
  const memRows = d.memberships.map((m, i) => `
    <tr><td style="padding:12px 16px;${i < d.memberships.length - 1 ? "border-bottom:1px solid #EFE9DA;" : ""}">
      <table cellpadding="0" cellspacing="0" border="0" width="100%"><tr>
        <td width="34" style="vertical-align:middle;"><div style="width:30px;height:30px;border-radius:8px;background:#FFFFFF;border:1px solid #E4DDCB;text-align:center;line-height:30px;">${tileInner(m.provider)}</div></td>
        <td style="padding-left:10px;vertical-align:middle;"><span style="${b}font-size:14px;font-weight:600;color:#23202A;">${escHtml(m.provider)}</span><span style="${b}font-size:12px;color:#6B6757;"> &middot; ${escHtml(m.tier)}</span></td>
        <td align="right" style="vertical-align:middle;"><span style="${b}font-size:10px;font-weight:700;color:#B07C1A;background:#F7ECD4;border-radius:20px;padding:3px 10px;">Active</span></td>
      </tr></table>
    </td></tr>`).join("");
  const memberships = d.memberships.length > 0
    ? `<table cellpadding="0" cellspacing="0" border="0" width="100%" style="${card}">${memRows}</table>`
    : `<table cellpadding="0" cellspacing="0" border="0" width="100%" style="${card}"><tr><td style="padding:18px;text-align:center;${b}font-size:13px;color:#6B6757;">No memberships added yet. Add one and your perks appear here.</td></tr></table>`;

  /* 4. What to use today */
  const todayCard = (p: EnrichedPerk) => {
    const reset = p.next_reset_date
      ? `resets ${new Date(p.next_reset_date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`
      : p.reset_period === "WEEKLY" ? "resets weekly" : p.reset_period === "MONTHLY" ? "resets monthly" : "available now";
    return `<table cellpadding="0" cellspacing="0" border="0" width="100%" style="${card}margin-bottom:10px;"><tr>
      <td width="44" style="padding:14px 0 14px 14px;vertical-align:middle;"><div style="width:34px;height:34px;border-radius:9px;background:#F7ECD4;text-align:center;line-height:34px;font-size:16px;">${categoryIcon(p.category)}</div></td>
      <td style="padding:12px;vertical-align:middle;"><div style="${b}font-size:14px;font-weight:600;color:#23202A;">${escHtml(trunc(p.title, 30))}</div><div style="${b}font-size:12px;color:#6B6757;">${escHtml(p.provider)} &middot; ${reset}</div></td>
      <td align="right" style="padding:12px 14px;vertical-align:middle;"><a href="${APP}" style="${b}font-size:12px;font-weight:700;color:#FFFFFF;background:#2B2A6E;border-radius:8px;padding:8px 14px;display:inline-block;">Open</a></td>
    </tr></table>`;
  };
  const today = d.whatToUseToday.length > 0
    ? d.whatToUseToday.slice(0, 6).map(todayCard).join("")
    : `<table cellpadding="0" cellspacing="0" border="0" width="100%" style="${card}"><tr><td style="padding:18px;text-align:center;${b}font-size:13px;color:#6B6757;">Nothing urgent today. You are on top of it.</td></tr></table>`;

  /* 5. Worth adding */
  const wa = d.topUnselectedMemberships.slice(0, 2);
  const waCard = (m: TopUnselectedMembership) => `
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="${card}"><tr><td style="padding:14px;">
      <table cellpadding="0" cellspacing="0" border="0"><tr>
        <td style="vertical-align:middle;"><div style="width:30px;height:30px;border-radius:8px;background:#FFFFFF;border:1px solid #E4DDCB;text-align:center;line-height:30px;">${tileInner(m.provider)}</div></td>
        <td style="padding-left:9px;vertical-align:middle;"><span style="${b}font-size:14px;font-weight:600;color:#23202A;">${escHtml(m.provider)}</span></td>
      </tr></table>
      <div style="${b}font-size:12px;color:#6B6757;padding:10px 0 6px;">Adds ${m.perkCount} ${m.perkCount === 1 ? "perk" : "perks"} you would actually use.</div>
      <a href="${APP}" style="${b}font-size:12px;font-weight:700;color:#2B2A6E;background:#F7ECD4;border:1px solid #E0A93B;border-radius:8px;padding:8px 14px;display:inline-block;">Add membership</a>
    </td></tr></table>`;
  const worthAdding = wa.length === 0 ? "" : `
    <tr><td class="px" style="padding:18px 8px 6px;">
      <div style="${h}font-size:17px;font-weight:700;color:#23202A;padding-bottom:3px;">Worth adding</div>
      <div style="${b}font-size:13px;color:#6B6757;padding-bottom:10px;">Memberships that would unlock more of what you already use.</div>
      <table cellpadding="0" cellspacing="0" border="0" width="100%"><tr>
        <td class="stack stack-mb" width="50%" style="vertical-align:top;padding-right:5px;">${waCard(wa[0])}</td>
        <td class="stack" width="50%" style="vertical-align:top;padding-left:5px;">${wa[1] ? waCard(wa[1]) : ""}</td>
      </tr></table>
    </td></tr>`;

  /* 6. Where to use next */
  const topCats = [...d.categoryGrouped].sort((a, b2) => b2.items.length - a.items.length).slice(0, 3);
  const catTile = (g: { category: string; icon: string; items: EnrichedPerk[] }) => `
    <td class="stack stack-mb" width="33.33%" style="vertical-align:top;padding:0 4px;">
      <a href="${APP}" style="display:block;${card}padding:14px;text-align:center;">
        <div style="font-size:22px;">${g.icon}</div>
        <div style="${b}font-size:13px;font-weight:600;color:#23202A;padding-top:5px;">${escHtml(g.category)}</div>
        <div style="${b}font-size:11px;color:#6B6757;">${g.items.length} ${g.items.length === 1 ? "perk" : "perks"}</div>
      </a>
    </td>`;
  const whereNext = topCats.length === 0 ? "" : `
    <tr><td class="px" style="padding:18px 8px 6px;">
      <div style="${h}font-size:17px;font-weight:700;color:#23202A;padding-bottom:3px;">Where to use next</div>
      <div style="${b}font-size:13px;color:#6B6757;padding-bottom:10px;">Browse by category, the way you would on the marketplace.</div>
      <table cellpadding="0" cellspacing="0" border="0" width="100%"><tr>${topCats.map(catTile).join("")}</tr></table>
    </td></tr>`;

  /* 7. All perks by category */
  const catCards = d.categoryGrouped.map((g) => `
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="${card}margin-bottom:10px;">
      <tr><td style="padding:12px 16px;border-bottom:1px solid #EFE9DA;">
        <span style="font-size:15px;">${g.icon}</span><span style="${h}font-size:14px;font-weight:700;color:#23202A;padding-left:8px;">${escHtml(g.category)}</span><span style="${b}font-size:11px;font-weight:700;color:#B07C1A;background:#F7ECD4;border-radius:20px;padding:2px 9px;margin-left:8px;">${g.items.length}</span>
      </td></tr>
      ${g.items.map((p) => perkRow(p, true)).join("")}
      <tr><td style="height:6px;"></td></tr>
    </table>`).join("");

  /* Assembly */
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
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@600;700;800&family=Work+Sans:wght@400;500;600;700&display=swap');
  body,table,td,a{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;}
  table,td{mso-table-lspace:0pt;mso-table-rspace:0pt;}
  img{-ms-interpolation-mode:bicubic;border:0;}
  body{margin:0;padding:0;width:100%!important;background:#F4F0E6;}
  a{text-decoration:none;}
  @media only screen and (max-width:600px){
    .container{width:100%!important;}
    .px{padding-left:18px!important;padding-right:18px!important;}
    .stack{display:block!important;width:100%!important;box-sizing:border-box;}
    .stack-mb{margin-bottom:10px!important;}
  }
</style>
</head>
<body style="margin:0;padding:0;background:#F4F0E6;">
<span style="display:none!important;visibility:hidden;opacity:0;color:transparent;height:0;width:0;overflow:hidden;mso-hide:all;">Here is what is worth a tap this morning.</span>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#F4F0E6;"><tr><td align="center" style="padding:20px 12px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" class="container" style="width:600px;max-width:600px;">

  <tr><td class="px" style="padding:4px 8px 14px;">
    <table cellpadding="0" cellspacing="0" border="0" width="100%"><tr>
      <td align="left" style="vertical-align:middle;"><table cellpadding="0" cellspacing="0" border="0"><tr>
        <td style="vertical-align:middle;"><div style="width:30px;height:30px;border-radius:8px;background:#2B2A6E;text-align:center;line-height:30px;"><span style="${h}color:#E0A93B;font-size:16px;font-weight:800;">P</span></div></td>
        <td style="vertical-align:middle;padding-left:9px;"><span style="${h}font-size:19px;font-weight:800;color:#23202A;">Perki</span></td>
      </tr></table></td>
      <td align="right" style="vertical-align:middle;"><span style="${b}font-size:12px;color:#6B6757;">${escHtml(d.dateStr)}</span></td>
    </tr></table>
  </td></tr>

  <tr><td class="px" style="padding:0 8px 16px;">
    <div style="${h}font-size:26px;line-height:32px;font-weight:800;color:#23202A;margin-bottom:8px;">Morning, ${escHtml(d.name)}.</div>
    <div style="${b}font-size:15px;line-height:23px;color:#6B6757;">Here is everything you are already paying for, lined up and ready. A few perks reset this week, so they are the ones worth grabbing first. Two minutes now, real value back.</div>
  </td></tr>

  <tr><td class="px" style="padding:0 8px 10px;">${dashboard}</td></tr>

  <tr><td class="px" style="padding:16px 8px 6px;">
    <div style="${h}font-size:17px;font-weight:700;color:#23202A;padding-bottom:10px;">Your memberships</div>
    ${memberships}
  </td></tr>

  <tr><td class="px" style="padding:18px 8px 6px;">
    <div style="${h}font-size:17px;font-weight:700;color:#23202A;padding-bottom:3px;">What to use today</div>
    <div style="${b}font-size:13px;color:#6B6757;padding-bottom:10px;">Resetting or expiring soon. Worth a tap before they roll over.</div>
    ${today}
  </td></tr>

  ${worthAdding}
  ${whereNext}

  <tr><td class="px" style="padding:18px 8px 6px;">
    <div style="${h}font-size:17px;font-weight:700;color:#23202A;padding-bottom:10px;">All your perks by category</div>
    ${catCards}
  </td></tr>

  <tr><td class="px" align="center" style="padding:22px 8px 8px;">
    <a href="${APP}" style="${b}font-size:14px;font-weight:700;color:#FFFFFF;background:#2B2A6E;border-radius:10px;padding:13px 28px;display:inline-block;">Open Perki</a>
  </td></tr>

  <tr><td class="px" align="center" style="padding:18px 8px 8px;">
    <div style="${b}font-size:12px;color:#6B6757;line-height:18px;">Read-only. We never move your money.</div>
    <div style="${b}font-size:12px;color:#6B6757;line-height:20px;padding-top:8px;"><a href="${APP}" style="color:#B07C1A;font-weight:600;">Manage preferences</a> &nbsp;&middot;&nbsp; <a href="${APP}" style="color:#B07C1A;font-weight:600;">Unsubscribe</a></div>
    <div style="${b}font-size:11px;color:#9A9482;padding-top:10px;">Perki &middot; London, UK</div>
  </td></tr>

</table>
</td></tr></table>
</body>
</html>`;
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

  const providersSeen = new Set<string>();
  const membershipSummary = userMemberships
    .filter((m) => { if (providersSeen.has(m.provider)) return false; providersSeen.add(m.provider); return true; })
    .map((m) => ({
      provider: m.provider,
      tier: getHighestTier(m.provider, userMemberships.filter((x) => x.provider === m.provider).map((x) => x.tier), tierPrices),
      color: providerColor(m.provider),
      renewal: "",
    }));

  const whatToUseToday = buildWhatToUseToday(perks);
  const momentBoxes = buildMomentBoxes(perks, today);

  const byCat: Record<string, EnrichedPerk[]> = {};
  for (const p of perks) { const cat = p.category ?? "Other"; (byCat[cat] ??= []).push(p); }
  const categoryGrouped = Object.entries(byCat)
    .map(([category, items]) => ({ category, icon: categoryIcon(category), items: items.sort(featureRankSort) }))
    .sort((a, b) => a.category.localeCompare(b.category));

  const missingMemberships = buildMissingMemberships(userMemberships, allPerks, tierPrices);
  const topUnselectedMemberships = buildTopUnselectedMemberships(userMemberships, perks, allPerks, tierPrices);

  const html = buildEmailHtml({
    name,
    dateStr: todayFormatted(today),
    available: availableCount,
    used: usedCount,
    willNotUse: willNotUseCount,
    memberships: membershipSummary,
    whatToUseToday,
    momentBoxes,
    categoryGrouped,
    missingMemberships,
    topUnselectedMemberships,
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
      const cronSecret = Deno.env.get("CRON_SECRET");
      const header = req.headers.get("authorization");
      console.log("[daily-digest] Auth check — secret set:", !!cronSecret, "header set:", !!header);
      if (!cronSecret || header !== `Bearer ${cronSecret}`) {
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
      const { data: perkStatesRaw } = await supabase.from("user_perk_state").select("perk_id, used, dismissed").eq("user_id", previewUserId);
      const perkStates: PerkState[] = (perkStatesRaw ?? []).map((r) => ({ perk_id: r.perk_id, used: r.used ?? false, dismissed: r.dismissed ?? false }));

      const { html, name } = buildDigestForUser(previewUserId, userMemberships, allPerks as Perk[], tierPrices, perkStates, fullName, authEmail, today);
      const sendTo = (body.email as string) ?? authEmail;
      console.log(`[daily-digest] Preview: sending ${name}'s digest to ${sendTo}`);
      try {
        await resend.emails.send({ from: FROM_EMAIL, to: sendTo, subject: `[PREVIEW] Perki for ${name}, ${todayFormatted(today)}`, html });
      } catch (sendErr: unknown) {
        const msg = sendErr instanceof Error ? sendErr.message : String(sendErr);
        return new Response(JSON.stringify({ mode: "preview", error: `Failed to send: ${msg}` }), { status: 500, headers: { "Content-Type": "application/json" } });
      }
      return new Response(JSON.stringify({ mode: "preview", sent: 1, sentTo: sendTo, userId: previewUserId, userName: name }), { headers: { "Content-Type": "application/json" } });
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

    const { data: perkStatesRaw } = await supabase.from("user_perk_state").select("user_id, perk_id, used, dismissed").in("user_id", eligibleUserIds);
    const perkStatesByUser: Record<string, PerkState[]> = {};
    for (const row of perkStatesRaw ?? []) {
      (perkStatesByUser[row.user_id] ??= []).push({ perk_id: row.perk_id, used: row.used ?? false, dismissed: row.dismissed ?? false });
    }

    let sentCount = 0;
    const errors: string[] = [];
    for (const userId of eligibleUserIds) {
      const email = emailMap[userId];
      if (!email) continue;
      const { html, name } = buildDigestForUser(userId, membershipsByUser[userId], allPerks as Perk[], tierPrices, perkStatesByUser[userId] ?? [], profileNameMap[userId] ?? authNameMap[userId] ?? null, email, today);
      try {
        await resend.emails.send({ from: FROM_EMAIL, to: email, subject: `Your Perki for ${todayFormatted(today)}`, html });
        sentCount++;
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
