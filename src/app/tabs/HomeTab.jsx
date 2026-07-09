import React, { useState, useMemo } from "react";
import { T, CATEGORIES, alphaSort, groupByClosingDate, isHigherTier, disp, chipStyle } from "../theme";
import { SectionHeader, TabDesc, PerkSquareTile, HowToUseModal } from "../components";

export default function HomeTab({userName,perks,onToggle,onDismiss,tierPrices,allPerks}){
  const first=(userName||"").trim().split(/\s+/)[0];
  const[selected,setSelected]=useState(null);
  const[groupBy,setGroupBy]=useState("reset");
  const[showHelp,setShowHelp]=useState(false);
  const[subTab,setSubTab]=useState("perks");

  /* Dedup: for each provider, if same titlegroup exists in multiple tiers, keep only the highest tier version */
  const dedupedPerks=useMemo(()=>{
    const byKey={};
    perks.forEach(p=>{
      const key=`${p.provider}|${p.titlegroup||p.title}`;
      if(!byKey[key]){byKey[key]=p;return;}
      if(isHigherTier(p,byKey[key],tierPrices))byKey[key]=p;
    });
    return Object.values(byKey);
  },[perks,tierPrices]);

  /* Split into features, competitions, discounts, and regular perks using the feature column */
  const features=useMemo(()=>dedupedPerks.filter(p=>p.feature==='feature').sort(alphaSort),[dedupedPerks]);
  const competitions=useMemo(()=>dedupedPerks.filter(p=>p.feature==='competition').sort(alphaSort),[dedupedPerks]);
  const discounts=useMemo(()=>dedupedPerks.filter(p=>p.feature==='discount').sort(alphaSort),[dedupedPerks]);
  const regularPerks=useMemo(()=>dedupedPerks.filter(p=>p.feature!=='feature'&&p.feature!=='competition'&&p.feature!=='discount').sort(alphaSort),[dedupedPerks]);

  const displayPerks=subTab==="features"?features:subTab==="competitions"?competitions:subTab==="discounts"?discounts:regularPerks;
  const countable=displayPerks.filter(p=>!p.dismissed);
  const used=countable.filter(p=>p.used).length;

  /* For competitions & discounts: group by closing date; for perks & features: group by reset/category */
  const useClosingDate=false; /* cadence/category only — no date-based grouping */
  const groups=useMemo(()=>{
    if(useClosingDate)return groupByClosingDate(displayPerks);
    if(groupBy==="category"){const g={};displayPerks.forEach(p=>{const cat=CATEGORIES[p.category];if(!cat)return;(g[cat.label]=g[cat.label]||[]).push(p);});return g;}
    const g={Weekly:[],Monthly:[],"One-off":[]};displayPerks.forEach(p=>{const u=(p.reset_period||"").toUpperCase();g[u==="WEEKLY"?"Weekly":u==="MONTHLY"?"Monthly":"One-off"].push(p);});return g;
  },[displayPerks,groupBy,useClosingDate]);

  return(
    <div onClick={()=>setSelected(null)}>
      {showHelp&&<HowToUseModal onClose={()=>setShowHelp(false)}/>}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:2}}>
        <h1 style={disp(28)}>{first?`Morning, ${first}.`:"Your perks."}</h1>
        <button onClick={e=>{e.stopPropagation();setShowHelp(true);}} style={{padding:"6px 12px",borderRadius:10,border:`1.5px solid ${T.border}`,background:T.surface,color:T.textSecondary,fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"'Work Sans',sans-serif",boxShadow:T.shadow}}>📖 How to use</button>
      </div>
      <TabDesc>Tap any perk to see details, mark it as used, or exclude it from your count.</TabDesc>

      {/* Perks / Features / Competitions / Discounts sub-tabs */}
      <div style={{display:"flex",gap:8,marginBottom:10,overflowX:"auto",paddingBottom:4}}>
        {[{id:"features",label:"Features",count:features.length},{id:"perks",label:"Perks",count:regularPerks.length},{id:"discounts",label:"Discounts",count:discounts.length},{id:"competitions",label:"Competitions",count:competitions.length}].map(t=>(
          <button key={t.id} onClick={()=>{setSubTab(t.id);setSelected(null);}} style={chipStyle(subTab===t.id)}>
            {t.label}
            <span style={{fontSize:9.5,fontWeight:800,background:subTab===t.id?"rgba(255,255,255,.2)":"#F7ECD4",color:subTab===t.id?"#E0A93B":"#B07C1A",padding:"1px 7px",borderRadius:999}}>{t.count}</span>
          </button>
        ))}
      </div>

      <p style={{fontSize:12,color:T.textSecondary,margin:"0 0 10px",fontFamily:"'Work Sans',sans-serif",fontWeight:600}}>Used {used} / Total {countable.length}{displayPerks.length!==countable.length&&<span style={{color:T.muted}}> ({displayPerks.length-countable.length} excluded)</span>}</p>
      {!useClosingDate&&<div style={{display:"flex",gap:8,marginBottom:12}}>
        {["reset","category"].map(g=>(<button key={g} onClick={()=>setGroupBy(g)} style={chipStyle(groupBy===g)}>{g==="reset"?"By cadence":"By category"}</button>))}
      </div>}
      {Object.entries(groups).map(([name,items])=>items.length>0&&(
        <div key={name}>
          <SectionHeader count={items.length}>{name}</SectionHeader>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8}}>
            {items.map(p=><PerkSquareTile key={p.perk_id} perk={p} onToggle={onToggle} onDismiss={onDismiss} selected={selected} onSelect={setSelected}/>)}
          </div>
        </div>
      ))}
      {displayPerks.length===0&&<p style={{textAlign:"center",color:T.muted,marginTop:30,fontSize:13,fontFamily:"'Work Sans',sans-serif"}}>{subTab==="features"?"No features found across your memberships.":subTab==="competitions"?"No competitions found across your memberships.":subTab==="discounts"?"No discounts found across your memberships.":"No perks to show."}</p>}
    </div>
  );
}

