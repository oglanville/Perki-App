import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "../../lib/supabase";
import { SB_CONFIGURED, getProviderTierOrder, getEffectiveTiers, getHighestTier, isHierarchicalProvider, TIER_RANK } from "../theme";

export function usePerksData(){
  const[user,setUser]=useState(null);
  const[loading,setLoading]=useState(true);
  const[allPerks,setAllPerks]=useState([]);
  const[activeMemberships,setActiveMemberships]=useState([]);
  const[usedMap,setUsedMap]=useState({});
  const[dismissedMap,setDismissedMap]=useState({});
  const tierPrices=useMemo(()=>{const m={};allPerks.forEach(p=>{if(p.price!=null){const k=`${p.provider}|${p.tier}`;if(!(k in m))m[k]={price:p.price,price_label:p.price===0?"Free":`£${p.price}`,sort_order:p.tier_rank??TIER_RANK[p.provider]?.[p.tier]??p.price,kind:p.tier_kind||"hierarchical"};}});return m;},[allPerks]);

  /* Auth listener */
  useEffect(()=>{
    if(!SB_CONFIGURED){setLoading(false);return;}
    let resolved=false;const resolve=()=>{if(!resolved){resolved=true;setLoading(false);}};
    const timeout=setTimeout(()=>{if(!resolved){console.warn("[Perki] Auth timeout");resolve();}},5000);
    let subscription;
    try{const result=supabase.auth.onAuthStateChange((event,session)=>{
      if(session?.user){const meta=session.user.user_metadata||{};setUser({id:session.user.id,name:meta.full_name||session.user.email?.split("@")[0]||"User",email:session.user.email});supabase.from("profiles").select("full_name").eq("id",session.user.id).single().then(({data})=>{if(data?.full_name)setUser(prev=>prev?.id===session.user.id?{...prev,name:data.full_name}:prev);}).catch(()=>{});}else{setUser(null);}resolve();});subscription=result.data.subscription;}catch(err){resolve();}
    return()=>{clearTimeout(timeout);subscription?.unsubscribe();};
  },[]);

  /* Load perks exclusively from Supabase */
  useEffect(()=>{(async()=>{
    if(!SB_CONFIGURED){setAllPerks([]);return;}
    try{
      const{data,error}=await supabase.from("perks").select("*").order("title");
      if(error){console.error("[Perki] Failed to load perks:",error);setAllPerks([]);}
      else{setAllPerks(data||[]);}
    }catch(e){console.error("[Perki] Perks fetch error:",e);setAllPerks([]);}
  })();},[]);


  /* Load user data */
  useEffect(()=>{
    if(!user?.id){setActiveMemberships([]);setUsedMap({});setDismissedMap({});return;}
    (async()=>{
      if(!SB_CONFIGURED){setActiveMemberships([]);return;}
      const{data:mData}=await supabase.from("user_memberships").select("provider,membership,tier").eq("user_id",user.id);
      setActiveMemberships(mData||[]);
      const{data:sData}=await supabase.from("user_perk_state").select("perk_id,used,dismissed").eq("user_id",user.id);
      const uMap={},dMap={};
      (sData||[]).forEach(r=>{if(r.used)uMap[r.perk_id]=true;if(r.dismissed)dMap[r.perk_id]=true;});
      setUsedMap(uMap);setDismissedMap(dMap);
    })();
  },[user?.id]);

  /* Computed perks */
  const userPerks=useMemo(()=>{
    const s=new Set();
    activeMemberships.forEach(m=>{
      getEffectiveTiers(m.provider,m.tier,tierPrices).forEach(t=>{
        allPerks.forEach(p=>{if(p.provider===m.provider&&p.tier===t)s.add(p.perk_id);});
      });
    });
    return allPerks.filter(p=>s.has(p.perk_id)).map(p=>({...p,used:!!usedMap[p.perk_id],dismissed:!!dismissedMap[p.perk_id]}));
  },[activeMemberships,allPerks,usedMap,dismissedMap,tierPrices]);

  /* Display memberships — only show highest tier per provider */
  const displayMemberships=useMemo(()=>{
    const bp={};
    activeMemberships.forEach(m=>{(bp[m.provider]=bp[m.provider]||[]).push(m);});
    const r=[];
    Object.entries(bp).forEach(([prov,ms])=>{
      if(isHierarchicalProvider(prov,tierPrices)){
        const h=getHighestTier(prov,ms.map(m=>m.tier),tierPrices);
        h.forEach(t=>{const m=ms.find(x=>x.tier===t);if(m)r.push(m);});
      }else r.push(...ms);
    });
    return r;
  },[activeMemberships,tierPrices]);

  /* Perks filtered to only the highest selected tier per provider (for totals & profile) */
  const highestTierPerks=useMemo(()=>{
    const highestTiers=new Set();
    displayMemberships.forEach(m=>highestTiers.add(`${m.provider}|${m.tier}`));
    return userPerks.filter(p=>highestTiers.has(`${p.provider}|${p.tier}`));
  },[userPerks,displayMemberships]);

  /* Toggle used */
  const toggleUsed=useCallback(async(perkId)=>{
    const newVal=!usedMap[perkId];
    setUsedMap(prev=>({...prev,[perkId]:newVal}));
    if(SB_CONFIGURED&&user?.id)await supabase.from("user_perk_state").upsert({user_id:user.id,perk_id:perkId,used:newVal,used_at:newVal?new Date().toISOString():null,updated_at:new Date().toISOString(),dismissed:!!dismissedMap[perkId]},{onConflict:"user_id,perk_id"});
  },[usedMap,dismissedMap,user?.id]);

  /* Toggle dismissed */
  const toggleDismissed=useCallback(async(perkId)=>{
    const newVal=!dismissedMap[perkId];
    setDismissedMap(prev=>({...prev,[perkId]:newVal}));
    if(newVal)setUsedMap(prev=>({...prev,[perkId]:false}));
    if(SB_CONFIGURED&&user?.id)await supabase.from("user_perk_state").upsert({user_id:user.id,perk_id:perkId,dismissed:newVal,used:newVal?false:!!usedMap[perkId],updated_at:new Date().toISOString()},{onConflict:"user_id,perk_id"});
  },[dismissedMap,usedMap,user?.id]);

  /* Add membership — selecting a higher tier auto-selects all tiers below it */
  const addMembership=useCallback(async(provider,membership,tier)=>{
    const order = getProviderTierOrder(provider, tierPrices);
    const tierIdx = order.indexOf(tier);

    if (isHierarchicalProvider(provider, tierPrices) && tierIdx >= 0) {
      // Auto-select all tiers at this level and below
      const tiersToAdd = order.slice(0, tierIdx + 1);
      setActiveMemberships(prev => {
        const withoutProv = prev.filter(m => m.provider !== provider);
        const newMs = tiersToAdd.map(t => ({ provider, membership, tier: t }));
        return [...withoutProv, ...newMs];
      });
      if (SB_CONFIGURED && user?.id) {
        await supabase.from("user_memberships").delete().eq("user_id", user.id).eq("provider", provider);
        const rows = tiersToAdd.map(t => ({ user_id: user.id, provider, membership, tier: t }));
        await supabase.from("user_memberships").upsert(rows, { onConflict: "user_id,provider,tier" });
      }
    } else {
      setActiveMemberships(prev => {
        if (prev.find(m => m.provider === provider && m.tier === tier)) return prev;
        return [...prev, { provider, membership, tier }];
      });
      if (SB_CONFIGURED && user?.id) {
        await supabase.from("user_memberships").upsert({ user_id: user.id, provider, membership, tier }, { onConflict: "user_id,provider,tier" });
      }
    }
  },[user?.id,tierPrices]);

  /* Remove membership — deselecting a lower tier removes all higher tiers that depend on it */
  const removeMembership=useCallback(async(provider,tier)=>{
    const order = getProviderTierOrder(provider, tierPrices);
    const tierIdx = order.indexOf(tier);

    if (isHierarchicalProvider(provider, tierPrices) && tierIdx >= 0) {
      const tiersToRemove = order.slice(tierIdx);
      setActiveMemberships(prev => prev.filter(m => !(m.provider === provider && tiersToRemove.includes(m.tier))));
      if (SB_CONFIGURED && user?.id) {
        await supabase.from("user_memberships").delete().eq("user_id", user.id).eq("provider", provider).in("tier", tiersToRemove);
      }
    } else {
      setActiveMemberships(prev => prev.filter(m => !(m.provider === provider && m.tier === tier)));
      if (SB_CONFIGURED && user?.id) {
        await supabase.from("user_memberships").delete().eq("user_id", user.id).eq("provider", provider).eq("tier", tier);
      }
    }
  },[user?.id,tierPrices]);

  const handleLogout=async()=>{if(SB_CONFIGURED)await supabase.auth.signOut();setUser(null);setActiveMemberships([]);setUsedMap({});setDismissedMap({});};

  return { user, setUser, loading, allPerks, activeMemberships, displayMemberships, userPerks, highestTierPerks, tierPrices, toggleUsed, toggleDismissed, addMembership, removeMembership, handleLogout };
}
