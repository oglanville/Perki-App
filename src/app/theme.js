import { supabase } from "../lib/supabase";

export const SB_CONFIGURED = !!supabase;


export const T={primary:"#2B2A6E",accent:"#3A388F",bg:"#F4F0E6",surface:"#FCFAF4",border:"#E4DDCB",textPrimary:"#23202A",textSecondary:"#6B6757",muted:"#8A8470",success:"#B07C1A",warning:"#B07C1A",danger:"#B4452F",shadow:"0 1px 2px rgba(43,42,40,.06)"};

export const PROVIDERS={"OVO Energy":{color:"#00C86F",initials:"OV",bg:"#ECFDF5"},"Monzo":{color:"#FF5C5C",initials:"MZ",bg:"#FFF1F2"},"Revolut":{color:"#6C63FF",initials:"RV",bg:"#EEF2FF"},"American Express":{color:"#0077C8",initials:"AX",bg:"#F7ECD4"}};

export const CATEGORIES={Banking:{label:"Banking",icon:"🏦"},Protection:{label:"Protection",icon:"🛡️"},Savings:{label:"Savings",icon:"💰"},Credit:{label:"Credit",icon:"📊"},Tools:{label:"Tools",icon:"🔧"},Security:{label:"Security",icon:"🔒"},Budgeting:{label:"Budgeting",icon:"📋"},Travel:{label:"Travel",icon:"🌍"},Investments:{label:"Investments",icon:"📈"},Lifestyle:{label:"Lifestyle",icon:"✨"},Entertainment:{label:"Entertainment",icon:"🎬"},Insurance:{label:"Insurance",icon:"🛡️"},Rewards:{label:"Rewards",icon:"🎁"},Family:{label:"Family",icon:"👨‍👩‍👧"},Currency:{label:"Currency",icon:"💱"},Card:{label:"Card",icon:"💳"},Transfers:{label:"Transfers",icon:"🔄"},Wellness:{label:"Wellness",icon:"🧘"},Fitness:{label:"Fitness",icon:"💪"},Creativity:{label:"Creativity",icon:"🎨"},Productivity:{label:"Productivity",icon:"⚡"},News:{label:"News",icon:"📰"},Workspace:{label:"Workspace",icon:"🖥️"},Education:{label:"Education",icon:"📚"},Sports:{label:"Sports",icon:"⚽"},Streaming:{label:"Streaming",icon:"📺"},Hardware:{label:"Hardware",icon:"🖥️"},Broadband:{label:"Broadband",icon:"📡"},Automotive:{label:"Automotive",icon:"🚗"},Food:{label:"Food",icon:"🍔"},Shopping:{label:"Shopping",icon:"🛒"}};

export const TABS=[{id:"home",label:"Home",icon:"🏠"},{id:"marketplace",label:"Marketplace",icon:"🛍️"},{id:"where",label:"Where",icon:"📍"},{id:"profile",label:"Profile",icon:"👤"}];


export function resetLabel(p){return{WEEKLY:"Weekly",MONTHLY:"Monthly",ANNUALLY:"Annually",YEARLY:"Annually",NONE:"Always on"}[p]||p;}

export function alphaSort(a,b){return a.title.localeCompare(b.title);}


export const FEATURE_ORDER={perk:0,feature:1,discount:2,competition:3};

export function featureThenAlpha(a,b){
  const fa=FEATURE_ORDER[a.feature]??1;
  const fb=FEATURE_ORDER[b.feature]??1;
  if(fa!==fb)return fa-fb;
  return a.title.localeCompare(b.title);
}


export function groupByClosingDate(items){
  const now=new Date();
  const buckets={"Closes in 1 week":[],"Closes in 2 weeks":[],"Closes in 3 weeks":[],"Closes in 4 weeks":[],"No close date":[]};
  items.forEach(p=>{
    if(!p.next_reset_date){buckets["No close date"].push(p);return;}
    const d=new Date(p.next_reset_date);
    const diffMs=d-now;
    const diffDays=diffMs/(1000*60*60*24);
    if(diffDays<=7)buckets["Closes in 1 week"].push(p);
    else if(diffDays<=14)buckets["Closes in 2 weeks"].push(p);
    else if(diffDays<=21)buckets["Closes in 3 weeks"].push(p);
    else if(diffDays<=28)buckets["Closes in 4 weeks"].push(p);
    else buckets["No close date"].push(p);
  });
  // Sort within each bucket by date ascending
  Object.values(buckets).forEach(arr=>arr.sort((a,b)=>{
    if(!a.next_reset_date&&!b.next_reset_date)return a.title.localeCompare(b.title);
    if(!a.next_reset_date)return 1;
    if(!b.next_reset_date)return -1;
    return new Date(a.next_reset_date)-new Date(b.next_reset_date);
  }));
  return buckets;
}


export function getProviderTierOrder(provider, tierPrices) {
  const entries = Object.entries(tierPrices)
    .filter(([k]) => k.startsWith(`${provider}|`))
    .map(([k, v]) => ({ tier: k.split("|")[1], price: v.price ?? 999 }))
    .sort((a, b) => a.price - b.price);
  return entries.map(e => e.tier);
}


export function getEffectiveTiers(provider, tier, tierPrices) {
  const order = getProviderTierOrder(provider, tierPrices);
  const idx = order.indexOf(tier);
  if (idx < 0) return [tier];
  return order.slice(0, idx + 1);
}


export function getHighestTier(provider, tiers, tierPrices) {
  const order = getProviderTierOrder(provider, tierPrices);
  let highIdx = -1, highTier = null;
  tiers.forEach(t => {
    const i = order.indexOf(t);
    if (i > highIdx) { highIdx = i; highTier = t; }
  });
  return highTier ? [highTier] : tiers;
}


export function isHierarchicalProvider(provider, tierPrices) {
  return getProviderTierOrder(provider, tierPrices).length > 1;
}


export function isHigherTier(candidate, existing, tierPrices) {
  const order = getProviderTierOrder(candidate.provider, tierPrices);
  const existIdx = order.indexOf(existing.tier);
  const newIdx = order.indexOf(candidate.tier);
  if (existIdx >= 0 || newIdx >= 0) return newIdx > existIdx;
  return (candidate.price ?? 0) > (existing.price ?? 0);
}


export function getPerkBrand(perk){
  const provColor=(PROVIDERS[perk.provider]||{}).color||T.muted;
  return {
    emoji:     perk.emoji       || "📦",
    initials:  perk.icon_initials || perk.title?.slice(0,2).toUpperCase() || "??",
    color:     perk.icon_color   || provColor,
    gradient:  perk.icon_gradient || `linear-gradient(135deg,${provColor}88,${provColor})`,
  };
}


export const PROVIDER_SLUGS={"Monzo":"monzo","Revolut":"revolut","OVO Energy":"ovoenergy","OVO":"ovoenergy","American Express":"americanexpress","Amex":"americanexpress","Sky TV":"sky","Sky":"sky","O2":"o2","Lidl":"lidl"};

export const PROVIDER_LOGOS={"OVO Energy":"https://logo.clearbit.com/ovoenergy.com","OVO":"https://logo.clearbit.com/ovoenergy.com"};

export function buildMembershipCatalog(perks, tp){
  const groups={};
  perks.forEach(p=>{const key=`${p.provider}|${p.membership}`; if(!groups[key])groups[key]={provider:p.provider,membership:p.membership,tierSet:new Set()}; groups[key].tierSet.add(p.tier);});
  return Object.values(groups).map(g=>({provider:g.provider,membership:g.membership,tiers:[...g.tierSet].map(tt=>({tier:tt,...(tp[`${g.provider}|${tt}`]||{price:0,price_label:"Free",sort_order:0})})).sort((a,b)=>a.sort_order-b.sort_order)})).sort((a,b)=>a.provider.localeCompare(b.provider));
}
export function dedupeAcrossTiers(perks, tp){
  const rank=p=>tp[`${p.provider}|${p.tier}`]?.sort_order ?? (Number(p.price)||0);
  const byKey={}; perks.forEach(p=>{const key=`${p.provider}|${(p.title||"").toLowerCase()}`; if(!byKey[key]||rank(p)>rank(byKey[key]))byKey[key]=p;});
  return Object.values(byKey);
}
