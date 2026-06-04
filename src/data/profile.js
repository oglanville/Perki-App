import { supabase } from "../lib/supabase";

/**
 * @typedef {Object} Membership
 * @property {string} provider
 * @property {string} membership
 * @property {string} tier
 * @property {number|null} price
 *
 * @typedef {Object} PerkRow
 * @property {string} perk_id
 * @property {string} provider
 * @property {string} membership
 * @property {string} tier
 * @property {string} title
 * @property {string} description
 * @property {string} category
 * @property {string} reset_period
 *
 * @typedef {Object} ProfileBundle
 * @property {{id:string,full_name:string|null,email:string|null,avatar_url:string|null,created_at:string|null,membership_status:string}} profile
 * @property {Membership[]} memberships
 * @property {number} monthlyCost
 * @property {{willUse:number,wontUse:number}} counts
 * @property {PerkRow[]} willUse
 * @property {PerkRow[]} wontUse
 * @property {PerkRow[]} activated
 * @property {PerkRow[]} saved
 * @property {"supabase"} source
 */

/** Identify the logged-in user. Throws a friendly error if not signed in / not configured. */
export async function getCurrentUser() {
  if (!supabase) throw new Error("NOT_CONFIGURED");
  const { data, error } = await supabase.auth.getUser();
  if (error) throw new Error("AUTH_ERROR");
  if (!data?.user) throw new Error("NOT_SIGNED_IN");
  return data.user;
}

/** Fetch the profile row, falling back to auth metadata for null fields. */
export async function fetchProfile(user) {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, avatar_url, created_at")
    .eq("id", user.id)
    .single();
  if (error && error.code !== "PGRST116") throw new Error("PROFILE_ERROR");
  const meta = user.user_metadata || {};
  return {
    id: user.id,
    full_name: data?.full_name || meta.full_name || (user.email ? user.email.split("@")[0] : null),
    email: data?.email || user.email || null,
    avatar_url: data?.avatar_url || meta.avatar_url || null,
    created_at: data?.created_at || user.created_at || null,
  };
}

/** Active memberships for the user. */
export async function fetchMemberships(userId) {
  const { data, error } = await supabase
    .from("user_memberships")
    .select("provider, membership, tier")
    .eq("user_id", userId);
  if (error) throw new Error("MEMBERSHIPS_ERROR");
  return data || [];
}

/** Tier price map keyed by `provider|tier`. */
export async function fetchTierPrices() {
  const { data, error } = await supabase.from("tiers").select("provider, tier, price");
  if (error) return {}; // non-fatal: monthly cost just shows as unavailable
  const map = {};
  (data || []).forEach((t) => { map[`${t.provider}|${t.tier}`] = t.price ?? null; });
  return map;
}

/** Per-user perk state rows. */
export async function fetchPerkState(userId) {
  const { data, error } = await supabase
    .from("user_perk_state")
    .select("perk_id, used, dismissed")
    .eq("user_id", userId);
  if (error) throw new Error("STATE_ERROR");
  return data || [];
}

/** Hydrate perk rows for a set of perk_ids. */
export async function fetchPerksByIds(ids) {
  if (!ids.length) return [];
  const { data, error } = await supabase
    .from("perks")
    .select("perk_id, provider, membership, tier, title, description, category, reset_period")
    .in("perk_id", ids);
  if (error) throw new Error("PERKS_ERROR");
  return data || [];
}

/** Perks unlocked by the user's active memberships ("activated"). */
export async function fetchActivatedPerks(memberships) {
  if (!memberships.length) return [];
  const providers = [...new Set(memberships.map((m) => m.provider))];
  const { data, error } = await supabase
    .from("perks")
    .select("perk_id, provider, membership, tier, title, description, category, reset_period")
    .in("provider", providers);
  if (error) throw new Error("PERKS_ERROR");
  const set = new Set(memberships.map((m) => `${m.provider}|${m.tier}`));
  return (data || []).filter((p) => set.has(`${p.provider}|${p.tier}`));
}

/** Orchestrator: assembles the full profile bundle in parallel where possible. */
export async function fetchProfileBundle() {
  const user = await getCurrentUser();
  const [profile, memberships, tierPrices, state] = await Promise.all([
    fetchProfile(user),
    fetchMemberships(user.id),
    fetchTierPrices(),
    fetchPerkState(user.id),
  ]);

  const usedIds = state.filter((s) => s.used).map((s) => s.perk_id);
  const dismissedIds = state.filter((s) => s.dismissed).map((s) => s.perk_id);

  const [statePerks, activated] = await Promise.all([
    fetchPerksByIds([...new Set([...usedIds, ...dismissedIds])]),
    fetchActivatedPerks(memberships),
  ]);
  const byId = Object.fromEntries(statePerks.map((p) => [p.perk_id, p]));

  const monthlyCost = memberships.reduce((sum, m) => {
    const price = tierPrices[`${m.provider}|${m.tier}`];
    return sum + (typeof price === "number" ? price : 0);
  }, 0);

  return {
    profile: { ...profile, membership_status: memberships.length ? "Active" : "None" },
    memberships: memberships.map((m) => ({ ...m, price: tierPrices[`${m.provider}|${m.tier}`] ?? null })),
    monthlyCost,
    counts: { willUse: usedIds.length, wontUse: dismissedIds.length },
    willUse: usedIds.map((id) => byId[id]).filter(Boolean),
    wontUse: dismissedIds.map((id) => byId[id]).filter(Boolean),
    activated,
    saved: [], // no `saved` column in the live schema yet — surfaced as an honest empty state
    source: "supabase",
  };
}

/** Friendly message for a thrown error code. */
export function errorMessage(code) {
  return {
    NOT_CONFIGURED: "Supabase isn't connected in this environment.",
    NOT_SIGNED_IN: "You need to be signed in to view your profile.",
    AUTH_ERROR: "We couldn't verify your session. Try signing in again.",
  }[code] || "Something went wrong loading your profile.";
}
