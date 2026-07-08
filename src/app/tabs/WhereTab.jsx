import React, { useState, useMemo } from "react";
import { T, CATEGORIES, BUNDLES, alphaSort, featureThenAlpha, cadenceLabel, isHigherTier } from "../theme";
import { PerkBrandIcon, ProviderOverlay, TabDesc, SectionHeader, PerkSheet, AppBrandLogo, FeatureChip } from "../components";

/* Compact item row used inside expanded bundle and category panels.
   Keeps the type tag, cadence chip and status control (via PerkSheet). */
function PanelItemRow({p,isOpen,onOpen,onToggle,onDismiss}){
  return(
    <div>
      <div onClick={e=>{e.stopPropagation();onOpen(isOpen?null:p.perk_id);}} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",borderRadius:10,background:p.used||p.dismissed?"rgba(255,255,255,0.05)":"rgba(255,255,255,0.08)",cursor:"pointer",opacity:p.used||p.dismissed?0.5:1,border:`1px solid ${isOpen?T.accent:"rgba(255,255,255,0.1)"}`}}>
        <div style={{position:"relative",flexShrink:0}}><PerkBrandIcon perk={p} size={28}/><ProviderOverlay provider={p.provider} size={12}/></div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:12,fontWeight:700,color:"#F1F5F9",fontFamily:"'Work Sans',sans-serif",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{p.title}</div>
          <div style={{fontSize:10,color:"#94A3B8",fontFamily:"'Work Sans',sans-serif"}}>{p.membership} — {p.tier}</div>
        </div>
        <FeatureChip feature={p.feature}/>
        <span style={{fontSize:9,fontWeight:600,color:"#CBD5E1",background:"rgba(255,255,255,0.1)",border:"1px solid rgba(255,255,255,0.15)",padding:"2px 7px",borderRadius:10,flexShrink:0,fontFamily:"'Work Sans',sans-serif"}}>{cadenceLabel(p.reset_period)}</span>
        {p.dismissed&&<span style={{fontSize:9,color:"#F87171"}}>✗</span>}
        {p.used&&!p.dismissed&&<span style={{fontSize:9,color:"#E0A93B"}}>✓</span>}
      </div>
      {isOpen&&<PerkSheet perk={p} mode="owned" onToggle={onToggle} onDismiss={onDismiss} onClose={()=>onOpen(null)}/>}
    </div>
  );
}

/* Expandable group card: shared shell for bundles and categories. */
function GroupCard({icon,label,sub,providers,isSel,onHeaderClick,children}){
  return(
    <div>
      <div onClick={onHeaderClick} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",borderRadius:12,cursor:"pointer",background:isSel?"#2B2A6E":T.surface,border:`1.5px solid ${isSel?"#2B2A6E":T.border}`,boxShadow:isSel?"none":T.shadow,color:isSel?"#fff":T.textPrimary}}>
        <span style={{fontSize:24}}>{icon}</span>
        <div style={{flex:1}}>
          <div style={{fontSize:13,fontWeight:700,fontFamily:"'Work Sans',sans-serif"}}>{label}</div>
          <div style={{fontSize:11,color:isSel?"#94A3B8":T.textSecondary,fontFamily:"'Work Sans',sans-serif"}}>{sub}</div>
        </div>
        <div style={{display:"flex",gap:3}}>{providers.map(prov=><AppBrandLogo key={prov} provider={prov} size={20}/>)}</div>
        <span style={{fontSize:14,color:isSel?"#94A3B8":T.muted,transform:isSel?"rotate(180deg)":"rotate(0)",display:"inline-block"}}>▾</span>
      </div>
      {isSel&&(<div style={{margin:"6px 0",padding:"10px 12px",borderRadius:12,background:"#2B2A6E"}}><div style={{display:"flex",flexDirection:"column",gap:6}}>{children}</div></div>)}
    </div>
  );
}

export default function WhereTab({perks,onToggle,onDismiss,tierPrices}){
  const[sel,setSel]=useState(null);const[selBundle,setSelBundle]=useState(null);const[sp,setSp]=useState(null);
  /* Dedup: for each provider, keep only highest-tier version of each titlegroup */
  const dedupedPerks=useMemo(()=>{
    const byKey={};
    perks.forEach(p=>{
      const key=`${p.provider}|${p.titlegroup||p.title}`;
      if(!byKey[key]){byKey[key]=p;return;}
      if(isHigherTier(p,byKey[key],tierPrices))byKey[key]=p;
    });
    return Object.values(byKey);
  },[perks,tierPrices]);
  /* Bundles: use-case moments assembled from held items by category.
     Only non-empty bundles render; an item may sit in more than one bundle. */
  const bundleGroups=useMemo(()=>BUNDLES.map(b=>{
    const items=dedupedPerks.filter(p=>b.categories.includes(p.category)).sort(featureThenAlpha);
    return {...b,items,providers:[...new Set(items.map(p=>p.provider))]};
  }).filter(b=>b.items.length>0),[dedupedPerks]);
  const catGroups=useMemo(()=>{const g={};dedupedPerks.forEach(p=>{const c=p.category;if(!c||!CATEGORIES[c])return;if(!g[c])g[c]={perks:[],providers:new Set()};g[c].perks.push(p);g[c].providers.add(p.provider);});return g;},[dedupedPerks]);
  return(
    <div onClick={()=>setSp(null)}>
      <h1 style={{fontSize:22,fontWeight:800,color:T.textPrimary,margin:0,fontFamily:"'Outfit',sans-serif"}}>Where to Use</h1>
      <TabDesc>Your perks grouped by moment and by category. Tap to expand.</TabDesc>
      {bundleGroups.length>0&&(<>
        <SectionHeader count={bundleGroups.length}>Bundles</SectionHeader>
        <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:4}}>
          {bundleGroups.map(b=>(
            <GroupCard key={b.key} icon={b.icon} label={b.name} sub={`${b.items.length} ${b.items.length===1?"item":"items"} across ${b.providers.length} ${b.providers.length===1?"provider":"providers"}`} providers={b.providers} isSel={selBundle===b.key} onHeaderClick={()=>{setSelBundle(selBundle===b.key?null:b.key);setSp(null);}}>
              {b.items.map(p=><PanelItemRow key={p.perk_id} p={p} isOpen={sp===p.perk_id} onOpen={setSp} onToggle={onToggle} onDismiss={onDismiss}/>)}
            </GroupCard>
          ))}
        </div>
      </>)}
      <SectionHeader count={Object.keys(catGroups).length}>By category</SectionHeader>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {Object.entries(catGroups).map(([cat,data])=>{
          const info=CATEGORIES[cat];if(!info)return null;
          return(
            <GroupCard key={cat} icon={info.icon} label={info.label} sub={`${data.perks.length} perks`} providers={[...data.providers]} isSel={sel===cat} onHeaderClick={()=>{setSel(sel===cat?null:cat);setSp(null);}}>
              {data.perks.sort(alphaSort).map(p=><PanelItemRow key={p.perk_id} p={p} isOpen={sp===p.perk_id} onOpen={setSp} onToggle={onToggle} onDismiss={onDismiss}/>)}
            </GroupCard>
          );
        })}
      </div>
    </div>
  );
}
