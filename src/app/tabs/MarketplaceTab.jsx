import React, { useState, useMemo } from "react";
import { supabase } from "../../lib/supabase";
import { SB_CONFIGURED, T, PROVIDERS, featureThenAlpha, getEffectiveTiers } from "../theme";
import { TabDesc, CollapsibleSection, AppBrandLogo, PotentialPerkTile } from "../components";

export default function MarketplaceTab({allPerks,activeMemberships,onAddMembership,userName,userId,tierPrices}){
  const[search,setSearch]=useState("");
  const[selected,setSelected]=useState(null);
  const[showReq,setShowReq]=useState(false);
  const[reqName,setReqName]=useState(userName||"");
  const[reqText,setReqText]=useState("");
  const[reqSent,setReqSent]=useState(false);
  const[openTier,setOpenTier]=useState({});

  /* Set of active provider|tier keys */
  const activeSet=useMemo(()=>{
    const s=new Set();
    activeMemberships.forEach(m=>{getEffectiveTiers(m.provider,m.tier,tierPrices).forEach(t=>s.add(`${m.provider}|${t}`));});
    return s;
  },[activeMemberships,tierPrices]);

  /* Filtered perks */
  const filtered=useMemo(()=>{
    let r=[...allPerks];
    if(search.trim()){const q=search.toLowerCase();r=r.filter(p=>p.title.toLowerCase().includes(q)||p.provider.toLowerCase().includes(q)||p.tier.toLowerCase().includes(q));}
    return r.sort(featureThenAlpha);
  },[search,allPerks]);

  /* Group by provider → tier, sorted by price */
  const providerGroups=useMemo(()=>{
    const byProv={};
    filtered.forEach(p=>{
      if(!byProv[p.provider])byProv[p.provider]={};
      if(!byProv[p.provider][p.tier])byProv[p.provider][p.tier]={perks:[],membership:p.membership};
      byProv[p.provider][p.tier].perks.push(p);
    });
    const providers=Object.keys(byProv).sort();
    return providers.map(prov=>{
      const tierMap=byProv[prov];
      const tiers=Object.keys(tierMap).sort((a,b)=>{
        const pa=tierMap[a].perks.find(pk=>pk.price!=null)?.price??999;
        const pb=tierMap[b].perks.find(pk=>pk.price!=null)?.price??999;
        return pa-pb;
      });
      return { provider:prov, tiers:tiers.map(t=>({ tier:t, perks:tierMap[t].perks, membership:tierMap[t].membership })) };
    });
  },[filtered]);

  const submitReq=async()=>{if(!reqText.trim())return;if(SB_CONFIGURED&&userId)await supabase.from("membership_requests").insert({user_id:userId,requester_name:reqName,description:reqText});setReqSent(true);};

  return(<div onClick={()=>setSelected(null)}>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:2}}>
      <h1 style={{fontSize:22,fontWeight:800,color:T.textPrimary,margin:0,fontFamily:"'Outfit',sans-serif"}}>Marketplace</h1>
      <button onClick={e=>{e.stopPropagation();setShowReq(!showReq);setReqSent(false);setReqName(userName||"");setReqText("");}} style={{width:32,height:32,borderRadius:16,border:`1.5px solid ${showReq?T.accent:T.border}`,background:showReq?"#F7ECD4":T.surface,color:showReq?T.accent:T.textSecondary,fontSize:16,fontWeight:800,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Work Sans',sans-serif",boxShadow:T.shadow}}>+</button>
    </div>
    <TabDesc>Every provider and tier. Browse, search, and add a membership.</TabDesc>

    {showReq&&(<div onClick={e=>e.stopPropagation()} style={{margin:"0 0 14px",padding:"14px",borderRadius:12,background:"#2B2A6E",boxShadow:"0 6px 20px rgba(0,0,0,0.15)"}}><div style={{fontSize:13,fontWeight:700,color:"#fff",marginBottom:8,fontFamily:"'Work Sans',sans-serif"}}>Request a Membership</div>{reqSent?<div style={{fontSize:12,color:"#E0A93B",padding:"8px 0",fontFamily:"'Work Sans',sans-serif"}}>✓ Submitted! We'll review it.</div>:<><div style={{marginBottom:8}}><label style={{fontSize:11,fontWeight:600,color:"#94A3B8",marginBottom:3,display:"block",fontFamily:"'Work Sans',sans-serif"}}>Your name</label><input value={reqName} onChange={e=>setReqName(e.target.value)} style={{width:"100%",padding:"8px 10px",borderRadius:8,border:"1px solid #334155",background:"#23202A",color:"#F1F5F9",fontSize:13,boxSizing:"border-box",outline:"none",fontFamily:"'Work Sans',sans-serif"}}/></div><div style={{marginBottom:10}}><label style={{fontSize:11,fontWeight:600,color:"#94A3B8",marginBottom:3,display:"block",fontFamily:"'Work Sans',sans-serif"}}>Which membership?</label><textarea value={reqText} onChange={e=>setReqText(e.target.value)} rows={3} placeholder="e.g. NatWest Reward, Sky VIP..." style={{width:"100%",padding:"8px 10px",borderRadius:8,border:"1px solid #334155",background:"#23202A",color:"#F1F5F9",fontSize:13,boxSizing:"border-box",outline:"none",fontFamily:"'Work Sans',sans-serif",resize:"vertical"}}/></div><button onClick={submitReq} style={{padding:"8px 20px",borderRadius:10,border:"none",background:T.accent,color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"'Work Sans',sans-serif",opacity:reqText.trim()?1:0.5}}>Submit</button></>}</div>)}

    <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search provider, tier, or perk..." style={{width:"100%",padding:"9px 14px",borderRadius:10,border:`1.5px solid ${T.border}`,background:T.surface,fontSize:13,fontFamily:"'Work Sans',sans-serif",color:T.textPrimary,marginBottom:10,boxSizing:"border-box",outline:"none"}}/>

    {providerGroups.map(pg=>{
      const pCfg=PROVIDERS[pg.provider]||{color:T.muted,bg:"#f1f5f9"};
      const totalPerks=pg.tiers.reduce((n,t)=>n+t.perks.length,0);
      /* Derive tier prices from perk.price */
      const allTierPrices=pg.tiers.map(tg=>{const p=tg.perks.find(pk=>pk.price!=null);return p?{tier:tg.tier,price:p.price}:null;}).filter(Boolean);
      const activeTierPrices=allTierPrices.filter(tp=>activeSet.has(`${pg.provider}|${tp.tier}`));
      /* Show active tier's price, or lowest if none active */
      const displayEntry=activeTierPrices.length>0?activeTierPrices.reduce((a,b)=>a.price>=b.price?a:b):allTierPrices.length>0?allTierPrices.reduce((a,b)=>a.price<=b.price?a:b):null;
      const hasActive=activeTierPrices.length>0;
      const provPriceLabel=displayEntry?(displayEntry.price===0?"Free":`£${displayEntry.price}/mo`):"";
      return(
        <CollapsibleSection
          key={pg.provider}
          title={pg.provider}
          subtitle={provPriceLabel?`${totalPerks} perks · ${hasActive?"":"from "}${provPriceLabel}`:`${totalPerks} perks`}
          badge={<AppBrandLogo provider={pg.provider} size={28}/>}
          headerBg={pCfg.bg}
          headerBorder={`${pCfg.color}33`}
          defaultOpen={providerGroups.length<=3}
        >
          {pg.tiers.map(tg=>{
            const tierKey=`${pg.provider}|${tg.tier}`;
            const isActive=activeSet.has(tierKey);
            const tierPrice=tg.perks.find(pk=>pk.price!=null)?.price;
            const priceLabel=tierPrice!=null?(tierPrice===0?"Free":`£${tierPrice}/mo`):"";
            return(
              <CollapsibleSection
                key={tg.tier}
                title={<>{tg.membership} — {tg.tier}</>}
                subtitle={<>{tg.perks.length} perks{priceLabel&&<span style={{marginLeft:6,fontWeight:700,color:pCfg.color||T.accent}}> · {priceLabel}</span>}</>}
                headerBg={isActive?"#F7ECD4":"transparent"}
                headerBorder={isActive?"#E0A93B":T.border}
                isOpen={openTier[pg.provider]===tg.tier}
                onToggle={()=>setOpenTier(prev=>({...prev,[pg.provider]:prev[pg.provider]===tg.tier?null:tg.tier}))}
                headerExtra={
                  <>
                    {isActive&&<span style={{fontSize:9,fontWeight:700,color:"#B07C1A",background:"#F7ECD4",padding:"2px 7px",borderRadius:10,fontFamily:"'Work Sans',sans-serif"}}>Already Active</span>}
                    {!isActive&&<button onClick={e=>{e.stopPropagation();onAddMembership(pg.provider,tg.membership,tg.tier);}} style={{padding:"6px 14px",borderRadius:10,border:"none",background:T.accent,color:"#fff",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"'Work Sans',sans-serif",boxShadow:"0 2px 6px rgba(30,144,255,0.3)"}}>+ Add Tier</button>}
                  </>
                }
              >
                <div style={{display:"flex",flexDirection:"column",gap:5}}>
                  {tg.perks.map(p=><PotentialPerkTile key={p.perk_id} perk={p} selected={selected} onSelect={setSelected}/>)}
                </div>
              </CollapsibleSection>
            );
          })}
        </CollapsibleSection>
      );
    })}
    {providerGroups.length===0&&<p style={{textAlign:"center",color:T.muted,marginTop:30,fontSize:13,fontFamily:"'Work Sans',sans-serif"}}>{search?"No matching perks.":"No memberships found."}</p>}
  </div>);
}

