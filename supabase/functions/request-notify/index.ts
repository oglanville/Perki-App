// supabase/functions/request-notify/index.ts
// Emails Ollie when a membership request lands in membership_requests.
// Called by a Postgres trigger via pg_net, authenticated with the Vault cron secret.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const FROM_EMAIL = Deno.env.get("FROM_EMAIL") ?? "Perki <digest@perki.app>";
const NOTIFY_TO = "ollie_glanville@hotmail.co.uk";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const resend = new Resend(RESEND_API_KEY);

function esc(s: string): string {
  return (s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

Deno.serve(async (req: Request) => {
  try {
    const header = req.headers.get("authorization");
    const envSecret = Deno.env.get("CRON_SECRET");
    let authOk = !!envSecret && header === `Bearer ${envSecret}`;
    if (!authOk && header) {
      const { data: vaultSecret } = await supabase.rpc("get_cron_secret");
      authOk = !!vaultSecret && header === `Bearer ${vaultSecret}`;
    }
    if (!authOk) return new Response("Unauthorized", { status: 401 });

    const body = await req.json().catch(() => ({}));
    const requester = body.requester ?? "Someone";
    const description = body.description ?? "(no description)";
    const context = body.context ?? "";
    const userId = body.user_id ?? "anonymous";

    const html = `<div style="font-family:'Work Sans',Helvetica,Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px;background:#F4F0E6;">
      <div style="background:#2B2A6E;border-radius:14px;padding:12px;text-align:center;margin-bottom:18px;">
        <span style="font-family:'Outfit',Helvetica,Arial,sans-serif;font-size:18px;font-weight:900;color:#FCFAF4;">Perki<span style='color:#E0A93B;'>.</span></span>
      </div>
      <div style="background:#FCFAF4;border:1px solid #E4DDCB;border-radius:14px;padding:20px;">
        <div style="font-size:11px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;color:#B07C1A;">New membership request</div>
        <div style="font-family:'Outfit',Helvetica,Arial,sans-serif;font-size:20px;font-weight:800;color:#23202A;padding:8px 0 12px;">${esc(description)}</div>
        <div style="font-size:13px;color:#6B6757;line-height:1.7;">
          <strong>From:</strong> ${esc(requester)}<br>
          ${context ? `<strong>Where:</strong> ${esc(context)}<br>` : ""}
          <strong>User:</strong> ${esc(String(userId))}
        </div>
      </div>
      <p style="font-size:11px;color:#9A9482;text-align:center;padding-top:14px;">Logged in membership_requests · Perki</p>
    </div>`;

    const result = await resend.emails.send({ from: FROM_EMAIL, to: NOTIFY_TO, subject: `Perki request: ${description.slice(0, 60)}`, html });
    const rErr = (result as Record<string, unknown>)?.error;
    if (rErr) {
      console.error(`[request-notify] Resend rejected: ${JSON.stringify(rErr)}`);
      return new Response(JSON.stringify({ sent: 0, error: rErr }), { status: 502, headers: { "Content-Type": "application/json" } });
    }
    return new Response(JSON.stringify({ sent: 1 }), { headers: { "Content-Type": "application/json" } });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[request-notify] Error: ${msg}`);
    return new Response(JSON.stringify({ error: msg }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
});
