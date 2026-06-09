import React, { useState, useMemo } from "react";
import { T, CATEGORIES, buildMembershipCatalog } from "../theme";
import { TabDesc, PotentialPerkTile } from "../components";

const byTitle = (a, b) => (a.title || "").localeCompare(b.title || "");
function dedupeCheapest(rows, tp){
  const rank = p => tp[`${p.provider}|${p.tier}`]?.sort_order ?? (Number(p.price) || 0);
  const byKey = {};
  rows.forEach(p => { const k = `${p.provider}|${(p.title||"").toLowerCase()}`; if(!byKey[k]||rank(p)<rank(byKey[k]))byKey[k]=p; });
  return Object.values(byKey);
}

export default function MarketplaceTab({allPerks,tierPrices}){
  const[membership,setMembership]=useState(null);
  const[tier,setTier]=useState(null);
  const[category,setCategory]=useState(null);
  const[query,setQuery]=useState("");
  const[selected,setSelected]=useState(null);
  const tp=tierPrices||{};

  const catalog=useMemo(()=>buildMembershipCatalog(allPerks,tp),[allPerks,tp]);
  const selCat=useMemo(()=>catalog.find(c=>`${c.provider}|${c.membership}`===membership)||null,[catalog,membership]);
  const baseRows=useMemo(()=>selCat?allPerks.filter(p=>p.provider===selCat.provider&&p.membership===selCat.membership):allPerks,[allPerks,selCat]);

  const tierChips=useMemo(()=>{const seen={};baseRows.forEach(p=>{const so=tp[`${p.provider}|${p.tier}`]?.sort_order??0;if(!(p.tier in seen)||so<seen[p.tier])seen[p.tier]=so;});return Object.keys(seen).sort((a,b)=>seen[a]-seen[b]);},[baseRows,tp]);
  const catChips=useMemo(()=>[...new Set(baseRows.map(p=>p.category).filter(Boolean))].sort(),[baseRows]);

  const visible=useMemo(()=>{
    let rows=baseRows;
    if(tier)rows=rows.filter(p=>p.tier===tier);
    if(category)rows=rows.filter(p=>p.category===category);
    if(!tier)rows=dedupeCheapest(rows,tp);
    if(query.trim()){const q=query.toLowerCase();rows=rows.filter(p=>[p.title,p.description,p.provider,p.tier,p.category].some(v=>(v||"").toLowerCase().includes(q)));}
    return [...rows].sort(byTitle);
  },[baseRows,tier,category,query,tp]);

  const chip=(on)=>({whiteSpace:"nowrap",borderRadius:20,padding:"8px 14px",fontSize:12,fontWeight:600,cursor:"pointer",border:`1px solid ${on?T.primary:T.border}`,background:on?T.primary:T.surface,color:on?"#fff":T.textSecondary,flexShrink:0,fontFamily:"'Work Sans',sans-serif"});

  return(<div onClick={()=>setSelected(null)}>
    <h1 style={{fontSize:22,fontWeight:800,color:T.textPrimary,margin:0,fontFamily:"'Outfit',sans-serif"}}>Marketplace</h1>
    <TabDesc>Every perk across every provider, shown once at the cheapest tier it appears in.</TabDesc>

    <div style={{display:"flex",gap:8,overflowX:"auto",paddingBottom:8,marginBottom:6}}>
      <button onClick={e=>{e.stopPropagation();setMembership(null);setTier(null);setCategory(null);}} style={chip(membership==null)}>All</button>
      {catalog.map(c=>{const key=`${c.provider}|${c.membership}`;return <button key={key} onClick={e=>{e.stopPropagation();setMembership(key);setTier(null);setCategory(null);}} style={chip(membership===key)}>{c.provider}</button>;})}
    </div>

    <div style={{display:"flex",gap:8,overflowX:"auto",paddingBottom:8,marginBottom:6}}>
      <button onClick={e=>{e.stopPropagation();setTier(null);}} style={chip(tier==null)}>All tiers</button>
      {tierChips.map(t=><button key={t} onClick={e=>{e.stopPropagation();setTier(t);}} style={chip(tier===t)}>{t}</button>)}
    </div>

    <div style={{display:"flex",gap:8,overflowX:"auto",paddingBottom:8,marginBottom:10}}>
      <button onClick={e=>{e.stopPropagation();setCategory(null);}} style={chip(category==null)}>All categories</button>
      {catChips.map(c=><button key={c} onClick={e=>{e.stopPropagation();setCategory(c);}} style={chip(category===c)}>{(CATEGORIES[c]||{}).icon||""} {c}</button>)}
    </div>

    <input value={query} onChange={e=>setQuery(e.target.value)} onClick={e=>e.stopPropagation()} placeholder="Search perks, providers, tiers..." style={{width:"100%",padding:"10px 14px",borderRadius:10,border:`1.5px solid ${T.border}`,background:T.surface,fontSize:13,fontFamily:"'Work Sans',sans-serif",color:T.textPrimary,margin:"2px 0 12px",boxSizing:"border-box",outline:"none"}}/>

    {visible.length>0
      ? <div style={{display:"flex",flexDirection:"column",gap:6}}>{visible.map(p=><PotentialPerkTile key={p.perk_id} perk={p} selected={selected} onSelect={setSelected} scope={allPerks} tierMap={tp}/>)}</div>
      : <p style={{textAlign:"center",color:T.muted,marginTop:24,fontSize:13,fontFamily:"'Work Sans',sans-serif"}}>No perks match.</p>}
  </div>);
}
