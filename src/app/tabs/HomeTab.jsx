import React, { useState, useMemo } from "react";
import { T, CATEGORIES, alphaSort, groupByClosingDate, isHigherTier } from "../theme";
import { SectionHeader, TabDesc, PerkSquareTile, HowToUseModal } from "../components";

export default function HomeTab({perks,onToggle,onDismiss,tierPrices,allPerks}){
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
  const useClosingDate=subTab==="competitions"||subTab==="discounts";
  const groups=useMemo(()=>{
    if(useClosingDate)return groupByClosingDate(displayPerks);
    if(groupBy==="category"){const g={};displayPerks.forEach(p=>{const cat=CATEGORIES[p.category];if(!cat)return;(g[cat.label]=g[cat.label]||[]).push(p);});return g;}
    const g={Weekly:[],Monthly:[],Annually:[],"Always On":[]};displayPerks.forEach(p=>{g[{WEEKLY:"Weekly",MONTHLY:"Monthly",ANNUALLY:"Annually",YEARLY:"Annually",NONE:"Always On"}[p.reset_period]||"Always On"].push(p);});return g;
  },[displayPerks,groupBy,useClosingDate]);

  return(
    <div onClick={()=>setSelected(null)}>
      {showHelp&&<HowToUseModal onClose={()=>setShowHelp(false)}/>}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:2}}>
        <h1 style={{fontSize:22,fontWeight:800,color:T.textPrimary,margin:0,fontFamily:"'Outfit',sans-serif"}}>Your Perks</h1>
        <button onClick={e=>{e.stopPropagation();setShowHelp(true);}} style={{padding:"6px 12px",borderRadius:10,border:`1.5px solid ${T.border}`,background:T.surface,color:T.textSecondary,fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"'Work Sans',sans-serif",boxShadow:T.shadow}}>📖 How to use</button>
      </div>
      <TabDesc>Tap any perk to see details, mark it as used, or exclude it from your count.</TabDesc>

      {/* Perks / Features / Competitions / Discounts sub-tabs */}
      <div style={{display:"flex",gap:0,marginBottom:10,borderRadius:10,overflow:"hidden",border:`1.5px solid ${T.border}`}}>
        {[{id:"features",label:"Features",count:features.length},{id:"perks",label:"Perks",count:regularPerks.length},{id:"discounts",label:"Discounts",count:discounts.length},{id:"competitions",label:"Competitions",count:competitions.length}].map(t=>(
          <button key={t.id} onClick={()=>{setSubTab(t.id);setSelected(null);}} style={{flex:1,padding:"8px 0",border:"none",background:subTab===t.id?"#F7ECD4":T.surface,color:subTab===t.id?T.accent:T.textSecondary,fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"'Work Sans',sans-serif",display:"flex",alignItems:"center",justifyContent:"center",gap:4}}>
            {t.label}
            <span style={{fontSize:9,fontWeight:700,background:subTab===t.id?`${T.accent}22`:T.bg,color:subTab===t.id?T.accent:T.muted,padding:"1px 6px",borderRadius:8}}>{t.count}</span>
          </button>
        ))}
      </div>

      <p style={{fontSize:12,color:T.textSecondary,margin:"0 0 10px",fontFamily:"'Work Sans',sans-serif",fontWeight:600}}>Used {used} / Total {countable.length}{displayPerks.length!==countable.length&&<span style={{color:T.muted}}> ({displayPerks.length-countable.length} excluded)</span>}</p>
      {!useClosingDate&&<div style={{display:"flex",gap:8,marginBottom:12}}>
        {["reset","category"].map(g=>(<button key={g} onClick={()=>setGroupBy(g)} style={{padding:"6px 14px",borderRadius:20,border:`1.5px solid ${groupBy===g?T.accent:T.border}`,background:groupBy===g?"#F7ECD4":T.surface,color:groupBy===g?T.accent:T.textSecondary,fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"'Work Sans',sans-serif"}}>{g==="reset"?"By Reset":"By Category"}</button>))}
      </div>}
      {Object.entries(groups).map(([name,items])=>items.length>0&&(
        <div key={name}>
          <SectionHeader count={items.length}>{name}</SectionHeader>
          <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:6}}>
            {items.map(p=><PerkSquareTile key={p.perk_id} perk={p} onToggle={onToggle} onDismiss={onDismiss} selected={selected} onSelect={setSelected}/>)}
          </div>
        </div>
      ))}
      {displayPerks.length===0&&<p style={{textAlign:"center",color:T.muted,marginTop:30,fontSize:13,fontFamily:"'Work Sans',sans-serif"}}>{subTab==="features"?"No features found across your memberships.":subTab==="competitions"?"No competitions found across your memberships.":subTab==="discounts"?"No discounts found across your memberships.":"No perks to show."}</p>}
    </div>
  );
}

