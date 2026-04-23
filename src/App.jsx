import React, { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { supabase } from "./lib/supabase";

// ─── TIER HIERARCHY (client-side config) ───
const TIER_HIERARCHY = {
  "Monzo": ["Extra", "Perks", "Max"],
  "Revolut": ["Standard", "Plus", "Premium", "Metal", "Ultra"],
  "OVO Energy": ["Beyond"],
  "American Express": ["Gold", "Platinum"],
};
const HIERARCHICAL_PROVIDERS = new Set(["Monzo", "Revolut"]);

function getEffectiveTiers(provider, tier) {
  if (!HIERARCHICAL_PROVIDERS.has(provider)) return [tier];
  const chain = TIER_HIERARCHY[provider] || [];
  const idx = chain.indexOf(tier);
  if (idx < 0) return [tier];
  return chain.slice(0, idx + 1);
}
function getHighestTier(provider, tiers) {
  if (!HIERARCHICAL_PROVIDERS.has(provider)) return tiers;
  const chain = TIER_HIERARCHY[provider] || [];
  let highest = -1, ht = null;
  tiers.forEach(t => { const i = chain.indexOf(t); if (i > highest) { highest = i; ht = t; } });
  return ht ? [ht] : tiers;
}

// ─── Check if Supabase is configured ───
const SB_CONFIGURED = !!supabase;

// ─── PERK BRANDS (client-side icon config — not in DB) ───
const PERK_BRANDS = {
  "ovo-beyond-costa-coffee":{name:"Costa Coffee",initials:"CC",color:"#7B1A3C"},
  "ovo-beyond-power-move":{name:"OVO Power Move",initials:"PM",color:"#00C86F"},
  "ovo-beyond-uber-green":{name:"Uber",initials:"UB",color:"#000000"},
  "ovo-beyond-vip-tickets":{name:"The O2",initials:"O2",color:"#E91C5A"},
  "ovo-beyond-boiler-service":{name:"OVO Heating",initials:"OH",color:"#00C86F"},
  "ovo-beyond-tesco-clubcard":{name:"Tesco",initials:"TC",color:"#00539F"},
  "ovo-beyond-oddbox-discount":{name:"Oddbox",initials:"OB",color:"#F5A623"},
  "monzo-perks-greggs-weekly":{name:"Greggs",initials:"GG",color:"#004B8D"},
  "monzo-perks-railcard":{name:"Trainline",initials:"TL",color:"#03A678"},
  "monzo-perks-billsback":{name:"Monzo Billsback",initials:"BB",color:"#FF5C5C"},
  "monzo-perks-savings-rate":{name:"Monzo Savings",initials:"MS",color:"#FF5C5C"},
  "monzo-perks-fee-free-withdrawals":{name:"Monzo ATM",initials:"MA",color:"#FF5C5C"},
  "monzo-max-travel-insurance":{name:"Travel Insurer",initials:"TI",color:"#2563EB"},
  "monzo-max-phone-insurance":{name:"Phone Insurer",initials:"PI",color:"#7C3AED"},
  "monzo-max-breakdown-cover":{name:"RAC",initials:"RAC",color:"#F97316"},
  "revolut-premium-travel-insurance":{name:"Revolut Insurance",initials:"RI",color:"#6C63FF"},
  "revolut-premium-atm-withdrawals":{name:"Revolut ATM",initials:"RA",color:"#6C63FF"},
  "revolut-premium-currency-exchange":{name:"Revolut FX",initials:"FX",color:"#6C63FF"},
  "revolut-metal-atm-800":{name:"Revolut ATM",initials:"RA",color:"#6C63FF"},
  "revolut-metal-travel-insurance":{name:"Revolut Insurance",initials:"RI",color:"#6C63FF"},
  "revolut-metal-revpoints":{name:"RevPoints",initials:"RP",color:"#6C63FF"},
  "revolut-metal-savings":{name:"Revolut Savings",initials:"RS",color:"#6C63FF"},
  "revolut-ultra-lounge-access":{name:"LoungeKey",initials:"LK",color:"#1E3A5F"},
  "revolut-ultra-partner-subs":{name:"Multiple Partners",initials:"MP",color:"#EC4899"},
  "revolut-ultra-atm-2000":{name:"Revolut ATM",initials:"RA",color:"#6C63FF"},
  "revolut-ultra-savings":{name:"Revolut Savings",initials:"RS",color:"#6C63FF"},
  "revolut-ultra-revpoints-1per1":{name:"RevPoints",initials:"RP",color:"#6C63FF"},
  "amex-gold-airport-lounge":{name:"Airport Lounges",initials:"AL",color:"#0077C8"},
  "amex-gold-deliveroo-credit":{name:"Deliveroo",initials:"DL",color:"#00CCBC"},
  "amex-gold-hotel-collection":{name:"Hotel Collection",initials:"HC",color:"#0077C8"},
  "amex-gold-double-airline-points":{name:"Airlines",initials:"AR",color:"#0077C8"},
  "amex-plat-airport-lounge-1":{name:"Priority Pass",initials:"PP",color:"#8B6914"},
  "amex-plat-dining-credit-uk":{name:"UK Restaurants",initials:"UK",color:"#DC2626"},
  "amex-plat-dining-credit-intl":{name:"Intl Restaurants",initials:"IN",color:"#DC2626"},
  "amex-plat-hotel-status":{name:"Hotel Chains",initials:"HT",color:"#92400E"},
  "amex-plat-eurostar-lounge":{name:"Eurostar",initials:"ES",color:"#FFD700"},
  "amex-plat-times-digital":{name:"The Times",initials:"TT",color:"#1A1A1A"},
  "amex-plat-car-hire-status":{name:"Avis / Hertz",initials:"AH",color:"#D62B1F"},
};

// ─── FALLBACK DATA (used when Supabase is not configured) ───
const FALLBACK_PERKS = [
  {perk_id:"ovo-beyond-costa-coffee",provider:"OVO Energy",membership:"OVO Energy",tier:"Beyond",title:"Free Costa Coffee",description:"Claim a free small drink at Costa Coffee each month via the OVO app.",category:"retail",reset_period:"MONTHLY",next_reset_date:"2026-05-01",usage_limit:"1 per month",popularity:"Common"},
  {perk_id:"ovo-beyond-power-move",provider:"OVO Energy",membership:"OVO Energy",tier:"Beyond",title:"Power Move Prize Draw",description:"Win up to a year's free energy by shifting electricity usage to off-peak times.",category:"finance",reset_period:"MONTHLY",next_reset_date:"2026-05-01",usage_limit:"Ongoing monthly draw",popularity:"Common"},
  {perk_id:"ovo-beyond-uber-green",provider:"OVO Energy",membership:"OVO Energy",tier:"Beyond",title:"£5 Uber Green Voucher",description:"£5 off an Uber Green ride each month for Beyond customers.",category:"travel",reset_period:"MONTHLY",next_reset_date:"2026-05-01",usage_limit:"1 per month",popularity:"Common"},
  {perk_id:"ovo-beyond-vip-tickets",provider:"OVO Energy",membership:"OVO Energy",tier:"Beyond",title:"VIP Ticket Access",description:"Exclusive access to VIP tickets at The O2, OVO Arena Wembley, and OVO Hydro.",category:"retail",reset_period:"NONE",next_reset_date:null,usage_limit:"Subject to availability",popularity:"Occasional"},
  {perk_id:"ovo-beyond-boiler-service",provider:"OVO Energy",membership:"OVO Energy",tier:"Beyond",title:"Free Annual Boiler Service",description:"One free boiler service per year for Beyond customers.",category:"other",reset_period:"ANNUALLY",next_reset_date:"2027-01-01",usage_limit:"1 per year",popularity:"Common"},
  {perk_id:"ovo-beyond-tesco-clubcard",provider:"OVO Energy",membership:"OVO Energy",tier:"Beyond",title:"Tesco Clubcard Points",description:"Earn Tesco Clubcard points on energy usage.",category:"supermarket",reset_period:"MONTHLY",next_reset_date:"2026-05-01",usage_limit:"Ongoing",popularity:"Common"},
  {perk_id:"ovo-beyond-oddbox-discount",provider:"OVO Energy",membership:"OVO Energy",tier:"Beyond",title:"Oddbox Discount",description:"Discounts of up to 40% on Oddbox fruit and veg boxes.",category:"retail",reset_period:"NONE",next_reset_date:null,usage_limit:"Ongoing",popularity:"Unknown"},
  {perk_id:"monzo-perks-greggs-weekly",provider:"Monzo",membership:"Monzo",tier:"Perks",title:"Weekly Greggs Treat",description:"Claim a free sausage roll, hot drink, doughnut or muffin from Greggs every week.",category:"retail",reset_period:"WEEKLY",next_reset_date:"2026-04-27",usage_limit:"1 per week",popularity:"Common"},
  {perk_id:"monzo-perks-railcard",provider:"Monzo",membership:"Monzo",tier:"Perks",title:"Annual Railcard",description:"Free annual Railcard from Trainline saving 1/3 on eligible train journeys.",category:"travel",reset_period:"ANNUALLY",next_reset_date:"2027-01-01",usage_limit:"1 per year",popularity:"Common"},
  {perk_id:"monzo-perks-billsback",provider:"Monzo",membership:"Monzo",tier:"Perks",title:"Billsback™",description:"Monthly chance to have eligible bills paid back, up to £150 per bill.",category:"finance",reset_period:"MONTHLY",next_reset_date:"2026-05-01",usage_limit:"Monthly draw",popularity:"Occasional"},
  {perk_id:"monzo-perks-savings-rate",provider:"Monzo",membership:"Monzo",tier:"Perks",title:"Boosted Savings (3.25% AER)",description:"3.25% AER (variable) on Instant Access Savings Pot and Cash ISA.",category:"finance",reset_period:"NONE",next_reset_date:null,usage_limit:"Ongoing",popularity:"Common"},
  {perk_id:"monzo-perks-fee-free-withdrawals",provider:"Monzo",membership:"Monzo",tier:"Perks",title:"Fee-Free UK/EEA Withdrawals",description:"Unlimited fee-free cash withdrawals in UK/EEA, £600/30d elsewhere.",category:"finance",reset_period:"MONTHLY",next_reset_date:"2026-05-01",usage_limit:"Unlimited UK/EEA",popularity:"Common"},
  {perk_id:"monzo-max-travel-insurance",provider:"Monzo",membership:"Monzo",tier:"Max",title:"Worldwide Travel Insurance",description:"Comprehensive worldwide travel insurance. Family cover +£5/month.",category:"insurance",reset_period:"NONE",next_reset_date:null,usage_limit:"Ongoing",popularity:"Common"},
  {perk_id:"monzo-max-phone-insurance",provider:"Monzo",membership:"Monzo",tier:"Max",title:"Phone Insurance",description:"Worldwide phone insurance for phones up to £2,000.",category:"insurance",reset_period:"NONE",next_reset_date:null,usage_limit:"Ongoing",popularity:"Common"},
  {perk_id:"monzo-max-breakdown-cover",provider:"Monzo",membership:"Monzo",tier:"Max",title:"UK & Europe Breakdown Cover",description:"RAC breakdown cover included for UK and Europe.",category:"travel",reset_period:"NONE",next_reset_date:null,usage_limit:"Ongoing",popularity:"Common"},
  {perk_id:"revolut-premium-travel-insurance",provider:"Revolut",membership:"Revolut",tier:"Premium",title:"Medical Travel Insurance",description:"Emergency medical insurance abroad.",category:"insurance",reset_period:"NONE",next_reset_date:null,usage_limit:"Ongoing",popularity:"Common"},
  {perk_id:"revolut-premium-atm-withdrawals",provider:"Revolut",membership:"Revolut",tier:"Premium",title:"Fee-Free ATM (£400/mo)",description:"Up to £400/month fee-free ATM withdrawals worldwide.",category:"finance",reset_period:"MONTHLY",next_reset_date:"2026-05-01",usage_limit:"£400/month",popularity:"Common"},
  {perk_id:"revolut-premium-currency-exchange",provider:"Revolut",membership:"Revolut",tier:"Premium",title:"Unlimited Currency Exchange",description:"Unlimited interbank-rate currency exchange, no fees.",category:"finance",reset_period:"NONE",next_reset_date:null,usage_limit:"Unlimited",popularity:"Common"},
  {perk_id:"revolut-metal-atm-800",provider:"Revolut",membership:"Revolut",tier:"Metal",title:"Fee-Free ATM (£800/mo)",description:"Up to £800/month fee-free ATM withdrawals worldwide.",category:"finance",reset_period:"MONTHLY",next_reset_date:"2026-05-01",usage_limit:"£800/month",popularity:"Common"},
  {perk_id:"revolut-metal-travel-insurance",provider:"Revolut",membership:"Revolut",tier:"Metal",title:"Comprehensive Travel Insurance",description:"Global medical, flight delay, lost luggage, winter sports.",category:"insurance",reset_period:"NONE",next_reset_date:null,usage_limit:"Ongoing",popularity:"Common"},
  {perk_id:"revolut-metal-revpoints",provider:"Revolut",membership:"Revolut",tier:"Metal",title:"RevPoints (1 per £2)",description:"Earn 1 RevPoint per £2 spent, redeemable for travel perks.",category:"travel",reset_period:"NONE",next_reset_date:null,usage_limit:"Ongoing",popularity:"Common"},
  {perk_id:"revolut-metal-savings",provider:"Revolut",membership:"Revolut",tier:"Metal",title:"3.51% AER Savings",description:"Up to 3.51% AER (variable) on instant access savings.",category:"finance",reset_period:"NONE",next_reset_date:null,usage_limit:"Ongoing",popularity:"Common"},
  {perk_id:"revolut-ultra-lounge-access",provider:"Revolut",membership:"Revolut",tier:"Ultra",title:"Airport Lounge Access",description:"Unlimited personal airport lounge passes.",category:"airport",reset_period:"NONE",next_reset_date:null,usage_limit:"Unlimited",popularity:"Common"},
  {perk_id:"revolut-ultra-partner-subs",provider:"Revolut",membership:"Revolut",tier:"Ultra",title:"Partner Subscriptions Bundle",description:"FT, WeWork, Uber One, The Athletic, MasterClass, and more.",category:"retail",reset_period:"MONTHLY",next_reset_date:"2026-05-01",usage_limit:"Ongoing",popularity:"Common"},
  {perk_id:"revolut-ultra-atm-2000",provider:"Revolut",membership:"Revolut",tier:"Ultra",title:"Fee-Free ATM (£2,000/mo)",description:"Up to £2,000/month fee-free ATM withdrawals worldwide.",category:"finance",reset_period:"MONTHLY",next_reset_date:"2026-05-01",usage_limit:"£2,000/month",popularity:"Common"},
  {perk_id:"revolut-ultra-savings",provider:"Revolut",membership:"Revolut",tier:"Ultra",title:"4% AER Savings",description:"Up to 4.00% AER (variable), paid daily.",category:"finance",reset_period:"NONE",next_reset_date:null,usage_limit:"Ongoing",popularity:"Common"},
  {perk_id:"revolut-ultra-revpoints-1per1",provider:"Revolut",membership:"Revolut",tier:"Ultra",title:"RevPoints (1 per £1)",description:"Earn 1 RevPoint per £1 spent — double the Metal rate.",category:"travel",reset_period:"NONE",next_reset_date:null,usage_limit:"Ongoing",popularity:"Common"},
  {perk_id:"amex-gold-airport-lounge",provider:"American Express",membership:"American Express",tier:"Gold",title:"Airport Lounge Passes",description:"Four complimentary lounge visits per year.",category:"airport",reset_period:"ANNUALLY",next_reset_date:"2027-01-01",usage_limit:"4 per year",popularity:"Common"},
  {perk_id:"amex-gold-deliveroo-credit",provider:"American Express",membership:"American Express",tier:"Gold",title:"Deliveroo Credit (£120/yr)",description:"£10 Deliveroo credit each month.",category:"retail",reset_period:"MONTHLY",next_reset_date:"2026-05-01",usage_limit:"£10/month",popularity:"Common"},
  {perk_id:"amex-gold-hotel-collection",provider:"American Express",membership:"American Express",tier:"Gold",title:"The Hotel Collection",description:"US$100 in-hotel credit and upgrade at 4-5 star hotels.",category:"travel",reset_period:"NONE",next_reset_date:null,usage_limit:"Per qualifying stay",popularity:"Occasional"},
  {perk_id:"amex-gold-double-airline-points",provider:"American Express",membership:"American Express",tier:"Gold",title:"Double Points on Airlines",description:"Double Membership Rewards on direct airline purchases.",category:"travel",reset_period:"NONE",next_reset_date:null,usage_limit:"Ongoing",popularity:"Common"},
  {perk_id:"amex-plat-airport-lounge-1",provider:"American Express",membership:"American Express",tier:"Platinum",title:"Priority Pass Lounge Access",description:"Unlimited access to 1,400+ airport lounges.",category:"airport",reset_period:"NONE",next_reset_date:null,usage_limit:"Unlimited",popularity:"Common"},
  {perk_id:"amex-plat-dining-credit-uk",provider:"American Express",membership:"American Express",tier:"Platinum",title:"UK Dining Credit (£200/yr)",description:"£200/yr at 160+ UK restaurants in half-year credits.",category:"retail",reset_period:"ANNUALLY",next_reset_date:"2026-07-01",usage_limit:"£100/half-year",popularity:"Common"},
  {perk_id:"amex-plat-dining-credit-intl",provider:"American Express",membership:"American Express",tier:"Platinum",title:"Intl Dining Credit (£200/yr)",description:"£200/yr at 1,400+ international restaurants.",category:"retail",reset_period:"ANNUALLY",next_reset_date:"2026-07-01",usage_limit:"£100/half-year",popularity:"Common"},
  {perk_id:"amex-plat-hotel-status",provider:"American Express",membership:"American Express",tier:"Platinum",title:"Elite Hotel Status",description:"Gold status at Marriott, Hilton, Radisson, Melia.",category:"travel",reset_period:"ANNUALLY",next_reset_date:"2027-01-01",usage_limit:"Ongoing",popularity:"Common"},
  {perk_id:"amex-plat-eurostar-lounge",provider:"American Express",membership:"American Express",tier:"Platinum",title:"Eurostar Lounge Access",description:"Business Lounges in London, Brussels and Paris.",category:"travel",reset_period:"NONE",next_reset_date:null,usage_limit:"Unlimited personal",popularity:"Occasional"},
  {perk_id:"amex-plat-times-digital",provider:"American Express",membership:"American Express",tier:"Platinum",title:"The Times Subscription",description:"Complimentary digital Times and Sunday Times.",category:"retail",reset_period:"NONE",next_reset_date:null,usage_limit:"Ongoing",popularity:"Occasional"},
  {perk_id:"amex-plat-car-hire-status",provider:"American Express",membership:"American Express",tier:"Platinum",title:"Car Hire Elite Status",description:"Avis President's Club and Hertz Five Star status.",category:"travel",reset_period:"NONE",next_reset_date:null,usage_limit:"Ongoing",popularity:"Occasional"},
];

// ─── THEME ───
const T = { primary:"#0B3D91",accent:"#1E90FF",bg:"#F8F9FC",surface:"#FFFFFF",border:"#E2E8F0",textPrimary:"#0F172A",textSecondary:"#64748B",muted:"#94A3B8",success:"#10B981",warning:"#F59E0B",danger:"#EF4444",shadow:"0 1px 3px rgba(15,23,42,0.06),0 1px 2px rgba(15,23,42,0.04)" };
const PROVIDERS = { "OVO Energy":{color:"#00C86F",initials:"OV",bg:"#ECFDF5"},"Monzo":{color:"#FF5C5C",initials:"MZ",bg:"#FFF1F2"},"Revolut":{color:"#6C63FF",initials:"RV",bg:"#EEF2FF"},"American Express":{color:"#0077C8",initials:"AX",bg:"#EFF6FF"} };
const CATEGORIES = { cinema:{label:"Cinema",icon:"🎬"},supermarket:{label:"Supermarket",icon:"🛒"},airport:{label:"Airport",icon:"✈️"},insurance:{label:"Insurance",icon:"🛡️"},travel:{label:"Travel",icon:"🌍"},finance:{label:"Finance",icon:"💰"},retail:{label:"Retail",icon:"🛍️"},other:{label:"Other",icon:"📦"} };
const TABS = [{id:"home",label:"Home",icon:"🏠"},{id:"memberships",label:"Current",icon:"💳"},{id:"where",label:"Where",icon:"📍"},{id:"potential",label:"Potential",icon:"✨"},{id:"profile",label:"Profile",icon:"👤"}];
function resetLabel(p){return{WEEKLY:"Weekly",MONTHLY:"Monthly",ANNUALLY:"Annually",NONE:"No reset"}[p]||p;}
function alphaSort(a,b){return a.title.localeCompare(b.title);}

/* ═══════════════════ SHARED UI COMPONENTS ═══════════════════ */
function PerkBrandIcon({perkId,size=32}){const b=PERK_BRANDS[perkId]||{initials:"??",color:T.muted};return(<div style={{width:size,height:size,borderRadius:size*0.24,background:`linear-gradient(135deg,${b.color}15,${b.color}25)`,border:`1.5px solid ${b.color}30`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:size*0.36,fontWeight:800,color:b.color,flexShrink:0,fontFamily:"'DM Sans',sans-serif",letterSpacing:"-0.3px"}}>{b.initials}</div>);}
function ProviderOverlay({provider,size=15}){const p=PROVIDERS[provider]||{color:T.muted,initials:"??"};return(<div style={{position:"absolute",top:-2,right:-2,width:size,height:size,borderRadius:size*0.35,background:p.color,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:size*0.48,fontWeight:800,border:"1.5px solid #fff",fontFamily:"'DM Sans',sans-serif",boxShadow:"0 1px 2px rgba(0,0,0,0.1)"}}>{p.initials}</div>);}
function ProviderBadge({provider,size=30}){const p=PROVIDERS[provider]||{color:T.muted,initials:"??",bg:"#f1f5f9"};return(<div style={{width:size,height:size,borderRadius:size*0.28,background:p.bg,border:`1.5px solid ${p.color}33`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:size*0.42,fontWeight:800,color:p.color,flexShrink:0,fontFamily:"'DM Sans',sans-serif"}}>{p.initials}</div>);}
function Dropdown({value,onChange,options,placeholder,disabled}){return(<select value={value} onChange={e=>onChange(e.target.value)} disabled={disabled} style={{flex:1,padding:"9px 12px",borderRadius:10,border:`1.5px solid ${T.border}`,background:T.surface,color:value?T.textPrimary:T.muted,fontSize:13,fontFamily:"'DM Sans',sans-serif",fontWeight:600,appearance:"none",backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%2394A3B8'/%3E%3C/svg%3E")`,backgroundRepeat:"no-repeat",backgroundPosition:"right 12px center",opacity:disabled?0.5:1}}><option value="">{placeholder}</option>{options.map(o=><option key={o} value={o}>{o}</option>)}</select>);}
function SectionHeader({children,count}){return(<div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8,marginTop:16}}><span style={{fontSize:14,fontWeight:800,color:T.textPrimary,fontFamily:"'DM Sans',sans-serif"}}>{children}</span>{count!=null&&(<span style={{fontSize:10,background:"#EFF6FF",color:T.accent,padding:"1px 7px",borderRadius:10,fontWeight:700,fontFamily:"'DM Sans',sans-serif"}}>{count}</span>)}</div>);}
function TabDesc({children}){return <p style={{fontSize:12,color:T.textSecondary,margin:"0 0 14px",lineHeight:1.5,fontFamily:"'DM Sans',sans-serif"}}>{children}</p>;}
function Spinner(){return <div style={{display:"flex",justifyContent:"center",alignItems:"center",padding:40}}><div style={{width:32,height:32,border:`3px solid ${T.border}`,borderTopColor:T.accent,borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></div>;}

/* ─── COMPACT PERK TILE ─── */
function PerkTile({perk,onToggle,selected,onSelect}){
  const pCfg=PROVIDERS[perk.provider]||{};
  return(
    <div style={{position:"relative"}}>
      <div onClick={e=>{e.stopPropagation();onSelect(perk.perk_id===selected?null:perk.perk_id);}} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 12px",borderRadius:12,background:perk.used?"#F1F5F9":T.surface,border:`1px solid ${perk.perk_id===selected?T.accent:T.border}`,opacity:perk.used?0.5:1,cursor:"pointer",transition:"all 0.15s",boxShadow:perk.used?"none":T.shadow}}>
        <div style={{position:"relative",flexShrink:0}}><PerkBrandIcon perkId={perk.perk_id} size={32}/><ProviderOverlay provider={perk.provider} size={14}/></div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:13,fontWeight:700,color:T.textPrimary,fontFamily:"'DM Sans',sans-serif",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{perk.title}</div>
          <div style={{fontSize:10,color:pCfg.color||T.textSecondary,fontWeight:600,fontFamily:"'DM Sans',sans-serif"}}>{perk.membership} — {perk.tier}</div>
        </div>
        {perk.used&&<span style={{fontSize:9,fontWeight:700,color:"#065F46",background:"#D1FAE5",padding:"2px 7px",borderRadius:10,flexShrink:0,fontFamily:"'DM Sans',sans-serif"}}>✓</span>}
      </div>
      {perk.perk_id===selected&&(
        <div onClick={e=>e.stopPropagation()} style={{margin:"4px 0 6px",padding:"12px 14px",borderRadius:12,background:"#1E293B",color:"#F1F5F9",fontSize:12,lineHeight:1.5,fontFamily:"'DM Sans',sans-serif",boxShadow:"0 6px 20px rgba(0,0,0,0.18)",position:"relative",zIndex:10}}>
          <div style={{fontSize:13,fontWeight:700,marginBottom:6,color:"#fff"}}>{perk.title}</div>
          <div style={{marginBottom:8,color:"#CBD5E1"}}>{perk.description}</div>
          <div style={{display:"flex",gap:12,flexWrap:"wrap",marginBottom:10,fontSize:11,color:"#94A3B8"}}><span>📅 {perk.next_reset_date?`Renews ${perk.next_reset_date}`:"No renewal date"}</span><span>🔄 {resetLabel(perk.reset_period)}</span></div>
          <label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",fontSize:12,fontWeight:600,color:"#fff"}}><input type="checkbox" checked={perk.used} onChange={()=>onToggle(perk.perk_id)} style={{width:18,height:18,accentColor:T.accent,cursor:"pointer"}}/>{perk.used?"Marked as used":"Mark as used"}</label>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════ AUTH SCREEN ═══════════════════ */
function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState("login"); // login | signup
  const [email, setEmail] = useState(""); const [pw, setPw] = useState(""); const [name, setName] = useState("");
  const [err, setErr] = useState(""); const [showPw, setShowPw] = useState(false); const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setErr(""); setLoading(true);
    try {
      if (!SB_CONFIGURED) {
        // Fallback: accept any credentials in dev mode
        onAuth({ id: "local-dev", name: name || "Dev User", email: email || "dev@local" });
        return;
      }
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email, password: pw,
          options: { data: { full_name: name } }
        });
        if (error) throw error;
        if (data.user) onAuth({ id: data.user.id, name, email });
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password: pw });
        if (error) throw error;
        const profile = await supabase.from("profiles").select("full_name").eq("id", data.user.id).single();
        onAuth({ id: data.user.id, name: profile.data?.full_name || email.split("@")[0], email });
      }
    } catch (e) { setErr(e.message || "Something went wrong."); }
    finally { setLoading(false); }
  };

  return (
    <div style={{maxWidth:420,margin:"0 auto",minHeight:"100vh",background:T.bg,display:"flex",flexDirection:"column",justifyContent:"center",padding:"0 28px",fontFamily:"'DM Sans',sans-serif"}}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet"/>
      <div style={{textAlign:"center",marginBottom:32}}>
        <div style={{width:56,height:56,borderRadius:16,margin:"0 auto 14px",background:`linear-gradient(135deg,${T.accent},${T.primary})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,fontWeight:900,color:"#fff",boxShadow:"0 8px 24px rgba(30,144,255,0.25)"}}>P</div>
        <h1 style={{fontSize:28,fontWeight:800,color:T.textPrimary,margin:"0 0 4px"}}>Perki</h1>
        <p style={{fontSize:14,color:T.textSecondary,margin:0}}>All your membership perks in one place</p>
      </div>
      {/* Toggle */}
      <div style={{display:"flex",gap:0,marginBottom:16,borderRadius:10,overflow:"hidden",border:`1.5px solid ${T.border}`}}>
        {["login","signup"].map(m=><button key={m} onClick={()=>{setMode(m);setErr("");}} style={{flex:1,padding:"9px 0",border:"none",background:mode===m?"#EFF6FF":T.surface,color:mode===m?T.accent:T.textSecondary,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>{m==="login"?"Log In":"Sign Up"}</button>)}
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {mode==="signup"&&<div><label style={{fontSize:12,fontWeight:700,color:T.textSecondary,marginBottom:3,display:"block"}}>Full Name</label><input value={name} onChange={e=>{setName(e.target.value);setErr("");}} placeholder="Ollie Glanville" style={{width:"100%",padding:"11px 14px",borderRadius:10,border:`1.5px solid ${T.border}`,background:T.surface,fontSize:14,color:T.textPrimary,boxSizing:"border-box",outline:"none",fontFamily:"'DM Sans',sans-serif"}}/></div>}
        <div><label style={{fontSize:12,fontWeight:700,color:T.textSecondary,marginBottom:3,display:"block"}}>Email</label><input type="email" value={email} onChange={e=>{setEmail(e.target.value);setErr("");}} placeholder="you@example.com" style={{width:"100%",padding:"11px 14px",borderRadius:10,border:`1.5px solid ${err?"#FECACA":T.border}`,background:T.surface,fontSize:14,color:T.textPrimary,boxSizing:"border-box",outline:"none",fontFamily:"'DM Sans',sans-serif"}}/></div>
        <div><label style={{fontSize:12,fontWeight:700,color:T.textSecondary,marginBottom:3,display:"block"}}>Password</label><div style={{position:"relative"}}><input type={showPw?"text":"password"} value={pw} onChange={e=>{setPw(e.target.value);setErr("");}} placeholder="Min. 6 characters" style={{width:"100%",padding:"11px 44px 11px 14px",borderRadius:10,border:`1.5px solid ${err?"#FECACA":T.border}`,background:T.surface,fontSize:14,color:T.textPrimary,boxSizing:"border-box",outline:"none",fontFamily:"'DM Sans',sans-serif"}}/><button onClick={()=>setShowPw(!showPw)} style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",fontSize:16,color:T.muted,padding:4}}>{showPw?"🙈":"👁️"}</button></div></div>
        {err&&<p style={{fontSize:12,color:T.danger,margin:0,padding:"8px 12px",background:"#FEF2F2",borderRadius:8,fontWeight:600}}>{err}</p>}
        <button onClick={handleSubmit} disabled={loading} style={{width:"100%",padding:"13px 0",borderRadius:12,border:"none",background:`linear-gradient(135deg,${T.accent},${T.primary})`,color:"#fff",fontSize:15,fontWeight:800,cursor:loading?"wait":"pointer",fontFamily:"'DM Sans',sans-serif",marginTop:2,boxShadow:"0 4px 14px rgba(30,144,255,0.3)",opacity:loading?0.7:1}}>{loading?"Please wait…":mode==="login"?"Log In":"Create Account"}</button>
        {!SB_CONFIGURED&&<p style={{fontSize:10,color:T.warning,textAlign:"center",marginTop:6,background:"#FEF3C7",padding:"6px 10px",borderRadius:8,fontWeight:600}}>⚠️ Supabase not configured — running in offline mode. Any credentials work.</p>}
      </div>
    </div>
  );
}

/* ═══════════════════ HOME TAB ═══════════════════ */
function HomeTab({perks,onToggle}){const[selected,setSelected]=useState(null);const[groupBy,setGroupBy]=useState("reset");const sorted=useMemo(()=>[...perks].sort(alphaSort),[perks]);const groups=useMemo(()=>{if(groupBy==="category"){const g={};sorted.forEach(p=>{const c=CATEGORIES[p.category]?.label||"Other";(g[c]=g[c]||[]).push(p);});return g;}const g={Weekly:[],Monthly:[],Annually:[],"No Reset":[]};sorted.forEach(p=>{g[{WEEKLY:"Weekly",MONTHLY:"Monthly",ANNUALLY:"Annually",NONE:"No Reset"}[p.reset_period]||"No Reset"].push(p);});return g;},[sorted,groupBy]);const used=perks.filter(p=>p.used).length;return(<div onClick={()=>setSelected(null)}><h1 style={{fontSize:22,fontWeight:800,color:T.textPrimary,margin:0,fontFamily:"'DM Sans',sans-serif"}}>Your Perks</h1><TabDesc>All your active perks across every membership. Tap any perk to see details or mark it as used.</TabDesc><p style={{fontSize:12,color:T.textSecondary,margin:"0 0 10px",fontFamily:"'DM Sans',sans-serif",fontWeight:600}}>Used {used} / Total {perks.length}</p><div style={{display:"flex",gap:8,marginBottom:12}}>{["reset","category"].map(g=>(<button key={g} onClick={()=>setGroupBy(g)} style={{padding:"6px 14px",borderRadius:20,border:`1.5px solid ${groupBy===g?T.accent:T.border}`,background:groupBy===g?"#EFF6FF":T.surface,color:groupBy===g?T.accent:T.textSecondary,fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>{g==="reset"?"By Reset":"By Category"}</button>))}</div>{Object.entries(groups).map(([name,items])=>items.length>0&&(<div key={name}><SectionHeader count={items.length}>{name}</SectionHeader><div style={{display:"flex",flexDirection:"column",gap:6}}>{items.map(p=><PerkTile key={p.perk_id} perk={p} onToggle={onToggle} selected={selected} onSelect={setSelected}/>)}</div></div>))}</div>);}

/* ═══════════════════ CURRENT MEMBERSHIPS TAB ═══════════════════ */
function MembershipsTab({perks,onToggle,activeMemberships}){const[brand,setBrand]=useState("");const[tier,setTier]=useState("");const[selected,setSelected]=useState(null);const activeProviders=[...new Set(activeMemberships.map(m=>m.provider))].sort();const activeTiers=brand?[...new Set(activeMemberships.filter(m=>m.provider===brand).map(m=>m.tier))]:[];const filtered=useMemo(()=>perks.filter(p=>(!brand||p.provider===brand)&&(!tier||p.tier===tier)).sort(alphaSort),[perks,brand,tier]);const used=filtered.filter(p=>p.used).length;return(<div onClick={()=>setSelected(null)}><h1 style={{fontSize:22,fontWeight:800,color:T.textPrimary,margin:0,fontFamily:"'DM Sans',sans-serif"}}>Current Memberships</h1><TabDesc>Browse perks from your active memberships. Filter by provider or tier to find what you need.</TabDesc><div style={{display:"flex",gap:8,marginBottom:14}}><Dropdown value={brand} onChange={v=>{setBrand(v);setTier("");}} options={activeProviders} placeholder="All Providers"/><Dropdown value={tier} onChange={setTier} options={activeTiers} placeholder="All Tiers" disabled={!brand}/></div>{filtered.length>0&&<p style={{fontSize:12,color:T.textSecondary,margin:"0 0 8px",fontFamily:"'DM Sans',sans-serif",fontWeight:600}}>Used {used} / Total {filtered.length}</p>}<div style={{display:"flex",flexDirection:"column",gap:6}}>{filtered.map(p=><PerkTile key={p.perk_id} perk={p} onToggle={onToggle} selected={selected} onSelect={setSelected}/>)}</div>{filtered.length===0&&<p style={{textAlign:"center",color:T.muted,marginTop:40,fontSize:13,fontFamily:"'DM Sans',sans-serif"}}>Select a provider to see your perks</p>}</div>);}

/* ═══════════════════ WHERE TO USE ═══════════════════ */
function WhereTab({perks,onToggle}){const[sel,setSel]=useState(null);const[sp,setSp]=useState(null);const catGroups=useMemo(()=>{const g={};perks.forEach(p=>{const c=p.category;if(!g[c])g[c]={perks:[],providers:new Set()};g[c].perks.push(p);g[c].providers.add(p.provider);});return g;},[perks]);return(<div onClick={()=>setSp(null)}><h1 style={{fontSize:22,fontWeight:800,color:T.textPrimary,margin:0,fontFamily:"'DM Sans',sans-serif"}}>Where to Use</h1><TabDesc>Find perks by category. Tap a category to see all matching perks underneath it.</TabDesc><div style={{display:"flex",flexDirection:"column",gap:10}}>{Object.entries(catGroups).map(([cat,data])=>{const info=CATEGORIES[cat]||CATEGORIES.other;const isSel=sel===cat;return(<div key={cat}><div onClick={()=>{setSel(isSel?null:cat);setSp(null);}} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",borderRadius:12,cursor:"pointer",transition:"all 0.15s",background:isSel?"#1E293B":T.surface,border:`1.5px solid ${isSel?"#1E293B":T.border}`,boxShadow:isSel?"none":T.shadow,color:isSel?"#fff":T.textPrimary}}><span style={{fontSize:24}}>{info.icon}</span><div style={{flex:1}}><div style={{fontSize:13,fontWeight:700,fontFamily:"'DM Sans',sans-serif"}}>{info.label}</div><div style={{fontSize:11,color:isSel?"#94A3B8":T.textSecondary,fontFamily:"'DM Sans',sans-serif"}}>{data.perks.length} perks · {data.providers.size} providers</div></div><div style={{display:"flex",gap:3}}>{[...data.providers].map(prov=><ProviderBadge key={prov} provider={prov} size={20}/>)}</div><span style={{fontSize:14,color:isSel?"#94A3B8":T.muted,transition:"transform 0.2s",transform:isSel?"rotate(180deg)":"rotate(0deg)",display:"inline-block"}}>▾</span></div>{isSel&&(<div style={{margin:"6px 0 4px",padding:"10px 12px",borderRadius:12,background:"#1E293B",boxShadow:"0 4px 16px rgba(0,0,0,0.12)"}}><div style={{display:"flex",flexDirection:"column",gap:6}}>{data.perks.sort(alphaSort).map(p=>(<div key={p.perk_id}><div onClick={e=>{e.stopPropagation();setSp(sp===p.perk_id?null:p.perk_id);}} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",borderRadius:10,background:p.used?"rgba(255,255,255,0.05)":"rgba(255,255,255,0.08)",cursor:"pointer",opacity:p.used?0.5:1,transition:"all 0.15s",border:`1px solid ${sp===p.perk_id?T.accent:"rgba(255,255,255,0.1)"}`}}><div style={{position:"relative",flexShrink:0}}><PerkBrandIcon perkId={p.perk_id} size={28}/><ProviderOverlay provider={p.provider} size={12}/></div><div style={{flex:1,minWidth:0}}><div style={{fontSize:12,fontWeight:700,color:"#F1F5F9",fontFamily:"'DM Sans',sans-serif",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{p.title}</div><div style={{fontSize:10,color:"#94A3B8",fontFamily:"'DM Sans',sans-serif"}}>{p.membership} — {p.tier}</div></div>{p.used&&<span style={{fontSize:9,fontWeight:700,color:"#6EE7B7",fontFamily:"'DM Sans',sans-serif"}}>✓</span>}</div>{sp===p.perk_id&&(<div onClick={e=>e.stopPropagation()} style={{margin:"4px 0",padding:"10px 12px",borderRadius:10,background:"#334155",fontSize:12,lineHeight:1.5,color:"#CBD5E1",fontFamily:"'DM Sans',sans-serif"}}><div style={{marginBottom:6}}>{p.description}</div><div style={{fontSize:11,color:"#94A3B8",marginBottom:8}}>📅 {p.next_reset_date?`Renews ${p.next_reset_date}`:"No renewal"} · 🔄 {resetLabel(p.reset_period)}</div><label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",fontSize:12,fontWeight:600,color:"#fff"}}><input type="checkbox" checked={p.used} onChange={()=>onToggle(p.perk_id)} style={{width:16,height:16,accentColor:T.accent,cursor:"pointer"}}/>{p.used?"Marked as used":"Mark as used"}</label></div>)}</div>))}</div></div>)}</div>);})}</div></div>);}

/* ═══════════════════ PROFILE TAB ═══════════════════ */
function ProfileTab({perks,activeMemberships,onRemoveMembership,user,onLogout,onToggle}){const[expanded,setExpanded]=useState(null);const[profilePic,setProfilePic]=useState(null);const[howToOpen,setHowToOpen]=useState(false);const fileRef=useRef(null);const used=perks.filter(p=>p.used).length;const sortedM=useMemo(()=>[...activeMemberships].sort((a,b)=>a.provider.localeCompare(b.provider)),[activeMemberships]);const handlePic=e=>{const f=e.target.files?.[0];if(f){const r=new FileReader();r.onload=ev=>setProfilePic(ev.target.result);r.readAsDataURL(f);}};
  return(<div><h1 style={{fontSize:22,fontWeight:800,color:T.textPrimary,margin:0,fontFamily:"'DM Sans',sans-serif"}}>Profile</h1><TabDesc>Manage your account, view perk usage stats, and control your active memberships.</TabDesc>
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",padding:"20px 16px 18px",marginBottom:14,background:T.surface,borderRadius:14,border:`1px solid ${T.border}`,boxShadow:T.shadow}}><div onClick={()=>fileRef.current?.click()} style={{width:64,height:64,borderRadius:32,cursor:"pointer",background:profilePic?`url(${profilePic}) center/cover`:`linear-gradient(135deg,${T.accent},${T.primary})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:profilePic?0:24,fontWeight:900,color:"#fff",border:"3px solid #fff",boxShadow:"0 4px 14px rgba(30,144,255,0.2)",position:"relative",overflow:"hidden"}}>{!profilePic&&user.name.split(" ").map(n=>n[0]).join("")}<div style={{position:"absolute",bottom:0,left:0,right:0,height:20,background:"rgba(0,0,0,0.45)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,color:"#fff",fontWeight:600}}>Edit</div></div><input ref={fileRef} type="file" accept="image/*" onChange={handlePic} style={{display:"none"}}/><h2 style={{fontSize:16,fontWeight:800,color:T.textPrimary,margin:"10px 0 1px",fontFamily:"'DM Sans',sans-serif"}}>{user.name}</h2><p style={{fontSize:12,color:T.textSecondary,margin:"0 0 12px",fontFamily:"'DM Sans',sans-serif"}}>{user.email}</p><button onClick={onLogout} style={{padding:"7px 22px",borderRadius:10,border:`1.5px solid ${T.border}`,background:T.bg,color:T.textSecondary,fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>Log Out</button></div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}><div style={{padding:14,borderRadius:12,textAlign:"center",background:"#F0FDF4",border:"1.5px solid #BBF7D0"}}><div style={{fontSize:26,fontWeight:800,color:T.success,fontFamily:"'DM Sans',sans-serif"}}>{perks.length-used}</div><div style={{fontSize:10,color:"#065F46",fontWeight:600,fontFamily:"'DM Sans',sans-serif"}}>Available</div></div><div style={{padding:14,borderRadius:12,textAlign:"center",background:"#EFF6FF",border:"1.5px solid #BFDBFE"}}><div style={{fontSize:26,fontWeight:800,color:T.accent,fontFamily:"'DM Sans',sans-serif"}}>{used}</div><div style={{fontSize:10,color:"#1E40AF",fontWeight:600,fontFamily:"'DM Sans',sans-serif"}}>Used</div></div></div>
    <p style={{fontSize:12,color:T.textSecondary,margin:"0 0 6px",fontFamily:"'DM Sans',sans-serif",fontWeight:600}}>Used {used} / Total {perks.length}</p>
    {/* How to Use */}
    <div style={{marginTop:14,marginBottom:14}}><div onClick={()=>setHowToOpen(!howToOpen)} style={{display:"flex",alignItems:"center",gap:10,padding:"12px 14px",borderRadius:12,cursor:"pointer",background:T.surface,border:`1.5px solid ${howToOpen?T.accent:T.border}`,boxShadow:T.shadow}}><span style={{fontSize:20}}>📖</span><div style={{flex:1}}><div style={{fontSize:13,fontWeight:700,color:T.textPrimary,fontFamily:"'DM Sans',sans-serif"}}>How to Use Perki</div><div style={{fontSize:11,color:T.textSecondary,fontFamily:"'DM Sans',sans-serif"}}>Learn how each tab works</div></div><span style={{fontSize:14,color:T.muted,transform:howToOpen?"rotate(180deg)":"rotate(0)",transition:"transform 0.2s",display:"inline-block"}}>▾</span></div>{howToOpen&&(<div style={{margin:"6px 0",padding:"14px",borderRadius:12,background:"#1E293B",color:"#CBD5E1",fontSize:12,lineHeight:1.6,fontFamily:"'DM Sans',sans-serif"}}><div style={{fontWeight:700,color:"#fff",marginBottom:4}}>🏠 Home</div><div style={{marginBottom:10}}>See all your perks sorted alphabetically. Tap any perk to view its description, renewal date, and mark it as used.</div><div style={{fontWeight:700,color:"#fff",marginBottom:4}}>💳 Current Memberships</div><div style={{marginBottom:10}}>Filter your perks by provider and tier using the dropdowns.</div><div style={{fontWeight:700,color:"#fff",marginBottom:4}}>📍 Where to Use</div><div style={{marginBottom:10}}>Browse perks by category. Tap a category to see matching perks inline.</div><div style={{fontWeight:700,color:"#fff",marginBottom:4}}>✨ Potential Memberships</div><div style={{marginBottom:10}}>Discover memberships you don't have yet. Use ❓ to request one we haven't listed.</div><div style={{fontWeight:700,color:"#fff",marginBottom:4}}>👤 Profile</div><div>View stats, manage memberships, and update your profile picture.</div></div>)}</div>
    {/* Active Memberships */}
    <SectionHeader count={sortedM.length}>Active Memberships</SectionHeader>
    <div style={{display:"flex",flexDirection:"column",gap:10}}>{sortedM.map(m=>{const key=`${m.provider}|${m.tier}`;const pCfg=PROVIDERS[m.provider]||{};const isExp=expanded===key;const effectiveTiers=getEffectiveTiers(m.provider,m.tier);const allPerks=perks.filter(p=>p.provider===m.provider&&effectiveTiers.includes(p.tier)).sort(alphaSort);const activePerks=allPerks.filter(p=>p.tier===m.tier);const inheritedPerks=allPerks.filter(p=>p.tier!==m.tier);const mUsed=allPerks.filter(p=>p.used).length;return(<div key={key} style={{borderRadius:14,overflow:"hidden",border:`1.5px solid ${isExp?pCfg.color+"44":T.border}`,background:T.surface,boxShadow:T.shadow}}><div onClick={()=>setExpanded(isExp?null:key)} style={{display:"flex",alignItems:"center",gap:10,padding:"11px 14px",cursor:"pointer",background:isExp?pCfg.bg||"#F1F5F9":"transparent"}}><ProviderBadge provider={m.provider} size={32}/><div style={{flex:1}}><div style={{fontSize:13,fontWeight:700,color:T.textPrimary,fontFamily:"'DM Sans',sans-serif"}}>{m.membership} — {m.tier}</div><div style={{fontSize:11,color:T.textSecondary,fontFamily:"'DM Sans',sans-serif"}}>Used {mUsed} / Total {allPerks.length}{inheritedPerks.length>0&&` (incl. ${inheritedPerks.length} inherited)`}</div></div><button onClick={e=>{e.stopPropagation();onRemoveMembership(m.provider,m.tier);}} style={{padding:"4px 9px",borderRadius:8,border:"1.5px solid #FECACA",background:"#FEF2F2",color:"#DC2626",fontSize:10,fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>Remove</button><span style={{fontSize:14,color:T.muted,transition:"transform 0.2s",transform:isExp?"rotate(180deg)":"rotate(0deg)",display:"inline-block"}}>▾</span></div>{isExp&&(<div style={{padding:"0 14px 14px"}}><div style={{fontSize:10,fontWeight:800,color:T.success,textTransform:"uppercase",letterSpacing:"0.5px",margin:"10px 0 6px",fontFamily:"'DM Sans',sans-serif",display:"flex",alignItems:"center",gap:5}}><span style={{width:5,height:5,borderRadius:3,background:T.success}}/>Active Perks <span style={{fontSize:9,fontWeight:700,background:"#D1FAE5",color:"#065F46",padding:"1px 5px",borderRadius:8}}>{activePerks.length}</span></div><div style={{display:"flex",flexDirection:"column",gap:4}}>{activePerks.map(p=><PerkTile key={p.perk_id} perk={p} onToggle={onToggle} selected={null} onSelect={()=>{}}/>)}{activePerks.length===0&&<p style={{fontSize:11,color:T.muted,fontStyle:"italic",margin:"2px 0",fontFamily:"'DM Sans',sans-serif"}}>No perks at this tier level.</p>}</div>{inheritedPerks.length>0&&(<><div style={{fontSize:10,fontWeight:800,color:T.muted,textTransform:"uppercase",letterSpacing:"0.5px",margin:"14px 0 6px",fontFamily:"'DM Sans',sans-serif",display:"flex",alignItems:"center",gap:5}}><span style={{width:5,height:5,borderRadius:3,background:T.muted}}/>Inherited Perks <span style={{fontSize:9,fontWeight:700,background:"#F1F5F9",color:T.textSecondary,padding:"1px 5px",borderRadius:8}}>{inheritedPerks.length}</span></div><p style={{fontSize:10,color:T.muted,margin:"0 0 6px",fontFamily:"'DM Sans',sans-serif"}}>From lower tiers in your plan</p><div style={{display:"flex",flexDirection:"column",gap:4}}>{inheritedPerks.map(p=><PerkTile key={p.perk_id} perk={p} onToggle={onToggle} selected={null} onSelect={()=>{}}/>)}</div></>)}</div>)}</div>);})}</div>
    {sortedM.length===0&&<p style={{textAlign:"center",color:T.muted,marginTop:20,fontSize:13,fontFamily:"'DM Sans',sans-serif"}}>No active memberships.</p>}
  </div>);
}

/* ═══════════════════ POTENTIAL MEMBERSHIPS TAB ═══════════════════ */
function PotentialTab({allPerks,activeMemberships,onAddMembership,userName,userId}){
  const[brand,setBrand]=useState("");const[tier,setTier]=useState("");const[search,setSearch]=useState("");const[selected,setSelected]=useState(null);
  const[showRequest,setShowRequest]=useState(false);const[reqName,setReqName]=useState(userName||"");const[reqText,setReqText]=useState("");const[reqSent,setReqSent]=useState(false);
  const activeSet=useMemo(()=>{const s=new Set();activeMemberships.forEach(m=>{getEffectiveTiers(m.provider,m.tier).forEach(t=>s.add(`${m.provider}|${t}`));});return s;},[activeMemberships]);
  const availableBrands=useMemo(()=>[...new Set(allPerks.map(p=>p.provider))].filter(b=>[...new Set(allPerks.filter(p=>p.provider===b).map(p=>p.tier))].some(t=>!activeSet.has(`${b}|${t}`))).sort(),[activeSet,allPerks]);
  const availableTiers=useMemo(()=>{if(!brand)return[];return[...new Set(allPerks.filter(p=>p.provider===brand).map(p=>p.tier))].filter(t=>!activeSet.has(`${brand}|${t}`));},[brand,activeSet,allPerks]);
  const filtered=useMemo(()=>{let r=allPerks.filter(p=>!activeSet.has(`${p.provider}|${p.tier}`));if(brand)r=r.filter(p=>p.provider===brand);if(tier)r=r.filter(p=>p.tier===tier);if(search.trim()){const q=search.toLowerCase();r=r.filter(p=>p.title.toLowerCase().includes(q)||p.provider.toLowerCase().includes(q)||p.tier.toLowerCase().includes(q));}return r.sort(alphaSort);},[brand,tier,search,activeSet,allPerks]);
  const tierGroups=useMemo(()=>{const g={};filtered.forEach(p=>{const k=`${p.provider}|${p.tier}`;if(!g[k])g[k]={provider:p.provider,membership:p.membership,tier:p.tier,perks:[]};g[k].perks.push(p);});return Object.values(g);},[filtered]);

  const submitRequest=async()=>{
    if(!reqText.trim())return;
    if(SB_CONFIGURED&&userId){
      await supabase.from("membership_requests").insert({user_id:userId,requester_name:reqName,description:reqText});
    }
    setReqSent(true);
  };

  return(<div onClick={()=>setSelected(null)}>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:2}}><h1 style={{fontSize:22,fontWeight:800,color:T.textPrimary,margin:0,fontFamily:"'DM Sans',sans-serif"}}>Potential Memberships</h1><button onClick={e=>{e.stopPropagation();setShowRequest(!showRequest);setReqSent(false);setReqName(userName||"");setReqText("");}} style={{width:32,height:32,borderRadius:16,border:`1.5px solid ${showRequest?T.accent:T.border}`,background:showRequest?"#EFF6FF":T.surface,color:showRequest?T.accent:T.textSecondary,fontSize:16,fontWeight:800,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'DM Sans',sans-serif",boxShadow:T.shadow}} title="Request a new membership">❓</button></div>
    <TabDesc>Explore memberships you haven't added yet. Add an entire provider + tier, or request one we haven't listed.</TabDesc>
    {showRequest&&(<div onClick={e=>e.stopPropagation()} style={{margin:"0 0 14px",padding:"14px",borderRadius:12,background:"#1E293B",boxShadow:"0 6px 20px rgba(0,0,0,0.15)"}}><div style={{fontSize:13,fontWeight:700,color:"#fff",marginBottom:8,fontFamily:"'DM Sans',sans-serif"}}>Request a Membership</div>{reqSent?(<div style={{fontSize:12,color:"#6EE7B7",fontFamily:"'DM Sans',sans-serif",padding:"8px 0"}}>✓ Request submitted! We'll review your suggestion.</div>):(<><div style={{marginBottom:8}}><label style={{fontSize:11,fontWeight:600,color:"#94A3B8",marginBottom:3,display:"block",fontFamily:"'DM Sans',sans-serif"}}>Your name</label><input value={reqName} onChange={e=>setReqName(e.target.value)} style={{width:"100%",padding:"8px 10px",borderRadius:8,border:"1px solid #334155",background:"#0F172A",color:"#F1F5F9",fontSize:13,boxSizing:"border-box",outline:"none",fontFamily:"'DM Sans',sans-serif"}}/></div><div style={{marginBottom:10}}><label style={{fontSize:11,fontWeight:600,color:"#94A3B8",marginBottom:3,display:"block",fontFamily:"'DM Sans',sans-serif"}}>Which membership would you like us to add?</label><textarea value={reqText} onChange={e=>setReqText(e.target.value)} rows={3} placeholder="e.g. NatWest Reward Account, Sky VIP..." style={{width:"100%",padding:"8px 10px",borderRadius:8,border:"1px solid #334155",background:"#0F172A",color:"#F1F5F9",fontSize:13,boxSizing:"border-box",outline:"none",fontFamily:"'DM Sans',sans-serif",resize:"vertical"}}/></div><button onClick={submitRequest} style={{padding:"8px 20px",borderRadius:10,border:"none",background:T.accent,color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",opacity:reqText.trim()?1:0.5}}>Submit Request</button></>)}</div>)}
    <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search provider, tier, or perk name..." style={{width:"100%",padding:"9px 14px",borderRadius:10,border:`1.5px solid ${T.border}`,background:T.surface,fontSize:13,fontFamily:"'DM Sans',sans-serif",color:T.textPrimary,marginBottom:10,boxSizing:"border-box",outline:"none"}}/>
    <div style={{display:"flex",gap:8,marginBottom:14}}><Dropdown value={brand} onChange={v=>{setBrand(v);setTier("");}} options={availableBrands} placeholder="All Providers"/><Dropdown value={tier} onChange={setTier} options={availableTiers} placeholder="All Tiers" disabled={!brand}/></div>
    {tierGroups.map(group=>(<div key={`${group.provider}|${group.tier}`} style={{marginBottom:14}}><div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6,padding:"9px 12px",borderRadius:12,background:PROVIDERS[group.provider]?.bg||"#F1F5F9",border:`1.5px solid ${PROVIDERS[group.provider]?.color||T.border}22`}}><div style={{display:"flex",alignItems:"center",gap:8}}><ProviderBadge provider={group.provider} size={28}/><div><div style={{fontSize:13,fontWeight:700,color:T.textPrimary,fontFamily:"'DM Sans',sans-serif"}}>{group.membership} — {group.tier}</div><div style={{fontSize:10,color:T.textSecondary,fontFamily:"'DM Sans',sans-serif"}}>{group.perks.length} perks</div></div></div><button onClick={()=>onAddMembership(group.provider,group.membership,group.tier)} style={{padding:"6px 14px",borderRadius:10,border:"none",background:T.accent,color:"#fff",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",boxShadow:"0 2px 6px rgba(30,144,255,0.3)"}}>+ Add Tier</button></div><div style={{display:"flex",flexDirection:"column",gap:5}}>{group.perks.map(p=><PerkTile key={p.perk_id} perk={p} onToggle={()=>{}} selected={selected} onSelect={setSelected}/>)}</div></div>))}
    {tierGroups.length===0&&<p style={{textAlign:"center",color:T.muted,marginTop:30,fontSize:13,fontFamily:"'DM Sans',sans-serif"}}>{search?"No matching perks found.":"All available tiers have been added."}</p>}
  </div>);
}

/* ═══════════════════ MAIN APP — DATA LAYER ═══════════════════ */
export default function PerikiApp() {
  const [user, setUser] = useState(null);       // { id, name, email }
  const [tab, setTab] = useState("home");
  const [loading, setLoading] = useState(true);
  const [allPerks, setAllPerks] = useState([]);  // full catalogue from DB
  const [activeMemberships, setActiveMemberships] = useState([]);
  const [usedMap, setUsedMap] = useState({});    // { perk_id: true }

  /* ─── 1. Auth listener (with timeout safety net) ─── */
  useEffect(() => {
    if (!SB_CONFIGURED) {
      console.log("[Perki] Supabase not configured — offline mode");
      setLoading(false);
      return;
    }

    let resolved = false;
    const resolve = () => { if (!resolved) { resolved = true; setLoading(false); } };

    // Safety timeout: if auth doesn't respond in 5 seconds, stop loading anyway
    const timeout = setTimeout(() => {
      if (!resolved) {
        console.warn("[Perki] Auth listener timed out after 5s — falling back to logged-out state");
        resolve();
      }
    }, 5000);

    let subscription;
    try {
      const result = supabase.auth.onAuthStateChange(async (event, session) => {
        console.log("[Perki] Auth event:", event, session ? "has session" : "no session");
        try {
          if (session?.user) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("full_name")
              .eq("id", session.user.id)
              .single();
            setUser({
              id: session.user.id,
              name: profile?.full_name || session.user.email?.split("@")[0] || "User",
              email: session.user.email,
            });
          } else {
            setUser(null);
          }
        } catch (err) {
          console.warn("[Perki] Error in auth handler:", err);
          setUser(null);
        }
        resolve();
      });
      subscription = result.data.subscription;
    } catch (err) {
      console.error("[Perki] Failed to set up auth listener:", err);
      resolve();
    }

    return () => {
      clearTimeout(timeout);
      subscription?.unsubscribe();
    };
  }, []);

  /* ─── 2. Load perks catalogue ─── */
  useEffect(() => {
    (async () => {
      if (!SB_CONFIGURED) { setAllPerks(FALLBACK_PERKS); return; }
      try {
        const { data, error } = await supabase.from("perks").select("*").order("title");
        if (error || !data?.length) { console.warn("[Perki] Perks query issue, using fallback:", error?.message); setAllPerks(FALLBACK_PERKS); }
        else { console.log("[Perki] Loaded", data.length, "perks from Supabase"); setAllPerks(data); }
      } catch (err) { console.warn("[Perki] Perks fetch failed, using fallback:", err); setAllPerks(FALLBACK_PERKS); }
    })();
  }, []);

  /* ─── 3. Load user data when user logs in ─── */
  useEffect(() => {
    if (!user?.id) { setActiveMemberships([]); setUsedMap({}); return; }
    (async () => {
      if (!SB_CONFIGURED) {
        // Offline mode defaults
        setActiveMemberships([
          { provider: "OVO Energy", membership: "OVO Energy", tier: "Beyond" },
          { provider: "Monzo", membership: "Monzo", tier: "Max" },
          { provider: "Revolut", membership: "Revolut", tier: "Metal" },
          { provider: "American Express", membership: "American Express", tier: "Platinum" },
        ]);
        return;
      }
      // Load memberships
      const { data: mData } = await supabase.from("user_memberships").select("provider, membership, tier").eq("user_id", user.id);
      setActiveMemberships(mData || []);
      // Load perk state
      const { data: sData } = await supabase.from("user_perk_state").select("perk_id, used").eq("user_id", user.id);
      const map = {};
      (sData || []).forEach(r => { if (r.used) map[r.perk_id] = true; });
      setUsedMap(map);
    })();
  }, [user?.id]);

  /* ─── Computed: user's perks with used state ─── */
  const userPerks = useMemo(() => {
    const perkSet = new Set();
    activeMemberships.forEach(m => { getEffectiveTiers(m.provider, m.tier).forEach(t => { allPerks.forEach(p => { if (p.provider === m.provider && p.tier === t) perkSet.add(p.perk_id); }); }); });
    return allPerks.filter(p => perkSet.has(p.perk_id)).map(p => ({ ...p, used: !!usedMap[p.perk_id] }));
  }, [activeMemberships, allPerks, usedMap]);

  const displayMemberships = useMemo(() => {
    const bp = {}; activeMemberships.forEach(m => { (bp[m.provider] = bp[m.provider] || []).push(m); });
    const r = []; Object.entries(bp).forEach(([prov, ms]) => { if (HIERARCHICAL_PROVIDERS.has(prov)) { const h = getHighestTier(prov, ms.map(m => m.tier)); h.forEach(t => { const m = ms.find(x => x.tier === t); if (m) r.push(m); }); } else r.push(...ms); }); return r;
  }, [activeMemberships]);

  /* ─── 4. Toggle perk used — optimistic + sync ─── */
  const toggleUsed = useCallback(async (perkId) => {
    const newVal = !usedMap[perkId];
    // Optimistic update
    setUsedMap(prev => ({ ...prev, [perkId]: newVal }));
    // Sync to Supabase
    if (SB_CONFIGURED && user?.id) {
      await supabase.from("user_perk_state").upsert({
        user_id: user.id, perk_id: perkId, used: newVal,
        used_at: newVal ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id,perk_id" });
    }
  }, [usedMap, user?.id]);

  /* ─── 5. Add membership ─── */
  const addMembership = useCallback(async (provider, membership, tier) => {
    // Optimistic local update
    setActiveMemberships(prev => {
      if (HIERARCHICAL_PROVIDERS.has(provider)) {
        const c = TIER_HIERARCHY[provider] || []; const ni = c.indexOf(tier);
        return [...prev.filter(m => m.provider !== provider || c.indexOf(m.tier) > ni), { provider, membership, tier }];
      }
      if (prev.find(m => m.provider === provider && m.tier === tier)) return prev;
      return [...prev, { provider, membership, tier }];
    });
    // Sync to Supabase
    if (SB_CONFIGURED && user?.id) {
      // For hierarchical providers, remove lower tiers from DB
      if (HIERARCHICAL_PROVIDERS.has(provider)) {
        const c = TIER_HIERARCHY[provider] || []; const ni = c.indexOf(tier);
        const lowerTiers = c.slice(0, ni);
        if (lowerTiers.length) {
          await supabase.from("user_memberships").delete().eq("user_id", user.id).eq("provider", provider).in("tier", lowerTiers);
        }
      }
      await supabase.from("user_memberships").upsert({ user_id: user.id, provider, membership, tier }, { onConflict: "user_id,provider,tier" });
    }
  }, [user?.id]);

  /* ─── 6. Remove membership ─── */
  const removeMembership = useCallback(async (provider, tier) => {
    setActiveMemberships(prev => prev.filter(m => !(m.provider === provider && m.tier === tier)));
    if (SB_CONFIGURED && user?.id) {
      await supabase.from("user_memberships").delete().eq("user_id", user.id).eq("provider", provider).eq("tier", tier);
    }
  }, [user?.id]);

  /* ─── 7. Logout ─── */
  const handleLogout = async () => {
    if (SB_CONFIGURED) await supabase.auth.signOut();
    setUser(null); setActiveMemberships([]); setUsedMap({}); setTab("home");
  };

  /* ─── Render ─── */
  if (loading) return <div style={{ maxWidth: 420, margin: "0 auto", minHeight: "100vh", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center" }}><Spinner /></div>;
  if (!user) return <AuthScreen onAuth={setUser} />;
  const usedCount = userPerks.filter(p => p.used).length;

  return (
    <div style={{ maxWidth: 420, margin: "0 auto", minHeight: "100vh", background: T.bg, color: T.textPrimary, position: "relative", fontFamily: "'DM Sans',sans-serif", display: "flex", flexDirection: "column" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      {!SB_CONFIGURED && <div style={{ background: "#FEF3C7", padding: "6px 16px", fontSize: 11, color: "#92400E", fontWeight: 600, textAlign: "center", fontFamily: "'DM Sans',sans-serif" }}>⚠️ Offline mode — data won't persist. Connect Supabase to save.</div>}
      <div style={{ padding: "13px 18px 11px", background: "rgba(255,255,255,0.92)", backdropFilter: "blur(12px)", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${T.border}`, position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}><div style={{ width: 28, height: 28, borderRadius: 8, background: `linear-gradient(135deg,${T.accent},${T.primary})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 900, color: "#fff" }}>P</div><span style={{ fontSize: 18, fontWeight: 800, color: T.textPrimary, letterSpacing: "-0.5px" }}>Perki</span></div>
        <div style={{ fontSize: 11, color: T.textSecondary, fontWeight: 600, background: "#F1F5F9", padding: "3px 10px", borderRadius: 20 }}>Used {usedCount} / Total {userPerks.length}</div>
      </div>
      <div style={{ flex: 1, padding: "12px 16px 100px", overflowY: "auto" }}>
        {tab === "home" && <HomeTab perks={userPerks} onToggle={toggleUsed} />}
        {tab === "memberships" && <MembershipsTab perks={userPerks} onToggle={toggleUsed} activeMemberships={displayMemberships} />}
        {tab === "where" && <WhereTab perks={userPerks} onToggle={toggleUsed} />}
        {tab === "potential" && <PotentialTab allPerks={allPerks} activeMemberships={activeMemberships} onAddMembership={addMembership} userName={user.name} userId={user.id} />}
        {tab === "profile" && <ProfileTab perks={userPerks} activeMemberships={displayMemberships} onRemoveMembership={removeMembership} user={user} onLogout={handleLogout} onToggle={toggleUsed} />}
      </div>
      <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 420, background: `linear-gradient(180deg,transparent 0%,${T.bg} 24%)`, padding: "8px 10px 12px", zIndex: 100 }}>
        <div style={{ display: "flex", justifyContent: "space-around", background: "rgba(255,255,255,0.94)", backdropFilter: "blur(14px)", borderRadius: 18, padding: "4px 2px", border: `1px solid ${T.border}`, boxShadow: "0 -2px 12px rgba(15,23,42,0.06)" }}>
          {TABS.map(t => { const isA = tab === t.id; return (<button key={t.id} onClick={() => setTab(t.id)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1, padding: "7px 4px", minWidth: 48, background: isA ? "#EFF6FF" : "transparent", border: "none", borderRadius: 12, cursor: "pointer", transition: "all 0.15s" }}><span style={{ fontSize: 16, filter: isA ? "none" : "grayscale(0.5) opacity(0.7)" }}>{t.icon}</span><span style={{ fontSize: 8, fontWeight: isA ? 800 : 600, color: isA ? T.accent : T.textSecondary, whiteSpace: "nowrap" }}>{t.label}</span></button>); })}
        </div>
      </div>
    </div>
  );
}
