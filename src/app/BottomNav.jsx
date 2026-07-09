import React from "react";
import { T, TABS } from "./theme";

export default function BottomNav({ tab, setTab }) {
  return (
    <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:420,background:`linear-gradient(180deg,transparent 0%,${T.bg} 24%)`,padding:"8px 10px 12px",zIndex:100}}>
      <div style={{display:"flex",justifyContent:"space-around",background:"rgba(255,255,255,0.94)",backdropFilter:"blur(14px)",borderRadius:999,padding:"5px 6px",border:`1px solid ${T.border}`,boxShadow:"0 -2px 12px rgba(15,23,42,0.06)"}}>
        {TABS.map(t=>{const isA=tab===t.id;return(<button key={t.id} onClick={()=>setTab(t.id)} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:1,padding:"7px 10px",minWidth:56,background:isA?T.primary:"transparent",border:"none",borderRadius:999,cursor:"pointer",transition:"background .2s"}}><span style={{fontSize:16,filter:isA?"none":"grayscale(0.5) opacity(0.7)"}}>{t.icon}</span><span style={{fontSize:8.5,fontWeight:isA?800:600,color:isA?"#fff":T.textSecondary,whiteSpace:"nowrap",fontFamily:"'Work Sans',sans-serif"}}>{t.label}</span></button>);})}
      </div>
    </div>
  );
}
