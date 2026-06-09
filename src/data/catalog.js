import { supabase } from "../lib/supabase";

/* ── Formatting ──────────────────────────────────────────────────────── */
export const CATEGORY_EMOJI = {
  Banking:"🏦",Protection:"🛡️",Savings:"💰",Credit:"📊",Tools:"🔧",Security:"🔒",Budgeting:"📋",
  Travel:"🌍",Investments:"📈",Lifestyle:"✨",Entertainment:"🎬",Insurance:"🛡️",Rewards:"🎁",
  Family:"👨‍👩‍👧",Currency:"💱",Card:"💳",Transfers:"🔄",Wellness:"🧘",Fitness:"💪",Creativity:"🎨",
  Productivity:"⚡",News:"📰",Workspace:"🖥️",Education:"📚",Sports:"⚽",Streaming:"📺",Hardware:"🖥️",
  Broadband:"📡",Automotive:"🚗",Food:"🍔",Shopping:"🛒",Energy:"⚡",EV:"🔌",Solar:"☀️",Heating:"🔥",
  Competition:"🏆","Smart Home":"🏠",
};
export const categoryEmoji = (c) => CATEGORY_EMOJI[c] || "✨";
export const providerInitials = (name) =>
  (name || "?").split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();

/* Category label from the `feature` classifier column. */
export const CATEGORY_LABEL = { feature: "Feature", perk: "Perk", competition: "Competition", discount: "Discount" };
export const categoryLabel = (feature) => CATEGORY_LABEL[feature] || "Perk";

/* ── Ordering ────────────────────────────────────────────────────────── */
/* Perks-page order: features → perks → competitions → discounts, alpha within. */
export const FEATURE_ORDER = { perk: 0, feature: 1, discount: 2, competition: 3 };
export function featureThenAlpha(a, b) {
  const fa = FEATURE_ORDER[a.feature] ?? 1;
  const fb = FEATURE_ORDER[b.feature] ?? 1;
  if (fa !== fb) return fa - fb;
  return (a.title || "").localeCompare(b.title || "");
}
/* Profile "Active Perks" order: perks → competitions → discounts → features. */
export const PROFILE_FEATURE_ORDER = { perk: 0, competition: 1, discount: 2, feature: 3 };

/* ── Tier prices: derived from perks.price (no `tiers` table exists) ───── */
export function buildTierMap(perks) {
  const m = {};
  perks.forEach((p) => {
    const key = `${p.provider}|${p.tier}`;
    const price = typeof p.price === "number" ? p.price : Number(p.price ?? 0) || 0;
    if (!(key in m) || price > m[key].price) {
      m[key] = { provider: p.provider, tier: p.tier, price };
    }
  });
  Object.values(m).forEach((t) => {
    t.price_label = t.price === 0 ? "Free" : `£${t.price}`;
    t.sort_order = t.price; // tiers ordered by price (low → high)
  });
  return m;
}

/* De-dupe across tiers (no tier selected): keep highest-tier instance. */
export function dedupeAcrossTiers(perks, tierMap) {
  const rank = (p) => tierMap[`${p.provider}|${p.tier}`]?.sort_order ?? (Number(p.price) || 0);
  const byKey = {};
  perks.forEach((p) => {
    const key = `${p.provider}|${(p.title || "").toLowerCase()}`;
    if (!byKey[key] || rank(p) > rank(byKey[key])) byKey[key] = p;
  });
  return Object.values(byKey);
}

/* Catalog: [{ provider, membership, tiers:[{tier,price,price_label,sort_order}] }]. */
export function buildMembershipCatalog(perks, tierMap) {
  const groups = {};
  perks.forEach((p) => {
    const key = `${p.provider}|${p.membership}`;
    if (!groups[key]) groups[key] = { provider: p.provider, membership: p.membership, tierSet: new Set() };
    groups[key].tierSet.add(p.tier);
  });
  return Object.values(groups).map((g) => ({
    provider: g.provider,
    membership: g.membership,
    tiers: [...g.tierSet]
      .map((t) => tierMap[`${g.provider}|${t}`] || { provider: g.provider, tier: t, price: 0, price_label: "Free", sort_order: 0 })
      .sort((a, b) => a.sort_order - b.sort_order),
  })).sort((a, b) => a.provider.localeCompare(b.provider));
}

export function monthlyCostOf(memberships, tierMap) {
  return memberships.reduce((sum, m) => sum + (tierMap[`${m.provider}|${m.tier}`]?.price ?? 0), 0);
}

/* ── Queries ─────────────────────────────────────────────────────────── */
export async function fetchAllPerks() {
  if (!supabase) return [];
  const { data, error } = await supabase.from("perks").select("*").order("title");
  if (error) throw new Error("PERKS_ERROR");
  return data || [];
}

export async function fetchUserMemberships(userId) {
  const { data, error } = await supabase
    .from("user_memberships").select("provider,membership,tier").eq("user_id", userId);
  if (error) throw new Error("MEMBERSHIPS_ERROR");
  return data || [];
}

export async function addMembership(userId, provider, membership, tier) {
  await supabase.from("user_memberships").delete().eq("user_id", userId).eq("provider", provider).eq("membership", membership);
  const { error } = await supabase.from("user_memberships").insert({ user_id: userId, provider, membership, tier });
  if (error) throw new Error("ADD_ERROR");
}

export async function removeMembership(userId, provider, membership) {
  const { error } = await supabase.from("user_memberships").delete().eq("user_id", userId).eq("provider", provider).eq("membership", membership);
  if (error) throw new Error("REMOVE_ERROR");
}

export async function requestMembership({ userId, name, description }) {
  const { error } = await supabase.from("membership_requests").insert({ user_id: userId || null, requester_name: name || null, description });
  if (error) throw new Error("REQUEST_ERROR");
}

/* ── Perk detail / usage (slide-out drawer) ──────────────────────────── */
const RESET_HUMAN = { WEEKLY: "Weekly", MONTHLY: "Monthly", ANNUALLY: "Annually", YEARLY: "Annually", NONE: "Doesn't reset" };
export const resetHuman = (p) => RESET_HUMAN[p] || (p ? p : "Doesn't reset");

/** Compute the next reset date from a frequency, starting now. */
export function nextResetFrom(resetPeriod, from = new Date()) {
  const d = new Date(from);
  switch ((resetPeriod || "NONE").toUpperCase()) {
    case "WEEKLY": d.setDate(d.getDate() + 7); return d;
    case "MONTHLY": d.setMonth(d.getMonth() + 1); return d;
    case "ANNUALLY": case "YEARLY": d.setFullYear(d.getFullYear() + 1); return d;
    default: return null;
  }
}

/** Current user's saved state for one perk (or null). */
export async function getUserPerkState(userId, perkId) {
  const { data } = await supabase
    .from("user_perk_state")
    .select("used, used_at, dismissed, last_used_at, will_not_use, next_reset_date")
    .eq("user_id", userId).eq("perk_id", perkId).maybeSingle();
  return data || null;
}

/** Mark a perk used: stamp last_used_at + recompute next_reset_date. */
export async function markPerkUsed(userId, perk) {
  const now = new Date();
  const next = nextResetFrom(perk.reset_period, now);
  const row = {
    user_id: userId, perk_id: perk.perk_id,
    used: true, used_at: now.toISOString(), last_used_at: now.toISOString(),
    will_not_use: false, dismissed: false,
    next_reset_date: next ? next.toISOString().slice(0, 10) : null,
    updated_at: now.toISOString(),
  };
  const { error } = await supabase.from("user_perk_state").upsert(row, { onConflict: "user_id,perk_id" });
  if (error) throw new Error("MARK_USED_ERROR");
  return row;
}

/** Will-not-use: set flag, clear last_used_at + next_reset_date. */
export async function markPerkWontUse(userId, perkId) {
  const row = {
    user_id: userId, perk_id: perkId,
    will_not_use: true, dismissed: true, used: false,
    used_at: null, last_used_at: null, next_reset_date: null,
    updated_at: new Date().toISOString(),
  };
  const { error } = await supabase.from("user_perk_state").upsert(row, { onConflict: "user_id,perk_id" });
  if (error) throw new Error("WONT_USE_ERROR");
  return row;
}
