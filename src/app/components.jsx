import React, { useState } from "react";
import { supabase } from "../lib/supabase";
import { SB_CONFIGURED, T, PROVIDERS, CATEGORIES, resetLabel, getPerkBrand, PROVIDER_SLUGS } from "./theme";

export function PerkBrandIcon({perk,size=32}){
  const b=getPerkBrand(perk);
  return(<div style={{width:size,height:size,borderRadius:size*0.24,background:`linear-gradient(135deg,${b.color}15,${b.color}25)`,border:`1.5px solid ${b.color}30`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:size*0.36,fontWeight:800,color:b.color,flexShrink:0,fontFamily:"'Work Sans',sans-serif",letterSpacing:"-0.3px"}}>{b.initials}</div>);
}

export function ProviderOverlay({provider,size=15,style={}}){const p=PROVIDERS[provider]||{color:T.muted,initials:"??"};return(<div style={{position:"absolute",top:-2,right:-2,width:size,height:size,borderRadius:size*0.35,background:p.color,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:size*0.48,fontWeight:800,border:"1.5px solid #fff",fontFamily:"'Work Sans',sans-serif",boxShadow:"0 1px 2px rgba(0,0,0,0.1)",...style}}>{p.initials}</div>);}

export function Dropdown({value,onChange,options,placeholder,disabled}){return(<select value={value} onChange={e=>onChange(e.target.value)} disabled={disabled} style={{flex:1,padding:"9px 12px",borderRadius:10,border:`1.5px solid ${T.border}`,background:T.surface,color:value?T.textPrimary:T.muted,fontSize:13,fontFamily:"'Work Sans',sans-serif",fontWeight:600,appearance:"none",backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%2394A3B8'/%3E%3C/svg%3E")`,backgroundRepeat:"no-repeat",backgroundPosition:"right 12px center",opacity:disabled?0.5:1}}><option value="">{placeholder}</option>{options.map(o=><option key={o} value={o}>{o}</option>)}</select>);}

export function SectionHeader({children,count}){return(<div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8,marginTop:16}}><span style={{fontSize:14,fontWeight:800,color:T.textPrimary,fontFamily:"'Work Sans',sans-serif"}}>{children}</span>{count!=null&&(<span style={{fontSize:10,background:"#F7ECD4",color:T.accent,padding:"1px 7px",borderRadius:10,fontWeight:700,fontFamily:"'Work Sans',sans-serif"}}>{count}</span>)}</div>);}

export function TabDesc({children}){return <p style={{fontSize:12,color:T.textSecondary,margin:"0 0 14px",lineHeight:1.5,fontFamily:"'Work Sans',sans-serif"}}>{children}</p>;}

export function Spinner(){return <div style={{display:"flex",justifyContent:"center",alignItems:"center",padding:40}}><div style={{width:32,height:32,border:`3px solid ${T.border}`,borderTopColor:T.accent,borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></div>;}


export function CollapsibleSection({ title, subtitle, count, badge, defaultOpen = false, headerBg, headerBorder, headerExtra, children, isOpen: controlledOpen, onToggle: controlledToggle }) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const toggle = controlledToggle || (() => setInternalOpen(o => !o));
  return (
    <div style={{ marginBottom: 8 }}>
      <div
        onClick={() => toggle()}
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
            <span style={{ fontSize: 13, fontWeight: 700, color: T.textPrimary, fontFamily: "'Work Sans',sans-serif" }}>{title}</span>
            {headerExtra}
          </div>
          {subtitle && <div style={{ fontSize: 10, color: T.textSecondary, fontFamily: "'Work Sans',sans-serif", marginTop: 1 }}>{subtitle}</div>}
        </div>
        {count != null && <span style={{ fontSize: 10, background: "#F7ECD4", color: T.accent, padding: "1px 7px", borderRadius: 10, fontWeight: 700, fontFamily: "'Work Sans',sans-serif", flexShrink: 0 }}>{count}</span>}
        <span style={{ fontSize: 14, color: T.muted, transform: open ? "rotate(180deg)" : "rotate(0deg)", display: "inline-block", transition: "transform 0.2s", flexShrink: 0 }}>▾</span>
      </div>
      {open && <div style={{ marginTop: 6, paddingLeft: 4 }}>{children}</div>}
    </div>
  );
}


export function PerkSheet({perk,mode="owned",onToggle,onDismiss,onClose}){
  const pCfg=PROVIDERS[perk.provider]||{color:T.accent};
  const url=perk.url;
  const isMarket=mode==="marketplace";
  return(
    <div onClick={onClose} style={{position:"fixed",inset:0,zIndex:200,background:"rgba(35,32,42,0.5)",backdropFilter:"blur(2px)",display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
      <div onClick={e=>e.stopPropagation()} style={{width:"100%",maxWidth:420,background:T.surface,borderRadius:"20px 20px 0 0",boxShadow:"0 -12px 40px rgba(43,42,40,0.22)",padding:"10px 18px 22px",fontFamily:"'Work Sans',sans-serif",animation:"perkiSheetUp 0.26s cubic-bezier(.4,0,.2,1)",borderTop:`3px solid ${pCfg.color||T.accent}`}}>
        <style>{`@keyframes perkiSheetUp{from{transform:translateY(100%)}to{transform:translateY(0)}}`}</style>
        <div style={{width:38,height:4,borderRadius:2,background:T.border,margin:"0 auto 14px"}}/>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}>
          <AppBrandLogo provider={perk.provider} size={44}/>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:16,fontWeight:800,color:T.textPrimary,fontFamily:"'Outfit',sans-serif",lineHeight:1.2}}>{perk.title}</div>
            <div style={{fontSize:11,fontWeight:600,color:pCfg.color||T.textSecondary,marginTop:2,fontFamily:"'Work Sans',sans-serif"}}>{perk.membership} — {perk.tier}</div>
          </div>
          <button onClick={onClose} style={{flexShrink:0,width:30,height:30,borderRadius:15,border:`1px solid ${T.border}`,background:T.bg,color:T.muted,fontSize:15,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
        </div>
        <div style={{fontSize:13,lineHeight:1.6,color:T.textSecondary,marginBottom:12}}>{perk.description||"No description available."}</div>
        <div style={{display:"flex",gap:14,flexWrap:"wrap",fontSize:11,color:T.muted,marginBottom:16}}>
          <span>🔄 {resetLabel(perk.reset_period)}</span>
          {perk.next_reset_date&&<span>📅 Renews {perk.next_reset_date}</span>}
          {isMarket&&<span>📊 {perk.usage_limit||"—"}</span>}
        </div>
        {isMarket?(
          url?<a href={url} target="_blank" rel="noopener noreferrer" style={{display:"flex",alignItems:"center",justifyContent:"center",gap:6,width:"100%",padding:"13px 0",borderRadius:12,background:T.primary,color:"#fff",fontSize:14,fontWeight:800,textDecoration:"none",fontFamily:"'Outfit',sans-serif"}}>Visit provider ↗</a>
          :<div style={{textAlign:"center",fontSize:12,color:T.muted,padding:"10px 0"}}>No provider link yet.</div>
        ):(
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            <label style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer",fontSize:14,fontWeight:600,color:T.textPrimary,padding:"11px 12px",borderRadius:10,border:`1px solid ${perk.used?T.success:T.border}`,background:perk.used?"#F7ECD4":T.bg}}>
              <input type="checkbox" checked={!!perk.used} onChange={()=>onToggle(perk.perk_id)} disabled={!!perk.dismissed} style={{width:18,height:18,accentColor:T.success,cursor:"pointer"}}/>
              {perk.used?"Marked as used":"Mark as used"}
            </label>
            <label style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer",fontSize:14,fontWeight:600,color:perk.dismissed?T.danger:T.muted,padding:"11px 12px",borderRadius:10,border:`1px solid ${perk.dismissed?T.danger:T.border}`,background:T.bg}}>
              <input type="checkbox" checked={!!perk.dismissed} onChange={()=>onDismiss(perk.perk_id)} style={{width:18,height:18,accentColor:T.danger,cursor:"pointer"}}/>
              Will not use (exclude from count)
            </label>
          </div>
        )}
      </div>
    </div>
  );
}


export function AppBrandLogo({provider,size=28}){
  const[failed,setFailed]=useState(false);
  const slug=PROVIDER_SLUGS[provider];
  const pCfg=PROVIDERS[provider]||{};
  const initials=pCfg.initials||(provider||"?").slice(0,2).toUpperCase();
  const tint=pCfg.color||T.muted;
  if(!slug||failed){
    return(<div style={{width:size,height:size,borderRadius:size*0.28,background:`${tint}1A`,border:`1.5px solid ${tint}33`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:size*0.4,fontWeight:800,color:tint,flexShrink:0,fontFamily:"'Work Sans',sans-serif"}}>{initials}</div>);
  }
  return(<div style={{width:size,height:size,borderRadius:size*0.28,background:"#fff",border:`1px solid ${T.border}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,overflow:"hidden"}}><img src={`https://cdn.simpleicons.org/${slug}`} alt={`${provider} logo`} onError={()=>setFailed(true)} style={{width:"62%",height:"62%",objectFit:"contain"}} loading="lazy"/></div>);
}

export function FeatureChip({feature}){
  const label={feature:"Feature",competition:"Competition",discount:"Discount"}[feature]||"Perk";
  return <span style={{fontSize:9,fontWeight:600,color:T.textSecondary,background:T.bg,border:`1px solid ${T.border}`,padding:"2px 8px",borderRadius:10,flexShrink:0,fontFamily:"'Work Sans',sans-serif"}}>{label}</span>;
}


export function PerkTile({perk,onToggle,onDismiss,selected,onSelect}){
  const isDimmed=perk.used||perk.dismissed;
  const isSel=perk.perk_id===selected;
  const catEmoji=(CATEGORIES[perk.category]||{}).icon;
  return(
    <div style={{position:"relative"}}>
      <div onClick={e=>{e.stopPropagation();onSelect(isSel?null:perk.perk_id);}} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 12px",borderRadius:12,background:isDimmed?T.bg:T.surface,border:`1px solid ${isSel?T.primary:T.border}`,opacity:isDimmed?0.55:1,cursor:"pointer",transition:"all 0.15s",boxShadow:isDimmed?"none":T.shadow}}>
        <AppBrandLogo provider={perk.provider} size={30}/>
        {catEmoji&&<span style={{fontSize:15,flexShrink:0}}>{catEmoji}</span>}
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:13,fontWeight:600,color:T.textPrimary,fontFamily:"'Work Sans',sans-serif",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{perk.title}</div>
          <div style={{fontSize:10,color:T.textSecondary,fontWeight:500,fontFamily:"'Work Sans',sans-serif",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{perk.provider} · {perk.tier}</div>
        </div>
        {perk.dismissed?<span style={{fontSize:9,fontWeight:700,color:T.danger,background:"#F6E9E5",padding:"2px 7px",borderRadius:10,flexShrink:0,fontFamily:"'Work Sans',sans-serif"}}>Set aside</span>:perk.used?<span style={{fontSize:9,fontWeight:700,color:"#B07C1A",background:"#F7ECD4",padding:"2px 7px",borderRadius:10,flexShrink:0,fontFamily:"'Work Sans',sans-serif"}}>Used</span>:<FeatureChip feature={perk.feature}/>}
      </div>
      {isSel&&<PerkSheet perk={perk} mode="owned" onToggle={onToggle} onDismiss={onDismiss} onClose={()=>onSelect(null)}/>}
    </div>
  );
}


export function PotentialPerkTile({perk,selected,onSelect}){
  const isSel=perk.perk_id===selected;
  const url=perk.url;
  const catEmoji=(CATEGORIES[perk.category]||{}).icon;
  return(
    <div style={{position:"relative"}}>
      <div onClick={e=>{e.stopPropagation();onSelect(isSel?null:perk.perk_id);}} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 12px",borderRadius:12,background:T.surface,border:`1px solid ${isSel?T.primary:T.border}`,cursor:"pointer",transition:"all 0.15s",boxShadow:T.shadow}}>
        <AppBrandLogo provider={perk.provider} size={30}/>
        {catEmoji&&<span style={{fontSize:15,flexShrink:0}}>{catEmoji}</span>}
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:13,fontWeight:600,color:T.textPrimary,fontFamily:"'Work Sans',sans-serif",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{perk.title}</div>
          <div style={{fontSize:10,color:T.textSecondary,fontWeight:500,fontFamily:"'Work Sans',sans-serif"}}>{perk.provider} · {perk.tier}</div>
        </div>
        {url?<a href={url} target="_blank" rel="noopener noreferrer" onClick={e=>e.stopPropagation()} style={{fontSize:10,fontWeight:700,color:T.primary,textDecoration:"none",background:"#F7ECD4",padding:"4px 9px",borderRadius:8,flexShrink:0,fontFamily:"'Work Sans',sans-serif"}}>Visit ↗</a>:<FeatureChip feature={perk.feature}/>}
      </div>
      {isSel&&<PerkSheet perk={perk} mode="marketplace" onClose={()=>onSelect(null)}/>}
    </div>
  );
}


export function PerkSquareTile({perk,onToggle,onDismiss,selected,onSelect}){
  const b=getPerkBrand(perk);
  const pCfg=PROVIDERS[perk.provider]||{color:T.muted,initials:"??"};
  const isDimmed=perk.used||perk.dismissed;
  const isSel=perk.perk_id===selected;
  return(
    <div style={{position:"relative"}}>
      <div onClick={e=>{e.stopPropagation();onSelect(isSel?null:perk.perk_id);}} style={{
        width:"100%",aspectRatio:"1",borderRadius:10,overflow:"hidden",cursor:"pointer",
        background:b.gradient,position:"relative",transition:"all 0.15s",
        opacity:isDimmed?0.45:1,
        border:`2px solid ${isSel?T.accent:"transparent"}`,
        boxShadow:isSel?"0 0 0 2px rgba(30,144,255,0.3)":isDimmed?"none":"0 2px 8px rgba(0,0,0,0.1)",
      }}>
        <div style={{position:"absolute",top:3,right:3,width:16,height:16,borderRadius:5,background:pCfg.color,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:6,fontWeight:800,border:"1px solid rgba(255,255,255,0.4)",fontFamily:"'Work Sans',sans-serif",boxShadow:"0 1px 3px rgba(0,0,0,0.2)",zIndex:2}}>{pCfg.initials}</div>
        {perk.dismissed&&<div style={{position:"absolute",top:3,left:3,fontSize:7,background:"rgba(0,0,0,0.5)",color:"#F87171",padding:"1px 4px",borderRadius:4,fontWeight:700,fontFamily:"'Work Sans',sans-serif",zIndex:2}}>✗</div>}
        {perk.used&&!perk.dismissed&&<div style={{position:"absolute",top:3,left:3,fontSize:7,background:"rgba(0,0,0,0.5)",color:"#E0A93B",padding:"1px 4px",borderRadius:4,fontWeight:700,fontFamily:"'Work Sans',sans-serif",zIndex:2}}>✓</div>}
        <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"60%",fontSize:22,filter:isDimmed?"grayscale(0.5)":"none"}}>{b.emoji}</div>
        <div style={{position:"absolute",bottom:0,left:0,right:0,background:"rgba(0,0,0,0.55)",backdropFilter:"blur(4px)",padding:"3px 4px"}}>
          <div style={{fontSize:7,fontWeight:700,color:"#fff",fontFamily:"'Work Sans',sans-serif",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",lineHeight:1.3}}>{perk.title}</div>
        </div>
      </div>
      {isSel&&<PerkSheet perk={perk} mode="owned" onToggle={onToggle} onDismiss={onDismiss} onClose={()=>onSelect(null)}/>}
    </div>
  );
}


export function HowToUseModal({onClose}){
  return(
    <div onClick={onClose} style={{position:"fixed",inset:0,zIndex:200,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div onClick={e=>e.stopPropagation()} style={{width:"100%",maxWidth:380,maxHeight:"80vh",overflowY:"auto",background:"#2B2A6E",borderRadius:16,padding:"20px 18px",color:"#CBD5E1",fontSize:12,lineHeight:1.6,fontFamily:"'Work Sans',sans-serif",boxShadow:"0 20px 60px rgba(0,0,0,0.3)",position:"relative"}}>
        <button onClick={onClose} style={{position:"absolute",top:12,right:14,background:"rgba(255,255,255,0.1)",border:"none",color:"#fff",width:28,height:28,borderRadius:14,fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700}}>✕</button>
        <div style={{fontSize:16,fontWeight:800,color:"#fff",marginBottom:14,fontFamily:"'Work Sans',sans-serif"}}>📖 How to Use Perki</div>
        <div style={{fontWeight:700,color:"#fff",marginBottom:4}}>🏠 Home</div><div style={{marginBottom:12}}>See all your perks in a visual grid. Tap any tile to view details, mark as used, or dismiss it from your count.</div>
        <div style={{fontWeight:700,color:"#fff",marginBottom:4}}>💳 Current Memberships</div><div style={{marginBottom:12}}>Browse perks grouped by provider and tier. Tap to expand.</div>
        <div style={{fontWeight:700,color:"#fff",marginBottom:4}}>📍 Where to Use</div><div style={{marginBottom:12}}>Browse perks by category (Travel, Retail, Finance, etc). Tap a category to expand matching perks.</div>
        <div style={{fontWeight:700,color:"#fff",marginBottom:4}}>✨ Potential Memberships</div><div style={{marginBottom:12}}>Browse all available memberships grouped by provider and tier. Tiers you already have are marked "Already Active". Tap "+ Add Tier" to add a new one.</div>
        <div style={{fontWeight:700,color:"#fff",marginBottom:4}}>👤 Profile</div><div>View stats, manage active memberships grouped by provider and tier, and update your profile picture.</div>
      </div>
    </div>
  );
}


export function AuthScreen({onAuth}){const[mode,setMode]=useState("login");const[email,setEmail]=useState("");const[pw,setPw]=useState("");const[name,setName]=useState("");const[err,setErr]=useState("");const[showPw,setShowPw]=useState(false);const[loading,setLoading]=useState(false);const handleSubmit=async()=>{setErr("");setLoading(true);try{if(!SB_CONFIGURED){onAuth({id:"local-dev",name:name||"Dev User",email:email||"dev@local"});return;}if(mode==="signup"){const{error}=await supabase.auth.signUp({email,password:pw,options:{data:{full_name:name}}});if(error)throw error;}else{const{error}=await supabase.auth.signInWithPassword({email,password:pw});if(error)throw error;}}catch(e){setErr(e.message||"Something went wrong.");setLoading(false);}};
  return(<div style={{maxWidth:420,margin:"0 auto",minHeight:"100vh",background:T.bg,display:"flex",flexDirection:"column",justifyContent:"center",padding:"0 28px",fontFamily:"'Work Sans',sans-serif"}}><link href="https://fonts.googleapis.com/css2?family=Outfit:wght@500;600;700;800&family=Work+Sans:wght@400;500;600;700&display=swap" rel="stylesheet"/><div style={{textAlign:"center",marginBottom:32}}><div style={{width:56,height:56,borderRadius:16,margin:"0 auto 14px",background:`linear-gradient(135deg,${T.accent},${T.primary})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,fontWeight:900,color:"#fff",boxShadow:"0 8px 24px rgba(30,144,255,0.25)"}}>P</div><h1 style={{fontSize:28,fontWeight:800,color:T.textPrimary,margin:"0 0 4px"}}>Perki</h1><p style={{fontSize:14,color:T.textSecondary,margin:0}}>All your membership perks in one place</p></div><div style={{display:"flex",gap:0,marginBottom:16,borderRadius:10,overflow:"hidden",border:`1.5px solid ${T.border}`}}>{["login","signup"].map(m=><button key={m} onClick={()=>{setMode(m);setErr("");}} style={{flex:1,padding:"9px 0",border:"none",background:mode===m?"#F7ECD4":T.surface,color:mode===m?T.accent:T.textSecondary,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"'Work Sans',sans-serif"}}>{m==="login"?"Log In":"Sign Up"}</button>)}</div><div style={{display:"flex",flexDirection:"column",gap:10}}>{mode==="signup"&&<div><label style={{fontSize:12,fontWeight:700,color:T.textSecondary,marginBottom:3,display:"block"}}>Full Name</label><input value={name} onChange={e=>{setName(e.target.value);setErr("");}} placeholder="Ollie Glanville" style={{width:"100%",padding:"11px 14px",borderRadius:10,border:`1.5px solid ${T.border}`,background:T.surface,fontSize:14,color:T.textPrimary,boxSizing:"border-box",outline:"none",fontFamily:"'Work Sans',sans-serif"}}/></div>}<div><label style={{fontSize:12,fontWeight:700,color:T.textSecondary,marginBottom:3,display:"block"}}>Email</label><input type="email" value={email} onChange={e=>{setEmail(e.target.value);setErr("");}} placeholder="you@example.com" style={{width:"100%",padding:"11px 14px",borderRadius:10,border:`1.5px solid ${err?"#FECACA":T.border}`,background:T.surface,fontSize:14,color:T.textPrimary,boxSizing:"border-box",outline:"none",fontFamily:"'Work Sans',sans-serif"}}/></div><div><label style={{fontSize:12,fontWeight:700,color:T.textSecondary,marginBottom:3,display:"block"}}>Password</label><div style={{position:"relative"}}><input type={showPw?"text":"password"} value={pw} onChange={e=>{setPw(e.target.value);setErr("");}} placeholder="Min. 6 characters" style={{width:"100%",padding:"11px 44px 11px 14px",borderRadius:10,border:`1.5px solid ${err?"#FECACA":T.border}`,background:T.surface,fontSize:14,color:T.textPrimary,boxSizing:"border-box",outline:"none",fontFamily:"'Work Sans',sans-serif"}}/><button onClick={()=>setShowPw(!showPw)} style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",fontSize:16,color:T.muted,padding:4}}>{showPw?"🙈":"👁️"}</button></div></div>{err&&<p style={{fontSize:12,color:T.danger,margin:0,padding:"8px 12px",background:"#FEF2F2",borderRadius:8,fontWeight:600}}>{err}</p>}<button onClick={handleSubmit} disabled={loading} style={{width:"100%",padding:"13px 0",borderRadius:12,border:"none",background:`linear-gradient(135deg,${T.accent},${T.primary})`,color:"#fff",fontSize:15,fontWeight:800,cursor:loading?"wait":"pointer",fontFamily:"'Work Sans',sans-serif",marginTop:2,boxShadow:"0 4px 14px rgba(30,144,255,0.3)",opacity:loading?0.7:1}}>{loading?"Please wait…":mode==="login"?"Log In":"Create Account"}</button>{!SB_CONFIGURED&&<p style={{fontSize:10,color:T.warning,textAlign:"center",marginTop:6,background:"#FEF3C7",padding:"6px 10px",borderRadius:8,fontWeight:600}}>⚠️ Supabase not configured — offline mode.</p>}</div></div>);
}

