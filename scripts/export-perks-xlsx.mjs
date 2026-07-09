// Regenerates Perks_Rows.xlsx from the live Supabase perks table.
// Run from the repo root:  npm i -D xlsx  (once)  then  node scripts/export-perks-xlsx.mjs
// Reads VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY from .env/.env.local.
import { createClient } from "@supabase/supabase-js";
import * as XLSX from "xlsx";
import { readFileSync, existsSync } from "node:fs";

const env = {};
for (const f of [".env", ".env.local"]) if (existsSync(f))
  for (const line of readFileSync(f, "utf8").split("\n")) {
    const m = line.match(/^\s*(VITE_SUPABASE_[A-Z_]+)\s*=\s*"?([^"\n]+)"?\s*$/);
    if (m) env[m[1]] = m[2];
  }
const url = process.env.VITE_SUPABASE_URL || env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY;
if (!url || !key) { console.error("Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY"); process.exit(1); }

const supabase = createClient(url, key);
const COLS = ["perk_id","provider","membership","tier","feature","titlegroup","title","description","category","reset_period","next_reset_date","usage_limit","usage_notes","source_url","last_verified","popularity","icon_provider_url","icon_membership_url","created_at","emoji","price","tier_kind","tier_rank"];

let rows = [], from = 0;
for (;;) {
  const { data, error } = await supabase.from("perks").select("*").order("provider").order("tier").order("title").range(from, from + 999);
  if (error) { console.error(error.message); process.exit(1); }
  rows.push(...data);
  if (data.length < 1000) break;
  from += 1000;
}
const ws = XLSX.utils.json_to_sheet(rows.map((r) => Object.fromEntries(COLS.map((c) => [c, r[c] ?? null]))), { header: COLS });
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, "perks_rows");
XLSX.writeFile(wb, "Perks_Rows.xlsx");
console.log(`Perks_Rows.xlsx regenerated: ${rows.length} rows`);
