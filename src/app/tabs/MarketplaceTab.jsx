import React, { useState, useMemo, useEffect } from "react";
import { T, CATEGORIES, buildMembershipCatalog } from "../theme";
import { TabDesc, PotentialPerkTile } from "../components";

const byTitle = (a, b) => (a.title || "").localeCompare(b.title || "");
const matches = (p, query) => {
  const q = (query || "").trim().toLowerCase();
  return !q || [p.title, p.description, p.provider, p.tier, p.category].some(v => (v || "").toLowerCase().includes(q));
};
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

  /* When searching, only show chips that still have a matching result. */
  const membershipChips=useMemo(()=>catalog.filter(c=>allPerks.some(p=>p.provider===c.provider&&p.membership===c.membership&&matches(p,query))),[catalog,allPerks,query]);
  const tierChips=useMemo(()=>{const seen={};baseRows.filter(p=>matches(p,query)).forEach(p=>{const k=`${p.provider}|${p.tier}`;const so=tp[k]?.sort_order??0;if(!(p.tier in seen)||so<seen[p.tier].so)seen[p.tier]={so,label:tp[k]?.price_label};});return Object.keys(seen).sort((a,b)=>seen[a].so-seen[b].so).map(t=>({tier:t,label:seen[t].label}));},[baseRows,tp,query]);
  const catChips=useMemo(()=>[...new Set(baseRows.filter(p=>matches(p,query)).map(p=>p.category).filter(Boolean))].sort(),[baseRows,query]);

  useEffect(()=>{if(membership&&!membershipChips.some(c=>`${c.provider}|${c.membership}`===membership))setMembership(null);},[membershipChips,membership]);
  useEffect(()=>{if(tier&&!tierChips.some(t=>t.tier===tier))setTier(null);},[tierChips,tier]);
  useEffect(()=>{if(category&&!catChips.includes(category))setCategory(null);},[catChips,category]);

  const visible=useMemo(()=>{
    let rows=baseRows;
    if(tier)rows=rows.filter(p=>p.tier===tier);
    if(category)rows=rows.filter(p=>p.category===category);
    if(!tier)rows=dedupeCheapest(rows,tp);
    if(query.trim())rows=rows.filter(p=>matches(p,query));
    return [...rows].sort(byTitle);
  },[baseRows,tier,category,query,tp]);

  const chip=(on)=>({whiteSpace:"nowrap",borderRadius:20,padding:"8px 14px",fontSize:12,fontWeight:600,cursor:"pointer",border:`1px solid ${on?T.primary:T.border}`,background:on?T.primary:T.surface,color:on?"#fff":T.textSecondary,flexShrink:0,fontFamily:"'Work Sans',sans-serif"});

  return(<div onClick={()=>setSelected(null)}>
    <h1 style={{fontSize:22,fontWeight:800,color:T.textPrimary,margin:0,fontFamily:"'Outfit',sans-serif"}}>Marketplace</h1>
    <TabDesc>Every perk across every provider, shown once at the cheapest tier it appears in.</TabDesc>

    <div style={{display:"flex",gap:8,overflowX:"auto",paddingBottom:8,marginBottom:6}}>
      <button onClick={e=>{e.stopPropagation();setMembership(null);setTier(null);setCategory(null);}} style={chip(membership==null)}>All</button>
      {membershipChips.map(c=>{const key=`${c.provider}|${c.membership}`;return <button key={key} onClick={e=>{e.stopPropagation();setMembership(key);setTier(null);setCategory(null);}} style={chip(membership===key)}>{c.provider}</button>;})}
    </div>

    <div style={{display:"flex",gap:8,overflowX:"auto",paddingBottom:8,marginBottom:6}}>
      <button onClick={e=>{e.stopPropagation();setTier(null);}} style={chip(tier==null)}>All tiers</button>
      {tierChips.map(t=><button key={t.tier} onClick={e=>{e.stopPropagation();setTier(t.tier);}} style={chip(tier===t.tier)}>{t.tier}{t.label?` · ${t.label}`:""}</button>)}
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
