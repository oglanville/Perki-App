import { supabase } from "../lib/supabase";

export const SB_CONFIGURED = !!supabase;


export const T={primary:"#2B2A6E",accent:"#3A388F",bg:"#F4F0E6",surface:"#FCFAF4",border:"#E4DDCB",textPrimary:"#23202A",textSecondary:"#6B6757",muted:"#8A8470",success:"#B07C1A",warning:"#B07C1A",danger:"#B4452F",shadow:"0 1px 2px rgba(43,42,40,.06)"};

export const PROVIDERS={"OVO Energy":{color:"#00C86F",initials:"OV",bg:"#ECFDF5"},"Monzo":{color:"#FF5C5C",initials:"MZ",bg:"#FFF1F2"},"Revolut":{color:"#6C63FF",initials:"RV",bg:"#EEF2FF"},"American Express":{color:"#0077C8",initials:"AX",bg:"#F7ECD4"}};

export const CATEGORIES={Banking:{label:"Banking",icon:"🏦"},Protection:{label:"Protection",icon:"🛡️"},Savings:{label:"Savings",icon:"💰"},Credit:{label:"Credit",icon:"📊"},Tools:{label:"Tools",icon:"🔧"},Security:{label:"Security",icon:"🔒"},Budgeting:{label:"Budgeting",icon:"📋"},Travel:{label:"Travel",icon:"🌍"},Investments:{label:"Investments",icon:"📈"},Lifestyle:{label:"Lifestyle",icon:"✨"},Entertainment:{label:"Entertainment",icon:"🎬"},Insurance:{label:"Insurance",icon:"🛡️"},Rewards:{label:"Rewards",icon:"🎁"},Family:{label:"Family",icon:"👨‍👩‍👧"},Currency:{label:"Currency",icon:"💱"},Card:{label:"Card",icon:"💳"},Transfers:{label:"Transfers",icon:"🔄"},Wellness:{label:"Wellness",icon:"🧘"},Fitness:{label:"Fitness",icon:"💪"},Creativity:{label:"Creativity",icon:"🎨"},Productivity:{label:"Productivity",icon:"⚡"},News:{label:"News",icon:"📰"},Workspace:{label:"Workspace",icon:"🖥️"},Education:{label:"Education",icon:"📚"},Sports:{label:"Sports",icon:"⚽"},Streaming:{label:"Streaming",icon:"📺"},Hardware:{label:"Hardware",icon:"🖥️"},Broadband:{label:"Broadband",icon:"📡"},Automotive:{label:"Automotive",icon:"🚗"},Food:{label:"Food",icon:"🍔"},Shopping:{label:"Shopping",icon:"🛒"},Mobile:{label:"Mobile",icon:"📱"}};

export const TABS=[{id:"home",label:"Home",icon:"🏠"},{id:"marketplace",label:"Marketplace",icon:"🛍️"},{id:"where",label:"Where",icon:"📍"},{id:"profile",label:"Profile",icon:"👤"}];


export function resetLabel(p){return{WEEKLY:"Weekly",MONTHLY:"Monthly",ANNUALLY:"Annually",YEARLY:"Annually",NONE:"Always on"}[p]||p;}
export const RENEWAL_DATES_ENABLED = false;
export function cadenceLabel(p){const u=(p||"").toUpperCase();if(u==="WEEKLY")return"Weekly";if(u==="MONTHLY")return"Monthly";return"One-off";}
export function cadenceResetText(p){const u=(p||"").toUpperCase();if(u==="WEEKLY")return"Resets every Monday";if(u==="MONTHLY")return"Resets on the 1st";return"One-off, never resets";}
export const STATUS_LABEL={used:"Have used",unused:"Have not used",wontuse:"Will not use"};
export const BUNDLES=[{key:"holiday",name:"Holiday",icon:"✈️",categories:["Travel","Insurance","Currency"]},{key:"cinema",name:"Cinema",icon:"🎬",categories:["Entertainment","Streaming"]},{key:"sports",name:"Sports",icon:"⚽",categories:["Sports"]},{key:"workday",name:"Workday",icon:"💼",categories:["Productivity","Insurance","Food"]},{key:"bigshop",name:"Big shop",icon:"🛒",categories:["Shopping","Savings","Rewards"]},{key:"famday",name:"Family day out",icon:"👨‍👩‍👧",categories:["Family","Education"]}];

/* ── Mob-style type + pill helpers ── */
export const FONT_DISP="'Outfit',sans-serif";
export const FONT_BODY="'Work Sans',sans-serif";
export const disp=(size=24,weight=900)=>({fontFamily:FONT_DISP,fontWeight:weight,lineHeight:.95,letterSpacing:"-0.01em",fontSize:size,color:T.textPrimary,margin:0});
export const chipStyle=(on)=>({whiteSpace:"nowrap",borderRadius:999,minHeight:38,padding:"0 15px",display:"inline-flex",alignItems:"center",gap:6,fontSize:12.5,fontWeight:600,cursor:"pointer",border:`1.5px solid ${on?T.primary:T.border}`,background:on?T.primary:T.surface,color:on?"#fff":T.textSecondary,flexShrink:0,fontFamily:FONT_BODY});
export const eyebrowStyle={fontSize:10.5,fontWeight:800,letterSpacing:"1.8px",textTransform:"uppercase",color:"#B07C1A",fontFamily:FONT_BODY};

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
    .map(([k, v]) => ({ tier: k.split("|")[1], rank: v.sort_order ?? v.price ?? 999 }))
    .sort((a, b) => a.rank - b.rank);
  return entries.map(e => e.tier);
}


export function getEffectiveTiers(provider, tier, tierPrices) {
  /* Variant tiers (Spotify plans, Railcard types, National Trust, Amazon, Cineworld groups)
     are parallel products: they never inherit from cheaper siblings. */
  if (tierPrices[`${provider}|${tier}`]?.kind === "variant") return [tier];
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
  const entry = Object.entries(tierPrices).find(([k]) => k.startsWith(`${provider}|`));
  if (entry && entry[1].kind === "variant") return false;
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

export const PROVIDER_LOGOS={"OVO Energy":"https://logo.clearbit.com/ovoenergy.com","OVO":"https://logo.clearbit.com/ovoenergy.com","Tesco":"https://logo.clearbit.com/tesco.com","Boots":"https://logo.clearbit.com/boots.com","IKEA":"https://logo.clearbit.com/ikea.com","Greggs":"https://logo.clearbit.com/greggs.co.uk","Nando's":"https://logo.clearbit.com/nandos.co.uk","Pret":"https://logo.clearbit.com/pret.co.uk","Deliveroo":"https://logo.clearbit.com/deliveroo.co.uk","Amazon":"https://logo.clearbit.com/amazon.co.uk","Spotify":"https://logo.clearbit.com/spotify.com","Cineworld":"https://logo.clearbit.com/cineworld.co.uk","ASOS":"https://logo.clearbit.com/asos.com","Nationwide":"https://logo.clearbit.com/nationwide.co.uk","Santander":"https://logo.clearbit.com/santander.co.uk","American Express":"https://logo.clearbit.com/americanexpress.com","Vodafone":"https://logo.clearbit.com/vodafone.co.uk","Costco":"https://logo.clearbit.com/costco.co.uk","Blue Light Card":"https://logo.clearbit.com/bluelightcard.co.uk","National Trust":"https://logo.clearbit.com/nationaltrust.org.uk","Railcard":"https://logo.clearbit.com/railcard.co.uk","British Airways":"https://logo.clearbit.com/britishairways.com","British Gas":"https://logo.clearbit.com/britishgas.co.uk","E.On Next":"https://logo.clearbit.com/eonnext.com","EDF":"https://logo.clearbit.com/edfenergy.com","Octopus Energy":"https://logo.clearbit.com/octopus.energy","Scottish Power":"https://logo.clearbit.com/scottishpower.co.uk","Utilita":"https://logo.clearbit.com/utilita.co.uk","Utility Warehouse":"https://logo.clearbit.com/uw.co.uk","EE":"https://logo.clearbit.com/ee.co.uk","Three":"https://logo.clearbit.com/three.co.uk","giffgaff":"https://logo.clearbit.com/giffgaff.com","Sky Mobile":"https://logo.clearbit.com/sky.com","Tesco Mobile":"https://logo.clearbit.com/tescomobile.com","Lebara":"https://logo.clearbit.com/lebara.com","BT":"https://logo.clearbit.com/bt.com","Sky Broadband":"https://logo.clearbit.com/sky.com","Virgin Media":"https://logo.clearbit.com/virginmedia.com","TalkTalk":"https://logo.clearbit.com/talktalk.co.uk","Plusnet":"https://logo.clearbit.com/plus.net","Vodafone Broadband":"https://logo.clearbit.com/vodafone.co.uk","Hyperoptic":"https://logo.clearbit.com/hyperoptic.com","Community Fibre":"https://logo.clearbit.com/communityfibre.co.uk","Netflix":"https://logo.clearbit.com/netflix.com","Disney+":"https://logo.clearbit.com/disneyplus.com","Apple TV+":"https://logo.clearbit.com/apple.com","NOW":"https://logo.clearbit.com/nowtv.com","Paramount+":"https://logo.clearbit.com/paramountplus.com","YouTube Premium":"https://logo.clearbit.com/youtube.com","Apple Music":"https://logo.clearbit.com/apple.com","Amazon Music":"https://logo.clearbit.com/amazon.co.uk","YouTube Music":"https://logo.clearbit.com/youtube.com","Tidal":"https://logo.clearbit.com/tidal.com","Deezer":"https://logo.clearbit.com/deezer.com","Barclaycard":"https://logo.clearbit.com/barclaycard.co.uk","HSBC":"https://logo.clearbit.com/hsbc.co.uk","NatWest":"https://logo.clearbit.com/natwest.com","M&S Bank":"https://logo.clearbit.com/marksandspencer.com","John Lewis Money":"https://logo.clearbit.com/johnlewis.com","Virgin Money":"https://logo.clearbit.com/virginmoney.com"};

export const TIER_RANK={"British Airways":{Blue:0,Bronze:1,Silver:2,Gold:3}};

export function providerLogoSources(provider){
  const out=[]; const logo=PROVIDER_LOGOS[provider]; const slug=PROVIDER_SLUGS[provider];
  if(logo) out.push(logo);
  if(slug) out.push(`https://cdn.simpleicons.org/${slug}`);
  if(logo){ const d=logo.split("/").pop(); out.push(`https://www.google.com/s2/favicons?domain=${d}&sz=64`); }
  return [...new Set(out)];
}

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
