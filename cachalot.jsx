import { useState, useRef, useCallback } from "react";

// ═══════════════════════════════════════════════════════════════════════════
// DONNÉES — bibliothèque enrichie (patterns symboliques + vrais ICI)
// ═══════════════════════════════════════════════════════════════════════════
// ornement: true = clic supplémentaire à la fin (Sharma 2024)
// voyelle:  "a" | "i" | "di" = type spectral (Beguš 2025)
const CODA_LIBRARY = [
  { pattern:"· · · ·",     name:"1+1+3",         ici:[180,175,60,55],       ipi:4.2, tempo:580,  rubato:8,  spectral:3.2, ornement:false, voyelle:"a",  clan:"Caraïbes",    context:"Contact social entre unités",          baseEmotion:"greeting"     },
  { pattern:"· · · · ·",   name:"5 réguliers",   ici:[120,118,122,119],     ipi:3.8, tempo:600,  rubato:3,  spectral:2.8, ornement:false, voyelle:"i",  clan:"Caraïbes",    context:"Navigation en groupe, plongée",        baseEmotion:"navigation"   },
  { pattern:"· ·· ·",      name:"1+2+1",         ici:[200,80,75,190],       ipi:4.5, tempo:640,  rubato:62, spectral:4.1, ornement:true,  voyelle:"di", clan:"Pacifique",   context:"Alerte — rubato fort + ornement",      baseEmotion:"alert"        },
  { pattern:"· · · ··",    name:"4+1",            ici:[70,68,72,70,180],     ipi:3.5, tempo:580,  rubato:5,  spectral:3.0, ornement:false, voyelle:"a",  clan:"Caraïbes",    context:"Appel mère-veau, très régulier",       baseEmotion:"maternal"     },
  { pattern:"··· · ···",   name:"3+3",            ici:[90,85,88,88,92,89],   ipi:5.1, tempo:650,  rubato:7,  spectral:5.2, ornement:true,  voyelle:"i",  clan:"Pacifique",   context:"Échange prolongé — orné + i-voyelle",  baseEmotion:"social"       },
  { pattern:"· ···· ·",    name:"2+3",            ici:[95,92,180,85,88],     ipi:4.8, tempo:620,  rubato:12, spectral:4.4, ornement:false, voyelle:"di", clan:"Atlantique",  context:"Marqueur d'identité clanique",         baseEmotion:"identity"     },
  { pattern:"·· ·· ··",    name:"4R",             ici:[100,98,102,99],       ipi:3.2, tempo:480,  rubato:4,  spectral:2.5, ornement:false, voyelle:"a",  clan:"Méditerranée",context:"Synchronisation plongée profonde",    baseEmotion:"coordination" },
  { pattern:"· · · · · ·", name:"6 réguliers",   ici:[85,83,87,84,86,85],   ipi:3.9, tempo:600,  rubato:3,  spectral:2.9, ornement:false, voyelle:"i",  clan:"Caraïbes",    context:"Dialecte caractéristique des Caraïbes",baseEmotion:"dialect"      },
  { pattern:"· · ·· · ·",  name:"1+1+1+3",       ici:[160,155,150,55,50,48],ipi:4.0, tempo:740,  rubato:5,  spectral:3.3, ornement:true,  voyelle:"a",  clan:"Atlantique",  context:"Coda longue ornée — conversation profonde",baseEmotion:"social"     },
  { pattern:"··· ···",     name:"3R-fast",        ici:[45,43,47],            ipi:2.8, tempo:200,  rubato:4,  spectral:8.5, ornement:false, voyelle:"di", clan:"Pacifique",   context:"Alarme — tempo rapide + diphtongue",   baseEmotion:"alert"        },
];

const EMOTIONS = {
  greeting:     { label:"Salutation",        color:"#4ade80", icon:"〰" },
  navigation:   { label:"Navigation",        color:"#60a5fa", icon:"◎" },
  alert:        { label:"Vigilance",         color:"#f59e0b", icon:"△" },
  maternal:     { label:"Lien maternel",     color:"#f472b6", icon:"♡" },
  social:       { label:"Échange social",    color:"#a78bfa", icon:"⟳" },
  identity:     { label:"Identité clanique", color:"#34d399", icon:"◈" },
  coordination: { label:"Coordination",      color:"#38bdf8", icon:"⇌" },
  dialect:      { label:"Dialecte régional", color:"#fb7185", icon:"⊛" },
};

// ─── Modèle 4D original + nouveaux axes évolutionnaires ─────────────────────
const DIMS = {
  time:    { label:"D₁ Rythme",    unit:"clics", values:[1,2,3,4,5,6],                 colors:["#bfdbfe","#93c5fd","#60a5fa","#3b82f6","#2563eb","#1d4ed8"] },
  freq:    { label:"D₂ Fréquence", unit:"kHz",   values:[0.2,1,3,8,15,25,30,50],       colors:["#fecdd3","#fda4af","#fb7185","#f43f5e","#e11d48","#be123c","#9f1239","#881337"] },
  azimuth: { label:"D₃ Direction", unit:"°",     values:[0,45,90,135,180,225,270,315], colors:["#bbf7d0","#86efac","#4ade80","#22c55e","#16a34a","#15803d","#166534","#14532d"] },
  depth:   { label:"D₄ Interface", unit:"",      values:["Fond","Mi-eau","Surface"],   colors:["#ddd6fe","#c4b5fd","#a78bfa"] },
};

const MORSE = {
  A:"·—",B:"—···",C:"—·—·",D:"—··",E:"·",F:"··—·",G:"——·",H:"····",
  I:"··",J:"·———",K:"—·—",L:"·—··",M:"——",N:"—·",O:"———",P:"·——·",
  Q:"——·—",R:"·—·",S:"···",T:"—",U:"··—",V:"···—",W:"·——",X:"—··—",
  Y:"—·——",Z:"——··",
  "1":"·————","2":"··———","3":"···——","4":"····—","5":"·····",
  "6":"—····","7":"——···","8":"———··","9":"————·","0":"—————",
};

// ── Calcul Sharma 2024 (Nature Comm.) + Beguš 2025 (Berkeley/CETI) ──────────
// Sharma : 18 rhythms × 5 tempos × 2 ornement × 3 rubato = 540 états confirmés
// Beguš  : × 3 voyelles (ɑ, i, diphtongue) = 1620 états totaux confirmés
// Avant Sharma : "at most 5 bits/coda" (log₂21 ≈ 4.4 bits) — 21 types connus
const SHARMA_BASE    = 18 * 5 * 2 * 3;           // 540 — 4 features Sharma
const BEGUS_SPECTRAL = 3;                          // ɑ / i / diphtongue
const WHALE_DISCRETE = Math.log2(SHARMA_BASE * BEGUS_SPECTRAL); // log₂(1620) ≈ 10.66
const MORSE_DISCRETE = Math.log2(2);               // 1.0 bit
const RATIO_D        = (WHALE_DISCRETE / MORSE_DISCRETE).toFixed(1);
const TOTAL_STATES   = SHARMA_BASE * BEGUS_SPECTRAL; // 1620
const PRE_SHARMA_BITS = Math.log2(21).toFixed(1); // 4.4 — avant 2024

const EVO_AXES = [
  // ── 4 features confirmées Sharma et al. 2024 ──────────────────────────────
  { id:"rythme",  label:"Rythme",        full:"Pattern ICI (18 types)",      unit:"",    range:[0,17],    color:"#38bdf8", sci:true,  ctx:"indépendant", why:"18 patterns ICI discrets — la structure temporelle fondamentale. Indépendant du contexte conversationnel. C'est le 'squelette' de la coda." },
  { id:"tempo",   label:"Tempo",         full:"Durée totale (5 catégories)", unit:"ms",  range:[200,2000], color:"#4ade80", sci:true,  ctx:"indépendant", why:"5 catégories de durée globale. Pense à un waltz joué lento vs presto — même structure, vitesse différente. Indépendant du contexte." },
  { id:"rubato",  label:"Rubato",        full:"Contour temporel (3 états)",  unit:"",    range:[0,2],      color:"#fb923c", sci:true,  ctx:"contextuel",  why:"Allongement/raccourcissement relatif aux codas précédentes — imité entre baleines en temps réel. 3 contours : croissant / décroissant / stable." },
  { id:"ornement",label:"Ornement",      full:"Clic supplémentaire (±1)",    unit:"±",   range:[0,1],      color:"#f472b6", sci:true,  ctx:"contextuel",  why:"Extra clic ajouté à la fin d'une coda de base. Modifie significativement la distribution ICI. Imité entre individus — Sharma 2024. Absent de notre ancien modèle." },
  // ── Voyelles spectrales — Beguš et al. 2025 (Berkeley/CETI) ─────────────
  { id:"voyelle", label:"Voyelle",       full:"ɑ-voyelle / i-voyelle / diphtongue", unit:"", range:[0,2], color:"#a78bfa", sci:true,  ctx:"confirmé",    why:"Beguš et al. Nov. 2025 : deux voyelles (ɑ, i) + diphtongues — patterns spectraux intentionnels dans 3.7–5.7 kHz. Indépendants du rythme. Échangés en conversation structurée." },
  // ── IPI — dimension biophysique individuelle ─────────────────────────────
  { id:"ipi",     label:"IPI",           full:"Inter-Pulse Interval (identité)", unit:"ms", range:[2,12], color:"#fbbf24", sci:true,  ctx:"identité",    why:"Taille de l'organe spermaceti → IPI encode la taille réelle du corps. Signature biométrique impossible à falsifier. Chaque clic annonce 'qui je suis'." },
  // ── Hypothèses non mesurées ───────────────────────────────────────────────
  { id:"multi",   label:"Multipath *",   full:"Délai écho surface/fond",    unit:"ms",  range:[0,200],    color:"#64748b", sci:false, ctx:"hypothèse",   why:"HYPOTHÈSE : délais prévisibles entre chemin direct, écho de surface et écho de fond. Information potentiellement gratuite de la physique. Non mesuré dans DSWP/CETI." },
];

// ═══════════════════════════════════════════════════════════════════════════
// COMPOSANTS VISUELS (anciens + nouveaux)
// ═══════════════════════════════════════════════════════════════════════════

// ── ClickViz (ancien) — visualisation dots animés ──────────────────────────
function ClickViz({ pattern, animating }) {
  return (
    <div style={{ display:"flex", gap:"6px", alignItems:"center", flexWrap:"wrap" }}>
      {pattern.split(" ").map((group, gi) => (
        <div key={gi} style={{ display:"flex", gap:"4px", alignItems:"center" }}>
          {group.split("").map((dot, di) => (
            <div key={di} style={{
              width:dot==="·"?"10px":"16px", height:dot==="·"?"10px":"16px",
              borderRadius:"50%",
              background: animating ? "radial-gradient(circle,#7dd3fc,#0ea5e9)" : "radial-gradient(circle,#bfdbfe,#3b82f6)",
              boxShadow: animating ? "0 0 12px #38bdf8,0 0 24px #0284c7" : "0 0 6px #3b82f680",
              animation: animating ? `codaPulse 0.6s ease ${(gi*3+di)*80}ms both` : "none",
            }}/>
          ))}
          {gi < pattern.split(" ").length - 1 && (
            <div style={{ width:"10px", height:"1px", background:"#1e40af40" }}/>
          )}
        </div>
      ))}
    </div>
  );
}

// ── AzimuthViz (ancien) — boussole 3D ──────────────────────────────────────
function AzimuthViz({ azimuth, depth, freq, time, animating }) {
  const S=250, cx=S/2, cy=S/2, R=95;
  const layerY=[cy+R*0.56, cy, cy-R*0.56];
  const layerC=["#1e3a5f","#0ea5e9","#7dd3fc"];
  const layerLb=["Fond","Mi-eau","Surface ◈"];
  const freqC=["#fb7185","#f97316","#facc15","#4ade80","#38bdf8","#818cf8","#c084fc","#e879f9"];
  const fc=freqC[freq]??"#38bdf8";
  const azRad=(azimuth*45-90)*Math.PI/180;
  const beamEndX=cx+R*0.82*Math.cos(azRad);
  const beamEndY=layerY[depth];
  const compass=["N","NE","E","SE","S","SO","O","NO"];
  return (
    <svg width={S} height={S} viewBox={`0 0 ${S} ${S}`} style={{ display:"block", filter:"drop-shadow(0 0 20px #0ea5e920)" }}>
      <defs>
        <radialGradient id="azbg" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#0a1e3d"/><stop offset="100%" stopColor="#020817"/>
        </radialGradient>
        <filter id="azglow"><feGaussianBlur stdDeviation="2.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>
      <circle cx={cx} cy={cy} r={R+28} fill="url(#azbg)"/>
      <circle cx={cx} cy={cy} r={R} fill="none" stroke="#1e3a5f" strokeWidth="1" strokeDasharray="4 4"/>
      {[0,1,2].map(d=>(
        <g key={d}>
          <line x1={cx-R} y1={layerY[d]} x2={cx+R} y2={layerY[d]}
            stroke={layerC[d]} strokeWidth={d===depth?2:1}
            strokeOpacity={d===depth?1:0.3} strokeDasharray={d===2?"none":"3 4"}/>
          <text x={cx+R+5} y={layerY[d]+4} fontSize="8.5" fill={layerC[d]} fillOpacity={d===depth?1:0.35}>{layerLb[d]}</text>
        </g>
      ))}
      {[0,1,2,3,4,5,6,7].map(i=>{
        const a=(i*45-90)*Math.PI/180; const active=i===azimuth;
        return (<g key={i}>
          <line x1={cx+(R-5)*Math.cos(a)} y1={cy+(R-5)*Math.sin(a)} x2={cx+(R+12)*Math.cos(a)} y2={cy+(R+12)*Math.sin(a)}
            stroke={active?"#38bdf8":"#1e3a5f"} strokeWidth={active?2.5:1}/>
          <text x={cx+(R+22)*Math.cos(a)} y={cy+(R+22)*Math.sin(a)+3} fontSize="8" textAnchor="middle"
            fill={active?"#38bdf8":"#334155"} fontWeight={active?"bold":"normal"}>{compass[i]}</text>
        </g>);
      })}
      <line x1={cx} y1={cy} x2={beamEndX} y2={beamEndY}
        stroke={fc} strokeWidth={animating?2.5:1.5} strokeOpacity={animating?0.95:0.5} filter={animating?"url(#azglow)":"none"}/>
      {animating && [14,27,42].map((r,i)=>(
        <circle key={i} cx={beamEndX} cy={beamEndY} r={r} fill="none" stroke={fc} strokeWidth="1" strokeOpacity={0.45-i*0.13}/>
      ))}
      <circle cx={beamEndX} cy={beamEndY} r={animating?7:4.5} fill={fc} fillOpacity={animating?1:0.75} filter={animating?"url(#azglow)":"none"}/>
      {animating && Array.from({length:time+1}).map((_,i)=>(
        <circle key={i} cx={cx} cy={cy} r={16+i*11} fill="none" stroke="#38bdf8" strokeWidth="1" strokeOpacity={0.08+0.08*(time-i)/(time+1)}/>
      ))}
      <text x={cx} y={cy+7} textAnchor="middle" fontSize="20">🐋</text>
      <text x={cx} y={S-8} textAnchor="middle" fontSize="9" fill={fc} fillOpacity="0.9">
        {["0.2","1","3","8","15","25","30","50"][freq]} kHz
      </text>
    </svg>
  );
}

// ── WaveBg (ancien) ─────────────────────────────────────────────────────────
function WaveBg() {
  return (
    <svg style={{ position:"absolute", inset:0, width:"100%", height:"100%", opacity:0.04, pointerEvents:"none" }}>
      <defs>
        <pattern id="wv" x="0" y="0" width="120" height="40" patternUnits="userSpaceOnUse">
          <path d="M0 20 Q15 5 30 20 Q45 35 60 20 Q75 5 90 20 Q105 35 120 20" fill="none" stroke="#7dd3fc" strokeWidth="1"/>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#wv)"/>
    </svg>
  );
}

// ── DimSlider (ancien) — blocs colorés ─────────────────────────────────────
function DimSlider({ dim, values, colors, value, onChange }) {
  return (
    <div style={{ marginBottom:"14px" }}>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"5px" }}>
        <span style={{ fontSize:"11px", color:"#64748b", letterSpacing:"1px", textTransform:"uppercase" }}>{DIMS[dim].label}</span>
        <span style={{ fontSize:"12px", color:colors[value], fontFamily:"monospace", fontWeight:"bold" }}>
          {values[value]}{dim==="freq"?" kHz":dim==="azimuth"?"°":dim==="time"?" clics":""}
        </span>
      </div>
      <div style={{ display:"flex", gap:"3px" }}>
        {values.map((_,i)=>(
          <div key={i} onClick={()=>onChange(i)} style={{
            flex:1, height:"26px", borderRadius:"4px", cursor:"pointer",
            background:i===value?colors[i]:"#0f1f3d",
            border:`1px solid ${i===value?colors[i]:"#1e3a5f"}`,
            boxShadow:i===value?`0 0 8px ${colors[i]}80`:"none",
            transition:"all 0.18s",
          }}/>
        ))}
      </div>
    </div>
  );
}

// ── InfoCard (ancien) ───────────────────────────────────────────────────────
function InfoCard({ label, value, color, sub }) {
  return (
    <div style={{ background:"#060f1e", borderRadius:"10px", padding:"14px 16px", border:`1px solid ${color}25` }}>
      <div style={{ fontSize:"10px", color:"#475569", letterSpacing:"1px", textTransform:"uppercase", marginBottom:"3px" }}>{label}</div>
      <div style={{ fontSize:"20px", fontFamily:"monospace", color, fontWeight:"bold" }}>{value}</div>
      {sub && <div style={{ fontSize:"10px", color:"#374151", marginTop:"3px" }}>{sub}</div>}
    </div>
  );
}

// ── IciTimeline (nouveau) — vrais intervalles ICI + ornement + voyelle ────
function IciTimeline({ ici, ipi = 4, activeIdx = -1, spectral = 3, ornement = false, voyelle = "a" }) {
  const total = ici.reduce((s,v)=>s+v,0) + (ornement ? 120 : 80);
  const h = 54;
  const VOYELLE_C = { a:"#38bdf8", i:"#a78bfa", di:"#fb923c" };
  const vc = VOYELLE_C[voyelle] || "#38bdf8";
  return (
    <svg width="100%" height={h} viewBox={`0 0 ${total} ${h}`} preserveAspectRatio="xMidYMid meet" style={{ overflow:"visible" }}>
      {/* Indicateur voyelle */}
      <rect x="0" y="0" width={total} height="3" rx="1.5" fill={vc} opacity="0.35"/>
      <text x={total} y="10" textAnchor="end" fontSize="7" fill={vc} opacity="0.8" fontFamily="monospace">
        {voyelle==="di"?"diphtongue":voyelle==="a"?"ɑ-voyelle":"i-voyelle"}
      </text>
      <line x1="0" y1={h/2+4} x2={total} y2={h/2+4} stroke="#1e3a5f" strokeWidth="1"/>
      {ici.map((interval,i)=>(
        <text key={`l${i}`} x={ici.slice(0,i).reduce((s,v)=>s+v,0)+interval/2} y={h-2}
          textAnchor="middle" fontSize="7" fill="#374151" fontFamily="monospace">{interval}ms</text>
      ))}
      {[...ici,0].map((_,i)=>{
        const x = i===0 ? 6 : ici.slice(0,i).reduce((s,v)=>s+v,0)+6;
        const active = activeIdx===i;
        const pulses = Math.max(2, Math.round(2+(ipi-2)/2));
        return (
          <g key={`c${i}`}>
            {Array.from({length:pulses}).map((_,p)=>(
              <line key={p} x1={x+p*2} y1={h/2-10+p*2} x2={x+p*2} y2={h/2+18-p*2}
                stroke={active?"#f472b6":`hsl(${190+spectral*8},80%,${60-p*8}%)`}
                strokeWidth={active?2.5:1.5} opacity={1-p*0.2}/>
            ))}
            {active && (
              <circle cx={x+2} cy={h/2+4} r="10" fill="none" stroke="#f472b6" strokeWidth="1.5" opacity="0.6">
                <animate attributeName="r" values="8;14;8" dur="0.6s" repeatCount="indefinite"/>
                <animate attributeName="opacity" values="0.6;0.1;0.6" dur="0.6s" repeatCount="indefinite"/>
              </circle>
            )}
          </g>
        );
      })}
      {/* Clic ornementel — pointillé, couleur différente */}
      {ornement && (()=>{
        const ox = ici.reduce((s,v)=>s+v,0) + 55;
        return (
          <g>
            <line x1={ox} y1={h/2-10} x2={ox} y2={h/2+18}
              stroke="#f472b6" strokeWidth="1.5" strokeDasharray="3,2" opacity="0.8"/>
            <circle cx={ox} cy={h/2+4} r="5" fill="none" stroke="#f472b6" strokeWidth="1" strokeDasharray="2,2" opacity="0.7"/>
            <text x={ox} y={h/2-14} textAnchor="middle" fontSize="7" fill="#f472b6" opacity="0.9">+1</text>
            <text x={ox} y={h-2} textAnchor="middle" fontSize="7" fill="#f472b6" opacity="0.7">ornement</text>
          </g>
        );
      })()}
    </svg>
  );
}

// ── WaterPropagation (nouveau) ──────────────────────────────────────────────
function WaterPropagation({ depth=500, active=false }) {
  const W=280, H=110;
  const surfaceY=14, bottomY=H-14, srcX=28, srcY=H/2;
  const paths=[
    { label:"Direct",  color:"#38bdf8", d:`M${srcX},${srcY} L${W-20},${srcY}`,                      delay:0  },
    { label:"Surface", color:"#4ade80", d:`M${srcX},${srcY} L${W/2},${surfaceY} L${W-20},${srcY}`,  delay:15 },
    { label:"Fond",    color:"#a78bfa", d:`M${srcX},${srcY} L${W/2},${bottomY} L${W-20},${srcY}`,   delay:35 },
  ];
  return (
    <svg width={W} height={H} style={{ background:"linear-gradient(180deg,#0a1628,#060f1e)", borderRadius:8, flexShrink:0 }}>
      <rect x="0" y="0" width={W} height="18" fill="#38bdf820" rx="4"/>
      <text x="5" y="12" fontSize="7" fill="#38bdf880">SURFACE</text>
      <rect x="0" y={H-18} width={W} height="18" fill="#a78bfa20" rx="4"/>
      <text x="5" y={H-5} fontSize="7" fill="#a78bfa80">FOND</text>
      <line x1="0" y1={H*0.4} x2={W} y2={H*0.4} stroke="#fbbf2420" strokeWidth="1" strokeDasharray="4,4"/>
      <text x="5" y={H*0.4-3} fontSize="7" fill="#fbbf2460">THERMOCLINE</text>
      {paths.map((p,i)=>(
        <g key={i}>
          <path d={p.d} fill="none" stroke={p.color} strokeWidth="1.5" opacity={active?0.8:0.2}
            style={{ transition:active?`opacity 0.5s ease ${p.delay*8}ms`:"none" }}/>
          <text x={W-65} y={i*14+22} fontSize="8" fill={p.color} opacity="0.7">{p.label} +{p.delay}ms</text>
        </g>
      ))}
      <circle cx={srcX} cy={srcY} r="5" fill="#38bdf8" opacity="0.8">
        {active && <animate attributeName="r" values="5;10;5" dur="1s" repeatCount="3"/>}
      </circle>
      <text x={srcX-4} y={srcY+20} fontSize="9" fill="#38bdf8">🐋</text>
    </svg>
  );
}

// ── ShannonRadar (nouveau) — 7 axes en étoile ──────────────────────────────
function ShannonRadar({ coda }) {
  const W=190, cx=W/2, cy=W/2, r=68;
  const N=EVO_AXES.length;
  const norm=(ax,val)=>Math.min(1,Math.max(0,(val-ax.range[0])/(ax.range[1]-ax.range[0])));
  const avgICI=coda.ici&&coda.ici.length?coda.ici.reduce((a,b)=>a+b)/coda.ici.length:120;
  const vals=[
    norm(EVO_AXES[0],avgICI), norm(EVO_AXES[1],coda.ipi||4),
    norm(EVO_AXES[2],coda.tempo||600), norm(EVO_AXES[3],coda.rubato||10),
    norm(EVO_AXES[4],coda.spectral||3), 0.3, 0.2,
  ];
  const pt=(i,v)=>{
    const a=(i/N)*Math.PI*2-Math.PI/2;
    return [cx+Math.cos(a)*r*v, cy+Math.sin(a)*r*v];
  };
  const poly=vals.map((v,i)=>pt(i,v));
  return (
    <svg width={W} height={W}>
      {[0.25,0.5,0.75,1].map(f=>(
        <polygon key={f} points={EVO_AXES.map((_,i)=>pt(i,f).join(",")).join(" ")}
          fill="none" stroke="#1e3a5f" strokeWidth="0.7" opacity={f===1?0.6:0.25}/>
      ))}
      {EVO_AXES.map((ax,i)=>{
        const [ex,ey]=pt(i,1.1); const [lx,ly]=pt(i,1.3);
        return (
          <g key={i}>
            <line x1={cx} y1={cy} x2={ex} y2={ey} stroke={ax.color} strokeWidth="0.7" opacity="0.4"/>
            <text x={lx} y={ly} textAnchor="middle" dominantBaseline="middle"
              fontSize="7" fill={ax.sci?"#64748b":"#4b5563"} fontFamily="monospace">
              {ax.label}
            </text>
          </g>
        );
      })}
      <polygon points={poly.map(p=>p.join(",")).join(" ")} fill="#38bdf812" stroke="#38bdf8" strokeWidth="1.2" opacity="0.8"/>
      {poly.map(([x,y],i)=>(<circle key={i} cx={x} cy={y} r="2.5" fill={EVO_AXES[i].color} opacity="0.9"/>))}
    </svg>
  );
}

// ── SofarViz (nouveau) — portée acoustique ─────────────────────────────────
function SofarViz({ tempo, spectral }) {
  const MAX=3000;
  const range=Math.min(MAX, 500+tempo*1.2+(50-spectral)*40);
  const W=240, H=60, pct=range/MAX;
  return (
    <svg width={W} height={H}>
      <defs>
        <linearGradient id="sofar" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.7"/>
          <stop offset={`${pct*100}%`} stopColor="#0ea5e9" stopOpacity="0.15"/>
          <stop offset="100%" stopColor="#0a1628" stopOpacity="0.05"/>
        </linearGradient>
      </defs>
      <rect x="18" y="22" width={W-36} height="16" rx="3" fill="#0a1628"/>
      <rect x="18" y="22" width={(W-36)*pct} height="16" rx="3" fill="url(#sofar)"/>
      {[0,1000,3000].map(km=>(
        <g key={km}>
          <line x1={18+(km/MAX)*(W-36)} y1="20" x2={18+(km/MAX)*(W-36)} y2="40" stroke="#1e3a5f" strokeWidth="0.7"/>
          <text x={18+(km/MAX)*(W-36)} y="50" textAnchor="middle" fontSize="7" fill="#374151">{km}km</text>
        </g>
      ))}
      <line x1={18+pct*(W-36)} y1="18" x2={18+pct*(W-36)} y2="42" stroke="#38bdf8" strokeWidth="1.5"/>
      <text x={18+pct*(W-36)} y="14" textAnchor="middle" fontSize="8" fill="#38bdf8">{Math.round(range)}km</text>
      <text x="10" y="33" fontSize="11">🐋</text>
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// AUDIO ENGINE (nouveau — avec IPI réaliste)
// ═══════════════════════════════════════════════════════════════════════════
function useAudio() {
  const ctx = useRef(null);
  const stopRef = useRef(false);
  const getCtx = () => {
    if (!ctx.current) ctx.current = new (window.AudioContext||window.webkitAudioContext)();
    return ctx.current;
  };

  // Clic simple avec structure IPI (multi-pulse)
  const playRawClick = useCallback((freq=3000, ipi=4, depthRatio=1.0, t0=0) => {
    try {
      const ac=getCtx();
      const pulses=Math.max(2,Math.round(2+(ipi-2)/2));
      for (let p=0; p<pulses; p++) {
        const osc=ac.createOscillator(), gain=ac.createGain();
        const filt=ac.createBiquadFilter();
        filt.type="lowpass"; filt.frequency.value=freq*(1-depthRatio*0.2);
        osc.connect(filt); filt.connect(gain); gain.connect(ac.destination);
        const t=t0+p*(ipi/1000);
        osc.frequency.setValueAtTime(freq,t);
        osc.frequency.exponentialRampToValueAtTime(freq*0.2,t+0.008);
        const amp=0.28*depthRatio*Math.pow(0.65,p);
        gain.gain.setValueAtTime(amp,t);
        gain.gain.exponentialRampToValueAtTime(0.0001,t+0.013);
        osc.start(t); osc.stop(t+0.015);
      }
    } catch(e) {}
  }, []);

  // Clic simple legacy (pour pipeline 4D)
  const playSimpleClick = useCallback((delay=0) => {
    try {
      if (!ctx.current) ctx.current = new (window.AudioContext||window.webkitAudioContext)();
      const ac=ctx.current;
      setTimeout(()=>{
        const osc=ac.createOscillator(), gain=ac.createGain();
        osc.connect(gain); gain.connect(ac.destination);
        osc.frequency.setValueAtTime(800+Math.random()*400,ac.currentTime);
        osc.frequency.exponentialRampToValueAtTime(200,ac.currentTime+0.05);
        gain.gain.setValueAtTime(0.3,ac.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001,ac.currentTime+0.08);
        osc.start(ac.currentTime); osc.stop(ac.currentTime+0.08);
      }, delay);
    } catch(e) {}
  }, []);

  // Joue un pattern symbolique (ancien compositeur)
  const playPattern = useCallback((pattern) => {
    let delay=0;
    pattern.split("").forEach(c=>{
      if (c==="·") { playSimpleClick(delay); delay+=180; }
      else if (c===" ") delay+=120;
    });
  }, [playSimpleClick]);

  // Joue une coda avec ses vrais ICI
  const playCodaICI = useCallback((coda, onProgress, onDone) => {
    try {
      const ac=getCtx();
      let t=ac.currentTime+0.05;
      const freq=(coda.spectral||3)*1000;
      const ipi=coda.ipi||4;
      coda.ici.forEach((interval,i)=>{
        playRawClick(freq,ipi,0.5,t);
        onProgress && setTimeout(()=>onProgress(i),(t-ac.currentTime)*1000);
        t+=interval/1000;
      });
      playRawClick(freq,ipi,0.5,t);
      const total=(t-ac.currentTime+0.1)*1000;
      onProgress && setTimeout(()=>onProgress(coda.ici.length),total-100);
      onDone && setTimeout(onDone,total);
    } catch(e) { onDone&&onDone(); }
  }, [playRawClick]);

  // Coda 4D pour pipeline et simulateur
  const playCoda4D = useCallback((coda, onDone) => {
    try {
      if (!ctx.current) ctx.current = new (window.AudioContext||window.webkitAudioContext)();
      const ac=ctx.current;
      const hz=(DIMS.freq.values[coda.f||3])*1000;
      const clicks=DIMS.time.values[coda.t||2];
      const depthRatio=[0.6,1.0,1.4][coda.d||1];
      let t=ac.currentTime;
      for (let i=0; i<clicks; i++) {
        const osc=ac.createOscillator(), gain=ac.createGain();
        osc.connect(gain); gain.connect(ac.destination);
        osc.frequency.setValueAtTime(hz,t);
        osc.frequency.exponentialRampToValueAtTime(hz*0.3,t+0.06);
        gain.gain.setValueAtTime(0.28*depthRatio,t);
        gain.gain.exponentialRampToValueAtTime(0.001,t+0.09);
        osc.start(t); osc.stop(t+0.1);
        t+=0.16;
      }
      const dur=(clicks*0.16+0.1)*1000;
      onDone && setTimeout(onDone, dur);
    } catch(e) { onDone&&onDone(); }
  }, []);

  return { playSimpleClick, playPattern, playCodaICI, playCoda4D, stopRef };
}

// ═══════════════════════════════════════════════════════════════════════════
// APP PRINCIPALE
// ═══════════════════════════════════════════════════════════════════════════
const TABS = [
  ["library",   "📚 Bibliothèque"],
  ["compose",   "🎵 Composer"],
  ["sim4d",     "◎ Simulateur 4D"],
  ["evolution", "⚡ Évolution"],
  ["physics",   "〰 Physique"],
  ["theory",    "⊕ Théorie"],
  ["morse",     "— Morse"],
  ["pipeline",  "⇝ Pipeline"],
  ["reverse",   "⟵ Inverse"],
];

export default function App() {
  const [tab, setTab] = useState("library");
  const { playSimpleClick, playPattern, playCodaICI, playCoda4D, stopRef } = useAudio();

  // ── Bibliothèque ──
  const [selectedCoda,  setSelectedCoda]  = useState(null);
  const [translation,   setTranslation]   = useState("");
  const [loadingTr,     setLoadingTr]     = useState(false);
  const [animating,     setAnimating]     = useState(false);
  const [playingLib,    setPlayingLib]    = useState(-1);
  const [activeLibClick,setActiveLibClick]= useState(-1);

  // ── Composer (ancien) ──
  const [userPattern, setUserPattern] = useState([]);

  // ── Simulateur 4D ──
  const [dimT, setDimT] = useState(2);
  const [dimF, setDimF] = useState(3);
  const [dimA, setDimA] = useState(0);
  const [dimD, setDimD] = useState(1);
  const [anim4D,    setAnim4D]    = useState(false);
  const [result4D,  setResult4D]  = useState("");
  const [loading4D, setLoading4D] = useState(false);

  // ── Évolution ──
  const [evoStep, setEvoStep] = useState(-1);

  // ── Physique ──
  const [physDepth,  setPhysDepth]  = useState(500);
  const [physActive, setPhysActive] = useState(false);

  // ── Morse ──
  const [morseText, setMorseText] = useState("CETI");

  // ── Pipeline ──
  const [pipeText,     setPipeText]     = useState("BONJOUR");
  const [pipeStep,     setPipeStep]     = useState(0);
  const [pipeMorse,    setPipeMorse]    = useState([]);
  const [pipeCodas,    setPipeCodas]    = useState([]);
  const [pipe4D,       setPipe4D]       = useState(null);
  const [pipeIA,       setPipeIA]       = useState("");
  const [pipeLoading,  setPipeLoading]  = useState(false);
  const [pipeAnimIdx,  setPipeAnimIdx]  = useState(-1);
  const [pipeIsPlaying,setPipeIsPlaying]= useState(false);
  const [pipePlayIdx,  setPipePlayIdx]  = useState(-1);

  // ── Reverse ──
  const [revCoda,    setRevCoda]    = useState(null);
  const [revMorse,   setRevMorse]   = useState("");
  const [revText,    setRevText]    = useState("");
  const [revIA,      setRevIA]      = useState("");
  const [revLoading, setRevLoading] = useState(false);
  const [revStep,    setRevStep]    = useState(0);
  const [revAnim,    setRevAnim]    = useState(false);

  // ── IA helper ──
  const callIA = async (system, user, max=900) => {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:max, system, messages:[{role:"user",content:user}] })
    });
    const d = await r.json();
    return d.content?.map(b=>b.text||"").join("")||"Erreur.";
  };

  // ── Bibliothèque ──
  const selectCoda = (coda) => {
    setSelectedCoda(coda); setAnimating(true);
    playPattern(coda.pattern);
    setTimeout(()=>setAnimating(false),2200);
    setLoadingTr(true); setTranslation("");
    callIA(
      `Tu es expert en bioacoustique des cétacés (projet CETI). Tu analyses les codas de cachalots selon ICI, IPI, tempo, rubato et fréquence spectrale. Traduis de façon poétique ET scientifiquement plausible. Réponds en 3 blocs : 1) Traduction créative (2-3 phrases) 2) Analyse acoustique (1-2 phrases) 3) Contexte social probable. En français, évocateur et rigoureux.`,
      `Coda : "${coda.pattern}" | Nom : ${coda.name} | ICI moyen : ${Math.round(coda.ici.reduce((a,b)=>a+b)/coda.ici.length)}ms | IPI : ${coda.ipi}ms | Rubato : ${coda.rubato}ms σ | Contexte : ${coda.context}`
    ).then(t=>{setTranslation(t);setLoadingTr(false);}).catch(()=>{setTranslation("Erreur réseau.");setLoadingTr(false);});
  };

  const playLibCoda = (coda, idx) => {
    setPlayingLib(idx);
    playCodaICI(coda, i=>setActiveLibClick(i), ()=>{setPlayingLib(-1);setActiveLibClick(-1);});
  };

  // ── Composer ──
  const addClick = ()=>{ setUserPattern(p=>[...p,"·"]); playSimpleClick(0); };
  const addPause = ()=>setUserPattern(p=>[...p," "]);
  const resetCompose = ()=>{ setUserPattern([]); setTranslation(""); setSelectedCoda(null); };
  const analyzeCustom = ()=>{
    if (!userPattern.length) return;
    const pat=userPattern.join("");
    setSelectedCoda({pattern:pat,name:"Coda personnalisée",context:"Composition libre",ici:[120,120,120],ipi:4,tempo:500,rubato:5,spectral:3,clan:"Synthétique",baseEmotion:"social"});
    setAnimating(true); setTimeout(()=>setAnimating(false),2200);
    setLoadingTr(true); setTranslation("");
    callIA(
      `Tu es expert en bioacoustique des cétacés. Traduis cette coda composée manuellement. 3 blocs : 1) Traduction créative 2) Analyse acoustique 3) Contexte social probable. Français, poétique.`,
      `Coda personnalisée : "${pat}" | ${userPattern.filter(c=>c==="·").length} clics | ${userPattern.filter(c=>c===" ").length} pauses`
    ).then(t=>{setTranslation(t);setLoadingTr(false);}).catch(()=>{setTranslation("Erreur réseau.");setLoadingTr(false);});
  };

  // ── Simulateur 4D ──
  const analyze4D = ()=>{
    setLoading4D(true); setResult4D("");
    callIA(
      `Tu es bioacousticien. Analyse ce signal 4D de cachalot (hypothèse CETI) : D1=rythme, D2=fréquence spermaceti, D3=azimut, D4=couche eau/surface. Donne : 1) Interprétation poétique plausible 2) Cohérence biologique 3) Perte d'info si compressé en Morse 1D. Français, précis, fascinant.`,
      `Signal 4D : rythme=${DIMS.time.values[dimT]} clics, fréquence=${DIMS.freq.values[dimF]} kHz, direction=${DIMS.azimuth.values[dimA]}° azimut, couche=${DIMS.depth.values[dimD]}`
    ).then(t=>{setResult4D(t);setLoading4D(false);}).catch(()=>{setResult4D("Erreur réseau.");setLoading4D(false);});
  };

  // ── Morse helpers ──
  const morseOf = t=>t.toUpperCase().split("").map(c=>c===" "?"   ":MORSE[c]||"").join("  ");
  const morseBits = morseText.toUpperCase().split("").filter(c=>MORSE[c]).reduce((s,c)=>s+MORSE[c].length,0);
  const codasNeeded = Math.ceil(morseBits/WHALE_DISCRETE);

  // ── Pipeline ──
  const textToMorseTokens = txt=>txt.toUpperCase().split("").map(c=>{
    if (c===" ") return {type:"space",char:" "};
    const m=MORSE[c]; if (!m) return null;
    return {type:"char",char:c,morse:m};
  }).filter(Boolean);

  const morseTokensToCodas = tokens=>tokens.filter(t=>t.type==="char").map((t,i)=>{
    const dots=t.morse.split("").filter(c=>c==="·").length;
    const dashes=t.morse.split("").filter(c=>c==="—").length;
    return { char:t.char, morse:t.morse,
      t:Math.min(t.morse.length-1,5), f:Math.min(dots*2,7),
      a:(i*3+dashes*2)%8, d:dashes===0?2:dashes>=2?0:1,
      label:`${DIMS.time.values[Math.min(t.morse.length-1,5)]}cl·${DIMS.freq.values[Math.min(dots*2,7)]}kHz·${DIMS.depth.values[dashes===0?2:dashes>=2?0:1]}`,
    };
  });

  const runPipeline = async ()=>{
    if (!pipeText.trim()) return;
    setPipeIA(""); setPipeMorse([]); setPipeCodas([]); setPipe4D(null); setPipeAnimIdx(-1);
    setPipeStep(1); await new Promise(r=>setTimeout(r,400));
    const tokens=textToMorseTokens(pipeText); setPipeMorse(tokens);
    setPipeStep(2);
    const codas=morseTokensToCodas(tokens);
    for (let i=0; i<codas.length; i++) { setPipeAnimIdx(i); await new Promise(r=>setTimeout(r,220)); }
    setPipeCodas(codas); setPipeAnimIdx(-1);
    setPipeStep(3); await new Promise(r=>setTimeout(r,300));
    const avg=(arr,key)=>Math.round(arr.reduce((s,c)=>s+c[key],0)/arr.length);
    setPipe4D({t:avg(codas,'t'),f:avg(codas,'f'),a:avg(codas,'a'),d:avg(codas,'d'),
      totalCodas:codas.length, morseBits:tokens.filter(t=>t.type==="char").reduce((s,t)=>s+t.morse.length,0)});
    setPipeStep(4); setPipeLoading(true);
    try {
      const summary=codas.map(c=>`${c.char}(${c.morse}→${c.label})`).join(", ");
      const t=await callIA(
        `Tu es un traducteur inter-espèces poétique. Un message humain a été transformé en Morse puis en codas 4D de cachalot. Imagine comment le cachalot le perçoit. 3 paragraphes : 1) Ce qu'il entend 2) Ce qu'il comprend 3) Ce qu'il répondrait. Français, poétique.`,
        `Message : "${pipeText}" | Codas : ${summary}`, 1000
      );
      setPipeIA(t);
    } catch { setPipeIA("Erreur réseau."); }
    setPipeLoading(false); setPipeStep(5);
  };

  const playPipelineCodas = async ()=>{
    if (!pipeCodas.length||pipeIsPlaying) return;
    stopRef.current=false; setPipeIsPlaying(true);
    for (let i=0; i<pipeCodas.length; i++) {
      if (stopRef.current) break;
      setPipePlayIdx(i);
      await new Promise(resolve=>playCoda4D(pipeCodas[i],resolve));
      await new Promise(r=>setTimeout(r,120));
    }
    setPipePlayIdx(-1); setPipeIsPlaying(false);
  };
  const stopPipelinePlay = ()=>{ stopRef.current=true; setPipeIsPlaying(false); setPipePlayIdx(-1); };

  // ── Reverse ──
  const REVERSE_MORSE = Object.fromEntries(Object.entries(MORSE).map(([k,v])=>[v,k]));

  const runReverse = async (coda) => {
    setRevCoda(coda); setRevMorse(""); setRevText(""); setRevIA("");
    setRevStep(1); setRevAnim(true); setTimeout(()=>setRevAnim(false),1800);
    playCodaICI(coda, null, ()=>{});
    await new Promise(r=>setTimeout(r,600));
    // Seuil médian ICI
    const sorted=[...coda.ici].sort((a,b)=>a-b);
    const median=sorted[Math.floor(sorted.length/2)];
    const morse=coda.ici.map(v=>v<median*1.2?"·":"—").join("");
    setRevMorse(morse); setRevStep(2);
    await new Promise(r=>setTimeout(r,500));
    const exact=REVERSE_MORSE[morse];
    let best=exact||"?";
    if (!exact) {
      let bestD=Infinity;
      for (const [m,c] of Object.entries(REVERSE_MORSE)) {
        if (Math.abs(m.length-morse.length)>2) continue;
        let d=0; for (let i=0;i<Math.max(m.length,morse.length);i++) if (m[i]!==morse[i]) d++;
        if (d<bestD) { bestD=d; best=c; }
      }
    }
    setRevText(best); setRevStep(3); setRevLoading(true); setRevStep(4);
    try {
      const t=await callIA(
        `Tu es traducteur inter-espèces et physicien acoustique. On a converti une coda de cachalot en Morse via le seuil médian des ICI. Commente : 1) Pertinence physique du seuil médian 2) Ce que la lettre évoque poétiquement 3) Information des 6 autres axes perdue dans cette réduction. Court, fascinant, français.`,
        `Coda "${coda.name}" (${coda.clan}) | ICI : [${coda.ici.join(",")}]ms | Médiane : ${Math.round(median)}ms | Morse : "${morse}" | Lettre : "${best}" | IPI : ${coda.ipi}ms | Rubato : ${coda.rubato}ms σ`
      );
      setRevIA(t);
    } catch { setRevIA("Erreur réseau."); }
    setRevLoading(false); setRevStep(5);
  };

  // ═══════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════
  const EVO_STEPS = [
    { title:"Contraintes de l'air",   color:"#fb7185", icon:"📡", content:"Le Morse a été inventé pour un canal 1D, bruité, sans écho exploitable. Il faut tout encoder dans le seul axe temporel (durée des signaux). Résultat : 2 états × N symboles = ~5.7 bits/caractère. La physique force la simplicité." },
    { title:"Avantages de l'eau",     color:"#38bdf8", icon:"🌊", content:"Le son dans l'eau voyage 4.7× plus vite, sur des milliers de km, avec une atténuation minimale. La surface agit comme un miroir acoustique quasi-parfait. Le fond réfléchit aussi. Ces interfaces créent des chemins multiples — chaque clic arrive en 3 copies avec des délais prévisibles et exploitables." },
    { title:"L'organe spermaceti",    color:"#f472b6", icon:"🔊", content:"2000 litres de cire liquide dans la tête. Ce n'est pas un larynx — c'est un synthétiseur physique. En modifiant la forme de l'organe, le cachalot change la structure interne de chaque clic : l'IPI (inter-pulse interval) encode directement la taille de l'animal. Chaque clic est une signature biométrique impossible à falsifier." },
    { title:"Hiérarchie fractale",    color:"#a78bfa", icon:"🔬", content:"4 échelles de temps imbriquées : IPI (µs) → identité individuelle | ICI (ms) → phonème/rythme | Coda (~1s) → mot/intention | Échange (min) → conversation | Dialecte (vie) → culture. Le Morse n'en a qu'une. L'évolution a eu 35 millions d'années pour construire cette hiérarchie." },
    { title:"Ce qu'on ne sait pas encore", color:"#fbbf24", icon:"❓", content:"Deux dimensions hypothétiques : (1) Superposition — deux cachalots peuvent émettre simultanément. Dans l'air c'est du bruit. Dans l'eau, leurs IPI différents permettent de séparer les sources. Vrai dialogue en parallèle. (2) Multipath intentionnel — encoder de l'information dans quel chemin acoustique porte le signal." },
  ];

  return (
    <div style={{ minHeight:"100vh", background:"#020817", fontFamily:"'Palatino Linotype','Book Antiqua',Palatino,serif", color:"#e2e8f0" }}>
      <style>{`
        @keyframes fadeUp    { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes codaPulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.45);opacity:0.8} }
        @keyframes pulse     { 0%,100%{opacity:1} 50%{opacity:0.4} }
        .coda-card { transition:all 0.25s; }
        .coda-card:hover { transform:translateY(-3px) scale(1.02); box-shadow:0 8px 28px #0ea5e920 !important; }
        .htab { transition:all 0.18s; cursor:pointer; }
        .htab:hover { background:#1e3a5f !important; }
        ::-webkit-scrollbar{width:3px} ::-webkit-scrollbar-thumb{background:#1e3a5f;border-radius:2px}
        .axis-row { transition:background 0.15s; border-radius:7px; }
        .axis-row:hover { background:#0a1628; }
      `}</style>

      <div style={{ maxWidth:"960px", margin:"0 auto", padding:"36px 18px" }}>

        {/* ── HEADER (titre de la v1) ── */}
        <div style={{ textAlign:"center", marginBottom:"40px", animation:"fadeUp 0.7s ease" }}>
          <div style={{ fontSize:"10px", letterSpacing:"5px", color:"#3b82f6", textTransform:"uppercase", marginBottom:"10px" }}>
            Projet CETI × Intelligence Artificielle × Théorie 7D
          </div>
          <h1 style={{ fontSize:"clamp(26px,4.5vw,46px)", fontWeight:"normal", margin:"0 0 6px", color:"#e2e8f0" }}>
            Codex des Cachalots
          </h1>
          <p style={{ color:"#475569", maxWidth:"580px", margin:"0 auto", lineHeight:1.8, fontSize:"13px" }}>
            Bibliothèque · Compositeur · Simulateur 4D · Évolution · Physique eau · Théorie Shannon · Morse · Pipeline · Décodage inverse
          </p>
        </div>

        {/* ── TABS ── */}
        <div style={{ display:"flex", gap:"3px", background:"#0a1628", borderRadius:"12px", padding:"5px", marginBottom:"28px", flexWrap:"wrap" }}>
          {TABS.map(([id,label])=>(
            <button key={id} className="htab" onClick={()=>setTab(id)} style={{
              flex:1, minWidth:"72px", padding:"8px 5px", borderRadius:"8px", border:"none",
              background:tab===id?"linear-gradient(135deg,#1e40af,#0c4a6e)":"transparent",
              color:tab===id?"#e2e8f0":"#475569", fontSize:"11px", fontFamily:"inherit",
            }}>{label}</button>
          ))}
        </div>

        {/* ════════════════ TAB : BIBLIOTHÈQUE ════════════════ */}
        {tab==="library" && (
          <div style={{ animation:"fadeUp 0.4s ease" }}>
            <p style={{ color:"#374151", fontSize:"12px", textAlign:"center", marginBottom:"18px" }}>
              Cliquez sur une coda pour l'entendre et la faire traduire par l'IA · Double viz : pattern symbolique + vrais ICI
            </p>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))", gap:"11px", marginBottom:"24px" }}>
              {CODA_LIBRARY.map((coda,i)=>{
                const emo=EMOTIONS[coda.baseEmotion];
                const active=selectedCoda?.name===coda.name;
                const playing=playingLib===i;
                return (
                  <div key={i} className="coda-card" onClick={()=>selectCoda(coda)} style={{
                    background:"linear-gradient(135deg,#0f1f3d,#0a1628)",
                    border:`1px solid ${active?emo.color+"80":"#1e3a5f"}`,
                    borderRadius:"12px", padding:"16px", cursor:"pointer",
                    boxShadow:active?`0 0 18px ${emo.color}30`:"none",
                  }}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"8px" }}>
                      <span style={{ fontSize:"10px", color:"#475569", fontFamily:"monospace" }}>{coda.name}</span>
                      <span style={{ fontSize:"15px" }}>{emo.icon}</span>
                    </div>
                    <div style={{ marginBottom:"8px" }}>
                      <ClickViz pattern={coda.pattern} animating={active&&animating}/>
                    </div>
                    <IciTimeline ici={coda.ici} ipi={coda.ipi} activeIdx={playing?activeLibClick:-1} spectral={coda.spectral} ornement={coda.ornement} voyelle={coda.voyelle}/>
                    <div style={{ marginTop:"8px", display:"flex", justifyContent:"space-between" }}>
                      <div style={{ fontSize:"9px", color:emo.color }}>{emo.label}</div>
                      <div style={{ fontSize:"9px", color:"#1e3a5f" }}>{coda.clan}</div>
                    </div>
                    <button onClick={e=>{ e.stopPropagation(); playLibCoda(coda,i); }} style={{
                      marginTop:"8px", width:"100%", padding:"5px", border:"none", borderRadius:6, cursor:"pointer",
                      background:playing?"#0a1628":`${emo.color}18`, color:playing?emo.color:"#475569",
                      fontSize:"10px", fontFamily:"inherit",
                    }}>{playing?"◉ En cours…":"▶ Écouter (ICI réels)"}</button>
                  </div>
                );
              })}
            </div>

            {(loadingTr||translation) && selectedCoda && (
              <div style={{ background:"linear-gradient(135deg,#0a1628,#061020)", border:"1px solid #1e3a5f", borderRadius:"14px", padding:"24px", position:"relative", overflow:"hidden", animation:"fadeUp 0.4s ease" }}>
                <WaveBg/>
                <div style={{ position:"relative" }}>
                  <div style={{ marginBottom:"16px", paddingBottom:"16px", borderBottom:"1px solid #1e3a5f" }}>
                    <div style={{ fontSize:"10px", color:"#475569", letterSpacing:"2px", textTransform:"uppercase", marginBottom:"7px" }}>Coda analysée</div>
                    <ClickViz pattern={selectedCoda.pattern} animating={animating}/>
                    <div style={{ display:"flex", gap:10, marginTop:10, flexWrap:"wrap" }}>
                      {[
                        {l:"ICI moy.",v:`${Math.round(selectedCoda.ici.reduce((a,b)=>a+b)/selectedCoda.ici.length)}ms`,c:"#38bdf8"},
                        {l:"IPI",v:`${selectedCoda.ipi}ms`,c:"#f472b6"},
                        {l:"Tempo",v:`${selectedCoda.tempo}ms`,c:"#4ade80"},
                        {l:"Rubato σ",v:`${selectedCoda.rubato}ms`,c:"#fb923c"},
                        {l:"Spectral",v:`${selectedCoda.spectral}kHz`,c:"#a78bfa"},
                      ].map((s,i)=>(
                        <div key={i} style={{ background:"#060f1e", borderRadius:6, padding:"4px 9px", border:`1px solid ${s.c}20` }}>
                          <div style={{ fontSize:"8px", color:"#374151" }}>{s.l}</div>
                          <div style={{ fontSize:"13px", color:s.c, fontFamily:"monospace", fontWeight:"bold" }}>{s.v}</div>
                        </div>
                      ))}
                      <div style={{ marginLeft:"auto" }}>
                        <ShannonRadar coda={selectedCoda}/>
                      </div>
                    </div>
                  </div>
                  <div style={{ fontSize:"10px", color:"#60a5fa", letterSpacing:"2px", textTransform:"uppercase", marginBottom:"12px" }}>◈ Traduction IA</div>
                  {loadingTr
                    ? <div style={{ display:"flex", gap:"5px" }}>{[0,1,2].map(i=><div key={i} style={{ width:6,height:6,borderRadius:"50%",background:"#3b82f6",animation:`pulse 1s ease ${i*0.2}s infinite` }}/>)}</div>
                    : <div style={{ color:"#cbd5e1", lineHeight:1.85, fontSize:"14px", whiteSpace:"pre-wrap", fontStyle:"italic" }}>{translation}</div>
                  }
                  <div style={{ marginTop:"14px", paddingTop:"10px", borderTop:"1px solid #1e3a5f", fontSize:"10px", color:"#374151" }}>
                    ⚠ Interprétation inspirée des recherches CETI. ICI/IPI/rubato : données réelles. D3/D4 : hypothèses.
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ════════════════ TAB : COMPOSER ════════════════ */}
        {tab==="compose" && (
          <div style={{ animation:"fadeUp 0.4s ease" }}>
            <div style={{ background:"linear-gradient(135deg,#0f1f3d,#0a1628)", border:"1px solid #1e3a5f", borderRadius:"14px", padding:"26px", marginBottom:"20px" }}>
              <p style={{ color:"#475569", fontSize:"12px", marginBottom:"20px", textAlign:"center" }}>
                Composez votre propre séquence — ajoutez des clics et des pauses
              </p>
              <div style={{ minHeight:"58px", background:"#060f1e", borderRadius:"10px", padding:"14px 18px", marginBottom:"18px", display:"flex", alignItems:"center", border:"1px solid #1e3a5f", flexWrap:"wrap" }}>
                {userPattern.length===0
                  ? <span style={{ color:"#374151", fontStyle:"italic", fontSize:"13px" }}>Votre coda apparaîtra ici…</span>
                  : <ClickViz pattern={userPattern.join("")} animating={animating}/>
                }
              </div>
              <div style={{ display:"flex", gap:"8px", flexWrap:"wrap", marginBottom:"14px" }}>
                {[
                  {label:"· Clic",  onClick:addClick,      bg:"linear-gradient(135deg,#1e40af,#0ea5e9)", color:"#fff"},
                  {label:"⎵ Pause", onClick:addPause,      bg:"transparent", color:"#64748b", border:"1px solid #1e3a5f"},
                  {label:"↺ Reset", onClick:resetCompose,  bg:"transparent", color:"#475569", border:"1px solid #374151"},
                ].map((btn,i)=>(
                  <button key={i} onClick={btn.onClick} style={{
                    padding:"11px 20px", borderRadius:"9px", border:btn.border||"none",
                    cursor:"pointer", background:btn.bg, color:btn.color,
                    fontSize:"13px", fontFamily:"inherit", transition:"all 0.15s",
                  }}>{btn.label}</button>
                ))}
                <button onClick={analyzeCustom} disabled={!userPattern.length||loadingTr} style={{
                  padding:"11px 20px", borderRadius:"9px", border:"none", marginLeft:"auto",
                  cursor:userPattern.length?"pointer":"not-allowed",
                  background:userPattern.length?"linear-gradient(135deg,#7c3aed,#4f46e5)":"#1e293b",
                  color:userPattern.length?"#fff":"#374151", fontSize:"13px", fontFamily:"inherit",
                }}>{loadingTr?"Analyse…":"🔬 Analyser avec l'IA"}</button>
              </div>
              <div style={{ fontSize:"10px", color:"#374151", textAlign:"center" }}>
                {userPattern.filter(c=>c==="·").length} clics · {userPattern.filter(c=>c===" ").length} pauses
              </div>
            </div>
            {(loadingTr||translation) && selectedCoda && (
              <div style={{ background:"linear-gradient(135deg,#0a1628,#061020)", border:"1px solid #1e3a5f", borderRadius:"14px", padding:"22px", position:"relative", overflow:"hidden", animation:"fadeUp 0.4s ease" }}>
                <WaveBg/>
                <div style={{ position:"relative" }}>
                  <div style={{ fontSize:"10px", color:"#60a5fa", letterSpacing:"2px", textTransform:"uppercase", marginBottom:"12px" }}>◈ Traduction IA</div>
                  {loadingTr
                    ? <div style={{ display:"flex", gap:"5px" }}>{[0,1,2].map(i=><div key={i} style={{ width:6,height:6,borderRadius:"50%",background:"#3b82f6",animation:`pulse 1s ease ${i*0.2}s infinite` }}/>)}</div>
                    : <div style={{ color:"#cbd5e1", lineHeight:1.85, fontSize:"14px", whiteSpace:"pre-wrap", fontStyle:"italic" }}>{translation}</div>
                  }
                </div>
              </div>
            )}
          </div>
        )}

        {/* ════════════════ TAB : SIMULATEUR 4D ════════════════ */}
        {tab==="sim4d" && (
          <div style={{ animation:"fadeUp 0.4s ease" }}>
            <div style={{ display:"grid", gridTemplateColumns:"1fr auto", gap:"22px", alignItems:"start" }}>
              <div>
                <div style={{ background:"#0a1628", borderRadius:"14px", padding:"22px", border:"1px solid #1e3a5f", marginBottom:"14px" }}>
                  <div style={{ fontSize:"10px", color:"#60a5fa", letterSpacing:"2px", textTransform:"uppercase", marginBottom:"18px" }}>
                    Configurer les 4 dimensions du signal
                  </div>
                  <DimSlider dim="time"    values={DIMS.time.values}    colors={DIMS.time.colors}    value={dimT} onChange={setDimT}/>
                  <DimSlider dim="freq"    values={DIMS.freq.values}    colors={DIMS.freq.colors}    value={dimF} onChange={setDimF}/>
                  <DimSlider dim="azimuth" values={DIMS.azimuth.values} colors={DIMS.azimuth.colors} value={dimA} onChange={setDimA}/>
                  <DimSlider dim="depth"   values={DIMS.depth.values}   colors={DIMS.depth.colors}   value={dimD} onChange={setDimD}/>
                </div>
                <div style={{ display:"flex", gap:"9px" }}>
                  <button onClick={()=>{ setAnim4D(true); setTimeout(()=>setAnim4D(false),1800); analyze4D(); }} style={{
                    flex:1, padding:"12px", borderRadius:"10px", border:"none", cursor:"pointer",
                    background:"linear-gradient(135deg,#1e40af,#0ea5e9)", color:"#fff", fontSize:"13px", fontFamily:"inherit",
                  }}>{loading4D?"Analyse IA…":"🔬 Analyser ce signal 4D"}</button>
                  <button onClick={()=>{ setAnim4D(true); setTimeout(()=>setAnim4D(false),1800); }} style={{
                    padding:"12px 16px", borderRadius:"10px", border:"1px solid #1e3a5f", cursor:"pointer",
                    background:"transparent", color:"#64748b", fontFamily:"inherit", fontSize:"13px",
                  }}>◎ Émettre</button>
                </div>
              </div>
              <div style={{ textAlign:"center" }}>
                <AzimuthViz azimuth={dimA} depth={dimD} freq={dimF} time={dimT} animating={anim4D}/>
                <div style={{ marginTop:"10px", fontSize:"10px", lineHeight:1.9 }}>
                  <div style={{ color:DIMS.azimuth.colors[dimA] }}>{DIMS.azimuth.values[dimA]}° azimut</div>
                  <div style={{ color:DIMS.depth.colors[dimD]   }}>Interface : {DIMS.depth.values[dimD]}</div>
                  <div style={{ color:DIMS.time.colors[dimT]    }}>{DIMS.time.values[dimT]} clic{DIMS.time.values[dimT]>1?"s":""}</div>
                  <div style={{ color:DIMS.freq.colors[dimF]    }}>{DIMS.freq.values[dimF]} kHz</div>
                </div>
              </div>
            </div>
            {(loading4D||result4D) && (
              <div style={{ marginTop:"18px", background:"#060f1e", borderRadius:"12px", padding:"20px", border:"1px solid #1e3a5f", animation:"fadeUp 0.4s ease" }}>
                <div style={{ fontSize:"10px", color:"#60a5fa", letterSpacing:"2px", textTransform:"uppercase", marginBottom:"12px" }}>◈ Interprétation IA du signal 4D</div>
                {loading4D
                  ? <div style={{ display:"flex", gap:"5px" }}>{[0,1,2].map(i=><div key={i} style={{ width:6,height:6,borderRadius:"50%",background:"#38bdf8",animation:`pulse 1s ease ${i*0.2}s infinite` }}/>)}</div>
                  : <div style={{ color:"#cbd5e1", lineHeight:1.9, fontSize:"14px", whiteSpace:"pre-wrap", fontStyle:"italic" }}>{result4D}</div>
                }
              </div>
            )}
          </div>
        )}

        {/* ════════════════ TAB : ÉVOLUTION ════════════════ */}
        {tab==="evolution" && (
          <div style={{ animation:"fadeUp 0.4s ease" }}>
            <div style={{ fontSize:"12px", color:"#374151", lineHeight:1.9, marginBottom:"22px", fontStyle:"italic" }}>
              Si tu es l'évolution et que tu dois concevoir un langage dans l'eau, tu ne pars pas de zéro — tu exploites la physique.
              Voici pourquoi les cachalots ont ~10× plus d'information par signal que le Morse.
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:28 }}>
              {EVO_STEPS.map((step,i)=>(
                <div key={i} className="coda-card" onClick={()=>setEvoStep(evoStep===i?-1:i)} style={{
                  background:"#060f1e", border:`1px solid ${evoStep===i?step.color+"60":"#0f2040"}`,
                  borderRadius:12, padding:"15px 20px", cursor:"pointer",
                  boxShadow:evoStep===i?`0 0 20px ${step.color}12`:""
                }}>
                  <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                    <div style={{ fontSize:20 }}>{step.icon}</div>
                    <div style={{ fontSize:"13px", color:evoStep===i?step.color:"#94a3b8", flex:1 }}>{step.title}</div>
                    <div style={{ fontSize:10, color:"#374151" }}>{evoStep===i?"▲":"▼"}</div>
                  </div>
                  {evoStep===i && (
                    <div style={{ marginTop:12, fontSize:"12px", color:"#94a3b8", lineHeight:1.9, borderTop:`1px solid ${step.color}20`, paddingTop:12, animation:"fadeUp 0.3s ease" }}>
                      {step.content}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div style={{ background:"#060f1e", borderRadius:12, padding:"20px 22px", border:"1px solid #0f2040" }}>
              <div style={{ fontSize:"10px", color:"#64748b", letterSpacing:"2px", textTransform:"uppercase", marginBottom:14 }}>Comparaison des canaux</div>
              <div style={{ overflowX:"auto" }}>
                <table style={{ width:"100%", borderCollapse:"collapse", fontSize:"11px" }}>
                  <thead>
                    <tr>{["Propriété","Morse (air)","Cachalot (eau)","Gain évolutif"].map(h=>(
                      <th key={h} style={{ textAlign:"left", padding:"7px 11px", color:"#475569", borderBottom:"1px solid #0f2040", fontWeight:"normal" }}>{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody>
                    {[
                      ["Vitesse son",     "343 m/s",     "1500 m/s",         "×4.7 — moins d'ambiguïté temporelle"],
                      ["Portée",          "~50 km",      "~3000 km (SOFAR)", "×60 — réseau social planétaire"],
                      ["Écho exploitable","Non",          "Oui (3 chemins)",  "Information gratuite de la physique"],
                      ["Axes d'info",     "1 (timing)",  "6 confirmés + 1*", "×7 — 4 Sharma + voyelles Beguš + IPI"],
                      ["Bits/signal",     "1 bit (·/—)", `${WHALE_DISCRETE.toFixed(1)} bits (Sharma+Beguš)`,`×${RATIO_D} — 21 → 1620 combinaisons`],
                      ["Signature corps", "Non",          "IPI = taille",     "Identité impossible à falsifier"],
                    ].map(([p,m,w,g],i)=>(
                      <tr key={i} style={{ borderBottom:"1px solid #0a1628" }}>
                        <td style={{ padding:"8px 11px", color:"#64748b" }}>{p}</td>
                        <td style={{ padding:"8px 11px", color:"#fb7185", fontFamily:"monospace" }}>{m}</td>
                        <td style={{ padding:"8px 11px", color:"#4ade80", fontFamily:"monospace" }}>{w}</td>
                        <td style={{ padding:"8px 11px", color:"#94a3b8", fontSize:"10px" }}>{g}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ════════════════ TAB : PHYSIQUE ════════════════ */}
        {tab==="physics" && (
          <div style={{ animation:"fadeUp 0.4s ease" }}>
            <div style={{ background:"#060f1e", borderRadius:12, padding:"20px 22px", border:"1px solid #0f2040", marginBottom:16 }}>
              <div style={{ fontSize:"10px", color:"#38bdf8", letterSpacing:"2px", textTransform:"uppercase", marginBottom:14 }}>
                Propagation multi-chemin acoustique
              </div>
              <div style={{ display:"flex", gap:20, alignItems:"center", flexWrap:"wrap" }}>
                <WaterPropagation depth={physDepth} active={physActive}/>
                <div style={{ flex:1, minWidth:160 }}>
                  <div style={{ fontSize:"11px", color:"#64748b", marginBottom:8 }}>
                    Profondeur émetteur : <span style={{ color:"#fbbf24" }}>{physDepth}m</span>
                  </div>
                  <input type="range" min="50" max="2000" value={physDepth}
                    onChange={e=>setPhysDepth(Number(e.target.value))}
                    style={{ width:"100%", accentColor:"#fbbf24", marginBottom:12 }}/>
                  <div style={{ fontSize:"11px", color:"#374151", lineHeight:1.8 }}>
                    À {physDepth}m, les 3 chemins arrivent :<br/>
                    <span style={{ color:"#38bdf8" }}>Direct</span> : 0ms &nbsp;
                    <span style={{ color:"#4ade80" }}>Surface</span> : +{Math.round(physDepth*2/1500*1000*0.8)}ms &nbsp;
                    <span style={{ color:"#a78bfa" }}>Fond (2000m)</span> : +{Math.round((2000-physDepth)*2/1500*1000*0.6)}ms
                  </div>
                  <button onClick={()=>{ setPhysActive(true); setTimeout(()=>setPhysActive(false),2500); }}
                    style={{ marginTop:12, padding:"8px 16px", borderRadius:8, border:"none", cursor:"pointer",
                      background:"#38bdf820", color:"#38bdf8", fontSize:"11px", fontFamily:"inherit" }}>
                    ▶ Simuler propagation
                  </button>
                </div>
              </div>
            </div>
            <div style={{ background:"#060f1e", borderRadius:12, padding:"20px 22px", border:"1px solid #0f2040" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:14 }}>
                <div style={{ fontSize:"10px", color:"#a78bfa", letterSpacing:"2px", textTransform:"uppercase" }}>
                  6 axes confirmés + 1 hypothèse
                </div>
                <div style={{ fontSize:"9px", color:"#374151" }}>
                  <span style={{ color:"#38bdf8" }}>■</span> indépendant &nbsp;
                  <span style={{ color:"#fb923c" }}>■</span> contextuel &nbsp;
                  <span style={{ color:"#fbbf24" }}>■</span> identité
                </div>
              </div>
              {EVO_AXES.map((ax,i)=>(
                <div key={i} className="axis-row" style={{ borderLeft:`3px solid ${ax.color}`, padding:"9px 12px", marginBottom:8 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:4 }}>
                    <div style={{ fontSize:"12px", color:ax.color, fontFamily:"monospace", minWidth:80 }}>{ax.label}</div>
                    <div style={{ fontSize:"10px", color:"#64748b", flex:1 }}>{ax.full}</div>
                    <div style={{ fontSize:"8px", color:"#374151", marginRight:6,
                      background:ax.ctx==="contextuel"?"#fb923c18":ax.ctx==="indépendant"?"#38bdf818":ax.ctx==="identité"?"#fbbf2418":"#64748b18",
                      color:ax.ctx==="contextuel"?"#fb923c":ax.ctx==="indépendant"?"#38bdf8":ax.ctx==="identité"?"#fbbf24":"#64748b",
                      padding:"2px 5px", borderRadius:3 }}>
                      {ax.ctx}
                    </div>
                    <div style={{ fontSize:"9px",
                      color:ax.sci?"#4ade80":"#64748b", background:ax.sci?"#4ade8015":"#64748b15",
                      padding:"2px 6px", borderRadius:4 }}>
                      {ax.sci?"✓ confirmé":"~ hypothèse"}
                    </div>
                  </div>
                  <div style={{ fontSize:"10px", color:"#475569", lineHeight:1.7 }}>{ax.why}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ════════════════ TAB : THÉORIE ════════════════ */}
        {tab==="theory" && (
          <div style={{ animation:"fadeUp 0.4s ease" }}>
            {/* Règle fondamentale */}
            <div style={{ background:"#0c1a1a", border:"1px solid #14532d", borderRadius:"11px", padding:"13px 17px", marginBottom:"20px", fontSize:"12px", color:"#86efac", lineHeight:1.8 }}>
              <strong style={{ color:"#4ade80" }}>⚠ Règle fondamentale :</strong> ne jamais mélanger codes <em>discrets</em> et signaux <em>continus</em>.
              Le paradoxe apparent "12 bits voix humaine > 10,7 bits cachalot" vient de cette confusion — les deux niveaux restent en faveur du cachalot.
            </div>

            {/* Alphabet phonétique Sharma 2024 — LA grande correction */}
            <div style={{ background:"#060f1e", borderRadius:"13px", padding:"20px 22px", marginBottom:"18px", border:"1px solid #38bdf840" }}>
              <div style={{ fontSize:"10px", color:"#38bdf8", letterSpacing:"2px", textTransform:"uppercase", marginBottom:"16px" }}>
                L'Alphabet phonétique — Sharma et al. 2024 (Nature Communications)
              </div>
              <div style={{ fontSize:"11px", color:"#475569", lineHeight:1.8, marginBottom:14 }}>
                Les cachalots ne communiquent pas avec 21 types de codas fixes. Ils combinent librement <strong style={{ color:"#e2e8f0" }}>4 features</strong> pour produire un répertoire combinatoire. Comme les phonèmes humains construisent les mots.
              </div>
              {/* Les 4 features */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px", marginBottom:16 }}>
                {[
                  { f:"Rythme",   états:"18 types", ctx:"indépendant", color:"#38bdf8", desc:"Pattern ICI discret — le 'squelette' de la coda. 18 types identifiés dans le dataset Dominica." },
                  { f:"Tempo",    états:"5 catégories",ctx:"indépendant", color:"#4ade80", desc:"Durée totale de la coda. Comme jouer la même mélodie lento ou presto." },
                  { f:"Rubato",   états:"3 contours", ctx:"CONTEXTUEL",  color:"#fb923c", desc:"Accélération/décélération relative aux codas précédentes. Imité entre baleines en temps réel." },
                  { f:"Ornement", états:"±1 clic",    ctx:"CONTEXTUEL",  color:"#f472b6", desc:"Clic supplémentaire ajouté à la fin. Modifie la distribution ICI. Absente de notre ancien modèle !" },
                ].map((item,i)=>(
                  <div key={i} style={{ background:"#0a1628", borderRadius:8, padding:"12px 14px", border:`1px solid ${item.color}25` }}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                      <span style={{ fontSize:"13px", color:item.color, fontWeight:"bold" }}>{item.f}</span>
                      <div style={{ display:"flex", gap:4 }}>
                        <span style={{ fontSize:"8px", color:item.color, background:item.color+"20", padding:"2px 5px", borderRadius:3 }}>{item.états}</span>
                        <span style={{ fontSize:"8px",
                          color:item.ctx==="CONTEXTUEL"?"#fb923c":"#64748b",
                          background:item.ctx==="CONTEXTUEL"?"#fb923c18":"#64748b15",
                          padding:"2px 5px", borderRadius:3 }}>{item.ctx}</span>
                      </div>
                    </div>
                    <div style={{ fontSize:"10px", color:"#475569", lineHeight:1.6 }}>{item.desc}</div>
                  </div>
                ))}
              </div>
              {/* Explosion combinatoire */}
              <div style={{ background:"#020817", borderRadius:8, padding:"14px 16px", fontFamily:"monospace", fontSize:"12px", lineHeight:2.2 }}>
                <div style={{ color:"#374151", marginBottom:4, fontSize:"9px", letterSpacing:"1px", textTransform:"uppercase", fontFamily:"inherit" }}>Explosion combinatoire</div>
                <div>
                  <span style={{ color:"#94a3b8" }}>Avant 2024</span>{"  → "}<span style={{ color:"#fb7185" }}>21 types</span>{" = "}
                  <span style={{ color:"#fb7185", fontWeight:"bold" }}>log₂(21) = {PRE_SHARMA_BITS} bits/coda</span>
                </div>
                <div>
                  <span style={{ color:"#38bdf8" }}>Sharma 2024</span>{" → "}<span style={{ color:"#38bdf8" }}>18 × 5 × 2 × 3</span>{" = "}
                  <span style={{ color:"#38bdf8", fontWeight:"bold" }}>log₂({SHARMA_BASE}) ≈ {Math.log2(SHARMA_BASE).toFixed(1)} bits</span>
                  <span style={{ color:"#374151" }}> (×{(Math.log2(SHARMA_BASE)/Number(PRE_SHARMA_BITS)).toFixed(1)} plus riche)</span>
                </div>
                <div>
                  <span style={{ color:"#a78bfa" }}>+ Beguš 2025</span>{" → "}
                  <span style={{ color:"#a78bfa" }}>{SHARMA_BASE} × {BEGUS_SPECTRAL} voyelles</span>{" = "}
                  <span style={{ color:"#a78bfa", fontWeight:"bold" }}>log₂({TOTAL_STATES}) = {WHALE_DISCRETE.toFixed(1)} bits/coda</span>
                </div>
                <div style={{ borderTop:"1px solid #1e3a5f", marginTop:4, paddingTop:8 }}>
                  <span style={{ color:"#4ade80" }}>vs. Morse</span>{"         = log₂(2)         = "}
                  <span style={{ color:"#4ade80", fontWeight:"bold" }}>1,0 bit/symbole → ratio ×{RATIO_D}</span>
                </div>
              </div>
              <div style={{ marginTop:12, fontSize:"10px", color:"#374151", lineHeight:1.7 }}>
                156 codas distinctes observées dans 9 000 enregistrements (Dominica 2005–2018). Potentiel théorique : {TOTAL_STATES} combinaisons.
                Certaines ne sont probablement jamais utilisées — comme les humains n'utilisent pas tous les trigrammes possibles.
              </div>
            </div>

            {/* Voyelles Beguš 2025 */}
            <div style={{ background:"#060f1e", borderRadius:"13px", padding:"18px 22px", marginBottom:"18px", border:"1px solid #a78bfa40" }}>
              <div style={{ fontSize:"10px", color:"#a78bfa", letterSpacing:"2px", textTransform:"uppercase", marginBottom:12 }}>
                5ème dimension — Beguš et al. 2025 (Berkeley / CETI)
              </div>
              <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
                {[
                  { v:"ɑ-voyelle", color:"#38bdf8", desc:"Fréquence basse, stable. Analogue au 'a' humain. Observée dans les échanges sociaux calmes." },
                  { v:"i-voyelle", color:"#a78bfa", desc:"Fréquence haute, stable. Analogue au 'i' humain. Souvent en réponse à une ɑ-voyelle." },
                  { v:"diphtongue",color:"#fb923c", desc:"Transition spectrale au cours du clic. Analogue à 'oi' ou 'ai'. Marqueur contextuel fort." },
                ].map((item,i)=>(
                  <div key={i} style={{ flex:1, minWidth:120, background:"#0a1628", borderRadius:8, padding:"10px 13px", border:`1px solid ${item.color}30` }}>
                    <div style={{ fontSize:"16px", color:item.color, fontFamily:"monospace", fontWeight:"bold", marginBottom:5 }}>{item.v}</div>
                    <div style={{ fontSize:"10px", color:"#475569", lineHeight:1.6 }}>{item.desc}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop:10, fontSize:"10px", color:"#374151", lineHeight:1.7 }}>
                "In the past, researchers thought of whale communication as a kind of morse code. However, this paper shows that their calls are more like very, very slow vowels." — G. Beguš, Berkeley Linguistics, nov. 2025.
              </div>
            </div>

            {/* Niveaux discret/continu */}
            <div style={{ fontSize:"10px", color:"#60a5fa", letterSpacing:"2px", textTransform:"uppercase", marginBottom:"9px" }}>Niveaux discret vs continu</div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"9px", marginBottom:"16px" }}>
              <InfoCard label="Morse (1D discret)"      value="1,0 bit"                              color="#fb7185" sub="log₂(2) · 2 états"/>
              <InfoCard label="Cachalot (5D confirmés)" value={`${WHALE_DISCRETE.toFixed(1)} bits`} color="#38bdf8" sub={`log₂(${TOTAL_STATES}) · ${TOTAL_STATES} états`}/>
              <InfoCard label="Ratio discret"            value={`×${RATIO_D}`}                       color="#4ade80" sub="Sharma + Beguš 2024–2025"/>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"9px", marginBottom:"18px" }}>
              <InfoCard label="Voix humaine (continu)"  value="~12 bits"  color="#fbbf24" sub="temps × formants × amplitude"/>
              <InfoCard label="Cachalot continu"        value="~22 bits"  color="#38bdf8" sub="6 axes confirmés × résolution"/>
              <InfoCard label="Ratio continu"            value="×1,8"     color="#4ade80" sub="cachalot reste supérieur"/>
            </div>
          </div>
        )}

        {/* ════════════════ TAB : MORSE ════════════════ */}
        {tab==="morse" && (
          <div style={{ animation:"fadeUp 0.4s ease" }}>
            <div style={{ background:"#0a1628", borderRadius:"13px", padding:"22px", border:"1px solid #1e3a5f", marginBottom:"18px" }}>
              <div style={{ fontSize:"10px", color:"#fb7185", letterSpacing:"2px", textTransform:"uppercase", marginBottom:"14px" }}>Code Morse — encodage 1D discret (1 bit/symbole)</div>
              <input value={morseText} onChange={e=>setMorseText(e.target.value.toUpperCase().slice(0,30))}
                placeholder="Tapez un message…"
                style={{ width:"100%", padding:"11px 15px", borderRadius:"8px", border:"1px solid #1e3a5f",
                  background:"#060f1e", color:"#e2e8f0", fontFamily:"inherit", fontSize:"16px",
                  marginBottom:"14px", boxSizing:"border-box", outline:"none" }}/>
              <div style={{ fontFamily:"monospace", fontSize:"16px", letterSpacing:"3px", wordBreak:"break-all", lineHeight:2 }}>
                {morseOf(morseText).split("").map((c,i)=>(
                  <span key={i} style={{ color:c==="·"?"#38bdf8":c==="—"?"#fb7185":"#1e3a5f" }}>{c}</span>
                ))}
              </div>
              <div style={{ fontSize:"11px", color:"#374151", marginTop:"10px" }}>
                {morseText.replace(/ /g,"").length} car. → {morseBits} symboles Morse → <span style={{ color:"#fb7185" }}>{morseBits} bits</span>
              </div>
            </div>
            <div style={{ background:"#060f1e", borderRadius:"13px", padding:"22px", border:"1px solid #1e3a5f", marginBottom:"18px" }}>
              <div style={{ fontSize:"10px", color:"#38bdf8", letterSpacing:"2px", textTransform:"uppercase", marginBottom:"14px" }}>Équivalent en codas 4D</div>
              <div style={{ display:"flex", alignItems:"center", gap:"18px", flexWrap:"wrap" }}>
                <div style={{ textAlign:"center" }}>
                  <div style={{ fontSize:"36px", fontFamily:"monospace", color:"#fb7185" }}>{morseBits}</div>
                  <div style={{ fontSize:"10px", color:"#475569" }}>bits en Morse</div>
                </div>
                <div style={{ fontSize:"22px", color:"#374151" }}>≡</div>
                <div style={{ textAlign:"center" }}>
                  <div style={{ fontSize:"36px", fontFamily:"monospace", color:"#38bdf8" }}>{codasNeeded}</div>
                  <div style={{ fontSize:"10px", color:"#475569" }}>codas 4D suffisent</div>
                </div>
                <div style={{ flex:1, minWidth:"180px", background:"#0a1628", borderRadius:"8px", padding:"12px", fontSize:"12px", color:"#475569", lineHeight:1.75 }}>
                  "<em style={{ color:"#94a3b8" }}>{morseText}</em>" en <strong style={{ color:"#fb7185" }}>{morseBits} symboles Morse</strong> ou <strong style={{ color:"#38bdf8" }}>{codasNeeded} coda{codasNeeded>1?"s":""} 4D</strong> — soit ×{RATIO_D} plus dense.
                </div>
              </div>
            </div>
            <div style={{ background:"linear-gradient(135deg,#0a1628,#0c1a3a)", borderRadius:"11px", padding:"18px 22px", border:"1px solid #1e40af40", fontSize:"11px", color:"#475569", lineHeight:1.9 }}>
              <strong style={{ color:"#94a3b8" }}>Pourquoi le Morse est structurellement limité :</strong> il opère dans l'air, medium 1D.
              Le son aquatique se propage en sphère complète et l'interface eau/surface crée des guides d'ondes naturels.
              Les cachalots ont co-évolué avec cette physique pendant <strong style={{ color:"#38bdf8" }}>35 millions d'années</strong>.
            </div>
          </div>
        )}

        {/* ════════════════ TAB : PIPELINE ════════════════ */}
        {tab==="pipeline" && (
          <div style={{ animation:"fadeUp 0.4s ease" }}>
            <div style={{ background:"#0c1a2e", border:"1px solid #1e3a5f", borderRadius:"11px", padding:"13px 18px", marginBottom:"22px", fontSize:"12px", color:"#64748b", lineHeight:1.8 }}>
              <span style={{ color:"#e2e8f0" }}>Texte</span> → <span style={{ color:"#fb7185" }}>Morse</span> → <span style={{ color:"#38bdf8" }}>Codas 4D</span> → <span style={{ color:"#4ade80" }}>Interprétation cachalot IA</span>
            </div>
            <div style={{ display:"flex", gap:"10px", marginBottom:"28px" }}>
              <input value={pipeText} onChange={e=>setPipeText(e.target.value.toUpperCase().slice(0,40))}
                placeholder="Entrez un message…"
                style={{ flex:1, padding:"13px 16px", borderRadius:"10px", border:"1px solid #1e3a5f",
                  background:"#060f1e", color:"#e2e8f0", fontFamily:"inherit", fontSize:"16px",
                  letterSpacing:"2px", outline:"none" }}/>
              <button onClick={runPipeline} disabled={pipeLoading||!pipeText.trim()} style={{
                padding:"13px 24px", borderRadius:"10px", border:"none", cursor:"pointer",
                background:pipeLoading?"#1e293b":"linear-gradient(135deg,#1e40af,#0ea5e9)",
                color:pipeLoading?"#374151":"#fff", fontSize:"13px", fontFamily:"inherit", whiteSpace:"nowrap",
              }}>{pipeLoading?"Pipeline…":"⇝ Lancer"}</button>
            </div>

            {/* Étapes visuelles */}
            <div style={{ display:"flex", alignItems:"center", marginBottom:"28px", overflowX:"auto", paddingBottom:"4px" }}>
              {[
                {n:1,label:"Texte humain",  color:"#e2e8f0",icon:"A"},
                {n:2,label:"Code Morse",    color:"#fb7185", icon:"·—"},
                {n:3,label:"Codas 4D",      color:"#38bdf8", icon:"◎"},
                {n:4,label:"Vision 4D",     color:"#a78bfa", icon:"⊕"},
                {n:5,label:"🐋 Réponse IA", color:"#4ade80", icon:"〰"},
              ].map((st,i)=>(
                <div key={st.n} style={{ display:"flex", alignItems:"center", flex:"none" }}>
                  <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:"5px", opacity:pipeStep>=st.n?1:0.3, transition:"opacity 0.4s" }}>
                    <div style={{ width:"42px", height:"42px", borderRadius:"50%",
                      background:pipeStep>=st.n?`${st.color}22`:"#0a1628",
                      border:`2px solid ${pipeStep>=st.n?st.color:"#1e3a5f"}`,
                      display:"flex", alignItems:"center", justifyContent:"center",
                      fontSize:"13px", color:st.color, fontFamily:"monospace",
                      boxShadow:pipeStep===st.n?`0 0 16px ${st.color}60`:"none", transition:"all 0.4s",
                    }}>{st.icon}</div>
                    <div style={{ fontSize:"9px", color:pipeStep>=st.n?st.color:"#374151", textAlign:"center", maxWidth:"60px", lineHeight:1.3 }}>{st.label}</div>
                  </div>
                  {i<4 && <div style={{ width:"32px", height:"2px", margin:"0 4px", marginBottom:"16px",
                    background:pipeStep>st.n?`linear-gradient(90deg,${st.color},${["#e2e8f0","#fb7185","#38bdf8","#a78bfa","#4ade80"][i+1]})`:"#1e3a5f",
                    transition:"background 0.4s" }}/>}
                </div>
              ))}
            </div>

            {pipeStep>=1 && <div style={{ background:"#0a1628", borderRadius:"12px", padding:"18px 20px", marginBottom:"14px", border:"1px solid #e2e8f040", animation:"fadeUp 0.4s ease" }}>
              <div style={{ fontSize:"10px", color:"#64748b", letterSpacing:"2px", textTransform:"uppercase", marginBottom:"10px" }}>① Texte humain</div>
              <div style={{ fontSize:"22px", letterSpacing:"4px", color:"#e2e8f0", fontFamily:"monospace" }}>{pipeText}</div>
            </div>}

            {pipeStep>=1 && pipeMorse.length>0 && <div style={{ background:"#0a1628", borderRadius:"12px", padding:"18px 20px", marginBottom:"14px", border:"1px solid #fb718540", animation:"fadeUp 0.4s ease 0.1s both" }}>
              <div style={{ fontSize:"10px", color:"#fb7185", letterSpacing:"2px", textTransform:"uppercase", marginBottom:"12px" }}>② Code Morse</div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:"10px" }}>
                {pipeMorse.map((t,i)=>t.type==="space"?<div key={i} style={{ width:"20px" }}/>:(
                  <div key={i} style={{ background:"#060f1e", borderRadius:"7px", padding:"7px 10px", border:"1px solid #fb718530", textAlign:"center" }}>
                    <div style={{ fontSize:"11px", color:"#64748b", marginBottom:"4px" }}>{t.char}</div>
                    <div style={{ fontFamily:"monospace", fontSize:"14px", letterSpacing:"2px" }}>
                      {t.morse.split("").map((c,j)=><span key={j} style={{ color:c==="·"?"#38bdf8":"#fb7185" }}>{c}</span>)}
                    </div>
                  </div>
                ))}
              </div>
            </div>}

            {pipeStep>=2 && pipeCodas.length>0 && (
              <div style={{ background:"#0a1628", borderRadius:"12px", padding:"18px 20px", marginBottom:"14px", border:"1px solid #38bdf840", animation:"fadeUp 0.4s ease 0.2s both" }}>
                <div style={{ fontSize:"10px", color:"#38bdf8", letterSpacing:"2px", textTransform:"uppercase", marginBottom:"12px" }}>③ Codas 4D</div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:"8px", marginBottom:"14px" }}>
                  {pipeCodas.map((c,i)=>{
                    const fc=["#fb7185","#f97316","#facc15","#4ade80","#38bdf8","#818cf8","#c084fc","#e879f9"][c.f];
                    const active=pipeAnimIdx>=0&&pipeAnimIdx<i?false:pipeAnimIdx===i;
                    return (
                      <div key={i} style={{ background:"#060f1e", borderRadius:"9px", padding:"9px 11px", border:`1px solid #38bdf830`,
                        opacity:pipeAnimIdx>=0&&pipeAnimIdx<i?0.3:1,
                        transform:active?"scale(1.08)":"scale(1)",
                        boxShadow:active?"0 0 14px #38bdf880":"none", transition:"all 0.2s", minWidth:"54px", textAlign:"center" }}>
                        <div style={{ fontSize:"13px", color:"#94a3b8", marginBottom:"5px", fontFamily:"monospace" }}>{c.char}</div>
                        <div style={{ fontSize:"8px", lineHeight:1.6 }}>
                          <div style={{ color:fc }}>{DIMS.freq.values[c.f]}kHz</div>
                          <div style={{ color:DIMS.azimuth.colors[c.a] }}>{DIMS.azimuth.values[c.a]}°</div>
                          <div style={{ color:DIMS.depth.colors[c.d] }}>{DIMS.depth.values[c.d]}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {/* Lecteur audio */}
                <div style={{ display:"flex", alignItems:"center", gap:"12px", flexWrap:"wrap", background:"#060f1e", borderRadius:"9px", padding:"10px 14px", border:"1px solid #38bdf820" }}>
                  <button onClick={pipeIsPlaying?stopPipelinePlay:playPipelineCodas} style={{
                    padding:"8px 16px", borderRadius:"8px", border:"none", cursor:"pointer",
                    background:pipeIsPlaying?"linear-gradient(135deg,#7f1d1d,#991b1b)":"linear-gradient(135deg,#064e3b,#065f46)",
                    color:"#fff", fontSize:"12px", fontFamily:"inherit", whiteSpace:"nowrap",
                  }}>{pipeIsPlaying?"⏹ Stop":"▶ Écouter les codas"}</button>
                  <div style={{ display:"flex", gap:"4px", flexWrap:"wrap", flex:1 }}>
                    {pipeCodas.map((c,i)=>{
                      const fc=["#fb7185","#f97316","#facc15","#4ade80","#38bdf8","#818cf8","#c084fc","#e879f9"][c.f];
                      const active=pipePlayIdx===i;
                      return <div key={i} style={{ minWidth:"26px", height:"26px", borderRadius:"5px",
                        background:active?fc+"40":"#0a1628", border:`1px solid ${active?fc:"#1e3a5f"}`,
                        display:"flex", alignItems:"center", justifyContent:"center",
                        fontSize:"10px", color:active?fc:"#475569", fontFamily:"monospace",
                        boxShadow:active?`0 0 8px ${fc}80`:"none", transition:"all 0.15s" }}>{c.char}</div>;
                    })}
                  </div>
                </div>
              </div>
            )}

            {pipeStep>=3 && pipe4D && pipe4D.totalCodas && (
              <div style={{ background:"#0a1628", borderRadius:"12px", padding:"18px 20px", marginBottom:"14px", border:"1px solid #a78bfa40", animation:"fadeUp 0.4s ease 0.3s both" }}>
                <div style={{ fontSize:"10px", color:"#a78bfa", letterSpacing:"2px", textTransform:"uppercase", marginBottom:"12px" }}>④ Profil 4D global</div>
                <div style={{ display:"flex", gap:"16px", alignItems:"center", flexWrap:"wrap" }}>
                  <AzimuthViz azimuth={pipe4D.a} depth={pipe4D.d} freq={pipe4D.f} time={pipe4D.t} animating={pipeStep===3}/>
                  <div style={{ flex:1, minWidth:"160px" }}>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"8px" }}>
                      {[
                        {label:"Codas générées",  value:pipe4D.totalCodas,                           color:"#38bdf8"},
                        {label:"Bits Morse",       value:`${pipe4D.morseBits} bits`,                  color:"#fb7185"},
                        {label:"Codas nécessaires",value:`${Math.ceil(pipe4D.morseBits/WHALE_DISCRETE)}`, color:"#4ade80"},
                        {label:"Compression",      value:`×${(pipe4D.morseBits/(pipe4D.totalCodas*WHALE_DISCRETE)).toFixed(2)}`, color:"#a78bfa"},
                      ].map((s,i)=>(
                        <div key={i} style={{ background:"#060f1e", borderRadius:"7px", padding:"10px 12px", border:`1px solid ${s.color}20` }}>
                          <div style={{ fontSize:"9px", color:"#475569", textTransform:"uppercase", letterSpacing:"1px" }}>{s.label}</div>
                          <div style={{ fontSize:"16px", color:s.color, fontFamily:"monospace", fontWeight:"bold" }}>{s.value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {pipeStep>=4 && (
              <div style={{ background:"linear-gradient(135deg,#060f1e,#0a1628)", borderRadius:"12px", padding:"20px 22px", border:"1px solid #4ade8040", animation:"fadeUp 0.4s ease 0.4s both", position:"relative", overflow:"hidden" }}>
                <WaveBg/>
                <div style={{ position:"relative" }}>
                  <div style={{ fontSize:"10px", color:"#4ade80", letterSpacing:"2px", textTransform:"uppercase", marginBottom:"14px" }}>🐋 Ce que le cachalot perçoit</div>
                  {pipeLoading
                    ? <div style={{ display:"flex", gap:"5px", alignItems:"center" }}>
                        {[0,1,2].map(i=><div key={i} style={{ width:7,height:7,borderRadius:"50%",background:"#4ade80",animation:`pulse 1s ease ${i*0.22}s infinite` }}/>)}
                        <span style={{ fontSize:"12px", color:"#374151", marginLeft:"8px" }}>L'IA traduit en langage cachalot…</span>
                      </div>
                    : <div style={{ color:"#cbd5e1", lineHeight:1.9, fontSize:"14px", whiteSpace:"pre-wrap", fontStyle:"italic" }}>{pipeIA}</div>
                  }
                </div>
              </div>
            )}
          </div>
        )}

        {/* ════════════════ TAB : INVERSE ════════════════ */}
        {tab==="reverse" && (
          <div style={{ animation:"fadeUp 0.4s ease" }}>
            <div style={{ fontSize:"11px", color:"#374151", lineHeight:1.9, marginBottom:"20px", fontStyle:"italic" }}>
              Décodage inverse : vrais ICI en ms → seuil médian → Morse → lettre humaine + analyse IA de la perte d'information.
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(170px,1fr))", gap:10, marginBottom:24 }}>
              {CODA_LIBRARY.map((coda,i)=>{
                const emo=EMOTIONS[coda.baseEmotion];
                const sel=revCoda?.name===coda.name;
                return (
                  <div key={i} className="coda-card" onClick={()=>runReverse(coda)} style={{
                    background:sel?"#0f2040":"#060f1e",
                    border:`1px solid ${sel?emo.color+"80":"#0f2040"}`,
                    borderRadius:11, padding:"13px 14px", cursor:"pointer",
                  }}>
                    <div style={{ fontSize:"9px", color:"#475569", fontFamily:"monospace", marginBottom:6 }}>{coda.name}</div>
                    <ClickViz pattern={coda.pattern} animating={sel&&revAnim}/>
                    <IciTimeline ici={coda.ici} ipi={coda.ipi} spectral={coda.spectral}/>
                    <div style={{ marginTop:6, fontSize:"9px", color:emo.color }}>{emo.label}</div>
                  </div>
                );
              })}
            </div>

            {revCoda && (
              <div style={{ background:"#060f1e", borderRadius:14, padding:"22px 24px", border:"1px solid #38bdf830", animation:"fadeUp 0.35s ease" }}>
                {/* Étapes */}
                <div style={{ display:"flex", alignItems:"center", gap:0, marginBottom:20, overflowX:"auto" }}>
                  {[
                    {n:1,label:"Coda source",    color:"#38bdf8",icon:"◎"},
                    {n:2,label:"Morse (médiane)",color:"#fb7185", icon:"·—"},
                    {n:3,label:"Lettre",         color:"#fbbf24", icon:"A"},
                    {n:4,label:"IA analyse",     color:"#a78bfa", icon:"⊕"},
                    {n:5,label:"Perte d'info",   color:"#4ade80", icon:"〰"},
                  ].map((st,i)=>(
                    <div key={st.n} style={{ display:"flex", alignItems:"center", flex:"none" }}>
                      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:4, opacity:revStep>=st.n?1:0.3, transition:"opacity 0.4s" }}>
                        <div style={{ width:38, height:38, borderRadius:"50%",
                          background:revStep>=st.n?`${st.color}22`:"#0a1628",
                          border:`2px solid ${revStep>=st.n?st.color:"#1e3a5f"}`,
                          display:"flex", alignItems:"center", justifyContent:"center",
                          fontSize:12, color:st.color, fontFamily:"monospace",
                          boxShadow:revStep===st.n?`0 0 12px ${st.color}60`:"none", transition:"all 0.4s",
                        }}>{st.icon}</div>
                        <div style={{ fontSize:8, color:revStep>=st.n?st.color:"#374151", textAlign:"center", maxWidth:56, lineHeight:1.3 }}>{st.label}</div>
                      </div>
                      {i<4 && <div style={{ width:28, height:2, margin:"0 3px", marginBottom:14,
                        background:revStep>st.n?st.color:"#1e3a5f", transition:"background 0.4s" }}/>}
                    </div>
                  ))}
                </div>

                {/* ICI bruts */}
                <div style={{ marginBottom:16 }}>
                  <div style={{ fontSize:"10px", color:"#38bdf8", letterSpacing:"2px", textTransform:"uppercase", marginBottom:10 }}>① ICI bruts — {revCoda.name}</div>
                  <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                    {revCoda.ici.map((v,i)=>{
                      const sorted=[...revCoda.ici].sort((a,b)=>a-b);
                      const med=sorted[Math.floor(sorted.length/2)];
                      const isLong=v>=med*1.2;
                      return (
                        <div key={i} style={{ background:"#0a1628", borderRadius:7, padding:"6px 10px",
                          border:`1px solid ${isLong?"#fb7185":"#38bdf8"}40`, textAlign:"center" }}>
                          <div style={{ fontFamily:"monospace", fontSize:"14px", color:isLong?"#fb7185":"#38bdf8" }}>{v}ms</div>
                          <div style={{ fontSize:"9px", color:"#374151", marginTop:2 }}>{isLong?"—":"·"}</div>
                        </div>
                      );
                    })}
                    <div style={{ display:"flex", alignItems:"center", fontSize:"10px", color:"#374151", fontStyle:"italic" }}>
                      médiane={Math.round([...revCoda.ici].sort((a,b)=>a-b)[Math.floor(revCoda.ici.length/2)])}ms
                    </div>
                  </div>
                </div>

                {revMorse && (
                  <div style={{ marginBottom:16, borderTop:"1px solid #0f2040", paddingTop:14 }}>
                    <div style={{ fontSize:"10px", color:"#fb7185", letterSpacing:"2px", textTransform:"uppercase", marginBottom:8 }}>② Morse reconstruit</div>
                    <div style={{ fontSize:"24px", fontFamily:"monospace", letterSpacing:"6px" }}>
                      {revMorse.split("").map((c,i)=><span key={i} style={{ color:c==="·"?"#38bdf8":"#fb7185" }}>{c}</span>)}
                    </div>
                  </div>
                )}

                {revText && (
                  <div style={{ marginBottom:16, borderTop:"1px solid #0f2040", paddingTop:14, display:"flex", alignItems:"baseline", gap:20 }}>
                    <div style={{ fontSize:"64px", fontFamily:"monospace", color:"#fbbf24", lineHeight:1 }}>{revText}</div>
                    <div style={{ fontSize:"11px", color:"#374151", lineHeight:1.8 }}>
                      Lettre la plus proche<br/>par distance de Hamming<br/>sur le seuil médian ICI
                    </div>
                    <div style={{ marginLeft:"auto" }}>
                      <SofarViz tempo={revCoda.tempo} spectral={revCoda.spectral}/>
                    </div>
                  </div>
                )}

                {revLoading && (
                  <div style={{ display:"flex", gap:5, alignItems:"center", marginTop:8 }}>
                    {[0,1,2].map(i=><div key={i} style={{ width:6,height:6,borderRadius:"50%",background:"#38bdf8",animation:`pulse 1s ease ${i*0.2}s infinite` }}/>)}
                    <span style={{ fontSize:"11px", color:"#374151", marginLeft:8 }}>Analyse de la perte d'information…</span>
                  </div>
                )}
                {revIA && (
                  <div style={{ marginTop:14, borderTop:"1px solid #0f2040", paddingTop:14, color:"#cbd5e1", lineHeight:1.9, fontSize:"13px", whiteSpace:"pre-wrap", fontStyle:"italic" }}>
                    {revIA}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* FOOTER */}
        <div style={{ marginTop:"36px", padding:"18px 22px", background:"#0a1628", borderRadius:"11px", border:"1px solid #1e293b", fontSize:"11px", color:"#374151", lineHeight:1.85 }}>
          <div style={{ color:"#475569", marginBottom:"6px", letterSpacing:"1px", textTransform:"uppercase", fontSize:"10px" }}>Sources</div>
          Sharma et al., <em>Nature Communications</em> 2024 · Paradise et al., WhAM <em>NeurIPS</em> 2025 · Beguš et al., <em>Open Mind</em> 2025 ·
          Rendell & Whitehead 2003 · DSWP Dominica (2005–2018) · CETI dataset (2020–2024) ·
          <span style={{ color:"#1e3a5f" }}> * D3/D4/multipath/overlap : hypothèses non encore mesurées</span>
        </div>
      </div>
    </div>
  );
}
