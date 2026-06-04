import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertCircle } from "lucide-react";
import { Button, GlassCard, Brand } from "../ui/components";
import { supabase } from "../lib/supabase";

export default function Auth({ mode = "signup" }) {
  const signup = mode === "signup";
  const navigate = useNavigate();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [name, setName] = React.useState("");
  const [error, setError] = React.useState("");
  const [notice, setNotice] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(""); setNotice("");
    if (!supabase) { setError("Supabase isn't connected in this environment."); return; }
    setLoading(true);
    try {
      if (signup) {
        const { data, error } = await supabase.auth.signUp({
          email, password, options: { data: { full_name: name } },
        });
        if (error) throw error;
        // If email confirmation is on, there's no active session yet.
        if (!data.session) { setNotice("Account created — check your inbox to confirm, then log in."); setLoading(false); return; }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      navigate("/app/account");
    } catch (err) {
      setError(err?.message || "Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <section className="py-10 min-h-[70vh] grid place-items-center">
      <GlassCard className="w-full max-w-sm">
        <div className="flex justify-center mb-6"><Brand /></div>
        <h1 className="text-2xl font-bold text-center mb-1">{signup ? "Get Perki" : "Welcome back"}</h1>
        <p className="text-center text-snow/70 text-sm mb-6">{signup ? "Find every perk you're already paying for." : "Log in to your perk inventory."}</p>

        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          {signup && (
            <div>
              <label htmlFor="auth-name" className="block text-sm font-medium mb-1.5">Full name</label>
              <input id="auth-name" type="text" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ollie Glanville"
                className="w-full px-4 py-3 text-base rounded-btn bg-ink2 border border-snow/15 placeholder-muted focus:border-gold focus:ring-[3px] focus:ring-gold/20 focus:outline-none min-h-[48px]" />
            </div>
          )}
          <div>
            <label htmlFor="auth-email" className="block text-sm font-medium mb-1.5">Email</label>
            <input id="auth-email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com"
              className="w-full px-4 py-3 text-base rounded-btn bg-ink2 border border-snow/15 placeholder-muted focus:border-gold focus:ring-[3px] focus:ring-gold/20 focus:outline-none min-h-[48px]" />
          </div>
          <div>
            <label htmlFor="auth-pw" className="block text-sm font-medium mb-1.5">Password</label>
            <input id="auth-pw" type="password" required minLength={6} autoComplete={signup ? "new-password" : "current-password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••"
              className="w-full px-4 py-3 text-base rounded-btn bg-ink2 border border-snow/15 placeholder-muted focus:border-gold focus:ring-[3px] focus:ring-gold/20 focus:outline-none min-h-[48px]" />
          </div>

          {error && <p className="text-sm text-red-400 flex items-center gap-1.5"><AlertCircle className="w-4 h-4 shrink-0" />{error}</p>}
          {notice && <p className="text-golddeep text-sm text-center">{notice}</p>}

          <Button as="button" type="submit" disabled={loading} className="w-full !min-h-[48px]">
            {loading ? "One sec…" : signup ? "Create account" : "Log in"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted mt-5">
          {signup
            ? <>Already have an account? <Link to="/login" className="text-purple cursor-pointer hover:underline">Log in</Link></>
            : <>New to Perki? <Link to="/signup" className="text-purple cursor-pointer hover:underline">Get started</Link></>}
        </p>
      </GlassCard>
    </section>
  );
}
