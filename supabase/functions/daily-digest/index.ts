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
  return PROVIDER_META[provider]?.color ?? "#0B3D91";
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
  const op = dim ? "0.4" : "1";
  const strike = p.used ? "line-through" : "none";
  const tick = p.used ? "✅" : "⬜";
  const cat = categoryIcon(p.category);
  const letter = providerLetter(p.provider);
  const color = providerColor(p.provider);
  const tag = `<span style="display:inline-block;font-size:7px;font-weight:800;color:#64748B;background:#F1F5F9;border-radius:3px;padding:1px 3px;margin-left:3px;vertical-align:middle;text-transform:uppercase;line-height:1;">${featureTypeLabel(p.feature)}</span>`;
  const dateTd = showDate && p.next_reset_date
    ? `<td width="40" align="right" style="font-size:9px;color:#94A3B8;white-space:nowrap;vertical-align:middle;">${escHtml(new Date(p.next_reset_date).toLocaleDateString("en-GB", { day: "numeric", month: "short" }))}</td>`
    : "";

  return `<tr>
  <td style="padding:2px 8px;opacity:${op};">
    <table cellpadding="0" cellspacing="0" border="0" width="100%"><tr>
      <td width="26" style="font-size:12px;vertical-align:middle;white-space:nowrap;">${tick}${cat}</td>
      <td style="font-size:11px;line-height:1.3;vertical-align:middle;overflow:hidden;">
        <span style="color:#0F172A;font-weight:500;text-decoration:${strike};white-space:nowrap;">${escHtml(trunc(p.title))}</span>${tag}
      </td>
      ${dateTd}
      <td width="20" align="right" style="vertical-align:middle;">
        <div style="width:16px;height:16px;border-radius:4px;background:${color};text-align:center;line-height:16px;">
          <span style="color:#fff;font-size:8px;font-weight:900;">${escHtml(letter)}</span>
        </div>
      </td>
    </tr></table>
  </td>
</tr>`;
}

/* ═══════════════════════════════════════════════════════
   HTML EMAIL TEMPLATE
   ═══════════════════════════════════════════════════════ */

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
  /* ── Banner-style section divider ── */
  const divider = `
        <tr>
          <td style="padding:12px 0;">
            <table cellpadding="0" cellspacing="0" border="0" width="100%"><tr>
              <td style="height:4px;border-radius:2px;background:linear-gradient(90deg,#0B3D91,#1E90FF);font-size:0;line-height:0;">&nbsp;</td>
            </tr></table>
          </td>
        </tr>`;

  /* --- Summary counts --- */
  const summaryHtml = `
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:8px;">
    <tr>
      <td width="33%" align="center" style="padding:2px;">
        <div style="padding:8px 4px;border-radius:8px;background:#F0FDF4;border:1.5px solid #BBF7D0;text-align:center;">
          <div style="font-size:22px;font-weight:900;color:#10B981;">${d.available}</div>
          <div style="font-size:8px;font-weight:700;color:#065F46;text-transform:uppercase;">Available</div>
        </div>
      </td>
      <td width="33%" align="center" style="padding:2px;">
        <div style="padding:8px 4px;border-radius:8px;background:#EFF6FF;border:1.5px solid #BFDBFE;text-align:center;">
          <div style="font-size:22px;font-weight:900;color:#1E90FF;">${d.used}</div>
          <div style="font-size:8px;font-weight:700;color:#1E40AF;text-transform:uppercase;">Used</div>
        </div>
      </td>
      <td width="33%" align="center" style="padding:2px;">
        <div style="padding:8px 4px;border-radius:8px;background:#FEF2F2;border:1.5px solid #FECACA;text-align:center;">
          <div style="font-size:22px;font-weight:900;color:#EF4444;">${d.willNotUse}</div>
          <div style="font-size:8px;font-weight:700;color:#991B1B;text-transform:uppercase;">Won't use</div>
        </div>
      </td>
    </tr>
  </table>`;

  /* --- Membership box --- */
  const membershipRows = d.memberships.map((m) => `
    <tr>
      <td style="padding:3px 8px;">
        <table cellpadding="0" cellspacing="0" border="0" width="100%"><tr>
          <td width="24" style="vertical-align:middle;">
            <div style="width:20px;height:20px;border-radius:5px;background:${m.color};text-align:center;line-height:20px;">
              <span style="color:#fff;font-size:9px;font-weight:800;">${escHtml(providerInitials(m.provider))}</span>
            </div>
          </td>
          <td style="padding-left:5px;vertical-align:middle;">
            <span style="font-size:11px;font-weight:700;color:#0F172A;">${escHtml(m.provider)}</span>
            <span style="font-size:10px;color:#64748B;"> · ${escHtml(m.tier)}</span>
          </td>
        </tr></table>
      </td>
    </tr>`).join("");

  const membershipBoxHtml = `
  <table cellpadding="0" cellspacing="0" border="0" width="100%"
         style="margin-bottom:8px;border-radius:8px;overflow:hidden;border:1.5px solid #E2E8F0;background:#FAFBFC;">
    <tr><td style="padding:6px 8px 3px;font-size:9px;font-weight:800;color:#64748B;text-transform:uppercase;">💳 Your memberships</td></tr>
    ${membershipRows}
    <tr><td style="height:4px;"></td></tr>
  </table>`;

  /* ─────────────────────────────────────────────────────
     SECTION 1: What to Use Today + Missing Out
     These two boxes are IDENTICAL components.
     ───────────────────────────────────────────────────── */

  // LEFT: What to Use Today — perks + features only
  let leftBox = "";
  if (d.whatToUseToday.length > 0) {
    const rows = d.whatToUseToday.map((p) => perkRow(p, true)).join("");
    leftBox = actionBox("🔥", "Use today", "Time-sensitive perks", rows);
  } else {
    leftBox = actionBox("✅", "All caught up", "Nothing urgent today", `
    <tr><td style="padding:8px;text-align:center;">
      <div style="font-size:16px;">🎉</div>
      <div style="font-size:10px;color:#065F46;font-weight:600;">You're on top of it!</div>
    </td></tr>`);
  }

  // RIGHT: Missing Out — ONLY unselected membership summaries
  let rightBox = "";
  if (d.missingMemberships.length > 0) {
    const membershipRows = d.missingMemberships.map((m) => {
      const color = providerColor(m.provider);
      const letter = providerLetter(m.provider);
      const catIcons = m.topCategories.map((c) => categoryIcon(c)).join("");
      return `<tr>
  <td style="padding:2px 8px;">
    <table cellpadding="0" cellspacing="0" border="0" width="100%"><tr>
      <td width="26" style="font-size:12px;vertical-align:middle;white-space:nowrap;">⬜${catIcons ? catIcons.charAt(0) + catIcons.charAt(1) : "📦"}</td>
      <td style="font-size:11px;line-height:1.3;vertical-align:middle;">
        <span style="color:#0F172A;font-weight:500;">${escHtml(trunc(m.provider, 18))}</span>
        <span style="display:inline-block;font-size:7px;font-weight:800;color:#64748B;background:#F1F5F9;border-radius:3px;padding:1px 3px;margin-left:3px;vertical-align:middle;text-transform:uppercase;line-height:1;">${m.perkCount} perks</span>
      </td>
      <td width="40" align="right" style="font-size:9px;color:#94A3B8;vertical-align:middle;white-space:nowrap;">${escHtml(trunc(m.tier, 10))}</td>
      <td width="20" align="right" style="vertical-align:middle;">
        <div style="width:16px;height:16px;border-radius:4px;background:${color};text-align:center;line-height:16px;">
          <span style="color:#fff;font-size:8px;font-weight:900;">${escHtml(letter)}</span>
        </div>
      </td>
    </tr></table>
  </td>
</tr>`;
    }).join("");
    rightBox = actionBox("👀", "Missing out", "Memberships not added", membershipRows);
  } else {
    rightBox = actionBox("🎉", "Fully loaded", "All memberships added", `
    <tr><td style="padding:8px;text-align:center;">
      <div style="font-size:16px;">💪</div>
      <div style="font-size:10px;color:#065F46;font-weight:600;">Every membership activated!</div>
    </td></tr>`);
  }

  const section1Html = `
  <table cellpadding="0" cellspacing="0" border="0" width="100%">
    <tr>
      <td width="50%" style="vertical-align:top;padding-right:5px;">${leftBox}</td>
      <td width="50%" style="vertical-align:top;padding-left:5px;">${rightBox}</td>
    </tr>
  </table>`;

  /* ─────────────────────────────────────────────────────
     SECTION 2: Where to Use Next (themed question boxes)
     ───────────────────────────────────────────────────── */
  let section2Html = "";
  if (d.momentBoxes.length > 0) {
    const boxes = d.momentBoxes.map((box) => {
      const usedN = box.items.filter((p) => p.used).length;
      const rows = box.items.map((p) => perkRow(p, true)).join("");
      return `
      <table cellpadding="0" cellspacing="0" border="0" width="100%"
             style="margin-bottom:8px;border-radius:8px;overflow:hidden;border:1px solid #E2E8F0;">
        <tr>
          <td style="padding:8px 10px 4px;background:#F8FAFC;border-bottom:1px solid #E2E8F0;">
            <div style="font-size:12px;font-weight:800;color:#0F172A;">${box.emoji} ${escHtml(box.question)}</div>
            <div style="font-size:9px;color:#64748B;">${usedN}/${box.items.length} used</div>
          </td>
        </tr>
        ${rows}
        <tr><td style="height:3px;"></td></tr>
      </table>`;
    }).join("");

    section2Html = `
      <div style="font-size:13px;font-weight:900;color:#0F172A;padding:0 0 6px;">Where to use next</div>
      ${boxes}`;
  }

  /* ─────────────────────────────────────────────────────
     SECTION 3: All Perks by Category
     ───────────────────────────────────────────────────── */
  const section3Html = d.categoryGrouped.map((g) => {
    const rows = g.items.map((p) => perkRow(p, true)).join("");
    return `
    <table cellpadding="0" cellspacing="0" border="0" width="100%"
           style="margin-bottom:6px;border-radius:7px;overflow:hidden;border:1px solid #E2E8F0;">
      <tr>
        <td style="padding:6px 10px;background:#F8FAFC;border-bottom:1px solid #E2E8F0;">
          <span style="font-size:11px;font-weight:800;color:#0F172A;">${g.icon} ${escHtml(g.category)}</span>
          <span style="font-size:9px;color:#94A3B8;margin-left:3px;">${g.items.length}</span>
        </td>
      </tr>
      ${rows}
      <tr><td style="height:3px;"></td></tr>
    </table>`;
  }).join("");

  /* --- Top unselected memberships --- */
  let topUnselectedHtml = "";
  if (d.topUnselectedMemberships.length > 0) {
    const rows = d.topUnselectedMemberships.map((m) => `
      <tr><td style="padding:3px 8px;">
        <table cellpadding="0" cellspacing="0" border="0" width="100%"><tr>
          <td width="24" style="vertical-align:middle;">
            <div style="width:20px;height:20px;border-radius:5px;background:${m.color};text-align:center;line-height:20px;">
              <span style="color:#fff;font-size:9px;font-weight:800;">${escHtml(providerInitials(m.provider))}</span>
            </div>
          </td>
          <td style="padding-left:5px;vertical-align:middle;">
            <span style="font-size:11px;font-weight:700;color:#0F172A;">${escHtml(m.provider)}</span>
            <span style="font-size:9px;color:#64748B;"> · ${escHtml(m.tier)} · ${m.perkCount} perks</span>
          </td>
        </tr></table>
      </td></tr>`).join("");

    topUnselectedHtml = `
    <table cellpadding="0" cellspacing="0" border="0" width="100%"
           style="margin-bottom:8px;border-radius:8px;overflow:hidden;border:1.5px solid #E2E8F0;background:#FAFBFC;">
      <tr><td style="padding:6px 8px 3px;font-size:9px;font-weight:800;color:#64748B;text-transform:uppercase;">🌟 Memberships you might like</td></tr>
      ${rows}
      <tr><td style="padding:4px 8px 6px;"><div style="font-size:9px;color:#1E90FF;font-weight:600;">Add in the Perki app →</div></td></tr>
    </table>`;
  }

  /* ══════════════════════════════════════════════════════
     FULL EMAIL ASSEMBLY
     ══════════════════════════════════════════════════════ */
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Perki Daily Digest</title>
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
</head>
<body style="margin:0;padding:0;background:#F1F5F9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#F1F5F9;">
    <tr><td align="center" style="padding:12px 6px 20px;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:600px;background:#FFFFFF;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(15,23,42,0.06);">

        <!-- ═══ BANNER ═══ -->
        <tr>
          <td bgcolor="#0B3D91" style="background:#0B3D91;background:linear-gradient(135deg,#0B3D91 0%,#1E90FF 100%);padding:16px 12px 14px;text-align:center;">
            <!--[if mso]><v:rect xmlns:v="urn:schemas-microsoft-com:vml" fill="true" stroke="false" style="width:600px;height:60px;"><v:fill type="gradient" color="#0B3D91" color2="#1E90FF" angle="135"/><v:textbox inset="0,0,0,0" style="mso-fit-shape-to-text:true;"><![endif]-->
            <div style="font-size:22px;font-weight:900;color:#FFFFFF;letter-spacing:-0.5px;">
              <span style="display:inline-block;width:26px;height:26px;background:rgba(255,255,255,0.25);border-radius:7px;text-align:center;line-height:26px;font-size:14px;font-weight:900;vertical-align:middle;margin-right:5px;">P</span>
              Perki
            </div>
            <div style="font-size:10px;color:rgba(255,255,255,0.85);margin-top:3px;font-weight:500;">Your Daily Membership Digest</div>
            <!--[if mso]></v:textbox></v:rect><![endif]-->
          </td>
        </tr>

        <!-- ═══ GREETING ═══ -->
        <tr>
          <td style="padding:12px 10px 6px;">
            <div style="font-size:16px;font-weight:900;color:#0F172A;">Hi ${escHtml(d.name)}! 👋</div>
            <div style="font-size:10px;color:#64748B;margin-top:1px;">${escHtml(d.dateStr)}</div>
          </td>
        </tr>

        <!-- ═══ SUMMARY COUNTS ═══ -->
        <tr><td style="padding:0 10px 4px;">${summaryHtml}</td></tr>

        <!-- ═══ YOUR MEMBERSHIPS ═══ -->
        <tr><td style="padding:0 10px;">${membershipBoxHtml}</td></tr>

        ${divider}

        <!-- ═══ SECTION 1: Use Today + Missing Out ═══ -->
        <tr><td style="padding:0 10px;">${section1Html}</td></tr>

        ${divider}

        <!-- ═══ SECTION 2: Where to Use Next ═══ -->
        ${section2Html ? `<tr><td style="padding:0 10px;">${section2Html}</td></tr>` : ""}

        ${section2Html ? divider : ""}

        <!-- ═══ MEMBERSHIPS YOU MIGHT LIKE ═══ -->
        ${topUnselectedHtml ? `<tr><td style="padding:0 10px;">${topUnselectedHtml}</td></tr>` : ""}

        ${topUnselectedHtml ? divider : ""}

        <!-- ═══ SECTION 3: All Perks by Category ═══ -->
        <tr>
          <td style="padding:0 10px;">
            <div style="font-size:13px;font-weight:900;color:#0F172A;padding:0 0 6px;">All your perks by category</div>
            ${section3Html}
          </td>
        </tr>

        ${divider}

        <!-- ═══ FOOTER ═══ -->
        <tr>
          <td style="background:#F8FAFC;padding:12px 14px;border-top:1px solid #E2E8F0;text-align:center;">
            <div style="font-size:9px;color:#94A3B8;line-height:1.4;">
              You're receiving this because you have active memberships on
              <a href="https://perki.app" style="color:#1E90FF;text-decoration:none;font-weight:600;">Perki</a>.
              <br/>To stop these emails, update your preferences in the app.
            </div>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

/* ═══════════════════════════════════════════════════════
   EMAIL BUILDER
   ═══════════════════════════════════════════════════════ */

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
      const cronSecret = Deno.env.get("cron_secret");
      const header = req.headers.get("x-cron-secret");
      console.log("[daily-digest] Auth check — secret set:", !!cronSecret, "header set:", !!header);
      if (!cronSecret || header !== cronSecret) {
        return new Response("Unauthorized", { status: 401 });
      }
    }

    const today = new Date();
    console.log(`[daily-digest] Starting ${isPreview ? "PREVIEW" : "production"} digest for ${todayFormatted(today)}`);

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
        await resend.emails.send({ from: FROM_EMAIL, to: sendTo, subject: `[PREVIEW] Perki Digest for ${name} — ${todayFormatted(today)}`, html });
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
        await resend.emails.send({ from: FROM_EMAIL, to: email, subject: `Your Perki Digest — ${todayFormatted(today)}`, html });
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
