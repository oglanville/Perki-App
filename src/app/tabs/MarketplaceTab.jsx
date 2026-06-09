import React, { useState, useMemo } from "react";
import { T, featureThenAlpha, buildMembershipCatalog, dedupeAcrossTiers } from "../theme";
import { TabDesc, PotentialPerkTile } from "../components";

export default function MarketplaceTab({allPerks,tierPrices}){
  const[membership,setMembership]=useState(null);
  const[tier,setTier]=useState(null);
  const[query,setQuery]=useState("");
  const[selected,setSelected]=useState(null);
  const tp=tierPrices||{};

  const catalog=useMemo(()=>buildMembershipCatalog(allPerks,tp),[allPerks,tp]);
  const selectedCat=useMemo(()=>catalog.find(c=>`${c.provider}|${c.membership}`===membership)||null,[catalog,membership]);

  const visible=useMemo(()=>{
    let rows=allPerks;
    if(selectedCat)rows=rows.filter(p=>p.provider===selectedCat.provider&&p.membership===selectedCat.membership);
    if(tier)rows=rows.filter(p=>p.tier===tier);
    else rows=dedupeAcrossTiers(rows,tp);
    if(query.trim()){const q=query.toLowerCase();rows=rows.filter(p=>[p.title,p.description,p.provider,p.tier,p.category].some(v=>(v||"").toLowerCase().includes(q)));}
    return [...rows].sort(featureThenAlpha);
  },[allPerks,selectedCat,tier,query,tp]);

  const chip=(on)=>({whiteSpace:"nowrap",borderRadius:20,padding:"8px 14px",fontSize:12,fontWeight:600,cursor:"pointer",border:`1px solid ${on?T.primary:T.border}`,background:on?T.primary:T.surface,color:on?"#fff":T.textSecondary,flexShrink:0,fontFamily:"'Work Sans',sans-serif"});

  return(<div onClick={()=>setSelected(null)}>
    <h1 style={{fontSize:22,fontWeight:800,color:T.textPrimary,margin:0,fontFamily:"'Outfit',sans-serif"}}>Marketplace</h1>
    <TabDesc>Every perk across every provider. Tap one to see the cheapest tier it lives in.</TabDesc>

    <div style={{display:"flex",gap:8,overflowX:"auto",paddingBottom:8,marginBottom:8}}>
      <button onClick={e=>{e.stopPropagation();setMembership(null);setTier(null);}} style={chip(membership==null)}>All</button>
      {catalog.map(c=>{const key=`${c.provider}|${c.membership}`;return(
        <button key={key} onClick={e=>{e.stopPropagation();setMembership(key);setTier(null);}} style={chip(membership===key)}>{c.provider}</button>
      );})}
    </div>

    {selectedCat&&(
      <div style={{display:"flex",gap:8,overflowX:"auto",paddingBottom:8,marginBottom:8}}>
        <button onClick={e=>{e.stopPropagation();setTier(null);}} style={chip(tier==null)}>All tiers</button>
        {selectedCat.tiers.map(t=>(
          <button key={t.tier} onClick={e=>{e.stopPropagation();setTier(t.tier);}} style={chip(tier===t.tier)}>{t.tier} · {t.price_label}</button>
        ))}
      </div>
    )}

    <input value={query} onChange={e=>setQuery(e.target.value)} onClick={e=>e.stopPropagation()} placeholder="Search perks, providers, tiers..." style={{width:"100%",padding:"10px 14px",borderRadius:10,border:`1.5px solid ${T.border}`,background:T.surface,fontSize:13,fontFamily:"'Work Sans',sans-serif",color:T.textPrimary,margin:"2px 0 12px",boxSizing:"border-box",outline:"none"}}/>

    {visible.length>0
      ? <div style={{display:"flex",flexDirection:"column",gap:6}}>{visible.map(p=><PotentialPerkTile key={p.perk_id} perk={p} selected={selected} onSelect={setSelected} scope={allPerks} tierMap={tp}/>)}</div>
      : <p style={{textAlign:"center",color:T.muted,marginTop:24,fontSize:13,fontFamily:"'Work Sans',sans-serif"}}>No perks match.</p>}
  </div>);
}
