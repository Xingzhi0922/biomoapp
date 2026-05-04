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
  // busy: currently in use, noise: dB, co2: ppm, kwh: today
  kafis:       { name:"Kafis",         busy:true,  co2:460,  kwh:1.2, noise:52, status:"good"     },
  hub:         { name:"The Hub",       busy:true,  co2:690,  kwh:2.1, noise:61, status:"good"     },
  room1:       { name:"Room 1",        busy:true,  co2:820,  kwh:0.4, noise:58, status:"moderate" },
  room2:       { name:"Room 2",        busy:true,  co2:540,  kwh:0.3, noise:44, status:"good"     },
  room3:       { name:"Room 3",        busy:false, co2:430,  kwh:0.1, noise:32, status:"good"     },
  room4:       { name:"Room 4",        busy:false, co2:410,  kwh:0.1, noise:30, status:"good"     },
  room5:       { name:"Room 5",        busy:false, co2:420,  kwh:0.1, noise:32, status:"good"     },
  room6:       { name:"Room 6",        busy:true,  co2:1240, kwh:0.5, noise:67, status:"critical" },
  room7:       { name:"Room 7",        busy:true,  co2:580,  kwh:0.3, noise:46, status:"good"     },
  room8:       { name:"Room 8",        busy:false, co2:500,  kwh:0.2, noise:38, status:"good"     },
  "wc-left":   { name:"WC (Left)",     busy:null,  co2:null, kwh:0.1, noise:null,status:"neutral" },
  "wc-center": { name:"WC (Center)",   busy:null,  co2:null, kwh:0.1, noise:null,status:"neutral" },
  stage:       { name:"The Stage",     busy:true,  co2:950,  kwh:3.8, noise:71, status:"warning"  },
  printshop:   { name:"Print Shop",    busy:true,  co2:510,  kwh:1.6, noise:58, status:"good"     },
  sauna:       { name:"Startup Sauna", busy:false, co2:780,  kwh:4.2, noise:48, status:"moderate" },
  stair:       { name:"Staircase",     busy:null,  co2:null, kwh:0.0, noise:null,status:"neutral" },
  elevator:    { name:"Elevator",      busy:null,  co2:null, kwh:0.2, noise:null,status:"neutral" },
  storage:     { name:"Storage",       busy:false, co2:null, kwh:0.1, noise:null,status:"neutral" },
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
    desc:"1,240 ppm · Room 6 busy · ventilation low", time:"2:15 PM" },
  { id:"a2", roomId:"stage", sev:"warning",  title:"High CO₂ — The Stage",
    desc:"950 ppm · The Stage busy · HVAC at medium",  time:"1:40 PM" },
  { id:"a3", roomId:"sauna", sev:"warning",  title:"Elevated energy — Startup Sauna",
    desc:"4.2 kWh today · +28% vs yesterday",     time:"11:20 AM" },
  { id:"a4", roomId:"room1", sev:"moderate", title:"Room 1 fully occupied",
    desc:"Room 1 busy · CO₂ rising to 820 ppm", time:"10:05 AM" },
];

// ─────────────────────────────────────────────
//  TIME-SERIES DATA  (building-wide)
// ─────────────────────────────────────────────
const DAYS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

const ENERGY_SERIES = {
  thisWeek: [18.2,21.4,28.6,22.1,19.8,11.2,8.4],
  lastWeek: [17.5,19.8,24.2,20.6,18.4,10.8,7.9],
  monthAvg: [16.8,18.9,22.1,19.4,17.6,10.1,7.4],
};
const CO2_SERIES = {
  thisWeek: [540,610,780,650,590,420,380],
  lastWeek: [510,580,720,620,560,400,360],
  monthAvg: [495,555,690,600,540,390,350],
};
const OCC_SERIES = {
  thisWeek: [62,71,88,74,65,28,14],
  lastWeek: [58,67,82,70,61,25,12],
  monthAvg: [55,64,79,68,59,23,11],
};
const NOISE_SERIES = {
  thisWeek: [54,58,68,62,56,41,36],
  lastWeek: [51,55,64,59,53,39,34],
  monthAvg: [49,53,62,57,51,38,33],
};

const ROOM_HISTORY = {
  kafis:     { co2:[480,510,530,460,490,310,280], occ:[16,19,20,18,17,8,5],   kwh:[1.1,1.3,1.5,1.2,1.2,0.6,0.4], noise:[49,52,55,52,50,38,32] },
  hub:       { co2:[650,700,740,690,710,410,360], occ:[14,17,18,17,16,8,5],   kwh:[2.0,2.2,2.6,2.1,2.0,1.0,0.7], noise:[57,61,64,61,59,42,35] },
  room1:     { co2:[760,800,850,820,800,520,480], occ:[7,8,8,8,8,4,2],        kwh:[0.4,0.4,0.5,0.4,0.4,0.2,0.1], noise:[54,57,60,58,56,38,30] },
  room2:     { co2:[500,530,560,540,520,340,300], occ:[3,4,5,4,4,2,1],        kwh:[0.3,0.3,0.3,0.3,0.3,0.1,0.1], noise:[41,44,47,44,43,32,28] },
  room3:     { co2:[580,620,650,610,600,390,350], occ:[5,6,7,6,6,3,2],        kwh:[0.3,0.3,0.4,0.3,0.3,0.1,0.1], noise:[46,49,52,49,48,35,29] },
  room4:     { co2:[450,480,500,480,470,310,280], occ:[1,2,3,2,2,1,0],        kwh:[0.2,0.2,0.2,0.2,0.2,0.1,0.0], noise:[35,38,40,38,37,28,22] },
  room5:     { co2:[400,420,440,420,410,280,260], occ:[0,0,0,0,0,0,0],        kwh:[0.1,0.1,0.1,0.1,0.1,0.0,0.0], noise:[30,32,33,32,31,25,20] },
  room6:     { co2:[1100,1180,1240,1200,1160,680,590], occ:[2,2,2,2,2,1,1],   kwh:[0.5,0.5,0.5,0.5,0.5,0.3,0.2], noise:[62,65,68,65,63,45,38] },
  room7:     { co2:[540,570,600,580,560,370,330], occ:[3,4,5,4,4,2,1],        kwh:[0.3,0.3,0.3,0.3,0.3,0.1,0.1], noise:[43,46,49,46,45,33,27] },
  room8:     { co2:[600,640,680,640,620,400,360], occ:[5,6,7,6,6,3,2],        kwh:[0.4,0.4,0.4,0.4,0.4,0.2,0.1], noise:[50,53,56,53,51,37,31] },
  stage:     { co2:[880,920,980,950,910,540,480], occ:[30,36,40,36,34,10,5],  kwh:[3.6,3.8,4.2,3.8,3.7,1.8,1.2], noise:[65,69,73,70,67,48,40] },
  printshop: { co2:[480,510,530,510,500,320,290], occ:[3,4,5,4,4,2,1],        kwh:[1.5,1.6,1.8,1.6,1.5,0.8,0.5], noise:[54,57,60,57,56,40,34] },
  sauna:     { co2:[720,760,800,780,750,480,420], occ:[4,6,8,6,5,3,2],        kwh:[4.0,4.2,4.6,4.2,4.0,2.2,1.6], noise:[44,47,50,48,46,36,30] },
};

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
//  LINE CHART  (pure SVG)
// ─────────────────────────────────────────────
const LineChart = ({ series, labels, colors, height=90 }) => {
  const W=280, H=height, PL=32, PR=8, PT=8, PB=24;
  const iW=W-PL-PR, iH=H-PT-PB;
  const allV=series.flatMap(s=>s);
  const minV=Math.min(...allV), maxV=Math.max(...allV), range=maxV-minV||1;
  const px=(i)=>PL+i*(iW/(labels.length-1));
  const py=(v)=>PT+iH-(((v-minV)/range)*iH);
  const pts=(vals)=>vals.map((v,i)=>`${px(i).toFixed(1)},${py(v).toFixed(1)}`).join(" ");
  const ticks=[minV, Math.round(minV+range*0.5), maxV];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{display:"block",overflow:"visible"}}>
      {ticks.map(t=>(
        <line key={t} x1={PL} y1={py(t)} x2={W-PR} y2={py(t)} stroke="#F1EFE8" strokeWidth="1"/>
      ))}
      {ticks.map(t=>(
        <text key={`tl${t}`} x={PL-4} y={py(t)+4} textAnchor="end"
          fontSize="8" fill="#B4B2A9" fontFamily="Arial,sans-serif">{Math.round(t)}</text>
      ))}
      {labels.map((l,i)=>(
        <text key={l} x={px(i)} y={H-4} textAnchor="middle"
          fontSize="8" fill="#B4B2A9" fontFamily="Arial,sans-serif">{l}</text>
      ))}
      {series.map((vals,si)=>(
        <polyline key={si} points={pts(vals)} fill="none"
          stroke={colors[si]} strokeWidth={si===0?2:1.2}
          strokeDasharray={si===1?"5,3":si===2?"2,2":"none"}
          strokeLinecap="round" strokeLinejoin="round" opacity={si===0?1:0.55}/>
      ))}
      <circle cx={px(4)} cy={py(series[0][4])} r="3.5"
        fill={colors[0]} stroke="#fff" strokeWidth="1.5"/>
    </svg>
  );
};

// ─────────────────────────────────────────────
//  ROOM HISTORY MODAL (bottom sheet)
// ─────────────────────────────────────────────
const RoomHistoryModal = ({ roomId, onClose }) => {
  const [metric, setMetric] = useState("co2");
  const r=ROOMS[roomId], h=ROOM_HISTORY[roomId];
  if (!r||!h) return null;
  const sc=STATUS[r.status];
  const mCfg = {
    co2:   { label:"CO₂",     unit:"ppm", color:r.co2>=1000?C.red:r.co2>=700?C.amber:C.green, vals:h.co2   },
    occ:   { label:"Status",  unit:"%",   color:C.blue,                                         vals:h.occ   },
    kwh:   { label:"Energy",  unit:"kWh", color:C.amber,                                        vals:h.kwh   },
    noise: { label:"Noise",   unit:"dB",  color:"#7C5CBF",                                      vals:h.noise },
  };
  const mc=mCfg[metric];
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.45)",
      display:"flex", alignItems:"flex-end", zIndex:200 }} onClick={onClose}>
      <div style={{ background:C.bg, borderRadius:"20px 20px 0 0", width:"100%",
        padding:"0 16px 32px", maxHeight:"88vh", overflowY:"auto" }}
        onClick={e=>e.stopPropagation()}>
        {/* drag handle */}
        <div style={{ display:"flex", justifyContent:"center", paddingTop:12, marginBottom:10 }}>
          <div style={{ width:36, height:4, borderRadius:2, background:C.border }}/>
        </div>
        <div style={{ display:"flex", justifyContent:"space-between",
          alignItems:"center", marginBottom:14 }}>
          <div>
            <div style={{ fontSize:17, fontWeight:500, color:C.text }}>{r.name} — History</div>
            <div style={{ fontSize:11, color:C.textSub }}>Last 7 days</div>
          </div>
          <div onClick={onClose} style={{ width:30, height:30, borderRadius:"50%",
            background:C.bgCard, border:`0.5px solid ${C.border}`,
            display:"flex", alignItems:"center", justifyContent:"center",
            cursor:"pointer", fontSize:16, color:C.textSub }}>×</div>
        </div>
        {/* today snapshot */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:6, marginBottom:14 }}>
          {[
            ["Status",  r.busy===null?"—":r.busy?"Busy":"Free",
              r.busy===null?"#C8C6C0":r.busy?C.amber:C.green],
            ["CO₂",     r.co2?`${r.co2}`:"—",
              r.co2>=1000?C.red:r.co2>=700?C.amber:C.green],
            ["Energy",  `${r.kwh}`,   C.amber],
            ["Noise",   r.noise?`${r.noise} dB`:"—",
              r.noise>=70?C.red:r.noise>=60?C.amber:"#7C5CBF"],
          ].map(([k,v,col])=>(
            <div key={k} style={{ background:C.bgCard, borderRadius:10, padding:"7px 4px",
              textAlign:"center", border:`0.5px solid ${C.border}` }}>
              <div style={{ fontSize:8, color:C.textSub, fontWeight:500, textTransform:"uppercase",
                letterSpacing:"0.05em", marginBottom:3 }}>{k}</div>
              <div style={{ fontSize:14, fontWeight:600, color:col, lineHeight:1.1 }}>{v}</div>
              <div style={{ fontSize:8, color:C.textSub, marginTop:2 }}>
                {k==="CO₂"?"ppm":k==="Energy"?"kWh":"today"}</div>
            </div>
          ))}
        </div>
        {/* metric tab switcher */}
        <div style={{ display:"flex", background:"#F1EFE8", borderRadius:9, padding:3, gap:2, marginBottom:12 }}>
          {Object.entries(mCfg).map(([k,cfg])=>(
            <div key={k} onClick={()=>setMetric(k)} style={{ flex:1, fontSize:10, fontWeight:500,
              padding:"5px 4px", textAlign:"center", borderRadius:7, cursor:"pointer",
              background:metric===k?"#fff":"transparent", color:metric===k?C.text:C.textSub,
              border:metric===k?`0.5px solid ${C.border}`:"none" }}>
              {cfg.label}
            </div>
          ))}
        </div>
        {/* chart */}
        <Card style={{ marginBottom:12 }}>
          <div style={{ fontSize:11, fontWeight:500, color:C.text, marginBottom:8 }}>
            {mc.label} ({mc.unit}) — This week</div>
          <LineChart series={[mc.vals]} labels={DAYS} colors={[mc.color]} height={80}/>
          <div style={{ display:"flex", justifyContent:"space-around", marginTop:10 }}>
            {[["Min",Math.min(...mc.vals)],["Avg",Math.round(mc.vals.reduce((a,b)=>a+b,0)/mc.vals.length)],["Max",Math.max(...mc.vals)]].map(([k,v])=>(
              <div key={k} style={{ textAlign:"center" }}>
                <div style={{ fontSize:9, color:C.textSub, textTransform:"uppercase",
                  letterSpacing:"0.06em", marginBottom:2 }}>{k}</div>
                <div style={{ fontSize:14, fontWeight:500, color:C.text }}>
                  {v}<span style={{ fontSize:9, marginLeft:1, color:C.textSub }}>{mc.unit}</span></div>
              </div>
            ))}
          </div>
        </Card>
        {r.status!=="neutral" && (
          <div style={{ background:r.status==="critical"?"#FCEBEB":r.status==="warning"?"#FAEEDA":"#E1F5EE",
            borderRadius:10, padding:"10px 12px", fontSize:11, lineHeight:1.6,
            color:r.status==="critical"?"#501313":r.status==="warning"?"#412402":"#085041" }}>
            <span style={{ fontWeight:600 }}>Biomo AI: </span>
            {r.status==="critical"
              ?"CO₂ critically elevated all week. Reduce max occupancy and fix ventilation."
              :r.status==="warning"
              ?"Elevated on Wed—matches peak occupancy. Pre-schedule HVAC boost for next week."
              :"Readings within normal range. No action required."}
          </div>
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
//  ROOM PANEL  (live snapshot + view history)
// ─────────────────────────────────────────────
const RoomPanel = ({ roomId, onClose }) => {
  const [showHist, setShowHist] = useState(false);
  const r=ROOMS[roomId];
  if (!r) return null;
  const sc=STATUS[r.status];
  return (
    <>
      {showHist && <RoomHistoryModal roomId={roomId} onClose={()=>setShowHist(false)}/>}
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
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:6, marginBottom:10 }}>
          {/* Busy / Available */}
          <div style={{ background: r.busy===null?"#F5F4F0":r.busy?"#FAEEDA":"#EAF3DE",
            borderRadius:10, padding:"8px 4px", textAlign:"center" }}>
            <div style={{ fontSize:8, color:C.textSub, fontWeight:500, textTransform:"uppercase",
              letterSpacing:"0.05em", marginBottom:3 }}>Status</div>
            <div style={{ fontSize:13, fontWeight:700, lineHeight:1.2,
              color:r.busy===null?"#C8C6C0":r.busy?C.amber:C.green }}>
              {r.busy===null?"—":r.busy?"Busy":"Free"}</div>
            <div style={{ fontSize:8, color:C.textSub, marginTop:2 }}>now</div>
          </div>
          {/* CO₂ */}
          <div style={{ background:r.co2?sc.fill:"#F5F4F0", borderRadius:10, padding:"8px 4px", textAlign:"center" }}>
            <div style={{ fontSize:8, color:C.textSub, fontWeight:500, textTransform:"uppercase",
              letterSpacing:"0.05em", marginBottom:3 }}>CO₂</div>
            <div style={{ fontSize:16, fontWeight:600, lineHeight:1.1,
              color:r.co2===null?"#C8C6C0":r.co2>=1000?C.red:r.co2>=700?C.amber:C.green }}>
              {r.co2===null?"—":r.co2}</div>
            {r.co2&&<div style={{ fontSize:8, color:C.textSub, marginTop:1 }}>ppm</div>}
          </div>
          {/* Energy */}
          <div style={{ background:"#F5F4F0", borderRadius:10, padding:"8px 4px", textAlign:"center" }}>
            <div style={{ fontSize:8, color:C.textSub, fontWeight:500, textTransform:"uppercase",
              letterSpacing:"0.05em", marginBottom:3 }}>Energy</div>
            <div style={{ fontSize:16, fontWeight:600, lineHeight:1.1, color:C.amber }}>
              {r.kwh}</div>
            <div style={{ fontSize:8, color:C.textSub, marginTop:1 }}>kWh</div>
          </div>
          {/* Noise */}
          <div style={{ background:"#F5F4F0", borderRadius:10, padding:"8px 4px", textAlign:"center" }}>
            <div style={{ fontSize:8, color:C.textSub, fontWeight:500, textTransform:"uppercase",
              letterSpacing:"0.05em", marginBottom:3 }}>Noise</div>
            <div style={{ fontSize:16, fontWeight:600, lineHeight:1.1,
              color:r.noise===null?"#C8C6C0":r.noise>=70?C.red:r.noise>=60?C.amber:"#7C5CBF" }}>
              {r.noise===null?"—":r.noise}</div>
            {r.noise&&<div style={{ fontSize:8, color:C.textSub, marginTop:1 }}>dB</div>}
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
            Biomo AI: Elevated readings. Monitor closely.</div>
        )}
        <div style={{ display:"flex", gap:6 }}>
          {ROOM_HISTORY[roomId] && (
            <button onClick={()=>setShowHist(true)}
              style={{ flex:1, fontSize:11, fontWeight:500, padding:"7px 0", borderRadius:8,
                background:"#2C2C2A", color:"#fff", border:"none", cursor:"pointer",
                fontFamily:"'DM Sans',sans-serif" }}>View history</button>
          )}
          <button style={{ flex:1, fontSize:11, fontWeight:500, padding:"7px 0", borderRadius:8,
            background:"transparent", color:C.textMid, border:`0.5px solid ${C.border}`,
            cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>Report issue</button>
        </div>
      </div>
    </>
  );
};

// ─────────────────────────────────────────────
//  HOME SCREEN
// ─────────────────────────────────────────────
const HomeScreen = ({ setPage }) => {
  const metrics = [
    { label:"Air quality", val:"612",  unit:"ppm", color:C.green,   pill:"green", pillText:"Good",       arc:[67,27], arcBg:"#EAF3DE", to:"floors"  },
    { label:"Utilisation", val:"8",    unit:"/13",  color:C.blue,    pill:"blue",  pillText:"8 rooms busy", arc:[44,50], arcBg:"#E6F1FB", to:"floors"  },
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
          ["Air","612 ppm","Good","#5DCAA5"],["Rooms","8/13 busy","▼ −1","#5DCAA5"]].map(([l,v,c,col])=>(
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
//  REPORTS — data & helpers
// ─────────────────────────────────────────────
const MONTHS = ["Oct","Nov","Dec","Jan","Feb","Mar","Apr"];
const WEEKS  = ["W1","W2","W3","W4"];

const E_MON = { cur:[142,138,151,145,134,128,126], prev:[155,149,162,158,148,141,139] };
const C_MON = { cur:[590,570,640,620,560,530,545], prev:[630,610,680,660,600,572,588] };
const O_MON = { cur:[58,54,62,60,55,52,54],        prev:[61,57,65,63,58,55,57]       };
const E_WEE = { cur:[32.4,35.8,38.2,37.4],         prev:[30.1,33.6,36.0,35.1]        };
const C_WEE = { cur:[558,572,591,584],              prev:[581,595,614,602]            };
const O_WEE = { cur:[52,56,60,57],                  prev:[49,53,58,55]                };

const ScoreRing = ({ pct, color, size=48 }) => {
  const R=17, circ=2*Math.PI*R;
  return (
    <svg width={size} height={size} viewBox="0 0 44 44">
      <circle cx="22" cy="22" r={R} fill="none" stroke="#F1EFE8" strokeWidth="5"/>
      <circle cx="22" cy="22" r={R} fill="none" stroke={color} strokeWidth="5"
        strokeDasharray={`${circ*(pct/100)} ${circ*(1-pct/100)}`}
        strokeDashoffset={circ*0.25} strokeLinecap="round"/>
      <text x="22" y="26" textAnchor="middle" fontSize="9" fontWeight="700"
        fill={color} fontFamily="Arial,sans-serif">{pct}%</text>
    </svg>
  );
};

// ─────────────────────────────────────────────
//  REPORTS SCREEN
// ─────────────────────────────────────────────
const ReportsScreen = () => {
  const [metric, setMetric] = useState("energy");
  const [range,  setRange]  = useState("month");

  const CFG = {
    energy: {
      label:"Electricity", unit:"kWh/day", color:C.amber,
      score:61, scoreLabel:"vs target",
      monthData:E_MON, weekData:E_WEE,
      thisWeekTotal:"149.7 kWh", vsLast:"+12%", vsLastBad:true, monthAvg:"138.4 kWh/day",
      insight:"Wed peak (+34%) driven by The Stage workshop. Pre-scheduling HVAC could cut approximately 15% next week.",
      insightBg:"#FAEEDA", insightColor:"#412402",
      goals:[
        { label:"Daily target <= 20 kWh", pct:61, color:C.amber, tc:"#854F0B" },
        { label:"Week vs last week",       pct:55, color:C.red,   tc:"#791F1F" },
        { label:"Month vs last month",     pct:72, color:C.amber, tc:"#854F0B" },
      ],
    },
    co2: {
      label:"Air Quality", unit:"ppm avg", color:C.green,
      score:74, scoreLabel:"rooms OK",
      monthData:C_MON, weekData:C_WEE,
      thisWeekTotal:"584 ppm", vsLast:"-4%", vsLastBad:false, monthAvg:"574 ppm",
      insight:"Room 6 exceeded 1,000 ppm on 3 days. Building average trending down vs last month — good progress.",
      insightBg:"#E1F5EE", insightColor:"#085041",
      goals:[
        { label:"Rooms below 800 ppm",     pct:74, color:C.green, tc:"#27500A" },
        { label:"Week avg improvement",     pct:80, color:C.green, tc:"#27500A" },
        { label:"Critical events vs prev",  pct:55, color:C.amber, tc:"#854F0B" },
      ],
    },
    occ: {
      label:"Room Utilisation", unit:"% rooms busy", color:C.blue,
      score:62, scoreLabel:"rooms in use",
      monthData:O_MON, weekData:O_WEE,
      thisWeekTotal:"62% busy",  vsLast:"+8%", vsLastBad:false, monthAvg:"54% busy",
      insight:"Average 62% of rooms in use this week. Wed peak at 85% — all meeting rooms occupied. 3 rooms consistently unused Mon–Fri.",
      insightBg:"#E6F1FB", insightColor:"#042C53",
      goals:[
        { label:"Utilisation > 60% on weekdays", pct:62, color:C.blue,  tc:"#185FA5" },
        { label:"No room idle > 3 days",          pct:55, color:C.amber, tc:"#854F0B" },
        { label:"Weekend rooms in use",           pct:30, color:C.amber, tc:"#854F0B" },
      ],
    },
    noise: {
      label:"Noise", unit:"dB avg", color:"#7C5CBF",
      score:78, scoreLabel:"dB avg OK",
      monthData:{ cur:[52,50,56,54,49,48,51], prev:[55,53,59,57,52,51,54] },
      weekData:{ cur:[52,55,62,58,53,43,38], prev:[49,52,58,55,50,41,36] },
      thisWeekTotal:"52 dB avg", vsLast:"+3 dB", vsLastBad:true, monthAvg:"49 dB",
      insight:"The Stage hit 73 dB on Wed during the workshop — above comfort threshold (65 dB). Consider acoustic panels or time-boxing loud sessions.",
      insightBg:"#EEEDFE", insightColor:"#3C3489",
      goals:[
        { label:"Below 65 dB (comfort)",    pct:78, color:"#7C5CBF", tc:"#3C3489" },
        { label:"Stage peak events limited", pct:60, color:C.amber,   tc:"#854F0B" },
        { label:"Quiet hours compliance",    pct:90, color:C.green,   tc:"#27500A" },
      ],
    },
  };
  const mc = CFG[metric];
  const chartData   = range==="month" ? mc.monthData : mc.weekData;
  const chartLabels = range==="month" ? MONTHS        : WEEKS;

  const avgCur  = Math.round(chartData.cur.reduce((a,b)=>a+b,0)/chartData.cur.length*10)/10;
  const avgPrev = Math.round(chartData.prev.reduce((a,b)=>a+b,0)/chartData.prev.length*10)/10;
  const diffPct = Math.round(((avgCur-avgPrev)/avgPrev)*100);

  // daily arrays for day-by-day comparison
  const [cArr, pArr] = metric==="energy"
    ? [ENERGY_SERIES.thisWeek, ENERGY_SERIES.lastWeek]
    : metric==="co2"
    ? [CO2_SERIES.thisWeek, CO2_SERIES.lastWeek]
    : metric==="noise"
    ? [NOISE_SERIES.thisWeek, NOISE_SERIES.lastWeek]
    : [OCC_SERIES.thisWeek, OCC_SERIES.lastWeek];
  const maxBarV = Math.max(...cArr, ...pArr);

  return (
    <ScreenBody>

      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between",
        alignItems:"flex-start", padding:"10px 0 10px" }}>
        <div>
          <div style={{ fontSize:22, fontWeight:500, color:C.text, letterSpacing:"-0.02em" }}>Reports</div>
          <div style={{ fontSize:12, color:C.textSub, marginTop:1 }}>Apr 14-20 · Design Factory</div>
        </div>
        <button style={{ fontSize:11, fontWeight:500, padding:"6px 11px", borderRadius:9,
          border:`0.5px solid ${C.border}`, background:C.bgCard, color:C.text,
          cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>Export</button>
      </div>

      {/* Score cards */}
      <SLabel style={{ marginTop:0 }}>Building Health Score</SLabel>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:6, marginBottom:16 }}>
        {[
          { key:"energy", label:"Electricity", score:61, color:C.amber,   sub:"vs target"   },
          { key:"co2",    label:"Air Quality",  score:74, color:C.green,   sub:"rooms OK"    },
          { key:"occ",    label:"Room Use",     score:62, color:C.blue,    sub:"rooms busy"  },
          { key:"noise",  label:"Noise",        score:78, color:"#7C5CBF", sub:"dB avg OK"   },
        ].map(m=>(
          <div key={m.key} onClick={()=>setMetric(m.key)}
            style={{ background:C.bgCard, borderRadius:14, padding:"10px 6px 8px",
              textAlign:"center", cursor:"pointer",
              border: metric===m.key ? `1.5px solid ${m.color}` : `0.5px solid ${C.border}`,
              boxShadow: metric===m.key ? `0 0 0 3px ${m.color}18` : "none" }}>
            <ScoreRing pct={m.score} color={m.color}/>
            <div style={{ fontSize:10, fontWeight:600, color:C.text, marginTop:5 }}>{m.label}</div>
            <div style={{ fontSize:9, color:C.textSub, marginTop:1 }}>{m.sub}</div>
          </div>
        ))}
      </div>

      {/* Metric tab strip */}
      <div style={{ display:"flex", background:"#F1EFE8", borderRadius:9,
        padding:3, gap:2, marginBottom:12 }}>
        {[["energy","Electricity"],["co2","Air Quality"],["occ","Room Use"],["noise","Noise"]].map(([k,lbl])=>(
          <div key={k} onClick={()=>setMetric(k)}
            style={{ flex:1, fontSize:10, fontWeight:500, padding:"5px 4px",
              textAlign:"center", borderRadius:7, cursor:"pointer",
              background:metric===k?"#fff":"transparent",
              color:metric===k?C.text:C.textSub,
              border:metric===k?`0.5px solid ${C.border}`:"none" }}>
            {lbl.split(" ")[0]}
          </div>
        ))}
      </div>

      {/* KPI pills */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:7, marginBottom:12 }}>
        {[
          ["This week",  mc.thisWeekTotal, mc.color],
          ["vs last wk", mc.vsLast,        mc.vsLastBad ? C.red : C.green],
          ["Month avg",  mc.monthAvg,      C.textSub],
        ].map(([lbl,val,col])=>(
          <div key={lbl} style={{ background:C.bgCard, borderRadius:10,
            border:`0.5px solid ${C.border}`, padding:"8px 6px", textAlign:"center" }}>
            <div style={{ fontSize:9, color:C.textSub, fontWeight:500, textTransform:"uppercase",
              letterSpacing:"0.06em", marginBottom:3 }}>{lbl}</div>
            <div style={{ fontSize:13, fontWeight:600, color:col }}>{val}</div>
          </div>
        ))}
      </div>

      {/* Main time-series chart */}
      <Card style={{ marginBottom:10 }}>
        <div style={{ display:"flex", justifyContent:"space-between",
          alignItems:"center", marginBottom:10 }}>
          <div style={{ fontSize:12, fontWeight:500, color:C.text }}>
            {mc.label}
            <span style={{ fontSize:10, color:C.textSub, fontWeight:400, marginLeft:5 }}>
              ({mc.unit})
            </span>
          </div>
          <div style={{ display:"flex", background:"#F1EFE8", borderRadius:7, padding:2, gap:1 }}>
            {[["month","Monthly"],["week","Weekly"]].map(([r,lbl])=>(
              <div key={r} onClick={()=>setRange(r)}
                style={{ fontSize:10, fontWeight:500, padding:"3px 8px", borderRadius:6,
                  cursor:"pointer", background:range===r?"#fff":"transparent",
                  color:range===r?C.text:C.textSub,
                  border:range===r?`0.5px solid ${C.border}`:"none" }}>
                {lbl}
              </div>
            ))}
          </div>
        </div>
        <LineChart
          series={[chartData.cur, chartData.prev]}
          labels={chartLabels}
          colors={[mc.color, "#C8C6C0"]}
          height={96}
        />
        {/* legend */}
        <div style={{ display:"flex", gap:14, marginTop:8 }}>
          {[
            [range==="month"?"This year":"This period", mc.color, "none"],
            [range==="month"?"Last year":"Last period", "#C8C6C0", "5,3"],
          ].map(([lbl,col,dash])=>(
            <div key={lbl} style={{ display:"flex", alignItems:"center", gap:5,
              fontSize:10, color:C.textSub }}>
              <svg width="18" height="5" style={{ flexShrink:0 }}>
                <line x1="0" y1="2.5" x2="18" y2="2.5" stroke={col}
                  strokeWidth="2" strokeDasharray={dash==="none"?"0":"5,3"}
                  opacity={dash==="none"?1:0.65}/>
              </svg>
              {lbl}
            </div>
          ))}
        </div>
        {/* avg delta row */}
        <div style={{ display:"flex", gap:8, marginTop:12,
          paddingTop:10, borderTop:`0.5px solid #F1EFE8` }}>
          {[
            ["Period avg", avgCur,  mc.color],
            ["Prev period", avgPrev, "#B4B2A9"],
            ["Delta", `${diffPct>0?"+":""}${diffPct}%`,
              (metric==="energy"||metric==="co2"||metric==="noise") ? (diffPct<0?C.green:C.red)
                                                                     : (diffPct>0?C.green:C.red)],
          ].map(([lbl,val,col])=>(
            <div key={lbl} style={{ flex:1, textAlign:"center" }}>
              <div style={{ fontSize:9, color:C.textSub, textTransform:"uppercase",
                letterSpacing:"0.06em", marginBottom:2 }}>{lbl}</div>
              <div style={{ fontSize:13, fontWeight:600, color:col }}>{val}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Day-by-day bar chart */}
      <SLabel>Day-by-Day — This Week vs Last</SLabel>
      <Card style={{ marginBottom:10 }}>
        {DAYS.map((d,i)=>{
          const cPct = Math.round((cArr[i]/maxBarV)*100);
          const pPct = Math.round((pArr[i]/maxBarV)*100);
          const better = metric==="occ" ? cArr[i]>=pArr[i] : cArr[i]<=pArr[i];
          const barCol = better ? mc.color : C.red;
          const suffix = metric==="energy"?" kWh":metric==="co2"?" ppm":metric==="noise"?" dB":"%";
          return (
            <div key={d} style={{ display:"flex", alignItems:"center", gap:6,
              marginBottom: i===DAYS.length-1?0:7 }}>
              <div style={{ fontSize:10, color:C.textSub, width:26, flexShrink:0 }}>{d}</div>
              <div style={{ flex:1 }}>
                <div style={{ height:6, background:"#F1EFE8", borderRadius:3,
                  overflow:"hidden", marginBottom:2 }}>
                  <div style={{ width:`${cPct}%`, height:"100%",
                    background:barCol, borderRadius:3 }}/>
                </div>
                <div style={{ height:4, background:"#F1EFE8", borderRadius:3, overflow:"hidden" }}>
                  <div style={{ width:`${pPct}%`, height:"100%",
                    background:"#D3D1C7", borderRadius:3 }}/>
                </div>
              </div>
              <div style={{ fontSize:10, fontWeight:600, color:barCol,
                width:50, textAlign:"right", flexShrink:0 }}>
                {cArr[i]}{suffix}
              </div>
            </div>
          );
        })}
        <div style={{ display:"flex", gap:10, marginTop:10,
          paddingTop:8, borderTop:`0.5px solid #F1EFE8` }}>
          <div style={{ display:"flex", alignItems:"center", gap:4, fontSize:10, color:C.textSub }}>
            <div style={{ width:12, height:5, borderRadius:2, background:mc.color }}/>This week
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:4, fontSize:10, color:C.textSub }}>
            <div style={{ width:12, height:4, borderRadius:2, background:"#D3D1C7" }}/>Last week
          </div>
        </div>
      </Card>

      {/* AI insight */}
      <div style={{ background:mc.insightBg, borderRadius:12, padding:"11px 13px",
        marginBottom:14, border:`0.5px solid ${mc.color}40` }}>
        <div style={{ fontSize:10, fontWeight:600, letterSpacing:"0.08em",
          textTransform:"uppercase", color:mc.insightColor, marginBottom:4 }}>Biomo AI</div>
        <div style={{ fontSize:12, lineHeight:1.6, color:mc.insightColor }}>{mc.insight}</div>
      </div>

      {/* Goals */}
      <SLabel>Goals — {mc.label}</SLabel>
      <Card style={{ marginBottom:10 }}>
        {mc.goals.map(({ label, pct, color, tc }, i, a)=>(
          <div key={label} style={{ display:"flex", alignItems:"center", gap:9,
            marginBottom:i===a.length-1?0:10 }}>
            <div style={{ fontSize:11, color:C.text, flex:1, lineHeight:1.3 }}>{label}</div>
            <div style={{ width:70, height:6, background:"#F1EFE8",
              borderRadius:3, overflow:"hidden", flexShrink:0 }}>
              <div style={{ width:`${pct}%`, height:"100%", background:color, borderRadius:3 }}/>
            </div>
            <div style={{ fontSize:11, fontWeight:600, width:28,
              textAlign:"right", color:tc, flexShrink:0 }}>{pct}%</div>
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
                {[
                  ["Status",  r.busy===null?null:r.busy?"Busy":"Free"],
                  ["CO₂",     r.co2?`${r.co2} ppm`:null],
                  ["Energy",  `${r.kwh} kWh`],
                  ["Noise",   r.noise?`${r.noise} dB`:null],
                ].filter(([,v])=>v!==null).map(([k,v])=>(
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