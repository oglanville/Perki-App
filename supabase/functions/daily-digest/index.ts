// supabase/functions/daily-digest/index.ts
// Supabase Edge Function — sends a personalised daily email digest to each Perki user.
// Triggered once per day via pg_cron (see migration file).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2";

/* ─── env ─── */
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

interface UserMembership {
  provider: string;
  membership: string;
  tier: string;
}

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
}

/* ═══════════════════════════════════════════════════════
   TIER HIERARCHY HELPERS (mirrors App.jsx logic)
   ═══════════════════════════════════════════════════════ */

type TierPriceMap = Record<string, { price: number; sort_order: number }>;

/**
 * Build the tier price map from the perks table.
 * Groups perks by provider|tier and takes the price from the first perk
 * that has one — mirrors how App.jsx derives tier prices at runtime.
 */
function buildTierPriceMap(perks: Perk[]): TierPriceMap {
  const m: TierPriceMap = {};
  for (const p of perks) {
    const key = `${p.provider}|${p.tier}`;
    if (m[key]) continue;
    m[key] = {
      price: p.price ?? 999,
      sort_order: p.price ?? 999,
    };
  }
  return m;
}

/** Sorted list of tier names for a provider (cheapest first). */
function getProviderTierOrder(provider: string, tp: TierPriceMap): string[] {
  return Object.entries(tp)
    .filter(([k]) => k.startsWith(`${provider}|`))
    .map(([k, v]) => ({ tier: k.split("|")[1], price: v.price }))
    .sort((a, b) => a.price - b.price)
    .map((e) => e.tier);
}

/** From a set of selected tiers, return only the highest one. */
function getHighestTier(
  provider: string,
  tiers: string[],
  tp: TierPriceMap,
): string {
  const order = getProviderTierOrder(provider, tp);
  let highIdx = -1;
  let highTier = tiers[0];
  for (const t of tiers) {
    const i = order.indexOf(t);
    if (i > highIdx) {
      highIdx = i;
      highTier = t;
    }
  }
  return highTier;
}

/** Return the selected tier and all tiers below it (inclusive). */
function getEffectiveTiers(
  provider: string,
  tier: string,
  tp: TierPriceMap,
): string[] {
  const order = getProviderTierOrder(provider, tp);
  const idx = order.indexOf(tier);
  if (idx < 0) return [tier];
  return order.slice(0, idx + 1);
}

/** True when `candidate` is from a higher tier than `existing`. */
function isHigherTier(candidate: Perk, existing: Perk, tp: TierPriceMap): boolean {
  const order = getProviderTierOrder(candidate.provider, tp);
  return order.indexOf(candidate.tier) > order.indexOf(existing.tier);
}

/* ═══════════════════════════════════════════════════════
   GROUPING & SORTING HELPERS
   ═══════════════════════════════════════════════════════ */

const FEATURE_ORDER: Record<string, number> = {
  feature: 0,
  perk: 1,
  competition: 2,
  discount: 3,
};

function featureLabel(f: string): string {
  return { feature: "Features", perk: "Perks", competition: "Competitions", discount: "Discounts" }[f] ?? f;
}

/** Reset-period grouping for Features & Perks. */
function groupByReset(items: Perk[], today: Date): Record<string, Perk[]> {
  const buckets: Record<string, Perk[]> = {
    "Resets today": [],
    "Resets tomorrow": [],
    "Resets this week": [],
    "Resets next week": [],
    "Resets this month": [],
    "Resets next month": [],
    "No reset date": [],
  };

  const startOfDay = new Date(today);
  startOfDay.setHours(0, 0, 0, 0);

  const tomorrow = new Date(startOfDay);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // "this week" = from today to end of Sunday
  const endOfWeek = new Date(startOfDay);
  endOfWeek.setDate(endOfWeek.getDate() + (7 - endOfWeek.getDay()));

  // "next week" = the 7 days after endOfWeek
  const endOfNextWeek = new Date(endOfWeek);
  endOfNextWeek.setDate(endOfNextWeek.getDate() + 7);

  // "this month" = remainder of the current calendar month
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);

  // "next month" = all of next calendar month
  const endOfNextMonth = new Date(today.getFullYear(), today.getMonth() + 2, 0, 23, 59, 59, 999);

  for (const p of items) {
    if (!p.next_reset_date) {
      buckets["No reset date"].push(p);
      continue;
    }
    const d = new Date(p.next_reset_date);
    d.setHours(0, 0, 0, 0);

    const diffMs = d.getTime() - startOfDay.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    if (diffDays >= 0 && diffDays < 1) buckets["Resets today"].push(p);
    else if (diffDays >= 1 && diffDays < 2) buckets["Resets tomorrow"].push(p);
    else if (d <= endOfWeek) buckets["Resets this week"].push(p);
    else if (d <= endOfNextWeek) buckets["Resets next week"].push(p);
    else if (d <= endOfMonth) buckets["Resets this month"].push(p);
    else if (d <= endOfNextMonth) buckets["Resets next month"].push(p);
    else buckets["No reset date"].push(p);
  }

  // Alpha sort within each bucket
  for (const arr of Object.values(buckets)) {
    arr.sort((a, b) => a.title.localeCompare(b.title));
  }
  return buckets;
}

/** Closing-date grouping for Competitions & Discounts. */
function groupByClosingDate(items: Perk[], today: Date): Record<string, Perk[]> {
  const buckets: Record<string, Perk[]> = {
    "Closes in 1 week": [],
    "Closes in 2 weeks": [],
    "Closes in 3 weeks": [],
    "Closes in 4 weeks": [],
    "No close date": [],
  };

  const startOfDay = new Date(today);
  startOfDay.setHours(0, 0, 0, 0);

  for (const p of items) {
    if (!p.next_reset_date) {
      buckets["No close date"].push(p);
      continue;
    }
    const d = new Date(p.next_reset_date);
    const diffDays = (d.getTime() - startOfDay.getTime()) / (1000 * 60 * 60 * 24);
    if (diffDays <= 7) buckets["Closes in 1 week"].push(p);
    else if (diffDays <= 14) buckets["Closes in 2 weeks"].push(p);
    else if (diffDays <= 21) buckets["Closes in 3 weeks"].push(p);
    else if (diffDays <= 28) buckets["Closes in 4 weeks"].push(p);
    else buckets["No close date"].push(p);
  }

  // Sort by date ascending, then alpha
  for (const arr of Object.values(buckets)) {
    arr.sort((a, b) => {
      if (!a.next_reset_date && !b.next_reset_date) return a.title.localeCompare(b.title);
      if (!a.next_reset_date) return 1;
      if (!b.next_reset_date) return -1;
      const d = new Date(a.next_reset_date).getTime() - new Date(b.next_reset_date).getTime();
      return d !== 0 ? d : a.title.localeCompare(b.title);
    });
  }
  return buckets;
}

/* ═══════════════════════════════════════════════════════
   PER-USER DIGEST BUILDER
   ═══════════════════════════════════════════════════════ */

interface MembershipDigest {
  provider: string;
  tier: string;
  features: Perk[];
  perks: Perk[];
  competitions: Perk[];
  discounts: Perk[];
}

function buildUserDigest(
  memberships: UserMembership[],
  allPerks: Perk[],
  tp: TierPriceMap,
): MembershipDigest[] {
  // 1. Group selected memberships by provider
  const byProvider: Record<string, UserMembership[]> = {};
  for (const m of memberships) {
    (byProvider[m.provider] ??= []).push(m);
  }

  const digests: MembershipDigest[] = [];

  for (const [provider, ms] of Object.entries(byProvider)) {
    // 2. Identify highest tier
    const highestTier = getHighestTier(provider, ms.map((m) => m.tier), tp);

    // 3. Collect effective tiers (highest + all below)
    const effectiveTiers = new Set(getEffectiveTiers(provider, highestTier, tp));

    // 4. Get all perks belonging to these tiers for this provider
    const providerPerks = allPerks.filter(
      (p) => p.provider === provider && effectiveTiers.has(p.tier),
    );

    // 5. Deduplicate by titlegroup — keep highest-tier version
    const deduped: Record<string, Perk> = {};
    for (const p of providerPerks) {
      const key = p.titlegroup || p.title;
      if (!deduped[key]) {
        deduped[key] = p;
      } else if (isHigherTier(p, deduped[key], tp)) {
        deduped[key] = p;
      }
    }

    const items = Object.values(deduped);

    // 6. Split into four feature types, alpha-sorted
    const alpha = (a: Perk, b: Perk) => a.title.localeCompare(b.title);
    digests.push({
      provider,
      tier: highestTier,
      features: items.filter((p) => p.feature === "feature").sort(alpha),
      perks: items.filter((p) => p.feature === "perk").sort(alpha),
      competitions: items.filter((p) => p.feature === "competition").sort(alpha),
      discounts: items.filter((p) => p.feature === "discount").sort(alpha),
    });
  }

  // Sort providers alphabetically for consistent ordering
  digests.sort((a, b) => a.provider.localeCompare(b.provider));
  return digests;
}

/* ═══════════════════════════════════════════════════════
   HTML EMAIL TEMPLATE
   ═══════════════════════════════════════════════════════ */

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function todayFormatted(d: Date): string {
  return d.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

const PROVIDER_COLORS: Record<string, string> = {
  "OVO Energy": "#00C86F",
  Monzo: "#FF5C5C",
  Revolut: "#6C63FF",
  "American Express": "#0077C8",
};

function providerColor(provider: string): string {
  return PROVIDER_COLORS[provider] ?? "#0B3D91";
}

/**
 * Render a grouped section (reset buckets or closing-date buckets) into
 * table-based email HTML rows.
 */
function renderBucketedItems(
  buckets: Record<string, Perk[]>,
  showDate: boolean,
): string {
  let html = "";
  for (const [label, items] of Object.entries(buckets)) {
    if (items.length === 0) continue;
    html += `
      <tr>
        <td style="padding:6px 16px 4px;font-size:11px;font-weight:700;color:#64748B;text-transform:uppercase;letter-spacing:0.5px;">
          ${label}
        </td>
      </tr>`;
    for (const p of items) {
      const dateStr = showDate && p.next_reset_date ? formatDate(p.next_reset_date) : "";
      html += `
      <tr>
        <td style="padding:4px 16px 4px 28px;">
          <table cellpadding="0" cellspacing="0" border="0" width="100%"><tr>
            <td style="font-size:13px;color:#0F172A;font-weight:500;line-height:1.4;">
              ${escHtml(p.title)}
            </td>
            ${dateStr ? `<td align="right" style="font-size:11px;color:#94A3B8;white-space:nowrap;">${dateStr}</td>` : ""}
          </tr></table>
        </td>
      </tr>`;
    }
  }
  return html;
}

function escHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildEmailHtml(
  userName: string,
  digests: MembershipDigest[],
  today: Date,
): string {
  const dateStr = todayFormatted(today);

  let membershipSections = "";

  for (const d of digests) {
    const color = providerColor(d.provider);

    // Build the four feature-type sections
    const sections: { label: string; items: Perk[]; type: string }[] = [
      { label: "Features", items: d.features, type: "feature" },
      { label: "Perks", items: d.perks, type: "perk" },
      { label: "Competitions", items: d.competitions, type: "competition" },
      { label: "Discounts", items: d.discounts, type: "discount" },
    ];

    let sectionRows = "";

    for (const sec of sections) {
      if (sec.items.length === 0) continue;

      const isClosingType = sec.type === "competition" || sec.type === "discount";
      const buckets = isClosingType
        ? groupByClosingDate(sec.items, today)
        : groupByReset(sec.items, today);

      sectionRows += `
      <tr>
        <td style="padding:14px 16px 6px;">
          <table cellpadding="0" cellspacing="0" border="0"><tr>
            <td style="background:${color}15;border:1px solid ${color}30;border-radius:6px;padding:3px 10px;">
              <span style="font-size:12px;font-weight:700;color:${color};">${sec.label}</span>
              <span style="font-size:11px;color:#94A3B8;margin-left:6px;">${sec.items.length}</span>
            </td>
          </tr></table>
        </td>
      </tr>`;
      sectionRows += renderBucketedItems(buckets, true);
    }

    if (!sectionRows) continue;

    membershipSections += `
    <!-- Provider: ${escHtml(d.provider)} -->
    <table cellpadding="0" cellspacing="0" border="0" width="100%"
           style="margin-bottom:20px;border-radius:12px;overflow:hidden;border:1px solid #E2E8F0;">
      <tr>
        <td style="background:linear-gradient(135deg,${color}12,${color}06);border-bottom:2px solid ${color}30;padding:14px 16px;">
          <table cellpadding="0" cellspacing="0" border="0"><tr>
            <td style="width:32px;height:32px;border-radius:8px;background:${color};text-align:center;vertical-align:middle;">
              <span style="color:#fff;font-size:13px;font-weight:800;line-height:32px;">
                ${escHtml(d.provider.slice(0, 2).toUpperCase())}
              </span>
            </td>
            <td style="padding-left:10px;">
              <div style="font-size:15px;font-weight:800;color:#0F172A;">${escHtml(d.provider)}</div>
              <div style="font-size:11px;color:#64748B;margin-top:1px;">${escHtml(d.tier)}</div>
            </td>
          </tr></table>
        </td>
      </tr>
      ${sectionRows}
      <tr><td style="height:12px;"></td></tr>
    </table>`;
  }

  if (!membershipSections) {
    membershipSections = `
    <table cellpadding="0" cellspacing="0" border="0" width="100%">
      <tr>
        <td style="text-align:center;padding:40px 20px;color:#94A3B8;font-size:14px;">
          You don't have any active memberships yet.
        </td>
      </tr>
    </table>`;
  }

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
    <tr><td align="center" style="padding:24px 12px 32px;">

      <!-- Container -->
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:560px;background:#FFFFFF;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(15,23,42,0.06);">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#0B3D91,#1E90FF);padding:28px 24px 24px;text-align:center;">
            <div style="font-size:24px;font-weight:900;color:#FFFFFF;letter-spacing:-0.5px;">
              <span style="display:inline-block;width:30px;height:30px;background:rgba(255,255,255,0.2);border-radius:8px;text-align:center;line-height:30px;font-size:16px;vertical-align:middle;margin-right:6px;">P</span>
              Perki
            </div>
            <div style="font-size:13px;color:rgba(255,255,255,0.8);margin-top:8px;">Your Daily Membership Digest</div>
          </td>
        </tr>

        <!-- Greeting -->
        <tr>
          <td style="padding:24px 24px 8px;">
            <div style="font-size:18px;font-weight:800;color:#0F172A;">
              Good morning, ${escHtml(userName)}! 👋
            </div>
            <div style="font-size:13px;color:#64748B;margin-top:4px;">
              ${escHtml(dateStr)}
            </div>
            <div style="font-size:13px;color:#64748B;margin-top:8px;line-height:1.5;">
              Here's a summary of all your membership perks, features, competitions and discounts for today.
            </div>
          </td>
        </tr>

        <!-- Divider -->
        <tr><td style="padding:12px 24px;"><div style="border-top:1px solid #E2E8F0;"></div></td></tr>

        <!-- Membership Sections -->
        <tr>
          <td style="padding:4px 16px 8px;">
            ${membershipSections}
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#F8FAFC;padding:20px 24px;border-top:1px solid #E2E8F0;text-align:center;">
            <div style="font-size:11px;color:#94A3B8;line-height:1.6;">
              You're receiving this because you have active memberships on
              <a href="https://perki.app" style="color:#1E90FF;text-decoration:none;font-weight:600;">Perki</a>.
              <br/>
              To stop these emails, update your preferences in the app.
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
   MAIN HANDLER
   ═══════════════════════════════════════════════════════ */

Deno.serve(async (req: Request) => {
  try {
    // Optional: verify cron secret for security
    const authHeader = req.headers.get("Authorization");
    const cronSecret = Deno.env.get("CRON_SECRET");
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return new Response("Unauthorized", { status: 401 });
    }

    const today = new Date();
    console.log(`[daily-digest] Starting digest for ${todayFormatted(today)}`);

    // 1. Load all perks
    const { data: allPerks, error: perksErr } = await supabase
      .from("perks")
      .select("*")
      .order("title");

    if (perksErr) throw new Error(`Failed to load perks: ${perksErr.message}`);

    // 2. Derive tier pricing hierarchy from the perks table
    const tierPrices = buildTierPriceMap((allPerks as Perk[]) ?? []);

    // 3. Load all users with active memberships
    //    We join user_memberships with auth.users via profiles to get emails.
    const { data: membershipsRaw, error: memErr } = await supabase
      .from("user_memberships")
      .select("user_id, provider, membership, tier");

    if (memErr) throw new Error(`Failed to load memberships: ${memErr.message}`);

    // Group memberships by user
    const membershipsByUser: Record<string, UserMembership[]> = {};
    for (const row of membershipsRaw ?? []) {
      (membershipsByUser[row.user_id] ??= []).push({
        provider: row.provider,
        membership: row.membership,
        tier: row.tier,
      });
    }

    const userIds = Object.keys(membershipsByUser);
    if (userIds.length === 0) {
      console.log("[daily-digest] No users with active memberships. Done.");
      return new Response(JSON.stringify({ sent: 0 }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // 4. Filter out users who have opted out of the daily digest
    const { data: disabledPrefs } = await supabase
      .from("email_preferences")
      .select("user_id")
      .eq("daily_digest_enabled", false)
      .in("user_id", userIds);

    const optedOut = new Set((disabledPrefs ?? []).map((r: { user_id: string }) => r.user_id));
    const eligibleUserIds = userIds.filter((id) => !optedOut.has(id));

    if (eligibleUserIds.length === 0) {
      console.log("[daily-digest] All users opted out. Done.");
      return new Response(JSON.stringify({ sent: 0, optedOut: optedOut.size }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // 5. Load user profiles (email + name)
    const { data: profiles, error: profErr } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", eligibleUserIds);

    if (profErr) throw new Error(`Failed to load profiles: ${profErr.message}`);

    // Also get emails from auth.users via admin API
    const { data: { users: authUsers }, error: authErr } =
      await supabase.auth.admin.listUsers({ perPage: 1000 });

    if (authErr) throw new Error(`Failed to list auth users: ${authErr.message}`);

    const emailMap: Record<string, string> = {};
    const nameMapFromAuth: Record<string, string> = {};
    for (const u of authUsers ?? []) {
      if (u.email) emailMap[u.id] = u.email;
      const meta = u.user_metadata as Record<string, string> | undefined;
      if (meta?.full_name) nameMapFromAuth[u.id] = meta.full_name;
    }

    const profileNameMap: Record<string, string> = {};
    for (const p of profiles ?? []) {
      if (p.full_name) profileNameMap[p.id] = p.full_name;
    }

    // 6. Build & send an email per user
    let sentCount = 0;
    const errors: string[] = [];

    for (const userId of eligibleUserIds) {
      const email = emailMap[userId];
      if (!email) {
        console.warn(`[daily-digest] No email for user ${userId}, skipping.`);
        continue;
      }

      const userName =
        profileNameMap[userId] ??
        nameMapFromAuth[userId] ??
        email.split("@")[0] ??
        "there";

      const userMemberships = membershipsByUser[userId];
      const digests = buildUserDigest(userMemberships, allPerks as Perk[], tierPrices);

      const html = buildEmailHtml(userName, digests, today);

      try {
        await resend.emails.send({
          from: FROM_EMAIL,
          to: email,
          subject: `Your Perki Digest — ${todayFormatted(today)}`,
          html,
        });
        sentCount++;
      } catch (sendErr: unknown) {
        const msg = sendErr instanceof Error ? sendErr.message : String(sendErr);
        console.error(`[daily-digest] Failed to send to ${email}: ${msg}`);
        errors.push(`${email}: ${msg}`);
      }
    }

    console.log(`[daily-digest] Done. Sent: ${sentCount}, Errors: ${errors.length}`);

    return new Response(
      JSON.stringify({ sent: sentCount, errors: errors.length, errorDetails: errors }),
      { headers: { "Content-Type": "application/json" } },
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[daily-digest] Fatal error: ${msg}`);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
