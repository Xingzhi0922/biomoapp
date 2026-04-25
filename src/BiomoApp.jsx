import { useState } from "react";

// ─────────────────────────────────────────────
//  DESIGN TOKENS
// ─────────────────────────────────────────────
const C = {
  bg:"#F5F4F0", bgCard:"#fff",
  border:"#D3D1C7", text:"#2C2C2A",
  textSub:"#888780", textMid:"#444441",
  green:"#1D9E75", blue:"#378ADD",
  amber:"#EF9F27", red:"#E24B4A",
};

// ─────────────────────────────────────────────
//  ROOM DATA  ← single source of truth
// ─────────────────────────────────────────────
const ROOMS = {
  kafis:       { name:"Kafis",         occupancy:72,  co2:460,  kwh:1.2, status:"good"     },
  hub:         { name:"The Hub",       occupancy:85,  co2:690,  kwh:2.1, status:"good"     },
  room1:       { name:"Room 1",        occupancy:100, co2:820,  kwh:0.4, status:"moderate" },
  room2:       { name:"Room 2",        occupancy:50,  co2:540,  kwh:0.3, status:"good"     },
  room3:       { name:"Room 3",        occupancy:75,  co2:610,  kwh:0.3, status:"good"     },
  room4:       { name:"Room 4",        occupancy:25,  co2:480,  kwh:0.2, status:"good"     },
  room5:       { name:"Room 5",        occupancy:0,   co2:420,  kwh:0.1, status:"good"     },
  room6:       { name:"Room 6",        occupancy:100, co2:1240, kwh:0.5, status:"critical" },
  room7:       { name:"Room 7",        occupancy:50,  co2:580,  kwh:0.3, status:"good"     },
  room8:       { name:"Room 8",        occupancy:75,  co2:640,  kwh:0.4, status:"good"     },
  "wc-left":   { name:"WC (Left)",     occupancy:null,co2:null, kwh:0.1, status:"neutral"  },
  "wc-center": { name:"WC (Center)",   occupancy:null,co2:null, kwh:0.1, status:"neutral"  },
  stage:       { name:"The Stage",     occupancy:60,  co2:950,  kwh:3.8, status:"warning"  },
  printshop:   { name:"Print Shop",    occupancy:40,  co2:510,  kwh:1.6, status:"good"     },
  sauna:       { name:"Startup Sauna", occupancy:30,  co2:780,  kwh:4.2, status:"moderate" },
  stair:       { name:"Staircase",     occupancy:null,co2:null, kwh:0.0, status:"neutral"  },
  elevator:    { name:"Elevator",      occupancy:null,co2:null, kwh:0.2, status:"neutral"  },
  storage:     { name:"Storage",       occupancy:null,co2:null, kwh:0.1, status:"neutral"  },
};

const STATUS = {
  good:     { fill:"rgba(29,158,117,0.10)",  stroke:"#1D9E75", pillColor:"green", label:"Good"     },
  moderate: { fill:"rgba(239,159,39,0.12)",  stroke:"#EF9F27", pillColor:"amber", label:"Moderate" },
  warning:  { fill:"rgba(239,159,39,0.20)",  stroke:"#EF9F27", pillColor:"amber", label:"Warning"  },
  critical: { fill:"rgba(226,75,74,0.14)",   stroke:"#E24B4A", pillColor:"red",   label:"Critical" },
  neutral:  { fill:"rgba(136,135,128,0.06)", stroke:"#C8C6C0", pillColor:"blue",  label:"—"        },
};

const ALERTS = [
  { id:"a1", roomId:"room6", sev:"critical", title:"Critical CO₂ — Room 6",
    desc:"1,240 ppm · 2 people · ventilation low", time:"2:15 PM" },
  { id:"a2", roomId:"stage", sev:"warning",  title:"High CO₂ — The Stage",
    desc:"950 ppm · 18 people · HVAC at medium",  time:"1:40 PM" },
  { id:"a3", roomId:"sauna", sev:"warning",  title:"Elevated energy — Startup Sauna",
    desc:"4.2 kWh today · +28% vs yesterday",     time:"11:20 AM" },
  { id:"a4", roomId:"room1", sev:"moderate", title:"Room 1 fully occupied",
    desc:"100% capacity · CO₂ rising to 820 ppm", time:"10:05 AM" },
];

// ─────────────────────────────────────────────
//  SHARED UI COMPONENTS
// ─────────────────────────────────────────────
const StatusBar = () => (
  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
    padding:"14px 22px 6px", fontSize:11, fontWeight:500, color:C.textMid }}>
    <span>9:41</span>
    <div style={{ display:"flex", gap:5, alignItems:"center" }}>
      <svg width="15" height="11" viewBox="0 0 15 11">
        {[0,4,8,12].map((x,i)=>(
          <rect key={x} x={x} y={i>=2?0:i===1?2:4} width="2.5"
            height={i>=2?11:i===1?9:7} rx="1" fill={i===3?"#D3D1C7":"#444441"}/>
        ))}
      </svg>
      <svg width="24" height="11" viewBox="0 0 24 11">
        <rect x="0" y="1" width="21" height="9" rx="2.5" stroke="#444441" strokeWidth="1" fill="none"/>
        <rect x="1.5" y="2.5" width="14" height="6" rx="1.5" fill="#444441"/>
        <path d="M22 4V7C22.7 6.7 23 6.1 23 5.5S22.7 4.3 22 4Z" fill="#444441"/>
      </svg>
    </div>
  </div>
);

const Pill = ({ color="green", children, style={} }) => {
  const m = { green:{bg:"#EAF3DE",text:"#27500A"}, amber:{bg:"#FAEEDA",text:"#633806"},
    blue:{bg:"#E6F1FB",text:"#0C447C"}, red:{bg:"#FCEBEB",text:"#791F1F"},
    teal:{bg:"#E1F5EE",text:"#0F6E56"}, purple:{bg:"#EEEDFE",text:"#3C3489"} };
  const s = m[color]||m.green;
  return (
    <span style={{ display:"inline-flex", alignItems:"center", fontSize:10, fontWeight:500,
      padding:"3px 9px", borderRadius:20, background:s.bg, color:s.text, ...style }}>
      {children}
    </span>
  );
};

const SLabel = ({ children, style={} }) => (
  <div style={{ fontSize:10, fontWeight:500, letterSpacing:"0.09em", textTransform:"uppercase",
    color:C.textSub, margin:"14px 0 8px", ...style }}>{children}</div>
);

const Card = ({ children, style={} }) => (
  <div style={{ background:C.bgCard, borderRadius:16, border:`0.5px solid ${C.border}`,
    padding:13, ...style }}>{children}</div>
);

const ScreenBody = ({ children }) => (
  <div style={{ padding:"0 16px", overflowY:"auto", flex:1, background:C.bg, minHeight:0 }}>
    {children}
    <div style={{ height:16 }}/>
  </div>
);

const BottomNav = ({ active, setPage }) => {
  const tabs = [
    { id:"home",     label:"Home",
      icon:(a)=><svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M3 10L10 3L17 10V17H13V13H7V17H3V10Z" stroke={a?C.green:C.textSub} strokeWidth="1.3" fill="none" strokeLinejoin="round"/></svg> },
    { id:"floors",   label:"Floors",
      icon:(a)=><svg width="20" height="20" viewBox="0 0 20 20" fill="none">{[[2,2],[11,2],[2,11],[11,11]].map(([x,y])=><rect key={`${x}${y}`} x={x} y={y} width="7" height="7" rx="2" stroke={a?C.green:C.textSub} strokeWidth="1.3"/>)}</svg> },
    { id:"reports",  label:"Reports",
      icon:(a)=><svg width="20" height="20" viewBox="0 0 20 20" fill="none">{[[2,10,3,8],[7,6,3,12],[12,2,3,16],[17,8,3,10]].map(([x,y,w,h])=><rect key={x} x={x} y={y} width={w} height={h} rx="1" fill={a?C.green:C.textSub}/>)}</svg> },
    { id:"alerts",   label:"Alerts",
      icon:(a)=><svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 2C10 2 6 4 6 9V13H14V9C14 4 10 2 10 2Z" stroke={a?C.green:C.textSub} strokeWidth="1.3" fill="none"/><path d="M4 13H16" stroke={a?C.green:C.textSub} strokeWidth="1.3" strokeLinecap="round"/><path d="M8 13C8 14.1 8.9 15 10 15C11.1 15 12 14.1 12 13" stroke={a?C.green:C.textSub} strokeWidth="1.3" fill="none"/></svg> },
    { id:"settings", label:"Settings",
      icon:(a)=><svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="7.5" stroke={a?C.green:C.textSub} strokeWidth="1.3"/><circle cx="10" cy="10" r="3" stroke={a?C.green:C.textSub} strokeWidth="1.3"/>{[[10,2.5,10,5],[10,15,10,17.5],[2.5,10,5,10],[15,10,17.5,10]].map(([x1,y1,x2,y2])=><line key={`${x1}${y1}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke={a?C.green:C.textSub} strokeWidth="1.3"/>)}</svg> },
  ];
  return (
    <div style={{ background:C.bgCard, borderTop:`0.5px solid ${C.border}`,
      display:"flex", justifyContent:"space-around", alignItems:"center", padding:"10px 0 18px" }}>
      {tabs.map(t=>{
        const a = active===t.id;
        return (
          <div key={t.id} onClick={()=>setPage(t.id)} style={{ display:"flex", flexDirection:"column",
            alignItems:"center", gap:3, cursor:"pointer", padding:"4px 8px", position:"relative" }}>
            {t.icon(a)}
            {t.id==="alerts" && <div style={{ width:6, height:6, background:C.red, borderRadius:"50%",
              position:"absolute", top:4, right:8, border:`1.5px solid ${C.bg}` }}/>}
            {a && <div style={{ width:4, height:4, borderRadius:"50%", background:C.green }}/>}
            <div style={{ fontSize:9, fontWeight:500, color:a?C.green:C.textSub }}>{t.label}</div>
          </div>
        );
      })}
    </div>
  );
};

// ─────────────────────────────────────────────
//  FLOOR MAP SVG  (shared across all screens)
// ─────────────────────────────────────────────
const FloorMapSVG = ({ selected, onSelect, highlightIds=null }) => {
  const hs = (id) => {
    const sc = STATUS[ROOMS[id]?.status||"neutral"];
    const isSel  = selected === id;
    const isHigh = highlightIds && highlightIds.includes(id);
    if (isSel)  return { cursor:"pointer", fill:"rgba(29,158,117,0.30)", stroke:"#1D9E75", strokeWidth:5 };
    if (isHigh) return { cursor:"pointer", fill:sc.fill, stroke:sc.stroke, strokeWidth:2.5 };
    return { cursor:"pointer", fill:"transparent", stroke:"none" };
  };
  const tap = (id) => onSelect && onSelect(id===selected ? null : id);

  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1049 1500" width="100%" style={{ display:"block" }}>
      <style>{`.fw{stroke:#4a4a4a;stroke-width:5;stroke-linecap:square;stroke-linejoin:miter;fill:none;}.fs{stroke:#4a4a4a;stroke-width:1.4;fill:none;}.fl{font-family:Arial,sans-serif;text-anchor:middle;dominant-baseline:middle;pointer-events:none;}`}</style>
      <rect width="1049" height="1500" fill="#fff"/>
      <path fill="#efefef" d="M290 0 L593 0 L669 0 L669 109 L1013 109 L1013 1066 L593 1066 L593 1191 L669 1191 L669 1478 L116 1478 L116 644 L290 644 Z"/>
      <rect x="593" y="1066" width="76" height="125" fill="#efefef"/>
      {/* outer walls */}
      <line className="fw" x1="290" y1="0"    x2="290" y2="644"/>
      <line className="fw" x1="116" y1="644"  x2="290" y2="644"/>
      <line className="fw" x1="116" y1="644"  x2="116" y2="1478"/>
      <line className="fw" x1="116" y1="1478" x2="669" y2="1478"/>
      <line className="fw" x1="669" y1="1191" x2="669" y2="1478"/>
      <line className="fw" x1="669" y1="1066" x2="669" y2="1191"/>
      <line className="fw" x1="593" y1="1191" x2="669" y2="1191"/>
      <line className="fw" x1="593" y1="1066" x2="593" y2="1191"/>
      <line className="fw" x1="593" y1="1066" x2="1013" y2="1066"/>
      <line className="fw" x1="1013" y1="109"  x2="1013" y2="1066"/>
      <line className="fw" x1="669"  y1="109"  x2="1013" y2="109"/>
      <line className="fw" x1="669"  y1="0"    x2="669"  y2="109"/>
      {/* inner walls */}
      <line className="fw" x1="490" y1="0"   x2="490" y2="396"/>
      <line className="fw" x1="490" y1="446" x2="490" y2="1066"/>
      <line className="fw" x1="290" y1="321" x2="490" y2="321"/>
      <line className="fw" x1="433" y1="321" x2="433" y2="394"/>
      <line className="fw" x1="383" y1="394" x2="490" y2="394"/>
      <line className="fw" x1="383" y1="394" x2="383" y2="448"/>
      <line className="fw" x1="290" y1="448" x2="490" y2="448"/>
      <line className="fw" x1="290" y1="531" x2="490" y2="531"/>
      <line className="fw" x1="116" y1="644" x2="490" y2="644"/>
      <line className="fw" x1="116" y1="925" x2="490" y2="925"/>
      <line className="fw" x1="735" y1="109" x2="735" y2="394"/>
      <line className="fw" x1="830" y1="109" x2="830" y2="394"/>
      <line className="fw" x1="735" y1="394" x2="1013" y2="394"/>
      <line className="fw" x1="735" y1="192" x2="830" y2="192"/>
      <line className="fw" x1="735" y1="258" x2="830" y2="258"/>
      <line className="fw" x1="735" y1="325" x2="830" y2="325"/>
      <line className="fw" x1="875" y1="394" x2="875" y2="792"/>
      <line className="fw" x1="875" y1="792" x2="1013" y2="792"/>
      <line className="fw" x1="875" y1="489" x2="1013" y2="489"/>
      <line className="fw" x1="875" y1="591" x2="1013" y2="591"/>
      <line className="fw" x1="875" y1="696" x2="1013" y2="696"/>
      <line className="fw" x1="684" y1="556" x2="830" y2="556"/>
      <line className="fw" x1="830" y1="556" x2="830" y2="664"/>
      <line className="fw" x1="656" y1="664" x2="830" y2="664"/>
      <line className="fw" x1="656" y1="590" x2="656" y2="664"/>
      <line className="fw" x1="656" y1="590" x2="684" y2="590"/>
      <line className="fw" x1="684" y1="556" x2="684" y2="590"/>
      <line className="fw" x1="802" y1="914"  x2="1013" y2="914"/>
      <line className="fw" x1="802" y1="914"  x2="802"  y2="1066"/>
      {/* stairs */}
      <line className="fs" x1="593" y1="1083" x2="669" y2="1083"/>
      <line className="fs" x1="593" y1="1100" x2="669" y2="1100"/>
      <line className="fs" x1="593" y1="1117" x2="669" y2="1117"/>
      <line className="fs" x1="593" y1="1134" x2="669" y2="1134"/>
      <line className="fs" x1="593" y1="1151" x2="669" y2="1151"/>
      <line className="fs" x1="593" y1="1168" x2="669" y2="1168"/>
      {/* labels */}
      <text className="fl" x="390"  y="160"  fontSize="28">Kafis</text>
      <text className="fl" x="900"  y="250"  fontSize="28">The Hub</text>
      <text className="fl" x="335"  y="490"  fontSize="24">WC</text>
      <text className="fl" x="743"  y="610"  fontSize="24">WC</text>
      <text className="fl" x="305"  y="790"  fontSize="28">The Stage</text>
      <text className="fl" x="908"  y="990"  fontSize="28">Print Shop</text>
      <text className="fl" x="375"  y="1230" fontSize="28">Startup Sauna</text>
      <text className="fl" x="631"  y="1128" fontSize="22">stair</text>
      <text className="fl" x="350"  y="357"  fontSize="22">stair</text>
      <text className="fl" x="461"  y="357"  fontSize="22">Elevator</text>
      <text className="fl" x="390"  y="584"  fontSize="22">Storage</text>
      <text className="fl" x="782"  y="151"  fontSize="22">room1</text>
      <text className="fl" x="782"  y="225"  fontSize="22">room2</text>
      <text className="fl" x="782"  y="292"  fontSize="22">room3</text>
      <text className="fl" x="782"  y="359"  fontSize="22">room4</text>
      <text className="fl" x="944"  y="442"  fontSize="22">room5</text>
      <text className="fl" x="944"  y="540"  fontSize="22">room6</text>
      <text className="fl" x="944"  y="644"  fontSize="22">room7</text>
      <text className="fl" x="944"  y="744"  fontSize="22">room8</text>
      {/* hit areas */}
      <rect       onClick={()=>tap("kafis")}      style={hs("kafis")}      x="290" y="0"    width="200" height="321"/>
      <rect       onClick={()=>tap("stair")}      style={hs("stair")}      x="290" y="321"  width="93"  height="127"/>
      <polygon    onClick={()=>tap("elevator")}   style={hs("elevator")}   points="433,321 490,321 490,448 383,448 383,394 433,394"/>
      <rect       onClick={()=>tap("wc-left")}    style={hs("wc-left")}    x="290" y="448"  width="200" height="83"/>
      <rect       onClick={()=>tap("storage")}    style={hs("storage")}    x="290" y="531"  width="200" height="113"/>
      <rect       onClick={()=>tap("stage")}      style={hs("stage")}      x="116" y="644"  width="374" height="281"/>
      <polygon    onClick={()=>tap("sauna")}      style={hs("sauna")}      points="116,1478 669,1478 669,1191 593,1191 593,1066 490,1066 490,925 116,925"/>
      <rect       onClick={()=>tap("hub")}        style={hs("hub")}        x="830" y="109"  width="183" height="285"/>
      <rect       onClick={()=>tap("room1")}      style={hs("room1")}      x="735" y="109"  width="95"  height="83"/>
      <rect       onClick={()=>tap("room2")}      style={hs("room2")}      x="735" y="192"  width="95"  height="66"/>
      <rect       onClick={()=>tap("room3")}      style={hs("room3")}      x="735" y="258"  width="95"  height="67"/>
      <rect       onClick={()=>tap("room4")}      style={hs("room4")}      x="735" y="325"  width="95"  height="69"/>
      <rect       onClick={()=>tap("room5")}      style={hs("room5")}      x="875" y="394"  width="138" height="95"/>
      <rect       onClick={()=>tap("room6")}      style={hs("room6")}      x="875" y="489"  width="138" height="102"/>
      <rect       onClick={()=>tap("room7")}      style={hs("room7")}      x="875" y="591"  width="138" height="105"/>
      <rect       onClick={()=>tap("room8")}      style={hs("room8")}      x="875" y="696"  width="138" height="96"/>
      <polygon    onClick={()=>tap("wc-center")}  style={hs("wc-center")}  points="684,556 830,556 830,664 656,664 656,590 684,590"/>
      <rect       onClick={()=>tap("printshop")}  style={hs("printshop")}  x="802" y="914"  width="211" height="152"/>
      <rect       onClick={()=>tap("stair")}      style={hs("stair")}      x="593" y="1066" width="76"  height="125"/>
    </svg>
  );
};

// ─────────────────────────────────────────────
//  ROOM DETAIL PANEL  (reused everywhere)
// ─────────────────────────────────────────────
const RoomPanel = ({ roomId, onClose }) => {
  const r = ROOMS[roomId];
  if (!r) return null;
  const sc = STATUS[r.status];
  return (
    <div style={{ background:C.bgCard, borderRadius:12,
      border:`1.5px solid ${sc.stroke}`, padding:"12px 14px", marginBottom:10 }}>
      <div style={{ display:"flex", justifyContent:"space-between",
        alignItems:"flex-start", marginBottom:10 }}>
        <div>
          <div style={{ fontSize:15, fontWeight:500, color:C.text }}>{r.name}</div>
          <Pill color={sc.pillColor} style={{ marginTop:4 }}>{sc.label}</Pill>
        </div>
        <div onClick={onClose}
          style={{ fontSize:18, color:C.textSub, cursor:"pointer", lineHeight:1, padding:"0 4px" }}>×</div>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:7, marginBottom:10 }}>
        <div style={{ background:"#F5F4F0", borderRadius:10, padding:"8px 6px", textAlign:"center" }}>
          <div style={{ fontSize:9, color:C.textSub, fontWeight:500, textTransform:"uppercase",
            letterSpacing:"0.06em", marginBottom:3 }}>Occupancy</div>
          <div style={{ fontSize:18, fontWeight:500,
            color:r.occupancy===null?"#C8C6C0":r.occupancy>=90?C.red:r.occupancy>=70?C.amber:C.green }}>
            {r.occupancy===null?"—":`${r.occupancy}%`}</div>
        </div>
        <div style={{ background:r.co2?sc.fill:"#F5F4F0", borderRadius:10,
          padding:"8px 6px", textAlign:"center" }}>
          <div style={{ fontSize:9, color:C.textSub, fontWeight:500, textTransform:"uppercase",
            letterSpacing:"0.06em", marginBottom:3 }}>CO₂</div>
          <div style={{ fontSize:18, fontWeight:500,
            color:r.co2===null?"#C8C6C0":r.co2>=1000?C.red:r.co2>=700?C.amber:C.green }}>
            {r.co2===null?"—":<>{r.co2}<span style={{ fontSize:10, marginLeft:1 }}>ppm</span></>}</div>
        </div>
        <div style={{ background:"#F5F4F0", borderRadius:10, padding:"8px 6px", textAlign:"center" }}>
          <div style={{ fontSize:9, color:C.textSub, fontWeight:500, textTransform:"uppercase",
            letterSpacing:"0.06em", marginBottom:3 }}>Energy</div>
          <div style={{ fontSize:18, fontWeight:500, color:C.text }}>
            {r.kwh}<span style={{ fontSize:10, marginLeft:1 }}>kWh</span></div>
        </div>
      </div>
      {r.status==="critical" && (
        <div style={{ background:"#FCEBEB", borderRadius:8, padding:"8px 10px",
          fontSize:11, color:"#501313", lineHeight:1.5, marginBottom:10 }}>
          Biomo AI: CO₂ threshold exceeded. Boost ventilation immediately.</div>
      )}
      {r.status==="warning" && (
        <div style={{ background:"#FAEEDA", borderRadius:8, padding:"8px 10px",
          fontSize:11, color:"#412402", lineHeight:1.5, marginBottom:10 }}>
          Biomo AI: Elevated readings detected. Monitor closely and consider adjusting HVAC.</div>
      )}
      <div style={{ display:"flex", gap:6 }}>
        <button style={{ flex:1, fontSize:11, fontWeight:500, padding:"7px 0", borderRadius:8,
          background:"#2C2C2A", color:"#fff", border:"none", cursor:"pointer",
          fontFamily:"'DM Sans',sans-serif" }}>View history</button>
        <button style={{ flex:1, fontSize:11, fontWeight:500, padding:"7px 0", borderRadius:8,
          background:"transparent", color:C.textMid, border:`0.5px solid ${C.border}`,
          cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>Report issue</button>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
//  HOME SCREEN
// ─────────────────────────────────────────────
const HomeScreen = ({ setPage }) => {
  const metrics = [
    { label:"Air quality", val:"612",  unit:"ppm", color:C.green,   pill:"green", pillText:"Good",       arc:[67,27], arcBg:"#EAF3DE", to:"floors"  },
    { label:"Occupancy",   val:"47",   unit:"%",   color:C.blue,    pill:"blue",  pillText:"Normal",     arc:[44,50], arcBg:"#E6F1FB", to:"floors"  },
    { label:"Electricity", val:"3.8",  unit:"kWh", color:"#BA7517", pill:"amber", pillText:"+12% today", arc:[58,36], arcBg:"#FAEEDA", to:"reports" },
    { label:"Water",       val:"42",   unit:"L/d", color:C.green,   pill:"teal",  pillText:"On track",   arc:[35,59], arcBg:"#E1F5EE", to:null      },
  ];
  return (
    <ScreenBody>
      {/* header */}
      <div style={{ display:"flex", justifyContent:"space-between",
        alignItems:"flex-start", padding:"10px 0 8px" }}>
        <div>
          <div style={{ fontSize:22, fontWeight:500, color:C.text, letterSpacing:"-0.02em" }}>Biomo</div>
          <div style={{ fontSize:12, color:C.textSub, marginTop:1 }}>Design Factory · Live</div>
        </div>
        <div onClick={()=>setPage("alerts")} style={{ width:36, height:36, borderRadius:"50%",
          background:C.bgCard, border:`0.5px solid ${C.border}`,
          display:"flex", alignItems:"center", justifyContent:"center",
          position:"relative", cursor:"pointer" }}>
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
            <path d="M7.5 1.5C7.5 1.5 4.5 3 4.5 7V10.5H10.5V7C10.5 3 7.5 1.5 7.5 1.5Z" stroke="#444441" strokeWidth="1.2" fill="none"/>
            <path d="M3 10.5H12" stroke="#444441" strokeWidth="1.2" strokeLinecap="round"/>
            <path d="M6 10.5C6 11.33 6.67 12 7.5 12C8.33 12 9 11.33 9 10.5" stroke="#444441" strokeWidth="1.2" fill="none"/>
          </svg>
          <div style={{ width:7, height:7, background:C.red, borderRadius:"50%",
            position:"absolute", top:5, right:5, border:`1.5px solid ${C.bg}` }}/>
        </div>
      </div>
      {/* ticker */}
      <div style={{ background:"#2C2C2A", borderRadius:14, padding:"10px 14px",
        display:"flex", justifyContent:"space-between", marginBottom:14 }}>
        {[["Water","42 L","▼ −8%","#5DCAA5"],["Electricity","3.8 kWh","▲ +12%","#F0997B"],
          ["Air","612 ppm","Good","#5DCAA5"],["People","32/68","▼ −5","#F0997B"]].map(([l,v,c,col])=>(
          <div key={l} style={{ textAlign:"center" }}>
            <div style={{ fontSize:9, color:"rgba(255,255,255,0.4)", textTransform:"uppercase",
              letterSpacing:"0.07em", marginBottom:2 }}>{l}</div>
            <div style={{ fontSize:12, color:"#fff", fontWeight:500 }}>{v}</div>
            <div style={{ fontSize:10, color:col }}>{c}</div>
          </div>
        ))}
      </div>
      {/* metric cards */}
      <div style={{ fontSize:10, color:C.textSub, marginBottom:7 }}>Tap a card for details</div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:9, marginBottom:14 }}>
        {metrics.map(m=>(
          <div key={m.label} onClick={m.to?()=>setPage(m.to):undefined}
            style={{ background:C.bgCard, borderRadius:18, border:`0.5px solid ${C.border}`,
              padding:13, cursor:m.to?"pointer":"default" }}>
            <div style={{ fontSize:10, color:C.textSub, fontWeight:500, textTransform:"uppercase",
              letterSpacing:"0.06em", marginBottom:6 }}>{m.label}</div>
            <div style={{ display:"flex", alignItems:"flex-end", justifyContent:"space-between" }}>
              <div style={{ display:"flex", alignItems:"flex-end" }}>
                <span style={{ fontSize:26, fontWeight:500, lineHeight:1, color:m.color }}>{m.val}</span>
                <span style={{ fontSize:11, color:C.textSub, marginBottom:2, marginLeft:2 }}>{m.unit}</span>
              </div>
              <svg width="40" height="40" viewBox="0 0 40 40">
                <circle cx="20" cy="20" r="15" fill="none" stroke={m.arcBg} strokeWidth="5"/>
                <circle cx="20" cy="20" r="15" fill="none" stroke={m.color} strokeWidth="5"
                  strokeDasharray={`${m.arc[0]} ${m.arc[1]}`} strokeDashoffset="23" strokeLinecap="round"/>
              </svg>
            </div>
            <Pill color={m.pill} style={{ marginTop:5 }}>{m.pillText}</Pill>
          </div>
        ))}
      </div>
      {/* active alerts */}
      <SLabel>Active Alerts</SLabel>
      {ALERTS.filter(a=>a.sev==="critical"||a.sev==="warning").map(a=>(
        <div key={a.id} onClick={()=>setPage("alerts")}
          style={{ background:C.bgCard, borderRadius:14, border:`0.5px solid ${C.border}`,
            padding:"11px 13px", marginBottom:7, display:"flex", alignItems:"flex-start",
            gap:9, cursor:"pointer" }}>
          <div style={{ width:3, borderRadius:3, alignSelf:"stretch",
            background:a.sev==="critical"?C.red:C.amber, flexShrink:0 }}/>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:13, fontWeight:500, color:C.text, marginBottom:2 }}>{a.title}</div>
            <div style={{ fontSize:11, color:C.textSub, lineHeight:1.45 }}>{a.desc}</div>
          </div>
          <div style={{ color:"#C8C6C0", fontSize:17, alignSelf:"center" }}>›</div>
        </div>
      ))}
      {/* AI insights */}
      <SLabel>AI Insights</SLabel>
      <div style={{ background:"#E1F5EE", borderRadius:14, padding:"12px 13px",
        marginBottom:7, border:"0.5px solid #9FE1CB" }}>
        <div style={{ fontSize:10, fontWeight:500, letterSpacing:"0.08em",
          textTransform:"uppercase", color:"#0F6E56", marginBottom:4 }}>Waste detected</div>
        <div style={{ fontSize:12, lineHeight:1.55, color:"#085041" }}>
          Storage lights on 40 min with zero occupancy. HVAC running. Est. waste: 0.3 kWh.</div>
      </div>
      <div style={{ background:"#EEEDFE", borderRadius:14, padding:"12px 13px",
        marginBottom:7, border:"0.5px solid #CECBF6" }}>
        <div style={{ fontSize:10, fontWeight:500, letterSpacing:"0.08em",
          textTransform:"uppercase", color:"#3C3489", marginBottom:4 }}>Weekly pattern</div>
        <div style={{ fontSize:12, lineHeight:1.55, color:"#26215C" }}>
          Energy peaks 10–11 AM Tue/Wed. The Stage = 41% of total this week.</div>
      </div>
      {/* quick actions */}
      <SLabel>Quick Actions</SLabel>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:8, marginBottom:10 }}>
        {[["#E1F5EE","Floor map","floors",C.green],["#E6F1FB","Reports","reports",C.blue],
          ["#FAEEDA","Schedule",null,C.amber],["#EEEDFE","AI summary",null,"#534AB7"]].map(([bg,label,to,col])=>(
          <div key={label} onClick={to?()=>setPage(to):undefined}
            style={{ background:C.bgCard, border:`0.5px solid ${C.border}`, borderRadius:14,
              padding:12, display:"flex", alignItems:"center", gap:8,
              fontSize:12, fontWeight:500, color:C.text, cursor:to?"pointer":"default" }}>
            <div style={{ width:28, height:28, borderRadius:8, background:bg,
              display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="7" cy="7" r="5.5" stroke={col} strokeWidth="1.2"/>
              </svg>
            </div>
            {label}
          </div>
        ))}
      </div>
    </ScreenBody>
  );
};

// ─────────────────────────────────────────────
//  FLOORS SCREEN
// ─────────────────────────────────────────────
const FloorsScreen = () => {
  const [selected, setSelected] = useState(null);
  const highlighted = Object.keys(ROOMS).filter(id=>ROOMS[id].status!=="neutral");
  return (
    <ScreenBody>
      <div style={{ display:"flex", justifyContent:"space-between",
        alignItems:"center", padding:"10px 0 8px" }}>
        <div>
          <div style={{ fontSize:22, fontWeight:500, color:C.text, letterSpacing:"-0.02em" }}>Floor Map</div>
          <div style={{ fontSize:12, color:C.textSub, marginTop:1 }}>Live · Design Factory</div>
        </div>
        <div style={{ background:"#EAF3DE", borderRadius:8, padding:"5px 10px",
          fontSize:11, color:"#0F6E56", fontWeight:500 }}>● Live</div>
      </div>
      {/* legend */}
      <div style={{ display:"flex", gap:8, marginBottom:10, flexWrap:"wrap" }}>
        {Object.entries(STATUS).filter(([k])=>k!=="neutral").map(([k,v])=>(
          <div key={k} style={{ display:"flex", alignItems:"center", gap:4, fontSize:10, color:C.textSub }}>
            <div style={{ width:8, height:8, borderRadius:"50%", background:v.stroke }}/>{v.label}
          </div>
        ))}
      </div>
      {/* map */}
      <div style={{ borderRadius:12, overflow:"hidden",
        border:`0.5px solid ${C.border}`, background:"#fff", marginBottom:10 }}>
        <FloorMapSVG selected={selected} onSelect={setSelected} highlightIds={highlighted}/>
      </div>
      {/* panel */}
      {selected
        ? <RoomPanel roomId={selected} onClose={()=>setSelected(null)}/>
        : <div style={{ background:"#F5F4F0", borderRadius:12, padding:"11px 14px",
            marginBottom:10, fontSize:12, color:C.textSub, textAlign:"center" }}>
            Tap a room to see occupancy, air quality &amp; energy
          </div>
      }
      {/* live status */}
      <SLabel>Live Status</SLabel>
      <Card style={{ marginBottom:10 }}>
        {ALERTS.map((a,i)=>(
          <div key={a.id} style={{ display:"flex", justifyContent:"space-between",
            alignItems:"center", padding:"8px 0",
            borderBottom:i<ALERTS.length-1?`0.5px solid #F1EFE8`:"none", fontSize:11 }}>
            <span style={{ color:C.textMid }}>{a.title}</span>
            <Pill color={a.sev==="critical"?"red":"amber"}>
              {a.sev==="critical"?"Act now":"Monitor"}
            </Pill>
          </div>
        ))}
      </Card>
    </ScreenBody>
  );
};

// ─────────────────────────────────────────────
//  REPORTS SCREEN
// ─────────────────────────────────────────────
const ReportsScreen = () => {
  const [selRoom, setSelRoom] = useState(null);
  const topCO2 = Object.entries(ROOMS)
    .filter(([,r])=>r.co2!==null).sort(([,a],[,b])=>b.co2-a.co2).slice(0,5);
  const topEnergy = Object.entries(ROOMS)
    .filter(([,r])=>r.kwh>0).sort(([,a],[,b])=>b.kwh-a.kwh).slice(0,5);
  return (
    <ScreenBody>
      <div style={{ display:"flex", justifyContent:"space-between",
        alignItems:"flex-start", padding:"10px 0 8px" }}>
        <div>
          <div style={{ fontSize:22, fontWeight:500, color:C.text, letterSpacing:"-0.02em" }}>Reports</div>
          <div style={{ fontSize:12, color:C.textSub, marginTop:1 }}>Week of Apr 14–20</div>
        </div>
        <button style={{ fontSize:11, fontWeight:500, padding:"6px 11px", borderRadius:9,
          border:`0.5px solid ${C.border}`, background:C.bgCard, color:C.text,
          cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>Export PDF</button>
      </div>
      {/* AI summary */}
      <SLabel>AI Weekly Summary</SLabel>
      <Card style={{ marginBottom:10 }}>
        <div style={{ display:"flex", alignItems:"center", gap:9, marginBottom:9 }}>
          <div style={{ width:30, height:30, borderRadius:9, background:"#EAF3DE",
            display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="7" r="5.5" stroke={C.green} strokeWidth="1.2"/>
              <circle cx="7" cy="7" r="2" fill={C.green}/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize:13, fontWeight:500, color:C.text }}>Building performed well</div>
            <div style={{ fontSize:10, color:C.textSub }}>One pattern flagged · AI generated</div>
          </div>
          <Pill color="blue" style={{ marginLeft:"auto", whiteSpace:"nowrap" }}>Apr 14–20</Pill>
        </div>
        <div style={{ fontSize:12, color:C.textMid, lineHeight:1.6, marginBottom:10 }}>
          Energy +12% due to Wed workshop — The Stage drove most usage. Room 6 CO₂ critical on 3 occasions. Startup Sauna energy elevated.
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:7 }}>
          {[["−8%",C.green,"Water"],["+12%",C.amber,"Energy"],["3/4",C.green,"Goals met"]].map(([v,c,l])=>(
            <div key={l} style={{ background:"#F5F4F0", borderRadius:10, padding:9, textAlign:"center" }}>
              <div style={{ fontSize:17, fontWeight:500, color:c }}>{v}</div>
              <div style={{ fontSize:10, color:C.textSub, marginTop:2 }}>{l}</div>
            </div>
          ))}
        </div>
      </Card>
      {/* interactive map */}
      <SLabel>Room Inspector — tap a room</SLabel>
      <div style={{ borderRadius:12, overflow:"hidden",
        border:`0.5px solid ${C.border}`, background:"#fff", marginBottom:8 }}>
        <FloorMapSVG
          selected={selRoom} onSelect={setSelRoom}
          highlightIds={topEnergy.map(([id])=>id)}
        />
      </div>
      {selRoom
        ? <RoomPanel roomId={selRoom} onClose={()=>setSelRoom(null)}/>
        : <div style={{ background:"#F5F4F0", borderRadius:10, padding:"9px 12px",
            marginBottom:10, fontSize:11, color:C.textSub, textAlign:"center" }}>
            Highlighted = top energy consumers · tap to inspect
          </div>
      }
      {/* top CO2 */}
      <SLabel>Top CO₂ by Room</SLabel>
      <Card style={{ marginBottom:10 }}>
        {topCO2.map(([id,r],i)=>{
          const pct = Math.round((r.co2/topCO2[0][1].co2)*100);
          const col = r.co2>=1000?C.red:r.co2>=700?C.amber:C.green;
          return (
            <div key={id} onClick={()=>setSelRoom(selRoom===id?null:id)}
              style={{ display:"flex", alignItems:"center", gap:9, padding:"7px 0",
                borderBottom:i<topCO2.length-1?`0.5px solid #F1EFE8`:"none", cursor:"pointer" }}>
              <div style={{ fontSize:12, color:C.text, width:88, flexShrink:0 }}>{r.name}</div>
              <div style={{ flex:1, height:6, background:"#F1EFE8", borderRadius:3, overflow:"hidden" }}>
                <div style={{ width:`${pct}%`, height:"100%", background:col, borderRadius:3 }}/>
              </div>
              <div style={{ fontSize:11, fontWeight:500, color:col, width:56, textAlign:"right" }}>
                {r.co2} ppm</div>
            </div>
          );
        })}
      </Card>
      {/* top energy */}
      <SLabel>Top Energy by Room</SLabel>
      <Card style={{ marginBottom:10 }}>
        {topEnergy.map(([id,r],i)=>{
          const pct = Math.round((r.kwh/topEnergy[0][1].kwh)*100);
          return (
            <div key={id} onClick={()=>setSelRoom(selRoom===id?null:id)}
              style={{ display:"flex", alignItems:"center", gap:9, padding:"7px 0",
                borderBottom:i<topEnergy.length-1?`0.5px solid #F1EFE8`:"none", cursor:"pointer" }}>
              <div style={{ fontSize:12, color:C.text, width:88, flexShrink:0 }}>{r.name}</div>
              <div style={{ flex:1, height:6, background:"#F1EFE8", borderRadius:3, overflow:"hidden" }}>
                <div style={{ width:`${pct}%`, height:"100%", background:C.amber, borderRadius:3 }}/>
              </div>
              <div style={{ fontSize:11, fontWeight:500, color:C.amber, width:44, textAlign:"right" }}>
                {r.kwh} kWh</div>
            </div>
          );
        })}
      </Card>
      {/* goals */}
      <SLabel>April Goals</SLabel>
      <Card style={{ marginBottom:10 }}>
        {[["Water reduction",82,C.green,"#27500A"],["Energy target",61,C.amber,"#854F0B"],
          ["CO₂ < 800 ppm",74,C.blue,"#185FA5"],["Alerts resolved",90,"#5DCAA5","#0F6E56"]].map(([label,pct,bc,tc],i,a)=>(
          <div key={label} style={{ display:"flex", alignItems:"center", gap:9,
            marginBottom:i===a.length-1?0:8 }}>
            <div style={{ fontSize:12, color:C.text, flex:1 }}>{label}</div>
            <div style={{ width:80, height:6, background:"#F1EFE8", borderRadius:3, overflow:"hidden" }}>
              <div style={{ width:`${pct}%`, height:"100%", background:bc, borderRadius:3 }}/>
            </div>
            <div style={{ fontSize:11, fontWeight:500, width:28, textAlign:"right", color:tc }}>{pct}%</div>
          </div>
        ))}
      </Card>
    </ScreenBody>
  );
};

// ─────────────────────────────────────────────
//  ALERTS SCREEN
// ─────────────────────────────────────────────
const AlertsScreen = () => {
  const [activeCat, setActiveCat] = useState("Temperature");
  const [expandedAlert, setExpandedAlert] = useState(null);
  const sevColor = { critical:C.red, warning:C.amber, moderate:C.amber };
  return (
    <ScreenBody>
      <div style={{ display:"flex", justifyContent:"space-between",
        alignItems:"flex-start", padding:"10px 0 8px" }}>
        <div>
          <div style={{ fontSize:22, fontWeight:500, color:C.text, letterSpacing:"-0.02em" }}>Alerts</div>
          <div style={{ fontSize:12, color:C.textSub, marginTop:1 }}>
            {ALERTS.length} active · 1 resolved today</div>
        </div>
        <Pill color="red">{ALERTS.length} active</Pill>
      </div>
      <div style={{ display:"flex", gap:5, flexWrap:"wrap", marginBottom:12 }}>
        {["All","Critical","Warning","Resolved"].map((f,i)=>(
          <div key={f} style={{ fontSize:11, fontWeight:500, padding:"4px 11px", borderRadius:20,
            background:i===0?"#2C2C2A":"transparent", color:i===0?"#fff":C.textSub,
            border:i===0?"none":`0.5px solid ${C.border}`, cursor:"pointer" }}>{f}</div>
        ))}
      </div>
      {ALERTS.map(a=>{
        const r = ROOMS[a.roomId];
        const isExp = expandedAlert===a.id;
        return (
          <div key={a.id} style={{ background:C.bgCard, borderRadius:16,
            border:`0.5px solid ${C.border}`, padding:14, marginBottom:9,
            borderLeft:`3px solid ${sevColor[a.sev]}` }}>
            {/* header */}
            <div style={{ display:"flex", justifyContent:"space-between",
              alignItems:"flex-start", marginBottom:6 }}>
              <div style={{ display:"flex", alignItems:"center", gap:7, flex:1, paddingRight:8 }}>
                <div style={{ width:7, height:7, borderRadius:"50%",
                  background:sevColor[a.sev], flexShrink:0 }}/>
                <div style={{ fontSize:13, fontWeight:500, color:C.text }}>{a.title}</div>
              </div>
              <div style={{ fontSize:10, color:C.textSub, whiteSpace:"nowrap" }}>{a.time}</div>
            </div>
            <div style={{ fontSize:12, color:C.textMid, lineHeight:1.5, marginBottom:8 }}>{a.desc}</div>
            {/* sensor mini-row */}
            {r.co2 && (
              <div style={{ display:"flex", gap:6, marginBottom:8 }}>
                {[["CO₂",`${r.co2} ppm`],["Occupancy",`${r.occupancy}%`],["Energy",`${r.kwh} kWh`]].map(([k,v])=>(
                  <div key={k} style={{ flex:1, background:"#F5F4F0", borderRadius:8,
                    padding:"5px 7px", textAlign:"center" }}>
                    <div style={{ fontSize:9, color:C.textSub, fontWeight:500,
                      textTransform:"uppercase", letterSpacing:"0.06em" }}>{k}</div>
                    <div style={{ fontSize:12, fontWeight:500, color:C.text, marginTop:2 }}>{v}</div>
                  </div>
                ))}
              </div>
            )}
            {/* floor map toggle */}
            <div onClick={()=>setExpandedAlert(isExp?null:a.id)}
              style={{ fontSize:11, color:C.textSub, marginBottom:isExp?8:0,
                cursor:"pointer", display:"flex", alignItems:"center", gap:4 }}>
              <span style={{ fontSize:13 }}>{isExp?"▾":"▸"}</span>
              Show on floor map
            </div>
            {isExp && (
              <div style={{ borderRadius:10, overflow:"hidden",
                border:`0.5px solid ${C.border}`, marginBottom:8 }}>
                <FloorMapSVG
                  selected={a.roomId} onSelect={()=>{}}
                  highlightIds={[a.roomId]}
                />
              </div>
            )}
            {/* actions */}
            <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginTop:8 }}>
              <button style={{ fontSize:11, fontWeight:500, padding:"6px 12px", borderRadius:8,
                background:"#2C2C2A", color:"#fff", border:"none", cursor:"pointer",
                fontFamily:"'DM Sans',sans-serif" }}>
                {a.sev==="critical"?"Boost HVAC":"Schedule fix"}
              </button>
              <button style={{ fontSize:11, fontWeight:500, padding:"6px 12px", borderRadius:8,
                border:`0.5px solid ${C.border}`, background:"transparent", color:C.textMid,
                cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>Dismiss</button>
              <button style={{ fontSize:11, fontWeight:500, padding:"6px 12px", borderRadius:8,
                border:`0.5px solid ${C.border}`, background:"transparent", color:C.textMid,
                cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>History</button>
            </div>
          </div>
        );
      })}
      {/* resolved */}
      <div style={{ background:C.bgCard, borderRadius:16, border:`0.5px solid ${C.border}`,
        padding:14, marginBottom:9, borderLeft:`3px solid ${C.green}` }}>
        <div style={{ display:"flex", justifyContent:"space-between",
          alignItems:"flex-start", marginBottom:6 }}>
          <div style={{ display:"flex", alignItems:"center", gap:7 }}>
            <div style={{ width:7, height:7, borderRadius:"50%", background:C.green }}/>
            <div style={{ fontSize:13, fontWeight:500, color:C.text }}>
              Water spike Apr 10 — resolved</div>
          </div>
          <div style={{ fontSize:10, color:C.textSub }}>Apr 10</div>
        </div>
        <div style={{ fontSize:12, color:C.textMid, lineHeight:1.5, marginBottom:6 }}>
          68 L spike (+70%). Cleaning crew overtime. No leak. Auto-resolved.</div>
        <Pill color="green">Resolved automatically</Pill>
      </div>
      {/* report form */}
      <SLabel>Report an Issue</SLabel>
      <Card style={{ marginBottom:10 }}>
        <div style={{ fontSize:13, fontWeight:500, color:C.text, marginBottom:8 }}>
          Something wrong in the building?</div>
        <div style={{ fontSize:11, color:C.textSub, marginBottom:6 }}>Category</div>
        <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:10 }}>
          {["Temperature","Lights","Noise","Air quality","Equipment","Other"].map(cat=>(
            <div key={cat} onClick={()=>setActiveCat(cat)}
              style={{ fontSize:11, fontWeight:500, padding:"4px 10px", borderRadius:20,
                border:`0.5px solid ${activeCat===cat?"#2C2C2A":C.border}`,
                background:activeCat===cat?"#2C2C2A":"#F5F4F0",
                color:activeCat===cat?"#fff":C.textMid, cursor:"pointer" }}>{cat}</div>
          ))}
        </div>
        <div style={{ fontSize:11, color:C.textSub, marginBottom:4 }}>Location</div>
        <select style={{ width:"100%", border:`0.5px solid ${C.border}`, borderRadius:10,
          padding:9, fontSize:12, color:C.text, background:"#F5F4F0",
          fontFamily:"'DM Sans',sans-serif", marginBottom:8 }}>
          {Object.values(ROOMS).filter(r=>r.occupancy!==null).map(r=>(
            <option key={r.name}>{r.name}</option>
          ))}
        </select>
        <div style={{ border:`0.5px solid ${C.border}`, borderRadius:10, padding:10,
          fontSize:12, color:C.textSub, background:"#F5F4F0", minHeight:56 }}>
          Describe the issue…</div>
        <button style={{ width:"100%", background:"#2C2C2A", color:"#fff", border:"none",
          borderRadius:12, padding:13, fontSize:13, fontWeight:500, marginTop:10,
          cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>Submit Report</button>
      </Card>
    </ScreenBody>
  );
};

// ─────────────────────────────────────────────
//  SETTINGS SCREEN
// ─────────────────────────────────────────────
const SettingsScreen = () => (
  <ScreenBody>
    <div style={{ padding:"10px 0 8px" }}>
      <div style={{ fontSize:22, fontWeight:500, color:C.text, letterSpacing:"-0.02em" }}>Settings</div>
      <div style={{ fontSize:12, color:C.textSub, marginTop:1 }}>Design Factory</div>
    </div>
    {[
      { title:"Notifications", items:["Alert thresholds","Email digests","Push notifications"] },
      { title:"Building",      items:["Zones & rooms","Sensor configuration","HVAC schedule"] },
      { title:"Account",       items:["Profile","Team members","API access"] },
    ].map(section=>(
      <div key={section.title}>
        <SLabel>{section.title}</SLabel>
        <Card style={{ marginBottom:10 }}>
          {section.items.map((item,i)=>(
            <div key={item} style={{ display:"flex", justifyContent:"space-between",
              alignItems:"center", padding:"10px 0",
              borderBottom:i<section.items.length-1?`0.5px solid #F1EFE8`:"none",
              cursor:"pointer", fontSize:13, color:C.text }}>
              <span>{item}</span>
              <span style={{ color:"#C8C6C0", fontSize:17 }}>›</span>
            </div>
          ))}
        </Card>
      </div>
    ))}
    <div style={{ textAlign:"center", padding:"12px 0" }}>
      <div style={{ fontSize:11, color:C.textSub }}>Biomo v3.2.0 · Design Factory</div>
    </div>
  </ScreenBody>
);

// ─────────────────────────────────────────────
//  ROOT
// ─────────────────────────────────────────────
export default function BiomoApp() {
  const [page, setPage] = useState("home");
  return (
    <div style={{ display:"flex", justifyContent:"center", alignItems:"flex-start",
      padding:"24px 0 48px", minHeight:"100vh",
      background:"#ECEAE4", fontFamily:"'DM Sans', sans-serif" }}>
      <div style={{ width:340, background:C.bg, borderRadius:42,
        border:`1.5px solid ${C.border}`, overflow:"hidden",
        display:"flex", flexDirection:"column",
        boxShadow:"0 24px 64px rgba(0,0,0,0.14)", height:720 }}>
        <StatusBar/>
        <div style={{ flex:1, overflow:"hidden", display:"flex", flexDirection:"column" }}>
          {page==="home"     && <HomeScreen    setPage={setPage}/>}
          {page==="floors"   && <FloorsScreen/>}
          {page==="reports"  && <ReportsScreen/>}
          {page==="alerts"   && <AlertsScreen/>}
          {page==="settings" && <SettingsScreen/>}
        </div>
        <BottomNav active={page} setPage={setPage}/>
      </div>
    </div>
  );
}
