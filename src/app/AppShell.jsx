import React, { useState } from "react";
import { SB_CONFIGURED, T } from "./theme";
import { Spinner, AuthScreen } from "./components";
import { usePerksData } from "./hooks/usePerksData";
import BottomNav from "./BottomNav";
import HomeTab from "./tabs/HomeTab";
import WhereTab from "./tabs/WhereTab";
import MarketplaceTab from "./tabs/MarketplaceTab";
import ProfileTab from "./tabs/ProfileTab";

const APP_PASSWORD="perki2026"; // Ollie-only for now; change here when opening up.

function LockScreen({onUnlock}){
  const[pw,setPw]=useState("");
  const[err,setErr]=useState(false);
  const submit=()=>{ if(pw===APP_PASSWORD){ try{localStorage.setItem("perki-app-unlocked","1");}catch{} onUnlock(); } else setErr(true); };
  return(
    <div style={{maxWidth:420,margin:"0 auto",minHeight:"100vh",background:T.bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24,fontFamily:"'Work Sans',sans-serif"}}>
      <div style={{width:44,height:44,borderRadius:12,background:T.primary,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,fontWeight:900,color:"#E0A93B",fontFamily:"'Outfit',sans-serif",marginBottom:14}}>P</div>
      <h1 style={{fontFamily:"'Outfit',sans-serif",fontWeight:900,fontSize:24,lineHeight:.95,color:T.textPrimary,margin:"0 0 6px"}}>Members only.</h1>
      <p style={{fontSize:13,color:T.textSecondary,margin:"0 0 18px",textAlign:"center"}}>The app is in private preview. Enter the password to continue.</p>
      <input type="password" value={pw} autoFocus onChange={e=>{setPw(e.target.value);setErr(false);}} onKeyDown={e=>e.key==="Enter"&&submit()} placeholder="Password"
        style={{width:"100%",maxWidth:280,padding:"13px 20px",borderRadius:999,border:`1.5px solid ${err?T.danger:T.border}`,background:T.surface,fontSize:15,fontFamily:"'Work Sans',sans-serif",color:T.textPrimary,outline:"none",boxSizing:"border-box",textAlign:"center"}}/>
      {err&&<p style={{fontSize:12,color:T.danger,margin:"8px 0 0"}}>Not quite. Try again.</p>}
      <button onClick={submit} style={{marginTop:14,minHeight:48,padding:"0 34px",borderRadius:999,border:"none",background:T.primary,color:"#fff",fontSize:15,fontWeight:700,cursor:"pointer",fontFamily:"'Work Sans',sans-serif"}}>Unlock</button>
    </div>
  );
}

export default function AppShell(){
  const [tab,setTab]=useState("home");
  const [unlocked,setUnlocked]=useState(()=>{try{return localStorage.getItem("perki-app-unlocked")==="1";}catch{return false;}});
  const d=usePerksData();
  if(!unlocked)return <LockScreen onUnlock={()=>setUnlocked(true)}/>;
  if(d.loading)return <div style={{maxWidth:420,margin:"0 auto",minHeight:"100vh",background:T.bg,display:"flex",alignItems:"center",justifyContent:"center"}}><Spinner/></div>;
  if(!d.user)return <AuthScreen onAuth={d.setUser}/>;
  const countable=d.highestTierPerks.filter(p=>!p.dismissed);
  const usedCount=countable.filter(p=>p.used).length;
  return(
    <div style={{maxWidth:420,margin:"0 auto",minHeight:"100vh",background:T.bg,color:T.textPrimary,position:"relative",fontFamily:"'Work Sans',sans-serif",display:"flex",flexDirection:"column"}}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@500;600;700;800&family=Work+Sans:wght@400;500;600;700&display=swap" rel="stylesheet"/>
      {!SB_CONFIGURED&&<div style={{background:"#FEF3C7",padding:"6px 16px",fontSize:11,color:"#92400E",fontWeight:600,textAlign:"center",fontFamily:"'Work Sans',sans-serif"}}>⚠️ Supabase not configured — connect Supabase to load perks</div>}
      <div style={{padding:"13px 18px 11px",background:"rgba(255,255,255,0.92)",backdropFilter:"blur(12px)",display:"flex",justifyContent:"space-between",alignItems:"center",borderBottom:`1px solid ${T.border}`,position:"sticky",top:0,zIndex:50}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}><div style={{width:28,height:28,borderRadius:8,background:`linear-gradient(135deg,${T.accent},${T.primary})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:900,color:"#fff"}}>P</div><span style={{fontFamily:"'Outfit',sans-serif",fontSize:19,fontWeight:900,color:T.textPrimary,letterSpacing:"-0.5px"}}>Perki<span style={{color:"#E0A93B"}}>.</span></span></div>
        <div style={{fontSize:11,color:T.textSecondary,fontWeight:600,background:"#F7ECD4",padding:"3px 10px",borderRadius:20}}>Used {usedCount} / Total {countable.length}</div>
      </div>
      <div style={{flex:1,padding:"12px 16px 100px",overflowY:"auto"}}>
        {tab==="home"&&<HomeTab userName={d.user.name} perks={d.userPerks} onToggle={d.toggleUsed} onDismiss={d.toggleDismissed} tierPrices={d.tierPrices} allPerks={d.allPerks}/>}
        {tab==="where"&&<WhereTab perks={d.userPerks} onToggle={d.toggleUsed} onDismiss={d.toggleDismissed} tierPrices={d.tierPrices}/>}
        {tab==="marketplace"&&<MarketplaceTab allPerks={d.allPerks} activeMemberships={d.activeMemberships} onAddMembership={d.addMembership} userName={d.user.name} userId={d.user.id} tierPrices={d.tierPrices}/>}
        {tab==="profile"&&<ProfileTab perks={d.highestTierPerks} activeMemberships={d.displayMemberships} rawMemberships={d.activeMemberships} onRemoveMembership={d.removeMembership} onAddMembership={d.addMembership} allPerks={d.allPerks} user={d.user} onLogout={d.handleLogout} onToggle={d.toggleUsed} onDismiss={d.toggleDismissed} tierPrices={d.tierPrices}/>}
      </div>
      <BottomNav tab={tab} setTab={setTab}/>
    </div>
  );
}
