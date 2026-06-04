import React, { useState, useMemo, useRef } from "react";
import { T, PROVIDERS, featureThenAlpha } from "../theme";
import { SectionHeader, TabDesc, CollapsibleSection, AppBrandLogo, PerkTile } from "../components";

export default function ProfileTab({perks,activeMemberships,onRemoveMembership,user,onLogout,onToggle,onDismiss,tierPrices}){
  const[selectedPerk,setSelectedPerk]=useState(null);
  const[profilePic,setProfilePic]=useState(null);
  const[costOpen,setCostOpen]=useState(false);
  const fileRef=useRef(null);
  const countable=perks.filter(p=>!p.dismissed);
  const used=countable.filter(p=>p.used).length;
  const willNotUseCount=perks.filter(p=>p.dismissed).length;
  const activePerks=countable.filter(p=>!p.used);
  const inactivePerks=perks.filter(p=>p.used||p.dismissed);

  /* Cost summary — only highest-priced tier per provider, from perks.price */
  const costBreakdown=useMemo(()=>{
    const byProv={};
    activeMemberships.forEach(m=>{
      const perkWithPrice=perks.find(p=>p.provider===m.provider&&p.tier===m.tier&&p.price!=null);
      const price=perkWithPrice?.price??0;
      if(!byProv[m.provider]||price>byProv[m.provider].price){
        byProv[m.provider]={provider:m.provider,tier:m.tier,price};
      }
    });
    return Object.values(byProv);
  },[activeMemberships,perks]);
  const totalMonthlyCost=useMemo(()=>costBreakdown.reduce((sum,i)=>sum+i.price,0),[costBreakdown]);

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
        const pa=perks.find(p=>p.provider===prov&&p.tier===a.tier&&p.price!=null)?.price??999;
        const pb=perks.find(p=>p.provider===prov&&p.tier===b.tier&&p.price!=null)?.price??999;
        return pa-pb;
      });
      return { provider:prov, memberships:ms };
    });
  },[activeMemberships,perks]);

  const handlePic=e=>{const f=e.target.files?.[0];if(f){const r=new FileReader();r.onload=ev=>setProfilePic(ev.target.result);r.readAsDataURL(f);}};

  return(<div onClick={()=>setSelectedPerk(null)}>
    <h1 style={{fontSize:22,fontWeight:800,color:T.textPrimary,margin:0,fontFamily:"'Outfit',sans-serif"}}>Profile</h1>
    <TabDesc>Manage your account, view stats, and control memberships.</TabDesc>

    <div style={{display:"flex",flexDirection:"column",alignItems:"center",padding:"20px 16px 18px",marginBottom:14,background:T.surface,borderRadius:14,border:`1px solid ${T.border}`,boxShadow:T.shadow}}>
      <div onClick={()=>fileRef.current?.click()} style={{width:64,height:64,borderRadius:32,cursor:"pointer",background:profilePic?`url(${profilePic}) center/cover`:`linear-gradient(135deg,${T.accent},${T.primary})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:profilePic?0:24,fontWeight:900,color:"#fff",border:"3px solid #fff",boxShadow:"0 4px 14px rgba(30,144,255,0.2)",position:"relative",overflow:"hidden"}}>
        {!profilePic&&user.name.split(" ").map(n=>n[0]).join("")}
        <div style={{position:"absolute",bottom:0,left:0,right:0,height:20,background:"rgba(0,0,0,0.45)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,color:"#fff",fontWeight:600}}>Edit</div>
      </div>
      <input ref={fileRef} type="file" accept="image/*" onChange={handlePic} style={{display:"none"}}/>
      <h2 style={{fontSize:16,fontWeight:800,color:T.textPrimary,margin:"10px 0 1px",fontFamily:"'Work Sans',sans-serif"}}>{user.name}</h2>
      <p style={{fontSize:12,color:T.textSecondary,margin:"0 0 12px",fontFamily:"'Work Sans',sans-serif"}}>{user.email}</p>
      <button onClick={onLogout} style={{padding:"7px 22px",borderRadius:10,border:`1.5px solid ${T.border}`,background:T.bg,color:T.textSecondary,fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"'Work Sans',sans-serif"}}>Log Out</button>
    </div>

    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:14}}>
      <div style={{padding:14,borderRadius:12,textAlign:"center",background:"#F7ECD4",border:"1.5px solid #E0A93B"}}><div style={{fontSize:26,fontWeight:800,color:T.success,fontFamily:"'Work Sans',sans-serif"}}>{countable.length-used}</div><div style={{fontSize:10,color:"#B07C1A",fontWeight:600,fontFamily:"'Work Sans',sans-serif"}}>Available</div></div>
      <div style={{padding:14,borderRadius:12,textAlign:"center",background:"#F7ECD4",border:"1.5px solid #E4DDCB"}}><div style={{fontSize:26,fontWeight:800,color:T.accent,fontFamily:"'Work Sans',sans-serif"}}>{used}</div><div style={{fontSize:10,color:"#2B2A6E",fontWeight:600,fontFamily:"'Work Sans',sans-serif"}}>Used</div></div>
      <div style={{padding:14,borderRadius:12,textAlign:"center",background:"#FEF2F2",border:"1.5px solid #FECACA"}}><div style={{fontSize:26,fontWeight:800,color:T.danger,fontFamily:"'Work Sans',sans-serif"}}>{willNotUseCount}</div><div style={{fontSize:10,color:"#991B1B",fontWeight:600,fontFamily:"'Work Sans',sans-serif"}}>Will Not Use</div></div>
    </div>
    <p style={{fontSize:12,color:T.textSecondary,margin:"0 0 6px",fontFamily:"'Work Sans',sans-serif",fontWeight:600}}>Used {used} / Total {countable.length}{perks.length!==countable.length&&<span style={{color:T.muted}}> ({perks.length-countable.length} excluded)</span>}</p>

    {/* Cost Summary */}
    <div style={{marginBottom:14,background:T.surface,borderRadius:12,border:`1px solid ${T.border}`,boxShadow:T.shadow,overflow:"hidden"}}>
      <div onClick={()=>setCostOpen(!costOpen)} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 14px",cursor:"pointer"}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:18}}>💷</span>
          <div>
            <div style={{fontSize:13,fontWeight:700,color:T.textPrimary,fontFamily:"'Work Sans',sans-serif"}}>Monthly Cost</div>
            <div style={{fontSize:10,color:T.textSecondary,fontFamily:"'Work Sans',sans-serif"}}>{costBreakdown.length} provider{costBreakdown.length!==1?"s":""}</div>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:20,fontWeight:800,color:T.primary,fontFamily:"'Work Sans',sans-serif"}}>{totalMonthlyCost===0?"Free":`£${totalMonthlyCost.toFixed(2)}`}</span>
          <span style={{fontSize:14,color:T.muted,transform:costOpen?"rotate(180deg)":"rotate(0deg)",display:"inline-block",transition:"transform 0.2s"}}>▾</span>
        </div>
      </div>
      {costOpen&&(
        <div style={{borderTop:`1px solid ${T.border}`,padding:"10px 14px"}}>
          {costBreakdown.length===0&&<p style={{fontSize:11,color:T.muted,fontFamily:"'Work Sans',sans-serif",margin:0}}>No active memberships.</p>}
          {costBreakdown.map((item,i)=>{
            const pCfg=PROVIDERS[item.provider]||{color:T.muted,bg:"#f1f5f9"};
            return(
              <div key={`${item.provider}-${item.tier}`} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 0",borderBottom:i<costBreakdown.length-1?`1px solid ${T.border}`:"none"}}>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <AppBrandLogo provider={item.provider} size={22}/>
                  <div>
                    <div style={{fontSize:12,fontWeight:700,color:T.textPrimary,fontFamily:"'Work Sans',sans-serif"}}>{item.provider}</div>
                    <div style={{fontSize:10,color:pCfg.color||T.textSecondary,fontWeight:600,fontFamily:"'Work Sans',sans-serif"}}>{item.tier}</div>
                  </div>
                </div>
                <span style={{fontSize:13,fontWeight:700,color:item.price===0?T.success:T.textPrimary,fontFamily:"'Work Sans',sans-serif"}}>{item.price===0?"Free":`£${item.price.toFixed(2)}/mo`}</span>
              </div>
            );
          })}
          {costBreakdown.length>0&&(
            <div style={{display:"flex",justifyContent:"space-between",paddingTop:10,marginTop:4,borderTop:`2px solid ${T.primary}22`}}>
              <span style={{fontSize:12,fontWeight:800,color:T.textPrimary,fontFamily:"'Work Sans',sans-serif"}}>Total</span>
              <span style={{fontSize:14,fontWeight:800,color:T.primary,fontFamily:"'Work Sans',sans-serif"}}>{totalMonthlyCost===0?"Free":`£${totalMonthlyCost.toFixed(2)}/mo`}</span>
            </div>
          )}
        </div>
      )}
    </div>

    <CollapsibleSection title="Active perks" subtitle="Available, not yet used" count={activePerks.length} defaultOpen={false}>
      <div style={{display:"flex",flexDirection:"column",gap:5}}>
        {activePerks.length>0?activePerks.map(p=><PerkTile key={p.perk_id} perk={p} onToggle={onToggle} onDismiss={onDismiss} selected={selectedPerk} onSelect={setSelectedPerk}/>):<p style={{fontSize:11,color:T.muted,fontStyle:"italic",fontFamily:"'Work Sans',sans-serif"}}>Nothing active right now.</p>}
      </div>
    </CollapsibleSection>
    <CollapsibleSection title="Inactive perks" subtitle="Used or set aside" count={inactivePerks.length} defaultOpen={false}>
      <div style={{display:"flex",flexDirection:"column",gap:5}}>
        {inactivePerks.length>0?inactivePerks.map(p=><PerkTile key={p.perk_id} perk={p} onToggle={onToggle} onDismiss={onDismiss} selected={selectedPerk} onSelect={setSelectedPerk}/>):<p style={{fontSize:11,color:T.muted,fontStyle:"italic",fontFamily:"'Work Sans',sans-serif"}}>Nothing here yet.</p>}
      </div>
    </CollapsibleSection>

    <SectionHeader count={activeMemberships.length}>Active Memberships</SectionHeader>

    {providerGroups.map(pg=>{
      const pCfg=PROVIDERS[pg.provider]||{color:T.muted,bg:"#f1f5f9"};
      return(
        <CollapsibleSection
          key={pg.provider}
          title={pg.provider}
          count={pg.memberships.length + " tier" + (pg.memberships.length!==1?"s":"")}
          badge={<AppBrandLogo provider={pg.provider} size={28}/>}
          headerBg={pCfg.bg}
          headerBorder={`${pCfg.color}33`}
          defaultOpen={false}
        >
          {pg.memberships.map(m=>{
            const key=`${m.provider}|${m.tier}`;
            const tierPerks=perks.filter(p=>p.provider===m.provider&&p.tier===m.tier).sort(featureThenAlpha);
            const tierPrice=tierPerks.find(p=>p.price!=null)?.price;
            const priceLabel=tierPrice!=null?(tierPrice===0?"Free":`£${tierPrice}/mo`):"";
            const cnt=tierPerks.filter(p=>!p.dismissed);
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
                  <button onClick={e=>{e.stopPropagation();onRemoveMembership(m.provider,m.tier);}} style={{padding:"4px 9px",borderRadius:8,border:"1.5px solid #FECACA",background:"#FEF2F2",color:"#DC2626",fontSize:10,fontWeight:700,cursor:"pointer",fontFamily:"'Work Sans',sans-serif"}}>Remove</button>
                }
              >
                {tierPerks.length>0?(
                  <div style={{display:"flex",flexDirection:"column",gap:4}}>
                    {tierPerks.map(p=><PerkTile key={p.perk_id} perk={p} onToggle={onToggle} onDismiss={onDismiss} selected={selectedPerk} onSelect={setSelectedPerk}/>)}
                  </div>
                ):<p style={{fontSize:11,color:T.muted,fontStyle:"italic",fontFamily:"'Work Sans',sans-serif"}}>No perks at this tier.</p>}
              </CollapsibleSection>
            );
          })}
        </CollapsibleSection>
      );
    })}
    {activeMemberships.length===0&&<p style={{textAlign:"center",color:T.muted,marginTop:20,fontSize:13,fontFamily:"'Work Sans',sans-serif"}}>No active memberships.</p>}
  </div>);
}

