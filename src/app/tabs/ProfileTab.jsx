import React, { useState, useMemo, useRef, useEffect } from "react";
import { T, PROVIDERS, featureThenAlpha, buildMembershipCatalog } from "../theme";
import { SectionHeader, TabDesc, CollapsibleSection, AppBrandLogo, PerkTile } from "../components";

/* Profile order: Feature -> Perk -> Discount -> Competition.  [type, activeLabel, inactiveLabel] */
const TYPE_ROWS = [
  ["feature","Active Features","Inactive Features"],
  ["perk","Active Perks","Inactive Perks"],
  ["discount","Used Discounts","Unused Discounts"],
  ["competition","Entered Competitions","Unentered Competitions"],
];

export default function ProfileTab({perks,activeMemberships,rawMemberships,onRemoveMembership,onAddMembership,allPerks,user,onLogout,onToggle,onDismiss,tierPrices}){
  const[selectedPerk,setSelectedPerk]=useState(null);
  const[profilePic,setProfilePic]=useState(null);
  const[costOpen,setCostOpen]=useState(false);
  const[query,setQuery]=useState("");
  const[pick,setPick]=useState({});
  const fileRef=useRef(null);

  const countable=perks.filter(p=>!p.dismissed);
  const nonFeature=countable.filter(p=>p.feature!=="feature");
  const totalAvailable=nonFeature.length;
  const totalActive=nonFeature.filter(p=>p.used).length;
  const activeFeatures=countable.filter(p=>p.feature==="feature"&&p.used).length;
  const activePlans=activeMemberships.length;

  const q=query.trim().toLowerCase();
  const matchP=(p)=>!q||[p.title,p.description,p.provider,p.tier,p.category].some(v=>(v||"").toString().toLowerCase().includes(q));
  const activeOf=(t)=>countable.filter(p=>p.feature===t&&matchP(p)&&p.used).sort(featureThenAlpha);
  const inactiveOf=(t)=>countable.filter(p=>p.feature===t&&matchP(p)&&!p.used).sort(featureThenAlpha);

  /* Cost summary — highest-priced tier per provider, from perks.price */
  const costBreakdown=useMemo(()=>{
    const byProv={};
    activeMemberships.forEach(m=>{
      const perkWithPrice=perks.find(p=>p.provider===m.provider&&p.tier===m.tier&&p.price!=null);
      const price=perkWithPrice?.price??0;
      if(!byProv[m.provider]||price>byProv[m.provider].price){byProv[m.provider]={provider:m.provider,tier:m.tier,price};}
    });
    return Object.values(byProv);
  },[activeMemberships,perks]);
  const totalMonthlyCost=useMemo(()=>costBreakdown.reduce((sum,i)=>sum+i.price,0),[costBreakdown]);

  /* Group memberships by provider, sort tiers by price */
  const providerGroups=useMemo(()=>{
    const byProv={};
    activeMemberships.forEach(m=>{(byProv[m.provider]=byProv[m.provider]||[]).push(m);});
    return Object.keys(byProv).sort().map(prov=>{
      const ms=byProv[prov].sort((a,b)=>{
        const pa=perks.find(p=>p.provider===prov&&p.tier===a.tier&&p.price!=null)?.price??999;
        const pb=perks.find(p=>p.provider===prov&&p.tier===b.tier&&p.price!=null)?.price??999;
        return pa-pb;
      });
      return { provider:prov, memberships:ms };
    });
  },[activeMemberships,perks]);

  const [addOpen,setAddOpen]=useState(false);
  const unusedList=useMemo(()=>{
    const tp=tierPrices||{};
    const cat=buildMembershipCatalog(allPerks||[],tp);
    const added={}; (rawMemberships||[]).forEach(m=>{(added[`${m.provider}|${m.membership}`]=added[`${m.provider}|${m.membership}`]||new Set()).add(m.tier);});
    return cat.map(c=>{
      const a=added[`${c.provider}|${c.membership}`];
      if(!a||a.size===0) return null;
      const maxSo=Math.max(...[...a].map(t=>tp[`${c.provider}|${t}`]?.sort_order??0));
      const unused=c.tiers.filter(t=>(t.sort_order??0)>maxSo);
      return unused.length?{...c,unusedTiers:unused}:null;
    }).filter(Boolean);
  },[allPerks,tierPrices,rawMemberships]);

  const fullCatalog=useMemo(()=>buildMembershipCatalog(allPerks||[],tierPrices||{}),[allPerks,tierPrices]);
  const heldKeys=useMemo(()=>new Set((rawMemberships||[]).map(m=>`${m.provider}|${m.membership}`)),[rawMemberships]);
  async function handleAdd(provider,membership,tier){ try{ await onAddMembership?.(provider,membership,tier); } finally { setAddOpen(false); } }

  const handlePic=e=>{const f=e.target.files?.[0];if(f){const r=new FileReader();r.onload=ev=>setProfilePic(ev.target.result);r.readAsDataURL(f);}};

  const statTile=(value,label,accent)=>(
    <div style={{padding:"12px 6px",borderRadius:12,textAlign:"center",background:T.surface,border:`1px solid ${T.border}`}}>
      <div style={{fontSize:22,fontWeight:800,color:accent,fontFamily:"'Outfit',sans-serif"}}>{value}</div>
      <div style={{fontSize:9.5,color:T.muted,fontWeight:600,fontFamily:"'Work Sans',sans-serif",marginTop:2,lineHeight:1.25}}>{label}</div>
    </div>
  );
  const renderList=(list)=>list.length>0
    ? <div style={{display:"flex",flexDirection:"column",gap:5}}>{list.map(p=><PerkTile key={p.perk_id} perk={p} onToggle={onToggle} onDismiss={onDismiss} selected={selectedPerk} onSelect={setSelectedPerk}/>)}</div>
    : <p style={{fontSize:11,color:T.muted,fontStyle:"italic",fontFamily:"'Work Sans',sans-serif"}}>None.</p>;

  return(<div onClick={()=>setSelectedPerk(null)}>
    <h1 style={{fontSize:22,fontWeight:800,color:T.textPrimary,margin:0,fontFamily:"'Outfit',sans-serif"}}>Profile</h1>
    <TabDesc>Your value at a glance, and the perks behind it.</TabDesc>

    {/* Identity */}
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",padding:"20px 16px 18px",marginBottom:14,background:T.surface,borderRadius:14,border:`1px solid ${T.border}`,boxShadow:T.shadow}}>
      <div onClick={()=>fileRef.current?.click()} style={{width:64,height:64,borderRadius:32,cursor:"pointer",background:profilePic?`url(${profilePic}) center/cover`:`linear-gradient(135deg,${T.accent},${T.primary})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:profilePic?0:24,fontWeight:900,color:"#fff",border:"3px solid #fff",boxShadow:"0 4px 14px rgba(43,42,40,0.16)",position:"relative",overflow:"hidden"}}>
        {!profilePic&&user.name.split(" ").map(n=>n[0]).join("")}
        <div style={{position:"absolute",bottom:0,left:0,right:0,height:20,background:"rgba(0,0,0,0.45)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,color:"#fff",fontWeight:600}}>Edit</div>
      </div>
      <input ref={fileRef} type="file" accept="image/*" onChange={handlePic} style={{display:"none"}}/>
      <h2 style={{fontSize:16,fontWeight:800,color:T.textPrimary,margin:"10px 0 1px",fontFamily:"'Outfit',sans-serif"}}>{user.name}</h2>
      <p style={{fontSize:12,color:T.textSecondary,margin:"0 0 12px",fontFamily:"'Work Sans',sans-serif"}}>{user.email}</p>
      <button onClick={onLogout} style={{padding:"7px 22px",borderRadius:10,border:`1.5px solid ${T.border}`,background:T.bg,color:T.textSecondary,fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"'Work Sans',sans-serif"}}>Log Out</button>
    </div>

    {/* Dashboard stats */}
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
      {statTile(activePlans,"Active plans","#2B2A6E")}
      {statTile(`£${totalMonthlyCost.toFixed(0)}`,"Monthly cost","#2B2A6E")}
      {statTile(totalAvailable,"Available perks, discounts, comps","#B07C1A")}
      {statTile(totalActive,"Claimed perks, discounts, comps","#2B2A6E")}
    </div>
    <div style={{marginBottom:14}}>{statTile(activeFeatures,"Active features","#B07C1A")}</div>

    {/* Monthly cost breakdown */}
    <div style={{marginBottom:14,background:T.surface,borderRadius:12,border:`1px solid ${T.border}`,boxShadow:T.shadow,overflow:"hidden"}}>
      <div onClick={()=>setCostOpen(!costOpen)} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 14px",cursor:"pointer"}}>
        <div style={{fontSize:13,fontWeight:700,color:T.textPrimary,fontFamily:"'Work Sans',sans-serif"}}>Monthly cost breakdown</div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:18,fontWeight:800,color:T.primary,fontFamily:"'Outfit',sans-serif"}}>{totalMonthlyCost===0?"Free":`£${totalMonthlyCost.toFixed(2)}`}</span>
          <span style={{fontSize:14,color:T.muted,transform:costOpen?"rotate(180deg)":"rotate(0deg)",display:"inline-block",transition:"transform 0.2s"}}>▾</span>
        </div>
      </div>
      {costOpen&&(
        <div style={{borderTop:`1px solid ${T.border}`,padding:"10px 14px"}}>
          {costBreakdown.length===0&&<p style={{fontSize:11,color:T.muted,fontFamily:"'Work Sans',sans-serif",margin:0}}>No active memberships.</p>}
          {costBreakdown.map((item,i)=>(
            <div key={`${item.provider}-${item.tier}`} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 0",borderBottom:i<costBreakdown.length-1?`1px solid ${T.border}`:"none"}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <AppBrandLogo provider={item.provider} size={22}/>
                <div><div style={{fontSize:12,fontWeight:700,color:T.textPrimary,fontFamily:"'Work Sans',sans-serif"}}>{item.provider}</div><div style={{fontSize:10,color:T.textSecondary,fontWeight:600,fontFamily:"'Work Sans',sans-serif"}}>{item.tier}</div></div>
              </div>
              <span style={{fontSize:13,fontWeight:700,color:item.price===0?"#B07C1A":T.textPrimary,fontFamily:"'Work Sans',sans-serif"}}>{item.price===0?"Free":`£${item.price.toFixed(2)}/mo`}</span>
            </div>
          ))}
        </div>
      )}
    </div>

    {/* Active Memberships */}
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8}}>
      <SectionHeader count={activeMemberships.length}>Active Memberships</SectionHeader>
      <button onClick={e=>{e.stopPropagation();setAddOpen(true);}} style={{display:"inline-flex",alignItems:"center",gap:5,fontSize:11,fontWeight:700,color:"#fff",background:T.primary,border:"none",borderRadius:10,padding:"8px 12px",cursor:"pointer",fontFamily:"'Work Sans',sans-serif",flexShrink:0}}>+ Add Membership</button>
    </div>
    {providerGroups.map(pg=>{
      const pCfg=PROVIDERS[pg.provider]||{color:T.muted,bg:"#f1f5f9"};
      return(
        <CollapsibleSection key={pg.provider} title={`${pg.provider} · ${pg.memberships[pg.memberships.length-1].tier}`} badge={<AppBrandLogo provider={pg.provider} size={28}/>} headerBg={pCfg.bg} headerBorder={`${pCfg.color}33`} defaultOpen={false}>
          {pg.memberships.map(m=>{
            const tierPerks=perks.filter(p=>p.provider===m.provider&&p.tier===m.tier).sort(featureThenAlpha);
            const tierPrice=tierPerks.find(p=>p.price!=null)?.price;
            const priceLabel=tierPrice!=null?(tierPrice===0?"Free":`£${tierPrice}/mo`):"";
            const cnt=tierPerks.filter(p=>!p.dismissed); const mUsed=cnt.filter(p=>p.used).length;
            return(
              <CollapsibleSection key={`${m.provider}|${m.tier}`} title={<>{m.tier}{priceLabel&&<span style={{marginLeft:6,fontSize:10,color:T.textSecondary,fontWeight:600}}>({priceLabel})</span>}</>} subtitle={`Used ${mUsed} / Total ${cnt.length}`} headerBg="transparent" headerBorder={T.border} defaultOpen={false}
                headerExtra={<button onClick={e=>{e.stopPropagation();onRemoveMembership(m.provider,m.tier);}} style={{padding:"4px 9px",borderRadius:8,border:"1.5px solid #E4DDCB",background:T.bg,color:"#B4452F",fontSize:10,fontWeight:700,cursor:"pointer",fontFamily:"'Work Sans',sans-serif"}}>Remove</button>}>
                {renderList(tierPerks)}
              </CollapsibleSection>
            );
          })}
        </CollapsibleSection>
      );
    })}
    {activeMemberships.length===0&&<p style={{textAlign:"center",color:T.muted,margin:"8px 0 14px",fontSize:13,fontFamily:"'Work Sans',sans-serif"}}>No active memberships.</p>}

    {/* Unused Tiers */}
    <SectionHeader count={unusedList.length}>Unused Tiers</SectionHeader>
    {unusedList.length===0
      ? <p style={{textAlign:"center",color:T.muted,margin:"4px 0 14px",fontSize:13,fontFamily:"'Work Sans',sans-serif"}}>No upgrades available.</p>
      : unusedList.map(c=>{
          const key=`${c.provider}|${c.membership}`; const sel=pick[key]||c.unusedTiers[0].tier;
          return(
            <div key={key} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderRadius:12,background:T.surface,border:`1px solid ${T.border}`,boxShadow:T.shadow,marginBottom:8}}>
              <AppBrandLogo provider={c.provider} size={28}/>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:13,fontWeight:700,color:T.textPrimary,fontFamily:"'Work Sans',sans-serif",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{c.provider}</div>
                <div style={{fontSize:10,color:T.textSecondary,fontFamily:"'Work Sans',sans-serif"}}>{c.membership}</div>
              </div>
              <select value={sel} onClick={e=>e.stopPropagation()} onChange={e=>setPick(prev=>({...prev,[key]:e.target.value}))} style={{fontSize:11,fontWeight:600,color:T.textPrimary,background:T.bg,border:`1px solid ${T.border}`,borderRadius:8,padding:"6px 8px",fontFamily:"'Work Sans',sans-serif",maxWidth:130}}>
                {c.unusedTiers.map(t=><option key={t.tier} value={t.tier}>{t.tier} · {t.price_label}</option>)}
              </select>
              <button onClick={e=>{e.stopPropagation();onAddMembership&&onAddMembership(c.provider,c.membership,sel);}} style={{fontSize:11,fontWeight:700,color:"#fff",background:T.primary,border:"none",borderRadius:8,padding:"7px 12px",cursor:"pointer",fontFamily:"'Work Sans',sans-serif",flexShrink:0}}>Add</button>
            </div>
          );
        })}

    {/* Search */}
    <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search your perks, features, memberships, tiers..." style={{width:"100%",padding:"10px 14px",borderRadius:10,border:`1.5px solid ${T.border}`,background:T.surface,fontSize:13,fontFamily:"'Work Sans',sans-serif",color:T.textPrimary,margin:"16px 0 12px",boxSizing:"border-box",outline:"none"}}/>

    {/* Active / Inactive split — collapsed by default; auto-expand on search */}
    <SectionHeader>Active</SectionHeader>
    {TYPE_ROWS.map(([t,at])=>{const list=activeOf(t); if(q&&list.length===0)return null; return(
      <CollapsibleSection key={`a-${t}-${q?1:0}`} title={at} count={list.length} defaultOpen={!!q}>{renderList(list)}</CollapsibleSection>
    );})}
    <SectionHeader>Inactive</SectionHeader>
    {TYPE_ROWS.map(([t,at,it])=>{const list=inactiveOf(t); if(q&&list.length===0)return null; return(
      <CollapsibleSection key={`i-${t}-${q?1:0}`} title={it} count={list.length} defaultOpen={!!q}>{renderList(list)}</CollapsibleSection>
    );})}

    {addOpen&&<AppAddMembershipModal catalog={fullCatalog} heldKeys={heldKeys} onAdd={handleAdd} onClose={()=>setAddOpen(false)}/>}
  </div>);
}

function AppAddMembershipModal({catalog,heldKeys,onAdd,onClose}){
  const[step,setStep]=useState(1);
  const[q,setQ]=useState("");
  const[sel,setSel]=useState(null);
  const[busy,setBusy]=useState(false);
  const ql=q.trim().toLowerCase();
  const list=[...catalog].sort((a,b)=>(a.provider||"").localeCompare(b.provider)||(a.membership||"").localeCompare(b.membership)).filter(c=>!ql||`${c.provider} ${c.membership}`.toLowerCase().includes(ql));
  const add=async(tier)=>{ if(busy)return; setBusy(true); try{ await onAdd(sel.provider,sel.membership,tier); }finally{ setBusy(false); } };
  return(
    <div onClick={onClose} style={{position:"fixed",inset:0,zIndex:200,background:"rgba(35,32,42,0.5)",backdropFilter:"blur(2px)",display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
      <div onClick={e=>e.stopPropagation()} style={{width:"100%",maxWidth:440,maxHeight:"85vh",display:"flex",flexDirection:"column",background:T.surface,borderRadius:"20px 20px 0 0",boxShadow:"0 -12px 40px rgba(43,42,40,0.22)",padding:"12px 16px 20px",fontFamily:"'Work Sans',sans-serif",animation:"perkiSheetUp 0.26s cubic-bezier(.4,0,.2,1)",boxSizing:"border-box"}}>
        <style>{`@keyframes perkiSheetUp{from{transform:translateY(100%)}to{transform:translateY(0)}}`}</style>
        <div style={{width:38,height:4,borderRadius:2,background:T.border,margin:"0 auto 12px",flexShrink:0}}/>
        {step===1?(<>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
            <div style={{fontSize:16,fontWeight:800,color:T.textPrimary,fontFamily:"'Outfit',sans-serif"}}>Add membership</div>
            <button onClick={onClose} style={{width:30,height:30,borderRadius:15,border:`1px solid ${T.border}`,background:T.bg,color:T.muted,fontSize:15,fontWeight:700,cursor:"pointer"}}>✕</button>
          </div>
          <input autoFocus value={q} onChange={e=>setQ(e.target.value)} placeholder="Search memberships..." style={{width:"100%",padding:"10px 14px",borderRadius:10,border:`1.5px solid ${T.border}`,background:T.bg,fontSize:13,fontFamily:"'Work Sans',sans-serif",color:T.textPrimary,boxSizing:"border-box",outline:"none",marginBottom:10}}/>
          <div style={{overflowY:"auto",display:"flex",flexDirection:"column",gap:6}}>
            {list.length===0?<p style={{textAlign:"center",color:T.muted,fontSize:12,padding:"16px 0"}}>No memberships match.</p>:
              list.map(c=>{const held=heldKeys.has(`${c.provider}|${c.membership}`);return(
                <button key={`${c.provider}|${c.membership}`} onClick={()=>{setSel(c);setStep(2);}} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderRadius:12,background:T.bg,border:`1px solid ${T.border}`,cursor:"pointer",textAlign:"left",width:"100%"}}>
                  <AppBrandLogo provider={c.provider} size={28}/>
                  <span style={{flex:1,minWidth:0}}>
                    <span style={{display:"block",fontSize:13,fontWeight:700,color:T.textPrimary,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{c.membership}</span>
                    {c.membership!==c.provider&&<span style={{display:"block",fontSize:10,color:T.textSecondary}}>{c.provider}</span>}
                  </span>
                  {held&&<span style={{fontSize:9,fontWeight:700,color:"#B07C1A",background:"#F7ECD4",borderRadius:10,padding:"2px 7px",flexShrink:0}}>Added</span>}
                </button>
              );})}
          </div>
        </>):(<>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
            <button onClick={()=>setStep(1)} style={{width:30,height:30,borderRadius:15,border:`1px solid ${T.border}`,background:T.bg,color:T.muted,fontSize:18,fontWeight:700,cursor:"pointer",lineHeight:1}}>‹</button>
            <div style={{minWidth:0}}>
              <div style={{fontSize:15,fontWeight:800,color:T.textPrimary,fontFamily:"'Outfit',sans-serif",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{sel.membership}</div>
              <div style={{fontSize:11,color:T.muted}}>Choose a tier</div>
            </div>
          </div>
          <div style={{overflowY:"auto",display:"flex",flexDirection:"column",gap:6}}>
            {sel.tiers.map(t=>(
              <button key={t.tier} disabled={busy} onClick={()=>add(t.tier)} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 14px",borderRadius:12,background:T.bg,border:`1px solid ${T.border}`,cursor:"pointer",width:"100%",opacity:busy?0.6:1}}>
                <span style={{fontSize:13,fontWeight:700,color:T.textPrimary}}>{t.tier}</span>
                <span style={{fontSize:12,fontWeight:700,color:"#B07C1A"}}>{t.price_label}</span>
              </button>
            ))}
            <button disabled={busy} onClick={()=>add("")} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 14px",borderRadius:12,background:T.surface,border:`1.5px dashed ${T.border}`,cursor:"pointer",width:"100%",opacity:busy?0.6:1}}>
              <span style={{fontSize:13,fontWeight:700,color:T.textSecondary}}>No tier</span>
              <span style={{fontSize:10,color:T.muted}}>Add without a tier</span>
            </button>
          </div>
        </>)}
      </div>
    </div>
  );
}
