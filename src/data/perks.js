import { supabase } from "../lib/supabase";

/**
 * Provider visual identity (on-palette: gold/purple system).
 * Logos rendered as Lucide SVG icons (system anti-pattern: no emoji icons).
 */
export const PROVIDERS = {
  Monzo:     { icon: "landmark",   blurb: "Banking" },
  Revolut:   { icon: "credit-card", blurb: "Banking" },
  Sky:       { icon: "tv",          blurb: "Entertainment" },
  OVO:       { icon: "zap",         blurb: "Energy" },
  Lidl:      { icon: "shopping-cart", blurb: "Grocery" },
  O2:        { icon: "smartphone",  blurb: "Mobile" },
};

/**
 * Fallback sample — drawn from the VALIDATED catalogue so the explorer
 * renders even before Supabase creds are wired (accuracy-first).
 */
export const SAMPLE_PERKS = [
  { perk_id: "monzo-perks-greggs", provider: "Monzo", tier: "Perks", title: "Weekly Greggs treat", description: "A free Greggs item, every single week.", category: "Food", reset_period: "WEEKLY" },
  { perk_id: "monzo-perks-vue", provider: "Monzo", tier: "Perks", title: "Monthly cinema ticket at Vue", description: "One cinema ticket at Vue, every month.", category: "Entertainment", reset_period: "MONTHLY" },
  { perk_id: "monzo-max-travel", provider: "Monzo", tier: "Max", title: "Worldwide travel insurance", description: "Personal worldwide travel cover, provided by Zurich.", category: "Insurance", reset_period: "NONE" },
  { perk_id: "revolut-metal-lounge", provider: "Revolut", tier: "Metal", title: "Airport lounge access", description: "Skip the terminal chaos with included lounge passes.", category: "Travel", reset_period: "NONE" },
  { perk_id: "revolut-ultra-perks", provider: "Revolut", tier: "Ultra", title: "Partner subscriptions", description: "Premium memberships bundled into your plan.", category: "Lifestyle", reset_period: "MONTHLY" },
  { perk_id: "revolut-premium-cashback", provider: "Revolut", tier: "Premium", title: "Cashback on spend", description: "Earn back on everyday purchases.", category: "Rewards", reset_period: "NONE" },
  { perk_id: "sky-silver-tickets", provider: "Sky", tier: "Silver", title: "Sky VIP competitions", description: "Exclusive prize draws and money-can't-buy experiences.", category: "Entertainment", reset_period: "MONTHLY" },
  { perk_id: "sky-silver-sport", provider: "Sky", tier: "Silver", title: "Sky Sports highlights", description: "Catch the moments that matter across the season.", category: "Sports", reset_period: "NONE" },
  { perk_id: "ovo-beyond-vip", provider: "OVO", tier: "Beyond", title: "VIP ticket access", description: "Exclusive tickets at The O2 and partner venues.", category: "Entertainment", reset_period: "NONE" },
  { perk_id: "ovo-beyond-trees", provider: "OVO", tier: "Beyond", title: "Tree planting", description: "Trees planted on your behalf each year you stay.", category: "Lifestyle", reset_period: "ANNUALLY" },
];

export const RESET_LABEL = { WEEKLY: "Resets weekly", MONTHLY: "Resets monthly", ANNUALLY: "Resets annually", NONE: "Ongoing" };

/** Fetch perks from Supabase; gracefully fall back to the validated sample. */
export async function fetchPerks() {
  if (!supabase) return { perks: SAMPLE_PERKS, source: "sample" };
  try {
    const { data, error } = await supabase
      .from("perks")
      .select("perk_id, provider, tier, title, description, category, reset_period")
      .order("provider", { ascending: true });
    if (error || !data || data.length === 0) return { perks: SAMPLE_PERKS, source: "sample" };
    return { perks: data, source: "supabase" };
  } catch {
    return { perks: SAMPLE_PERKS, source: "sample" };
  }
}
