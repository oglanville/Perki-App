import React, { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { supabase } from "./lib/supabase";

/* ═══════════════ CONFIG ═══════════════ */
const SB_CONFIGURED = !!supabase;

/* ═══════════════ THEME ═══════════════ */
const T={primary:"#0B3D91",accent:"#1E90FF",bg:"#F8F9FC",surface:"#FFFFFF",border:"#E2E8F0",textPrimary:"#0F172A",textSecondary:"#64748B",muted:"#94A3B8",success:"#10B981",warning:"#F59E0B",danger:"#EF4444",shadow:"0 1px 3px rgba(15,23,42,0.06),0 1px 2px rgba(15,23,42,0.04)"};
const PROVIDERS={"OVO Energy":{color:"#00C86F",initials:"OV",bg:"#ECFDF5"},"Monzo":{color:"#FF5C5C",initials:"MZ",bg:"#FFF1F2"},"Revolut":{color:"#6C63FF",initials:"RV",bg:"#EEF2FF"},"American Express":{color:"#0077C8",initials:"AX",bg:"#EFF6FF"}};
const CATEGORIES={cinema:{label:"Cinema",icon:"🎬"},supermarket:{label:"Supermarket",icon:"🛒"},airport:{label:"Airport",icon:"✈️"},insurance:{label:"Insurance",icon:"🛡️"},travel:{label:"Travel",icon:"🌍"},finance:{label:"Finance",icon:"💰"},retail:{label:"Retail",icon:"🛍️"},other:{label:"Other",icon:"📦"}};
const TABS=[{id:"home",label:"Home",icon:"🏠"},{id:"memberships",label:"Current",icon:"💳"},{id:"where",label:"Where",icon:"📍"},{id:"potential",label:"Potential",icon:"✨"},{id:"profile",label:"Profile",icon:"👤"}];

function resetLabel(p){return{WEEKLY:"Weekly",MONTHLY:"Monthly",ANNUALLY:"Annually",NONE:"Always on"}[p]||p;}
function alphaSort(a,b){return a.title.localeCompare(b.title);}

/* ═══════════════ TIER HIERARCHY HELPERS (derived from tierPrices at runtime) ═══════════════ */

/**
 * Build a sorted list of tier names for a provider from the tierPrices map.
 * Sorted by price ascending (cheapest / free first).
 */
function getProviderTierOrder(provider, tierPrices) {
  const entries = Object.entries(tierPrices)
    .filter(([k]) => k.startsWith(`${provider}|`))
    .map(([k, v]) => ({ tier: k.split("|")[1], price: v.price ?? 999 }))
    .sort((a, b) => a.price - b.price);
  return entries.map(e => e.tier);
}

/**
 * Given a provider and a selected tier, return all tiers at that level and below
 * (i.e. all tiers with price <= the selected tier's price in the hierarchy).
 */
function getEffectiveTiers(provider, tier, tierPrices) {
  const order = getProviderTierOrder(provider, tierPrices);
  const idx = order.indexOf(tier);
  if (idx < 0) return [tier];
  return order.slice(0, idx + 1);
}

/**
 * From a list of selected tiers for a provider, return only the highest one
 * (so we don't show redundant memberships).
 */
function getHighestTier(provider, tiers, tierPrices) {
  const order = getProviderTierOrder(provider, tierPrices);
  let highIdx = -1, highTier = null;
  tiers.forEach(t => {
    const i = order.indexOf(t);
    if (i > highIdx) { highIdx = i; highTier = t; }
  });
  return highTier ? [highTier] : tiers;
}

/**
 * Check if a provider has more than one tier (i.e. it has a hierarchy).
 */
function isHierarchicalProvider(provider, tierPrices) {
  return getProviderTierOrder(provider, tierPrices).length > 1;
}

/*
 * getPerkBrand(perk) — resolve icon data for any perk.
 * Uses fields from the Supabase perk row, falling back to provider color.
 */
function getPerkBrand(perk){
  const provColor=(PROVIDERS[perk.provider]||{}).color||T.muted;
  return {
    emoji:     perk.emoji       || "📦",
    initials:  perk.icon_initials || perk.title?.slice(0,2).toUpperCase() || "??",
    color:     perk.icon_color   || provColor,
    gradient:  perk.icon_gradient || `linear-gradient(135deg,${provColor}88,${provColor})`,
  };
}

/* ═══════════════ SHARED UI ═══════════════ */
function PerkBrandIcon({perk,size=32}){
  const b=getPerkBrand(perk);
  return(<div style={{width:size,height:size,borderRadius:size*0.24,background:`linear-gradient(135deg,${b.color}15,${b.color}25)`,border:`1.5px solid ${b.color}30`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:size*0.36,fontWeight:800,color:b.color,flexShrink:0,fontFamily:"'DM Sans',sans-serif",letterSpacing:"-0.3px"}}>{b.initials}</div>);
}
function ProviderOverlay({provider,size=15,style={}}){const p=PROVIDERS[provider]||{color:T.muted,initials:"??"};return(<div style={{position:"absolute",top:-2,right:-2,width:size,height:size,borderRadius:size*0.35,background:p.color,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:size*0.48,fontWeight:800,border:"1.5px solid #fff",fontFamily:"'DM Sans',sans-serif",boxShadow:"0 1px 2px rgba(0,0,0,0.1)",...style}}>{p.initials}</div>);}
function ProviderBadge({provider,size=30}){const p=PROVIDERS[provider]||{color:T.muted,initials:"??",bg:"#f1f5f9"};return(<div style={{width:size,height:size,borderRadius:size*0.28,background:p.bg,border:`1.5px solid ${p.color}33`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:size*0.42,fontWeight:800,color:p.color,flexShrink:0,fontFamily:"'DM Sans',sans-serif"}}>{p.initials}</div>);}
function Dropdown({value,onChange,options,placeholder,disabled}){return(<select value={value} onChange={e=>onChange(e.target.value)} disabled={disabled} style={{flex:1,padding:"9px 12px",borderRadius:10,border:`1.5px solid ${T.border}`,background:T.surface,color:value?T.textPrimary:T.muted,fontSize:13,fontFamily:"'DM Sans',sans-serif",fontWeight:600,appearance:"none",backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%2394A3B8'/%3E%3C/svg%3E")`,backgroundRepeat:"no-repeat",backgroundPosition:"right 12px center",opacity:disabled?0.5:1}}><option value="">{placeholder}</option>{options.map(o=><option key={o} value={o}>{o}</option>)}</select>);}
function SectionHeader({children,count}){return(<div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8,marginTop:16}}><span style={{fontSize:14,fontWeight:800,color:T.textPrimary,fontFamily:"'DM Sans',sans-serif"}}>{children}</span>{count!=null&&(<span style={{fontSize:10,background:"#EFF6FF",color:T.accent,padding:"1px 7px",borderRadius:10,fontWeight:700,fontFamily:"'DM Sans',sans-serif"}}>{count}</span>)}</div>);}
function TabDesc({children}){return <p style={{fontSize:12,color:T.textSecondary,margin:"0 0 14px",lineHeight:1.5,fontFamily:"'DM Sans',sans-serif"}}>{children}</p>;}
function Spinner(){return <div style={{display:"flex",justifyContent:"center",alignItems:"center",padding:40}}><div style={{width:32,height:32,border:`3px solid ${T.border}`,borderTopColor:T.accent,borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></div>;}

/* ── Collapsible Section ── */
function CollapsibleSection({ title, subtitle, count, badge, defaultOpen = false, headerBg, headerBorder, headerExtra, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ marginBottom: 8 }}>
      <div
        onClick={() => setOpen(!open)}
        style={{
          display: "flex", alignItems: "center", gap: 8, padding: "9px 12px",
          borderRadius: 12, cursor: "pointer",
          background: headerBg || T.surface,
          border: `1.5px solid ${headerBorder || T.border}`,
          boxShadow: T.shadow, transition: "all 0.15s",
        }}
      >
        {badge}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: T.textPrimary, fontFamily: "'DM Sans',sans-serif" }}>{title}</span>
            {headerExtra}
          </div>
          {subtitle && <div style={{ fontSize: 10, color: T.textSecondary, fontFamily: "'DM Sans',sans-serif", marginTop: 1 }}>{subtitle}</div>}
        </div>
        {count != null && <span style={{ fontSize: 10, background: "#EFF6FF", color: T.accent, padding: "1px 7px", borderRadius: 10, fontWeight: 700, fontFamily: "'DM Sans',sans-serif", flexShrink: 0 }}>{count}</span>}
        <span style={{ fontSize: 14, color: T.muted, transform: open ? "rotate(180deg)" : "rotate(0deg)", display: "inline-block", transition: "transform 0.2s", flexShrink: 0 }}>▾</span>
      </div>
      {open && <div style={{ marginTop: 6, paddingLeft: 4 }}>{children}</div>}
    </div>
  );
}

/* ── PerkTooltip ── */
function PerkTooltip({perk, onToggle, onDismiss}) {
  const pCfg=PROVIDERS[perk.provider]||{color:T.accent};
  return (
    <div onClick={e=>e.stopPropagation()} style={{padding:"14px 14px 14px 18px",borderRadius:12,background:T.surface,color:T.textPrimary,fontSize:12,lineHeight:1.5,fontFamily:"'DM Sans',sans-serif",boxShadow:"0 2px 10px rgba(15,23,42,0.08)",zIndex:10,border:`1px solid ${T.border}`,borderLeft:`4px solid ${pCfg.color||T.accent}`,position:"relative"}}>
      <div style={{fontSize:13,fontWeight:700,marginBottom:4,color:T.textPrimary}}>{perk.title}</div>
      <div style={{marginBottom:8,color:T.textSecondary}}>{perk.description}</div>
      <div style={{display:"flex",gap:12,flexWrap:"wrap",marginBottom:10,fontSize:11,color:T.muted}}>
        <span>📅 {perk.next_reset_date?`Renews ${perk.next_reset_date}`:"No renewal date"}</span>
        <span>🔄 {resetLabel(perk.reset_period)}</span>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        <label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",fontSize:12,fontWeight:600,color:T.textPrimary}}>
          <input type="checkbox" checked={!!perk.used} onChange={()=>onToggle(perk.perk_id)} disabled={!!perk.dismissed} style={{width:17,height:17,accentColor:T.success,cursor:"pointer"}}/>
          {perk.used?"Marked as used":"Mark as used"}
        </label>
        <label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",fontSize:12,fontWeight:600,color:perk.dismissed?T.danger:T.muted}}>
          <input type="checkbox" checked={!!perk.dismissed} onChange={()=>onDismiss(perk.perk_id)} style={{width:17,height:17,accentColor:T.danger,cursor:"pointer"}}/>
          Will not use (exclude from count)
        </label>
      </div>
    </div>
  );
}

/* ── PerkTile ── */
function PerkTile({perk,onToggle,onDismiss,selected,onSelect}){
  const pCfg=PROVIDERS[perk.provider]||{};
  const isDimmed = perk.used || perk.dismissed;
  return(
    <div style={{position:"relative"}}>
      <div onClick={e=>{e.stopPropagation();onSelect(perk.perk_id===selected?null:perk.perk_id);}} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 12px",borderRadius:12,background:isDimmed?"#F1F5F9":T.surface,border:`1px solid ${perk.perk_id===selected?T.accent:T.border}`,opacity:isDimmed?0.5:1,cursor:"pointer",transition:"all 0.15s",boxShadow:isDimmed?"none":T.shadow}}>
        <div style={{position:"relative",flexShrink:0}}><PerkBrandIcon perk={perk} size={32}/><ProviderOverlay provider={perk.provider} size={14}/></div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:13,fontWeight:700,color:T.textPrimary,fontFamily:"'DM Sans',sans-serif",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{perk.title}</div>
          <div style={{fontSize:10,color:pCfg.color||T.textSecondary,fontWeight:600,fontFamily:"'DM Sans',sans-serif"}}>{perk.membership} — {perk.tier}</div>
        </div>
        {perk.dismissed&&<span style={{fontSize:9,fontWeight:700,color:"#DC2626",background:"#FEE2E2",padding:"2px 7px",borderRadius:10,flexShrink:0,fontFamily:"'DM Sans',sans-serif"}}>✗</span>}
        {perk.used&&!perk.dismissed&&<span style={{fontSize:9,fontWeight:700,color:"#065F46",background:"#D1FAE5",padding:"2px 7px",borderRadius:10,flexShrink:0,fontFamily:"'DM Sans',sans-serif"}}>✓</span>}
      </div>
      {perk.perk_id===selected&&<div style={{margin:"4px 0 6px"}}><PerkTooltip perk={perk} onToggle={onToggle} onDismiss={onDismiss}/></div>}
    </div>
  );
}

/* ── PotentialPerkTile ── */
function PotentialPerkTile({perk,selected,onSelect}){
  const pCfg=PROVIDERS[perk.provider]||{};
  const url=perk.url;
  const perkCallout = perk.perk_id===selected;
  return(
    <div style={{position:"relative"}}>
      <div onClick={e=>{e.stopPropagation();onSelect(perk.perk_id===selected?null:perk.perk_id);}} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 12px",borderRadius:12,background:T.surface,border:`1px solid ${perkCallout?T.accent:T.border}`,cursor:"pointer",transition:"all 0.15s",boxShadow:T.shadow}}>
        <div style={{position:"relative",flexShrink:0}}><PerkBrandIcon perk={perk} size={32}/><ProviderOverlay provider={perk.provider} size={14}/></div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:13,fontWeight:700,color:T.textPrimary,fontFamily:"'DM Sans',sans-serif",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{perk.title}</div>
          <div style={{fontSize:10,color:pCfg.color||T.textSecondary,fontWeight:600,fontFamily:"'DM Sans',sans-serif"}}>{perk.membership} — {perk.tier}</div>
        </div>
        {url&&<a href={url} target="_blank" rel="noopener noreferrer" onClick={e=>e.stopPropagation()} style={{fontSize:10,fontWeight:700,color:T.accent,textDecoration:"none",background:"#EFF6FF",padding:"3px 8px",borderRadius:8,flexShrink:0,fontFamily:"'DM Sans',sans-serif",border:`1px solid ${T.accent}33`}}>Visit ↗</a>}
      </div>
      {perkCallout&&(
        <div onClick={e=>e.stopPropagation()} style={{margin:"4px 0 6px",padding:"14px 14px 14px 18px",borderRadius:12,background:T.surface,color:T.textPrimary,fontSize:12,lineHeight:1.5,fontFamily:"'DM Sans',sans-serif",boxShadow:"0 2px 10px rgba(15,23,42,0.08)",border:`1px solid ${T.border}`,borderLeft:`4px solid ${pCfg.color||T.accent}`}}>
          <div style={{fontSize:13,fontWeight:700,marginBottom:4,color:T.textPrimary}}>{perk.title}</div>
          <div style={{marginBottom:8,color:T.textSecondary}}>{perk.description}</div>
          <div style={{display:"flex",gap:12,flexWrap:"wrap",fontSize:11,color:T.muted}}>
            <span>🔄 {resetLabel(perk.reset_period)}</span>
            <span>📊 {perk.usage_limit||"—"}</span>
          </div>
          {url&&<a href={url} target="_blank" rel="noopener noreferrer" style={{display:"inline-block",marginTop:10,fontSize:11,fontWeight:700,color:T.accent,textDecoration:"none",fontFamily:"'DM Sans',sans-serif"}}>Learn more on provider site ↗</a>}
        </div>
      )}
    </div>
  );
}

/* ── PerkCalloutModal ── */
function PerkCalloutModal({perk,onToggle,onDismiss,onClose}){
  const pCfg=PROVIDERS[perk.provider]||{color:T.accent};
  const b=getPerkBrand(perk);
  return(
    <div onClick={onClose} style={{position:"fixed",inset:0,zIndex:200,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div onClick={e=>e.stopPropagation()} style={{width:"100%",maxWidth:360,background:T.surface,borderRadius:16,overflow:"hidden",boxShadow:"0 20px 60px rgba(0,0,0,0.25)",position:"relative",fontFamily:"'DM Sans',sans-serif"}}>
        <div style={{background:"#1E293B",padding:"20px 18px 16px",display:"flex",alignItems:"center",gap:12,position:"relative"}}>
          <button onClick={onClose} style={{position:"absolute",top:10,right:12,background:"rgba(0,0,0,0.3)",border:"none",color:"#fff",width:28,height:28,borderRadius:14,fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,backdropFilter:"blur(4px)"}}>✕</button>
          <div style={{fontSize:36}}>{b.emoji}</div>
          <div>
            <div style={{fontSize:15,fontWeight:800,color:"#fff"}}>{perk.title}</div>
            <div style={{fontSize:11,fontWeight:600,color:"rgba(255,255,255,0.8)",marginTop:2}}>{perk.membership} — {perk.tier}</div>
          </div>
        </div>
        <div style={{padding:"16px 18px 18px",borderLeft:`4px solid ${pCfg.color||T.accent}`}}>
          <div style={{fontSize:12,lineHeight:1.6,color:T.textSecondary,marginBottom:12}}>{perk.description}</div>
          <div style={{display:"flex",gap:12,flexWrap:"wrap",marginBottom:14,fontSize:11,color:T.muted}}>
            <span>📅 {perk.next_reset_date?`Renews ${perk.next_reset_date}`:"No renewal date"}</span>
            <span>🔄 {resetLabel(perk.reset_period)}</span>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            <label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",fontSize:13,fontWeight:600,color:T.textPrimary}}>
              <input type="checkbox" checked={!!perk.used} onChange={()=>onToggle(perk.perk_id)} disabled={!!perk.dismissed} style={{width:18,height:18,accentColor:T.success,cursor:"pointer"}}/>
              {perk.used?"Marked as used":"Mark as used"}
            </label>
            <label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",fontSize:13,fontWeight:600,color:perk.dismissed?T.danger:T.muted}}>
              <input type="checkbox" checked={!!perk.dismissed} onChange={()=>onDismiss(perk.perk_id)} style={{width:18,height:18,accentColor:T.danger,cursor:"pointer"}}/>
              Will not use (exclude from count)
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── PerkSquareTile (Home grid) ── */
function PerkSquareTile({perk,onToggle,onDismiss,selected,onSelect}){
  const b=getPerkBrand(perk);
  const pCfg=PROVIDERS[perk.provider]||{color:T.muted,initials:"??"};
  const isDimmed=perk.used||perk.dismissed;
  const isSel=perk.perk_id===selected;
  return(
    <div style={{position:"relative"}}>
      <div onClick={e=>{e.stopPropagation();onSelect(isSel?null:perk.perk_id);}} style={{
        width:"100%",aspectRatio:"1",borderRadius:14,overflow:"hidden",cursor:"pointer",
        background:b.gradient,position:"relative",transition:"all 0.15s",
        opacity:isDimmed?0.45:1,
        border:`2px solid ${isSel?T.accent:"transparent"}`,
        boxShadow:isSel?"0 0 0 2px rgba(30,144,255,0.3)":isDimmed?"none":"0 2px 8px rgba(0,0,0,0.1)",
      }}>
        <div style={{position:"absolute",top:6,right:6,width:22,height:22,borderRadius:8,background:pCfg.color,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:800,border:"1.5px solid rgba(255,255,255,0.4)",fontFamily:"'DM Sans',sans-serif",boxShadow:"0 1px 3px rgba(0,0,0,0.2)",zIndex:2}}>{pCfg.initials}</div>
        {perk.dismissed&&<div style={{position:"absolute",top:6,left:6,fontSize:10,background:"rgba(0,0,0,0.5)",color:"#F87171",padding:"1px 6px",borderRadius:6,fontWeight:700,fontFamily:"'DM Sans',sans-serif",zIndex:2}}>✗</div>}
        {perk.used&&!perk.dismissed&&<div style={{position:"absolute",top:6,left:6,fontSize:10,background:"rgba(0,0,0,0.5)",color:"#6EE7B7",padding:"1px 6px",borderRadius:6,fontWeight:700,fontFamily:"'DM Sans',sans-serif",zIndex:2}}>✓</div>}
        <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"60%",fontSize:36,filter:isDimmed?"grayscale(0.5)":"none"}}>{b.emoji}</div>
        <div style={{position:"absolute",bottom:0,left:0,right:0,background:"rgba(0,0,0,0.55)",backdropFilter:"blur(4px)",padding:"6px 8px"}}>
          <div style={{fontSize:10,fontWeight:700,color:"#fff",fontFamily:"'DM Sans',sans-serif",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",lineHeight:1.3}}>{perk.title}</div>
        </div>
      </div>
      {isSel&&<PerkCalloutModal perk={perk} onToggle={onToggle} onDismiss={onDismiss} onClose={()=>onSelect(null)}/>}
    </div>
  );
}

/* ═══════════════ HOW TO USE MODAL ═══════════════ */
function HowToUseModal({onClose}){
  return(
    <div onClick={onClose} style={{position:"fixed",inset:0,zIndex:200,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div onClick={e=>e.stopPropagation()} style={{width:"100%",maxWidth:380,maxHeight:"80vh",overflowY:"auto",background:"#1E293B",borderRadius:16,padding:"20px 18px",color:"#CBD5E1",fontSize:12,lineHeight:1.6,fontFamily:"'DM Sans',sans-serif",boxShadow:"0 20px 60px rgba(0,0,0,0.3)",position:"relative"}}>
        <button onClick={onClose} style={{position:"absolute",top:12,right:14,background:"rgba(255,255,255,0.1)",border:"none",color:"#fff",width:28,height:28,borderRadius:14,fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700}}>✕</button>
        <div style={{fontSize:16,fontWeight:800,color:"#fff",marginBottom:14,fontFamily:"'DM Sans',sans-serif"}}>📖 How to Use Perki</div>
        <div style={{fontWeight:700,color:"#fff",marginBottom:4}}>🏠 Home</div><div style={{marginBottom:12}}>See all your perks in a visual grid. Tap any tile to view details, mark as used, or dismiss it from your count.</div>
        <div style={{fontWeight:700,color:"#fff",marginBottom:4}}>💳 Current Memberships</div><div style={{marginBottom:12}}>Browse perks grouped by provider and tier. Tap to expand.</div>
        <div style={{fontWeight:700,color:"#fff",marginBottom:4}}>📍 Where to Use</div><div style={{marginBottom:12}}>Browse perks by category (Travel, Retail, Finance, etc). Tap a category to expand matching perks.</div>
        <div style={{fontWeight:700,color:"#fff",marginBottom:4}}>✨ Potential Memberships</div><div style={{marginBottom:12}}>Browse all available memberships grouped by provider and tier. Tiers you already have are marked "Already Active". Tap "+ Add Tier" to add a new one.</div>
        <div style={{fontWeight:700,color:"#fff",marginBottom:4}}>👤 Profile</div><div>View stats, manage active memberships grouped by provider and tier, and update your profile picture.</div>
      </div>
    </div>
  );
}

/* ═══════════════ AUTH SCREEN ═══════════════ */
function AuthScreen({onAuth}){const[mode,setMode]=useState("login");const[email,setEmail]=useState("");const[pw,setPw]=useState("");const[name,setName]=useState("");const[err,setErr]=useState("");const[showPw,setShowPw]=useState(false);const[loading,setLoading]=useState(false);const handleSubmit=async()=>{setErr("");setLoading(true);try{if(!SB_CONFIGURED){onAuth({id:"local-dev",name:name||"Dev User",email:email||"dev@local"});return;}if(mode==="signup"){const{error}=await supabase.auth.signUp({email,password:pw,options:{data:{full_name:name}}});if(error)throw error;}else{const{error}=await supabase.auth.signInWithPassword({email,password:pw});if(error)throw error;}}catch(e){setErr(e.message||"Something went wrong.");setLoading(false);}};
  return(<div style={{maxWidth:420,margin:"0 auto",minHeight:"100vh",background:T.bg,display:"flex",flexDirection:"column",justifyContent:"center",padding:"0 28px",fontFamily:"'DM Sans',sans-serif"}}><link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet"/><div style={{textAlign:"center",marginBottom:32}}><div style={{width:56,height:56,borderRadius:16,margin:"0 auto 14px",background:`linear-gradient(135deg,${T.accent},${T.primary})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,fontWeight:900,color:"#fff",boxShadow:"0 8px 24px rgba(30,144,255,0.25)"}}>P</div><h1 style={{fontSize:28,fontWeight:800,color:T.textPrimary,margin:"0 0 4px"}}>Perki</h1><p style={{fontSize:14,color:T.textSecondary,margin:0}}>All your membership perks in one place</p></div><div style={{display:"flex",gap:0,marginBottom:16,borderRadius:10,overflow:"hidden",border:`1.5px solid ${T.border}`}}>{["login","signup"].map(m=><button key={m} onClick={()=>{setMode(m);setErr("");}} style={{flex:1,padding:"9px 0",border:"none",background:mode===m?"#EFF6FF":T.surface,color:mode===m?T.accent:T.textSecondary,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>{m==="login"?"Log In":"Sign Up"}</button>)}</div><div style={{display:"flex",flexDirection:"column",gap:10}}>{mode==="signup"&&<div><label style={{fontSize:12,fontWeight:700,color:T.textSecondary,marginBottom:3,display:"block"}}>Full Name</label><input value={name} onChange={e=>{setName(e.target.value);setErr("");}} placeholder="Ollie Glanville" style={{width:"100%",padding:"11px 14px",borderRadius:10,border:`1.5px solid ${T.border}`,background:T.surface,fontSize:14,color:T.textPrimary,boxSizing:"border-box",outline:"none",fontFamily:"'DM Sans',sans-serif"}}/></div>}<div><label style={{fontSize:12,fontWeight:700,color:T.textSecondary,marginBottom:3,display:"block"}}>Email</label><input type="email" value={email} onChange={e=>{setEmail(e.target.value);setErr("");}} placeholder="you@example.com" style={{width:"100%",padding:"11px 14px",borderRadius:10,border:`1.5px solid ${err?"#FECACA":T.border}`,background:T.surface,fontSize:14,color:T.textPrimary,boxSizing:"border-box",outline:"none",fontFamily:"'DM Sans',sans-serif"}}/></div><div><label style={{fontSize:12,fontWeight:700,color:T.textSecondary,marginBottom:3,display:"block"}}>Password</label><div style={{position:"relative"}}><input type={showPw?"text":"password"} value={pw} onChange={e=>{setPw(e.target.value);setErr("");}} placeholder="Min. 6 characters" style={{width:"100%",padding:"11px 44px 11px 14px",borderRadius:10,border:`1.5px solid ${err?"#FECACA":T.border}`,background:T.surface,fontSize:14,color:T.textPrimary,boxSizing:"border-box",outline:"none",fontFamily:"'DM Sans',sans-serif"}}/><button onClick={()=>setShowPw(!showPw)} style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",fontSize:16,color:T.muted,padding:4}}>{showPw?"🙈":"👁️"}</button></div></div>{err&&<p style={{fontSize:12,color:T.danger,margin:0,padding:"8px 12px",background:"#FEF2F2",borderRadius:8,fontWeight:600}}>{err}</p>}<button onClick={handleSubmit} disabled={loading} style={{width:"100%",padding:"13px 0",borderRadius:12,border:"none",background:`linear-gradient(135deg,${T.accent},${T.primary})`,color:"#fff",fontSize:15,fontWeight:800,cursor:loading?"wait":"pointer",fontFamily:"'DM Sans',sans-serif",marginTop:2,boxShadow:"0 4px 14px rgba(30,144,255,0.3)",opacity:loading?0.7:1}}>{loading?"Please wait…":mode==="login"?"Log In":"Create Account"}</button>{!SB_CONFIGURED&&<p style={{fontSize:10,color:T.warning,textAlign:"center",marginTop:6,background:"#FEF3C7",padding:"6px 10px",borderRadius:8,fontWeight:600}}>⚠️ Supabase not configured — offline mode.</p>}</div></div>);
}

/* ═══════════════ HOME TAB ═══════════════ */
function HomeTab({perks,onToggle,onDismiss}){
  const[selected,setSelected]=useState(null);
  const[groupBy,setGroupBy]=useState("reset");
  const[showHelp,setShowHelp]=useState(false);
  const sorted=useMemo(()=>[...perks].sort(alphaSort),[perks]);
  const countable=perks.filter(p=>!p.dismissed);
  const used=countable.filter(p=>p.used).length;
  const groups=useMemo(()=>{
    if(groupBy==="category"){const g={};sorted.forEach(p=>{const c=CATEGORIES[p.category]?.label||"Other";(g[c]=g[c]||[]).push(p);});return g;}
    const g={Weekly:[],Monthly:[],Annually:[],"Always On":[]};sorted.forEach(p=>{g[{WEEKLY:"Weekly",MONTHLY:"Monthly",ANNUALLY:"Annually",NONE:"Always On"}[p.reset_period]||"Always On"].push(p);});return g;
  },[sorted,groupBy]);
  return(
    <div onClick={()=>setSelected(null)}>
      {showHelp&&<HowToUseModal onClose={()=>setShowHelp(false)}/>}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:2}}>
        <h1 style={{fontSize:22,fontWeight:800,color:T.textPrimary,margin:0,fontFamily:"'DM Sans',sans-serif"}}>Your Perks</h1>
        <button onClick={e=>{e.stopPropagation();setShowHelp(true);}} style={{padding:"6px 12px",borderRadius:10,border:`1.5px solid ${T.border}`,background:T.surface,color:T.textSecondary,fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",boxShadow:T.shadow}}>📖 How to use</button>
      </div>
      <TabDesc>Tap any perk to see details, mark it as used, or exclude it from your count.</TabDesc>
      <p style={{fontSize:12,color:T.textSecondary,margin:"0 0 10px",fontFamily:"'DM Sans',sans-serif",fontWeight:600}}>Used {used} / Total {countable.length}{perks.length!==countable.length&&<span style={{color:T.muted}}> ({perks.length-countable.length} excluded)</span>}</p>
      <div style={{display:"flex",gap:8,marginBottom:12}}>
        {["reset","category"].map(g=>(<button key={g} onClick={()=>setGroupBy(g)} style={{padding:"6px 14px",borderRadius:20,border:`1.5px solid ${groupBy===g?T.accent:T.border}`,background:groupBy===g?"#EFF6FF":T.surface,color:groupBy===g?T.accent:T.textSecondary,fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>{g==="reset"?"By Reset":"By Category"}</button>))}
      </div>
      {Object.entries(groups).map(([name,items])=>items.length>0&&(
        <div key={name}>
          <SectionHeader count={items.length}>{name}</SectionHeader>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
            {items.map(p=><PerkSquareTile key={p.perk_id} perk={p} onToggle={onToggle} onDismiss={onDismiss} selected={selected} onSelect={setSelected}/>)}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════ CURRENT MEMBERSHIPS (grouped by provider → tier, collapsible) ═══════════════ */
function MembershipsTab({perks,onToggle,onDismiss,activeMemberships,tierPrices}){
  const[selected,setSelected]=useState(null);
  const[search,setSearch]=useState("");

  const filtered=useMemo(()=>{
    let r=[...perks];
    if(search.trim()){const q=search.toLowerCase();r=r.filter(p=>p.title.toLowerCase().includes(q)||p.provider.toLowerCase().includes(q)||p.tier.toLowerCase().includes(q));}
    return r.sort(alphaSort);
  },[perks,search]);

  /* Group by provider → tier, sorted by price */
  const providerGroups=useMemo(()=>{
    const byProv={};
    filtered.forEach(p=>{
      if(!byProv[p.provider])byProv[p.provider]={};
      if(!byProv[p.provider][p.tier])byProv[p.provider][p.tier]=[];
      byProv[p.provider][p.tier].push(p);
    });
    const providers=Object.keys(byProv).sort();
    return providers.map(prov=>{
      const tierMap=byProv[prov];
      const tiers=Object.keys(tierMap).sort((a,b)=>{
        const pa=tierPrices[`${prov}|${a}`]?.price??999;
        const pb=tierPrices[`${prov}|${b}`]?.price??999;
        return pa-pb;
      });
      return { provider:prov, tiers:tiers.map(t=>({ tier:t, perks:tierMap[t] })) };
    });
  },[filtered,tierPrices]);

  const countable=filtered.filter(p=>!p.dismissed);
  const used=countable.filter(p=>p.used).length;

  return(<div onClick={()=>setSelected(null)}>
    <h1 style={{fontSize:22,fontWeight:800,color:T.textPrimary,margin:0,fontFamily:"'DM Sans',sans-serif"}}>Current Memberships</h1>
    <TabDesc>Browse perks from your active memberships, grouped by provider and tier.</TabDesc>
    <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search perk name, provider, or tier..." style={{width:"100%",padding:"9px 14px",borderRadius:10,border:`1.5px solid ${T.border}`,background:T.surface,fontSize:13,fontFamily:"'DM Sans',sans-serif",color:T.textPrimary,marginBottom:10,boxSizing:"border-box",outline:"none"}}/>
    {filtered.length>0&&<p style={{fontSize:12,color:T.textSecondary,margin:"0 0 8px",fontFamily:"'DM Sans',sans-serif",fontWeight:600}}>Used {used} / Total {countable.length}</p>}

    {providerGroups.map(pg=>{
      const pCfg=PROVIDERS[pg.provider]||{color:T.muted,bg:"#f1f5f9"};
      const provPerks=pg.tiers.flatMap(t=>t.perks);
      return(
        <CollapsibleSection
          key={pg.provider}
          title={pg.provider}
          count={provPerks.length}
          badge={<ProviderBadge provider={pg.provider} size={28}/>}
          headerBg={pCfg.bg}
          headerBorder={`${pCfg.color}33`}
          defaultOpen={providerGroups.length<=3}
        >
          {pg.tiers.map(tg=>{
            const tp=tierPrices[`${pg.provider}|${tg.tier}`];
            const priceLabel=tp?.price_label||(tp?.price===0?"Free":tp?.price!=null?`£${tp.price}`:"");
            return(
              <CollapsibleSection
                key={tg.tier}
                title={tg.tier}
                subtitle={priceLabel?`${tg.perks.length} perks · ${priceLabel}`:`${tg.perks.length} perks`}
                headerBg="transparent"
                headerBorder={T.border}
                defaultOpen={true}
              >
                <div style={{display:"flex",flexDirection:"column",gap:5}}>
                  {tg.perks.map(p=><PerkTile key={p.perk_id} perk={p} onToggle={onToggle} onDismiss={onDismiss} selected={selected} onSelect={setSelected}/>)}
                </div>
              </CollapsibleSection>
            );
          })}
        </CollapsibleSection>
      );
    })}
    {providerGroups.length===0&&<p style={{textAlign:"center",color:T.muted,marginTop:40,fontSize:13,fontFamily:"'DM Sans',sans-serif"}}>{search?"No matching perks.":"No active memberships yet."}</p>}
  </div>);
}

/* ═══════════════ WHERE TO USE ═══════════════ */
function WhereTab({perks,onToggle,onDismiss}){const[sel,setSel]=useState(null);const[sp,setSp]=useState(null);const catGroups=useMemo(()=>{const g={};perks.forEach(p=>{const c=p.category;if(!g[c])g[c]={perks:[],providers:new Set()};g[c].perks.push(p);g[c].providers.add(p.provider);});return g;},[perks]);return(<div onClick={()=>setSp(null)}><h1 style={{fontSize:22,fontWeight:800,color:T.textPrimary,margin:0,fontFamily:"'DM Sans',sans-serif"}}>Where to Use</h1><TabDesc>Find perks by category. Tap to expand matching perks.</TabDesc><div style={{display:"flex",flexDirection:"column",gap:10}}>{Object.entries(catGroups).map(([cat,data])=>{const info=CATEGORIES[cat]||CATEGORIES.other;const isSel=sel===cat;return(<div key={cat}><div onClick={()=>{setSel(isSel?null:cat);setSp(null);}} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",borderRadius:12,cursor:"pointer",background:isSel?"#1E293B":T.surface,border:`1.5px solid ${isSel?"#1E293B":T.border}`,boxShadow:isSel?"none":T.shadow,color:isSel?"#fff":T.textPrimary}}><span style={{fontSize:24}}>{info.icon}</span><div style={{flex:1}}><div style={{fontSize:13,fontWeight:700,fontFamily:"'DM Sans',sans-serif"}}>{info.label}</div><div style={{fontSize:11,color:isSel?"#94A3B8":T.textSecondary,fontFamily:"'DM Sans',sans-serif"}}>{data.perks.length} perks</div></div><div style={{display:"flex",gap:3}}>{[...data.providers].map(prov=><ProviderBadge key={prov} provider={prov} size={20}/>)}</div><span style={{fontSize:14,color:isSel?"#94A3B8":T.muted,transform:isSel?"rotate(180deg)":"rotate(0)",display:"inline-block"}}>▾</span></div>{isSel&&(<div style={{margin:"6px 0",padding:"10px 12px",borderRadius:12,background:"#1E293B"}}><div style={{display:"flex",flexDirection:"column",gap:6}}>{data.perks.sort(alphaSort).map(p=>(<div key={p.perk_id}><div onClick={e=>{e.stopPropagation();setSp(sp===p.perk_id?null:p.perk_id);}} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",borderRadius:10,background:p.used||p.dismissed?"rgba(255,255,255,0.05)":"rgba(255,255,255,0.08)",cursor:"pointer",opacity:p.used||p.dismissed?0.5:1,border:`1px solid ${sp===p.perk_id?T.accent:"rgba(255,255,255,0.1)"}`}}><div style={{position:"relative",flexShrink:0}}><PerkBrandIcon perk={p} size={28}/><ProviderOverlay provider={p.provider} size={12}/></div><div style={{flex:1,minWidth:0}}><div style={{fontSize:12,fontWeight:700,color:"#F1F5F9",fontFamily:"'DM Sans',sans-serif",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{p.title}</div><div style={{fontSize:10,color:"#94A3B8",fontFamily:"'DM Sans',sans-serif"}}>{p.membership} — {p.tier}</div></div>{p.dismissed&&<span style={{fontSize:9,color:"#F87171"}}>✗</span>}{p.used&&!p.dismissed&&<span style={{fontSize:9,color:"#6EE7B7"}}>✓</span>}</div>{sp===p.perk_id&&<div style={{margin:"4px 0"}}><PerkTooltip perk={p} onToggle={onToggle} onDismiss={onDismiss}/></div>}</div>))}</div></div>)}</div>);})}</div></div>);}

/* ═══════════════ PROFILE (grouped by provider → tier, collapsible) ═══════════════ */
function ProfileTab({perks,activeMemberships,onRemoveMembership,user,onLogout,onToggle,onDismiss,tierPrices}){
  const[selectedPerk,setSelectedPerk]=useState(null);
  const[profilePic,setProfilePic]=useState(null);
  const fileRef=useRef(null);
  const countable=perks.filter(p=>!p.dismissed);
  const used=countable.filter(p=>p.used).length;
  const willNotUseCount=perks.filter(p=>p.dismissed).length;

  /* Group memberships by provider, sort tiers by price */
  const providerGroups=useMemo(()=>{
    const byProv={};
    activeMemberships.forEach(m=>{
      if(!byProv[m.provider])byProv[m.provider]=[];
      byProv[m.provider].push(m);
    });
    const providers=Object.keys(byProv).sort();
    return providers.map(prov=>{
      const ms=byProv[prov].sort((a,b)=>{
        const pa=tierPrices[`${prov}|${a.tier}`]?.price??999;
        const pb=tierPrices[`${prov}|${b.tier}`]?.price??999;
        return pa-pb;
      });
      return { provider:prov, memberships:ms };
    });
  },[activeMemberships,tierPrices]);

  const handlePic=e=>{const f=e.target.files?.[0];if(f){const r=new FileReader();r.onload=ev=>setProfilePic(ev.target.result);r.readAsDataURL(f);}};

  return(<div onClick={()=>setSelectedPerk(null)}>
    <h1 style={{fontSize:22,fontWeight:800,color:T.textPrimary,margin:0,fontFamily:"'DM Sans',sans-serif"}}>Profile</h1>
    <TabDesc>Manage your account, view stats, and control memberships.</TabDesc>

    <div style={{display:"flex",flexDirection:"column",alignItems:"center",padding:"20px 16px 18px",marginBottom:14,background:T.surface,borderRadius:14,border:`1px solid ${T.border}`,boxShadow:T.shadow}}>
      <div onClick={()=>fileRef.current?.click()} style={{width:64,height:64,borderRadius:32,cursor:"pointer",background:profilePic?`url(${profilePic}) center/cover`:`linear-gradient(135deg,${T.accent},${T.primary})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:profilePic?0:24,fontWeight:900,color:"#fff",border:"3px solid #fff",boxShadow:"0 4px 14px rgba(30,144,255,0.2)",position:"relative",overflow:"hidden"}}>
        {!profilePic&&user.name.split(" ").map(n=>n[0]).join("")}
        <div style={{position:"absolute",bottom:0,left:0,right:0,height:20,background:"rgba(0,0,0,0.45)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,color:"#fff",fontWeight:600}}>Edit</div>
      </div>
      <input ref={fileRef} type="file" accept="image/*" onChange={handlePic} style={{display:"none"}}/>
      <h2 style={{fontSize:16,fontWeight:800,color:T.textPrimary,margin:"10px 0 1px",fontFamily:"'DM Sans',sans-serif"}}>{user.name}</h2>
      <p style={{fontSize:12,color:T.textSecondary,margin:"0 0 12px",fontFamily:"'DM Sans',sans-serif"}}>{user.email}</p>
      <button onClick={onLogout} style={{padding:"7px 22px",borderRadius:10,border:`1.5px solid ${T.border}`,background:T.bg,color:T.textSecondary,fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>Log Out</button>
    </div>

    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:14}}>
      <div style={{padding:14,borderRadius:12,textAlign:"center",background:"#F0FDF4",border:"1.5px solid #BBF7D0"}}><div style={{fontSize:26,fontWeight:800,color:T.success,fontFamily:"'DM Sans',sans-serif"}}>{countable.length-used}</div><div style={{fontSize:10,color:"#065F46",fontWeight:600,fontFamily:"'DM Sans',sans-serif"}}>Available</div></div>
      <div style={{padding:14,borderRadius:12,textAlign:"center",background:"#EFF6FF",border:"1.5px solid #BFDBFE"}}><div style={{fontSize:26,fontWeight:800,color:T.accent,fontFamily:"'DM Sans',sans-serif"}}>{used}</div><div style={{fontSize:10,color:"#1E40AF",fontWeight:600,fontFamily:"'DM Sans',sans-serif"}}>Used</div></div>
      <div style={{padding:14,borderRadius:12,textAlign:"center",background:"#FEF2F2",border:"1.5px solid #FECACA"}}><div style={{fontSize:26,fontWeight:800,color:T.danger,fontFamily:"'DM Sans',sans-serif"}}>{willNotUseCount}</div><div style={{fontSize:10,color:"#991B1B",fontWeight:600,fontFamily:"'DM Sans',sans-serif"}}>Will Not Use</div></div>
    </div>
    <p style={{fontSize:12,color:T.textSecondary,margin:"0 0 6px",fontFamily:"'DM Sans',sans-serif",fontWeight:600}}>Used {used} / Total {countable.length}{perks.length!==countable.length&&<span style={{color:T.muted}}> ({perks.length-countable.length} excluded)</span>}</p>

    <SectionHeader count={activeMemberships.length}>Active Memberships</SectionHeader>

    {providerGroups.map(pg=>{
      const pCfg=PROVIDERS[pg.provider]||{color:T.muted,bg:"#f1f5f9"};
      return(
        <CollapsibleSection
          key={pg.provider}
          title={pg.provider}
          count={pg.memberships.length + " tier" + (pg.memberships.length!==1?"s":"")}
          badge={<ProviderBadge provider={pg.provider} size={28}/>}
          headerBg={pCfg.bg}
          headerBorder={`${pCfg.color}33`}
          defaultOpen={true}
        >
          {pg.memberships.map(m=>{
            const key=`${m.provider}|${m.tier}`;
            const tp=tierPrices[key];
            const priceLabel=tp?.price_label||(tp?.price===0?"Free":tp?.price!=null?`£${tp.price}`:"");
            const effectiveTiers=getEffectiveTiers(m.provider,m.tier,tierPrices);
            const allP=perks.filter(p=>p.provider===m.provider&&effectiveTiers.includes(p.tier)).sort(alphaSort);
            const activePerks=allP.filter(p=>p.tier===m.tier);
            const inheritedPerks=allP.filter(p=>p.tier!==m.tier);
            const cnt=allP.filter(p=>!p.dismissed);
            const mUsed=cnt.filter(p=>p.used).length;

            return(
              <CollapsibleSection
                key={key}
                title={<>{m.tier}{priceLabel&&<span style={{marginLeft:6,fontSize:10,color:T.textSecondary,fontWeight:600}}>({priceLabel})</span>}</>}
                subtitle={`Used ${mUsed} / Total ${cnt.length}`}
                headerBg="transparent"
                headerBorder={T.border}
                defaultOpen={false}
                headerExtra={
                  <button onClick={e=>{e.stopPropagation();onRemoveMembership(m.provider,m.tier);}} style={{padding:"4px 9px",borderRadius:8,border:"1.5px solid #FECACA",background:"#FEF2F2",color:"#DC2626",fontSize:10,fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>Remove</button>
                }
              >
                {activePerks.length>0&&(
                  <>
                    <div style={{fontSize:10,fontWeight:800,color:T.success,textTransform:"uppercase",letterSpacing:"0.5px",margin:"6px 0 4px",fontFamily:"'DM Sans',sans-serif",display:"flex",alignItems:"center",gap:5}}>
                      <span style={{width:5,height:5,borderRadius:3,background:T.success}}/>Active Perks <span style={{fontSize:9,fontWeight:700,background:"#D1FAE5",color:"#065F46",padding:"1px 5px",borderRadius:8}}>{activePerks.length}</span>
                    </div>
                    <div style={{display:"flex",flexDirection:"column",gap:4}}>
                      {activePerks.map(p=><PerkTile key={p.perk_id} perk={p} onToggle={onToggle} onDismiss={onDismiss} selected={selectedPerk} onSelect={setSelectedPerk}/>)}
                    </div>
                  </>
                )}
                {activePerks.length===0&&<p style={{fontSize:11,color:T.muted,fontStyle:"italic",fontFamily:"'DM Sans',sans-serif"}}>No perks at this tier.</p>}
                {inheritedPerks.length>0&&(
                  <>
                    <div style={{fontSize:10,fontWeight:800,color:T.muted,textTransform:"uppercase",letterSpacing:"0.5px",margin:"10px 0 4px",fontFamily:"'DM Sans',sans-serif",display:"flex",alignItems:"center",gap:5}}>
                      <span style={{width:5,height:5,borderRadius:3,background:T.muted}}/>Inherited <span style={{fontSize:9,fontWeight:700,background:"#F1F5F9",color:T.textSecondary,padding:"1px 5px",borderRadius:8}}>{inheritedPerks.length}</span>
                    </div>
                    <div style={{display:"flex",flexDirection:"column",gap:4}}>
                      {inheritedPerks.map(p=><PerkTile key={p.perk_id} perk={p} onToggle={onToggle} onDismiss={onDismiss} selected={selectedPerk} onSelect={setSelectedPerk}/>)}
                    </div>
                  </>
                )}
              </CollapsibleSection>
            );
          })}
        </CollapsibleSection>
      );
    })}
    {activeMemberships.length===0&&<p style={{textAlign:"center",color:T.muted,marginTop:20,fontSize:13,fontFamily:"'DM Sans',sans-serif"}}>No active memberships.</p>}
  </div>);
}

/* ═══════════════ POTENTIAL MEMBERSHIPS (grouped by provider → tier, collapsible) ═══════════════ */
function PotentialTab({allPerks,activeMemberships,onAddMembership,userName,userId,tierPrices}){
  const[search,setSearch]=useState("");
  const[selected,setSelected]=useState(null);
  const[showReq,setShowReq]=useState(false);
  const[reqName,setReqName]=useState(userName||"");
  const[reqText,setReqText]=useState("");
  const[reqSent,setReqSent]=useState(false);

  /* Set of active provider|tier keys */
  const activeSet=useMemo(()=>{
    const s=new Set();
    activeMemberships.forEach(m=>{getEffectiveTiers(m.provider,m.tier,tierPrices).forEach(t=>s.add(`${m.provider}|${t}`));});
    return s;
  },[activeMemberships,tierPrices]);

  /* Filtered perks */
  const filtered=useMemo(()=>{
    let r=[...allPerks];
    if(search.trim()){const q=search.toLowerCase();r=r.filter(p=>p.title.toLowerCase().includes(q)||p.provider.toLowerCase().includes(q)||p.tier.toLowerCase().includes(q));}
    return r.sort(alphaSort);
  },[search,allPerks]);

  /* Group by provider → tier, sorted by price */
  const providerGroups=useMemo(()=>{
    const byProv={};
    filtered.forEach(p=>{
      if(!byProv[p.provider])byProv[p.provider]={};
      if(!byProv[p.provider][p.tier])byProv[p.provider][p.tier]={perks:[],membership:p.membership};
      byProv[p.provider][p.tier].perks.push(p);
    });
    const providers=Object.keys(byProv).sort();
    return providers.map(prov=>{
      const tierMap=byProv[prov];
      const tiers=Object.keys(tierMap).sort((a,b)=>{
        const pa=tierPrices[`${prov}|${a}`]?.price??999;
        const pb=tierPrices[`${prov}|${b}`]?.price??999;
        return pa-pb;
      });
      return { provider:prov, tiers:tiers.map(t=>({ tier:t, perks:tierMap[t].perks, membership:tierMap[t].membership })) };
    });
  },[filtered,tierPrices]);

  const submitReq=async()=>{if(!reqText.trim())return;if(SB_CONFIGURED&&userId)await supabase.from("membership_requests").insert({user_id:userId,requester_name:reqName,description:reqText});setReqSent(true);};

  return(<div onClick={()=>setSelected(null)}>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:2}}>
      <h1 style={{fontSize:22,fontWeight:800,color:T.textPrimary,margin:0,fontFamily:"'DM Sans',sans-serif"}}>Potential Memberships</h1>
      <button onClick={e=>{e.stopPropagation();setShowReq(!showReq);setReqSent(false);setReqName(userName||"");setReqText("");}} style={{width:32,height:32,borderRadius:16,border:`1.5px solid ${showReq?T.accent:T.border}`,background:showReq?"#EFF6FF":T.surface,color:showReq?T.accent:T.textSecondary,fontSize:16,fontWeight:800,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'DM Sans',sans-serif",boxShadow:T.shadow}}>+</button>
    </div>
    <TabDesc>Browse all memberships grouped by provider. Tiers you already have are marked "Already Active".</TabDesc>

    {showReq&&(<div onClick={e=>e.stopPropagation()} style={{margin:"0 0 14px",padding:"14px",borderRadius:12,background:"#1E293B",boxShadow:"0 6px 20px rgba(0,0,0,0.15)"}}><div style={{fontSize:13,fontWeight:700,color:"#fff",marginBottom:8,fontFamily:"'DM Sans',sans-serif"}}>Request a Membership</div>{reqSent?<div style={{fontSize:12,color:"#6EE7B7",padding:"8px 0",fontFamily:"'DM Sans',sans-serif"}}>✓ Submitted! We'll review it.</div>:<><div style={{marginBottom:8}}><label style={{fontSize:11,fontWeight:600,color:"#94A3B8",marginBottom:3,display:"block",fontFamily:"'DM Sans',sans-serif"}}>Your name</label><input value={reqName} onChange={e=>setReqName(e.target.value)} style={{width:"100%",padding:"8px 10px",borderRadius:8,border:"1px solid #334155",background:"#0F172A",color:"#F1F5F9",fontSize:13,boxSizing:"border-box",outline:"none",fontFamily:"'DM Sans',sans-serif"}}/></div><div style={{marginBottom:10}}><label style={{fontSize:11,fontWeight:600,color:"#94A3B8",marginBottom:3,display:"block",fontFamily:"'DM Sans',sans-serif"}}>Which membership?</label><textarea value={reqText} onChange={e=>setReqText(e.target.value)} rows={3} placeholder="e.g. NatWest Reward, Sky VIP..." style={{width:"100%",padding:"8px 10px",borderRadius:8,border:"1px solid #334155",background:"#0F172A",color:"#F1F5F9",fontSize:13,boxSizing:"border-box",outline:"none",fontFamily:"'DM Sans',sans-serif",resize:"vertical"}}/></div><button onClick={submitReq} style={{padding:"8px 20px",borderRadius:10,border:"none",background:T.accent,color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",opacity:reqText.trim()?1:0.5}}>Submit</button></>}</div>)}

    <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search provider, tier, or perk..." style={{width:"100%",padding:"9px 14px",borderRadius:10,border:`1.5px solid ${T.border}`,background:T.surface,fontSize:13,fontFamily:"'DM Sans',sans-serif",color:T.textPrimary,marginBottom:10,boxSizing:"border-box",outline:"none"}}/>

    {providerGroups.map(pg=>{
      const pCfg=PROVIDERS[pg.provider]||{color:T.muted,bg:"#f1f5f9"};
      const totalPerks=pg.tiers.reduce((n,t)=>n+t.perks.length,0);
      return(
        <CollapsibleSection
          key={pg.provider}
          title={pg.provider}
          count={totalPerks}
          badge={<ProviderBadge provider={pg.provider} size={28}/>}
          headerBg={pCfg.bg}
          headerBorder={`${pCfg.color}33`}
          defaultOpen={providerGroups.length<=3}
        >
          {pg.tiers.map(tg=>{
            const tierKey=`${pg.provider}|${tg.tier}`;
            const isActive=activeSet.has(tierKey);
            const tp=tierPrices[tierKey];
            const priceLabel=tp?.price_label||(tp?.price===0?"Free":tp?.price!=null?`£${tp.price}`:"");
            return(
              <CollapsibleSection
                key={tg.tier}
                title={<>{tg.membership} — {tg.tier}</>}
                subtitle={<>{tg.perks.length} perks{priceLabel&&<span style={{marginLeft:6,fontWeight:700,color:pCfg.color||T.accent}}> · {priceLabel}</span>}</>}
                headerBg={isActive?"#F0FDF4":"transparent"}
                headerBorder={isActive?"#BBF7D0":T.border}
                defaultOpen={false}
                headerExtra={
                  <>
                    {isActive&&<span style={{fontSize:9,fontWeight:700,color:"#065F46",background:"#D1FAE5",padding:"2px 7px",borderRadius:10,fontFamily:"'DM Sans',sans-serif"}}>Already Active</span>}
                    {!isActive&&<button onClick={e=>{e.stopPropagation();onAddMembership(pg.provider,tg.membership,tg.tier);}} style={{padding:"6px 14px",borderRadius:10,border:"none",background:T.accent,color:"#fff",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",boxShadow:"0 2px 6px rgba(30,144,255,0.3)"}}>+ Add Tier</button>}
                  </>
                }
              >
                <div style={{display:"flex",flexDirection:"column",gap:5}}>
                  {tg.perks.map(p=><PotentialPerkTile key={p.perk_id} perk={p} selected={selected} onSelect={setSelected}/>)}
                </div>
              </CollapsibleSection>
            );
          })}
        </CollapsibleSection>
      );
    })}
    {providerGroups.length===0&&<p style={{textAlign:"center",color:T.muted,marginTop:30,fontSize:13,fontFamily:"'DM Sans',sans-serif"}}>{search?"No matching perks.":"No memberships found."}</p>}
  </div>);
}

/* ═══════════════ MAIN APP ═══════════════ */
export default function PerikiApp(){
  const[user,setUser]=useState(null);
  const[tab,setTab]=useState("home");
  const[loading,setLoading]=useState(true);
  const[allPerks,setAllPerks]=useState([]);
  const[activeMemberships,setActiveMemberships]=useState([]);
  const[usedMap,setUsedMap]=useState({});
  const[dismissedMap,setDismissedMap]=useState({});
  const[tierPrices,setTierPrices]=useState({});

  /* Auth listener */
  useEffect(()=>{
    if(!SB_CONFIGURED){setLoading(false);return;}
    let resolved=false;const resolve=()=>{if(!resolved){resolved=true;setLoading(false);}};
    const timeout=setTimeout(()=>{if(!resolved){console.warn("[Perki] Auth timeout");resolve();}},5000);
    let subscription;
    try{const result=supabase.auth.onAuthStateChange((event,session)=>{
      if(session?.user){const meta=session.user.user_metadata||{};setUser({id:session.user.id,name:meta.full_name||session.user.email?.split("@")[0]||"User",email:session.user.email});supabase.from("profiles").select("full_name").eq("id",session.user.id).single().then(({data})=>{if(data?.full_name)setUser(prev=>prev?.id===session.user.id?{...prev,name:data.full_name}:prev);}).catch(()=>{});}else{setUser(null);}resolve();});subscription=result.data.subscription;}catch(err){resolve();}
    return()=>{clearTimeout(timeout);subscription?.unsubscribe();};
  },[]);

  /* Load perks exclusively from Supabase */
  useEffect(()=>{(async()=>{
    if(!SB_CONFIGURED){setAllPerks([]);return;}
    try{
      const{data,error}=await supabase.from("perks").select("*").order("title");
      if(error){console.error("[Perki] Failed to load perks:",error);setAllPerks([]);}
      else{setAllPerks(data||[]);}
    }catch(e){console.error("[Perki] Perks fetch error:",e);setAllPerks([]);}
  })();},[]);

  /* Load tier prices from Supabase — price column is the single source of truth */
  useEffect(()=>{(async()=>{
    if(!SB_CONFIGURED)return;
    try{
      const{data,error}=await supabase.from("tiers").select("provider,tier,price,price_label,sort_order").order("price");
      if(!error&&data?.length){
        const m={};
        data.forEach(r=>{
          m[`${r.provider}|${r.tier}`]={
            price: r.price ?? 999,
            price_label: r.price_label || (r.price === 0 ? "Free" : r.price != null ? `£${r.price}` : ""),
            sort_order: r.sort_order ?? r.price ?? 999,
          };
        });
        setTierPrices(m);
      }
    }catch(e){console.error("[Perki] Tiers fetch error:",e);}
  })();},[]);

  /* Load user data */
  useEffect(()=>{
    if(!user?.id){setActiveMemberships([]);setUsedMap({});setDismissedMap({});return;}
    (async()=>{
      if(!SB_CONFIGURED){setActiveMemberships([]);return;}
      const{data:mData}=await supabase.from("user_memberships").select("provider,membership,tier").eq("user_id",user.id);
      setActiveMemberships(mData||[]);
      const{data:sData}=await supabase.from("user_perk_state").select("perk_id,used,dismissed").eq("user_id",user.id);
      const uMap={},dMap={};
      (sData||[]).forEach(r=>{if(r.used)uMap[r.perk_id]=true;if(r.dismissed)dMap[r.perk_id]=true;});
      setUsedMap(uMap);setDismissedMap(dMap);
    })();
  },[user?.id]);

  /* Computed perks */
  const userPerks=useMemo(()=>{
    const s=new Set();
    activeMemberships.forEach(m=>{
      getEffectiveTiers(m.provider,m.tier,tierPrices).forEach(t=>{
        allPerks.forEach(p=>{if(p.provider===m.provider&&p.tier===t)s.add(p.perk_id);});
      });
    });
    return allPerks.filter(p=>s.has(p.perk_id)).map(p=>({...p,used:!!usedMap[p.perk_id],dismissed:!!dismissedMap[p.perk_id]}));
  },[activeMemberships,allPerks,usedMap,dismissedMap,tierPrices]);

  /* Display memberships — only show highest tier per provider */
  const displayMemberships=useMemo(()=>{
    const bp={};
    activeMemberships.forEach(m=>{(bp[m.provider]=bp[m.provider]||[]).push(m);});
    const r=[];
    Object.entries(bp).forEach(([prov,ms])=>{
      if(isHierarchicalProvider(prov,tierPrices)){
        const h=getHighestTier(prov,ms.map(m=>m.tier),tierPrices);
        h.forEach(t=>{const m=ms.find(x=>x.tier===t);if(m)r.push(m);});
      }else r.push(...ms);
    });
    return r;
  },[activeMemberships,tierPrices]);

  /* Toggle used */
  const toggleUsed=useCallback(async(perkId)=>{
    const newVal=!usedMap[perkId];
    setUsedMap(prev=>({...prev,[perkId]:newVal}));
    if(SB_CONFIGURED&&user?.id)await supabase.from("user_perk_state").upsert({user_id:user.id,perk_id:perkId,used:newVal,used_at:newVal?new Date().toISOString():null,updated_at:new Date().toISOString(),dismissed:!!dismissedMap[perkId]},{onConflict:"user_id,perk_id"});
  },[usedMap,dismissedMap,user?.id]);

  /* Toggle dismissed */
  const toggleDismissed=useCallback(async(perkId)=>{
    const newVal=!dismissedMap[perkId];
    setDismissedMap(prev=>({...prev,[perkId]:newVal}));
    if(newVal)setUsedMap(prev=>({...prev,[perkId]:false}));
    if(SB_CONFIGURED&&user?.id)await supabase.from("user_perk_state").upsert({user_id:user.id,perk_id:perkId,dismissed:newVal,used:newVal?false:!!usedMap[perkId],updated_at:new Date().toISOString()},{onConflict:"user_id,perk_id"});
  },[dismissedMap,usedMap,user?.id]);

  /* Add membership — selecting a higher tier auto-selects all tiers below it */
  const addMembership=useCallback(async(provider,membership,tier)=>{
    const order = getProviderTierOrder(provider, tierPrices);
    const tierIdx = order.indexOf(tier);

    if (isHierarchicalProvider(provider, tierPrices) && tierIdx >= 0) {
      // Auto-select all tiers at this level and below
      const tiersToAdd = order.slice(0, tierIdx + 1);
      setActiveMemberships(prev => {
        const withoutProv = prev.filter(m => m.provider !== provider);
        const newMs = tiersToAdd.map(t => ({ provider, membership, tier: t }));
        return [...withoutProv, ...newMs];
      });
      if (SB_CONFIGURED && user?.id) {
        await supabase.from("user_memberships").delete().eq("user_id", user.id).eq("provider", provider);
        const rows = tiersToAdd.map(t => ({ user_id: user.id, provider, membership, tier: t }));
        await supabase.from("user_memberships").upsert(rows, { onConflict: "user_id,provider,tier" });
      }
    } else {
      setActiveMemberships(prev => {
        if (prev.find(m => m.provider === provider && m.tier === tier)) return prev;
        return [...prev, { provider, membership, tier }];
      });
      if (SB_CONFIGURED && user?.id) {
        await supabase.from("user_memberships").upsert({ user_id: user.id, provider, membership, tier }, { onConflict: "user_id,provider,tier" });
      }
    }
  },[user?.id,tierPrices]);

  /* Remove membership — deselecting a lower tier removes all higher tiers that depend on it */
  const removeMembership=useCallback(async(provider,tier)=>{
    const order = getProviderTierOrder(provider, tierPrices);
    const tierIdx = order.indexOf(tier);

    if (isHierarchicalProvider(provider, tierPrices) && tierIdx >= 0) {
      const tiersToRemove = order.slice(tierIdx);
      setActiveMemberships(prev => prev.filter(m => !(m.provider === provider && tiersToRemove.includes(m.tier))));
      if (SB_CONFIGURED && user?.id) {
        await supabase.from("user_memberships").delete().eq("user_id", user.id).eq("provider", provider).in("tier", tiersToRemove);
      }
    } else {
      setActiveMemberships(prev => prev.filter(m => !(m.provider === provider && m.tier === tier)));
      if (SB_CONFIGURED && user?.id) {
        await supabase.from("user_memberships").delete().eq("user_id", user.id).eq("provider", provider).eq("tier", tier);
      }
    }
  },[user?.id,tierPrices]);

  const handleLogout=async()=>{if(SB_CONFIGURED)await supabase.auth.signOut();setUser(null);setActiveMemberships([]);setUsedMap({});setDismissedMap({});setTab("home");};

  /* Render */
  if(loading)return<div style={{maxWidth:420,margin:"0 auto",minHeight:"100vh",background:T.bg,display:"flex",alignItems:"center",justifyContent:"center"}}><Spinner/></div>;
  if(!user)return<AuthScreen onAuth={setUser}/>;
  const countable=userPerks.filter(p=>!p.dismissed);
  const usedCount=countable.filter(p=>p.used).length;

  return(
    <div style={{maxWidth:420,margin:"0 auto",minHeight:"100vh",background:T.bg,color:T.textPrimary,position:"relative",fontFamily:"'DM Sans',sans-serif",display:"flex",flexDirection:"column"}}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet"/>
      {!SB_CONFIGURED&&<div style={{background:"#FEF3C7",padding:"6px 16px",fontSize:11,color:"#92400E",fontWeight:600,textAlign:"center",fontFamily:"'DM Sans',sans-serif"}}>⚠️ Supabase not configured — connect Supabase to load perks</div>}
      <div style={{padding:"13px 18px 11px",background:"rgba(255,255,255,0.92)",backdropFilter:"blur(12px)",display:"flex",justifyContent:"space-between",alignItems:"center",borderBottom:`1px solid ${T.border}`,position:"sticky",top:0,zIndex:50}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}><div style={{width:28,height:28,borderRadius:8,background:`linear-gradient(135deg,${T.accent},${T.primary})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:900,color:"#fff"}}>P</div><span style={{fontSize:18,fontWeight:800,color:T.textPrimary,letterSpacing:"-0.5px"}}>Perki</span></div>
        <div style={{fontSize:11,color:T.textSecondary,fontWeight:600,background:"#F1F5F9",padding:"3px 10px",borderRadius:20}}>Used {usedCount} / Total {countable.length}</div>
      </div>
      <div style={{flex:1,padding:"12px 16px 100px",overflowY:"auto"}}>
        {tab==="home"&&<HomeTab perks={userPerks} onToggle={toggleUsed} onDismiss={toggleDismissed}/>}
        {tab==="memberships"&&<MembershipsTab perks={userPerks} onToggle={toggleUsed} onDismiss={toggleDismissed} activeMemberships={displayMemberships} tierPrices={tierPrices}/>}
        {tab==="where"&&<WhereTab perks={userPerks} onToggle={toggleUsed} onDismiss={toggleDismissed}/>}
        {tab==="potential"&&<PotentialTab allPerks={allPerks} activeMemberships={activeMemberships} onAddMembership={addMembership} userName={user.name} userId={user.id} tierPrices={tierPrices}/>}
        {tab==="profile"&&<ProfileTab perks={userPerks} activeMemberships={displayMemberships} onRemoveMembership={removeMembership} user={user} onLogout={handleLogout} onToggle={toggleUsed} onDismiss={toggleDismissed} tierPrices={tierPrices}/>}
      </div>
      <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:420,background:`linear-gradient(180deg,transparent 0%,${T.bg} 24%)`,padding:"8px 10px 12px",zIndex:100}}>
        <div style={{display:"flex",justifyContent:"space-around",background:"rgba(255,255,255,0.94)",backdropFilter:"blur(14px)",borderRadius:18,padding:"4px 2px",border:`1px solid ${T.border}`,boxShadow:"0 -2px 12px rgba(15,23,42,0.06)"}}>
          {TABS.map(t=>{const isA=tab===t.id;return(<button key={t.id} onClick={()=>setTab(t.id)} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:1,padding:"7px 4px",minWidth:48,background:isA?"#EFF6FF":"transparent",border:"none",borderRadius:12,cursor:"pointer"}}><span style={{fontSize:16,filter:isA?"none":"grayscale(0.5) opacity(0.7)"}}>{t.icon}</span><span style={{fontSize:8,fontWeight:isA?800:600,color:isA?T.accent:T.textSecondary,whiteSpace:"nowrap"}}>{t.label}</span></button>);})}
        </div>
      </div>
    </div>
  );
}
