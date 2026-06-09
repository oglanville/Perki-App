import React, { useState } from "react";
import { SB_CONFIGURED, T } from "./theme";
import { Spinner, AuthScreen } from "./components";
import { usePerksData } from "./hooks/usePerksData";
import BottomNav from "./BottomNav";
import HomeTab from "./tabs/HomeTab";
import WhereTab from "./tabs/WhereTab";
import MarketplaceTab from "./tabs/MarketplaceTab";
import ProfileTab from "./tabs/ProfileTab";

export default function AppShell(){
  const [tab,setTab]=useState("home");
  const d=usePerksData();
  if(d.loading)return <div style={{maxWidth:420,margin:"0 auto",minHeight:"100vh",background:T.bg,display:"flex",alignItems:"center",justifyContent:"center"}}><Spinner/></div>;
  if(!d.user)return <AuthScreen onAuth={d.setUser}/>;
  const countable=d.highestTierPerks.filter(p=>!p.dismissed);
  const usedCount=countable.filter(p=>p.used).length;
  return(
    <div style={{maxWidth:420,margin:"0 auto",minHeight:"100vh",background:T.bg,color:T.textPrimary,position:"relative",fontFamily:"'Work Sans',sans-serif",display:"flex",flexDirection:"column"}}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@500;600;700;800&family=Work+Sans:wght@400;500;600;700&display=swap" rel="stylesheet"/>
      {!SB_CONFIGURED&&<div style={{background:"#FEF3C7",padding:"6px 16px",fontSize:11,color:"#92400E",fontWeight:600,textAlign:"center",fontFamily:"'Work Sans',sans-serif"}}>⚠️ Supabase not configured — connect Supabase to load perks</div>}
      <div style={{padding:"13px 18px 11px",background:"rgba(255,255,255,0.92)",backdropFilter:"blur(12px)",display:"flex",justifyContent:"space-between",alignItems:"center",borderBottom:`1px solid ${T.border}`,position:"sticky",top:0,zIndex:50}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}><div style={{width:28,height:28,borderRadius:8,background:`linear-gradient(135deg,${T.accent},${T.primary})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:900,color:"#fff"}}>P</div><span style={{fontSize:18,fontWeight:800,color:T.textPrimary,letterSpacing:"-0.5px"}}>Perki</span></div>
        <div style={{fontSize:11,color:T.textSecondary,fontWeight:600,background:"#F7ECD4",padding:"3px 10px",borderRadius:20}}>Used {usedCount} / Total {countable.length}</div>
      </div>
      <div style={{flex:1,padding:"12px 16px 100px",overflowY:"auto"}}>
        {tab==="home"&&<HomeTab perks={d.userPerks} onToggle={d.toggleUsed} onDismiss={d.toggleDismissed} tierPrices={d.tierPrices} allPerks={d.allPerks}/>}
        {tab==="where"&&<WhereTab perks={d.userPerks} onToggle={d.toggleUsed} onDismiss={d.toggleDismissed} tierPrices={d.tierPrices}/>}
        {tab==="marketplace"&&<MarketplaceTab allPerks={d.allPerks} activeMemberships={d.activeMemberships} onAddMembership={d.addMembership} userName={d.user.name} userId={d.user.id} tierPrices={d.tierPrices}/>}
        {tab==="profile"&&<ProfileTab perks={d.highestTierPerks} activeMemberships={d.displayMemberships} rawMemberships={d.activeMemberships} onRemoveMembership={d.removeMembership} onAddMembership={d.addMembership} allPerks={d.allPerks} user={d.user} onLogout={d.handleLogout} onToggle={d.toggleUsed} onDismiss={d.toggleDismissed} tierPrices={d.tierPrices}/>}
      </div>
      <BottomNav tab={tab} setTab={setTab}/>
    </div>
  );
}
