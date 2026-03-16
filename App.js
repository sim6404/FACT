const { useState, useEffect, useRef, useCallback } = React;
const RECHARTS_AVAILABLE = typeof Recharts !== "undefined";
const NoChart = ({ children }) => (children ? <>{children}</> : null);
const {
  LineChart = NoChart, Line = NoChart, BarChart = NoChart, Bar = NoChart,
  AreaChart = NoChart, Area = NoChart, RadarChart = NoChart, Radar = NoChart,
  PolarGrid = NoChart, PolarAngleAxis = NoChart, ScatterChart = NoChart, Scatter = NoChart,
  XAxis = NoChart, YAxis = NoChart, CartesianGrid = NoChart, Tooltip = NoChart,
  ResponsiveContainer = NoChart, PolarRadiusAxis = NoChart, Cell = NoChart,
} = RECHARTS_AVAILABLE ? Recharts : {};

/* ═══════════════════════════════════════════════════
   BRAND TOKENS — 포디비전 브랜드 컬러
═══════════════════════════════════════════════════ */
const B = {
  // Neutrals
  bg0: "#F4F6FA",
  bg1: "#FFFFFF",
  bg2: "#F8FAFD",
  bg3: "#EEF2F9",
  // Primary — deep navy (신뢰·기술)
  navy:    "#0D2B5E",
  navyMid: "#1A4080",
  navyLight:"#2B5EA7",
  // Accent — vivid blue (4D Vision blue)
  blue:    "#1960D4",
  blueLight:"#4A87E8",
  // Secondary accent — teal
  teal:    "#0FA CA6",  // fallback
  cyan:    "#0EA5C8",
  // Status
  green:   "#0FAC6E",
  amber:   "#E89B10",
  red:     "#D93B3B",
  violet:  "#6B4FBB",
  // Text
  text:    "#0D1B2E",
  textSub: "#3D5068",
  muted:   "#6B7D93",
  dim:     "#9AAABB",
  // Borders
  border:  "rgba(13,43,94,0.10)",
  borderMid:"rgba(13,43,94,0.18)",
};

/* ═══════════════════════════════════════════════════
   UTILITY
═══════════════════════════════════════════════════ */
const useInterval = (cb, ms) => {
  const r = useRef(cb);
  useEffect(() => { r.current = cb; }, [cb]);
  useEffect(() => { const t = setInterval(() => r.current(), ms); return () => clearInterval(t); }, [ms]);
};
const rand = (a, b) => Math.random() * (b - a) + a;

/* ═══════════════════════════════════════════════════
   SHARED UI
═══════════════════════════════════════════════════ */
const Chip = ({ children, color = B.blue, bg }) => (
  <span style={{
    background: bg || `${color}14`,
    border: `1px solid ${color}30`,
    color,
    fontSize: 10, fontWeight: 700, letterSpacing: "0.10em",
    padding: "2px 9px", borderRadius: 100,
    fontFamily: "monospace", whiteSpace: "nowrap",
  }}>{children}</span>
);

const StatusDot = ({ status }) => {
  const c = { active: B.green, warning: B.amber, error: B.red, idle: B.dim }[status] || B.dim;
  return <span style={{ display: "inline-block", width: 7, height: 7, background: c, borderRadius: "50%", boxShadow: `0 0 5px ${c}99`, flexShrink: 0 }} />;
};

const Card = ({ children, style = {}, shadow = "sm" }) => (
  <div style={{
    background: B.bg1,
    border: `1px solid ${B.border}`,
    borderRadius: 14,
    boxShadow: shadow === "md"
      ? "0 4px 24px rgba(13,43,94,0.08)"
      : "0 1px 6px rgba(13,43,94,0.06)",
    ...style,
  }}>{children}</div>
);

const CardHeader = ({ title, sub, right, icon }) => (
  <div style={{
    padding: "14px 20px",
    borderBottom: `1px solid ${B.border}`,
    display: "flex", justifyContent: "space-between", alignItems: "center",
  }}>
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      {icon && <span style={{ fontSize: 16 }}>{icon}</span>}
      <div>
        <div style={{ color: B.text, fontSize: 13, fontWeight: 700 }}>{title}</div>
        {sub && <div style={{ color: B.muted, fontSize: 11, marginTop: 1 }}>{sub}</div>}
      </div>
    </div>
    {right && <div style={{ display: "flex", alignItems: "center", gap: 8 }}>{right}</div>}
  </div>
);

const Btn = ({ children, variant = "ghost", color = B.blue, onClick, style = {} }) => {
  const [hov, setHov] = useState(false);
  const base = {
    padding: "7px 16px", borderRadius: 8, fontSize: 12, fontWeight: 700,
    cursor: "pointer", transition: "all 0.18s", fontFamily: "inherit", border: "none",
    display: "inline-flex", alignItems: "center", gap: 5,
  };
  const vs = {
    primary: {
      background: hov ? B.navyMid : B.navy,
      color: "#fff",
      boxShadow: hov ? `0 4px 16px rgba(13,43,94,0.28)` : `0 2px 8px rgba(13,43,94,0.18)`,
    },
    accent: {
      background: hov ? B.navyLight : B.blue,
      color: "#fff",
      boxShadow: hov ? `0 4px 16px rgba(25,96,212,0.32)` : `0 2px 8px rgba(25,96,212,0.20)`,
    },
    ghost: {
      background: hov ? B.bg3 : "transparent",
      border: `1px solid ${B.borderMid}`,
      color: hov ? B.navy : B.muted,
    },
    danger: {
      background: hov ? "rgba(217,59,59,0.12)" : "rgba(217,59,59,0.07)",
      border: `1px solid rgba(217,59,59,0.25)`,
      color: B.red,
    },
  };
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ ...base, ...vs[variant], ...style }}>{children}</button>
  );
};

const Input = ({ label, value, onChange, type = "text", placeholder, style = {} }) => (
  <div style={style}>
    {label && <div style={{ color: B.muted, fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", marginBottom: 5 }}>{label}</div>}
    <input type={type} value={value} onChange={onChange} placeholder={placeholder}
      style={{
        width: "100%", background: B.bg2, border: `1px solid ${B.border}`, borderRadius: 8,
        padding: "8px 12px", color: B.text, fontSize: 13, outline: "none",
        fontFamily: "inherit", boxSizing: "border-box", transition: "border 0.2s",
      }}
      onFocus={e => e.target.style.borderColor = B.blue}
      onBlur={e => e.target.style.borderColor = B.border}
    />
  </div>
);

const Select = ({ label, value, onChange, options, style = {} }) => (
  <div style={style}>
    {label && <div style={{ color: B.muted, fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", marginBottom: 5 }}>{label}</div>}
    <select value={value} onChange={onChange}
      style={{
        width: "100%", background: B.bg2, border: `1px solid ${B.border}`, borderRadius: 8,
        padding: "8px 12px", color: B.text, fontSize: 13, outline: "none",
        fontFamily: "inherit", cursor: "pointer",
      }}>
      {options.map(o => <option key={o.v || o} value={o.v || o}>{o.l || o}</option>)}
    </select>
  </div>
);

const Slider = ({ label, value, onChange, min = 0, max = 1, step = 0.01, format = v => v.toFixed(2) }) => (
  <div>
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
      <span style={{ color: B.muted, fontSize: 11, fontWeight: 600 }}>{label}</span>
      <span style={{ color: B.blue, fontSize: 12, fontWeight: 700, fontFamily: "monospace" }}>{format(value)}</span>
    </div>
    <input type="range" min={min} max={max} step={step} value={value} onChange={onChange}
      style={{ width: "100%", accentColor: B.blue, cursor: "pointer" }} />
  </div>
);

const Toggle = ({ on, onChange, label }) => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
    {label && <span style={{ color: B.textSub, fontSize: 13 }}>{label}</span>}
    <div onClick={() => onChange(!on)} style={{
      width: 36, height: 20, background: on ? B.blue : B.dim,
      borderRadius: 10, cursor: "pointer", position: "relative", transition: "background 0.2s", flexShrink: 0,
    }}>
      <div style={{
        width: 14, height: 14, background: "#fff", borderRadius: "50%",
        position: "absolute", top: 3, left: on ? 18 : 3,
        transition: "left 0.2s", boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
      }} />
    </div>
  </div>
);

const Table = ({ cols, rows, emptyMsg = "데이터 없음" }) => (
  <div style={{ overflowX: "auto" }}>
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
      <thead>
        <tr style={{ background: B.bg2, borderBottom: `1px solid ${B.border}` }}>
          {cols.map(c => (
            <th key={c.key} style={{
              padding: "10px 16px", textAlign: "left",
              color: B.muted, fontWeight: 700, letterSpacing: "0.07em",
              whiteSpace: "nowrap", fontSize: 11,
            }}>{c.label}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.length === 0
          ? <tr><td colSpan={cols.length} style={{ textAlign: "center", color: B.dim, padding: 32 }}>{emptyMsg}</td></tr>
          : rows.map((r, i) => (
            <tr key={i} style={{ borderBottom: `1px solid ${B.border}` }}
              onMouseEnter={e => e.currentTarget.style.background = B.bg2}
              onMouseLeave={e => e.currentTarget.style.background = ""}>
              {cols.map(c => <td key={c.key} style={{ padding: "10px 16px", color: B.text }}>{r[c.key]}</td>)}
            </tr>
          ))}
      </tbody>
    </table>
  </div>
);

const StatCard = ({ icon, label, value, sub, color = B.blue, trend }) => (
  <Card style={{ padding: "18px 20px" }} shadow="md">
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
      <div style={{
        width: 38, height: 38,
        background: `linear-gradient(135deg, ${color}20, ${color}0a)`,
        border: `1px solid ${color}25`,
        borderRadius: 10,
        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17,
      }}>{icon}</div>
      {trend !== undefined && (
        <span style={{
          fontSize: 11, fontWeight: 700,
          color: trend > 0 ? B.green : B.red,
          background: trend > 0 ? `${B.green}12` : `${B.red}12`,
          padding: "2px 7px", borderRadius: 100,
        }}>{trend > 0 ? "+" : ""}{trend}%</span>
      )}
    </div>
    <div style={{ color: B.text, fontSize: 22, fontWeight: 900, fontFamily: "monospace", marginBottom: 3 }}>{value}</div>
    <div style={{ color: B.muted, fontSize: 11, fontWeight: 600, letterSpacing: "0.05em" }}>{label}</div>
    {sub && <div style={{ color: B.dim, fontSize: 11, marginTop: 3 }}>{sub}</div>}
  </Card>
);

const PageHeader = ({ title, sub, actions, badge }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
        <h1 style={{ color: B.navy, fontSize: 20, fontWeight: 800 }}>{title}</h1>
        {badge && <Chip color={B.blue}>{badge}</Chip>}
      </div>
      {sub && <p style={{ color: B.muted, fontSize: 13 }}>{sub}</p>}
    </div>
    {actions && <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>{actions}</div>}
  </div>
);

const ProgressBar = ({ value, max = 100, color = B.blue, label, showPct = true }) => {
  const pct = (value / max) * 100;
  return (
    <div>
      {(label || showPct) && (
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
          {label && <span style={{ color: B.muted, fontSize: 12 }}>{label}</span>}
          {showPct && <span style={{ color, fontSize: 12, fontFamily: "monospace", fontWeight: 700 }}>{pct.toFixed(0)}%</span>}
        </div>
      )}
      <div style={{ height: 6, background: B.bg3, borderRadius: 3, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: `linear-gradient(90deg, ${color}, ${color}bb)`, borderRadius: 3, transition: "width 0.5s ease" }} />
      </div>
    </div>
  );
};

const Divider = () => <div style={{ height: 1, background: B.border, margin: "4px 0" }} />;

/* ═══════════════════════════════════════════════════
   LANDING PAGE — 랜딩
═══════════════════════════════════════════════════ */
const LandingPage = ({ onEnter }) => {
  const [hov, setHov] = useState(false);

  const products = [
    { icon: "🥽", title: "Smart Glass Solution", desc: "HMD·스마트글라스 기반 산업용 AR 솔루션" },
    { icon: "🤖", title: "AMR 판독 시스템", desc: "YOLOv8 기반 자율이동로봇 실시간 판독·분석" },
    { icon: "🧊", title: "무안경 3D Display", desc: "자체 개발 3D 사이니지 및 홀로그램 시스템" },
    { icon: "🌐", title: "AR/VR Contents", desc: "체험형 가상·증강현실 플랫폼 및 콘텐츠" },
  ];

  const certs = ["기술혁신형 중소기업", "벤처기업", "기업부설연구소", "RoHS · CE · FCC 인증"];

  return (
    <div style={{ minHeight: "100vh", background: "#F4F6FA", fontFamily: "'Noto Sans KR','Apple SD Gothic Neo',sans-serif" }}>
      {/* ── Top bar */}
      <div style={{
        background: B.navy,
        padding: "0 40px",
        height: 52,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <LogoMark size={28} />
          <div>
            <div style={{ color: "#fff", fontWeight: 900, fontSize: 14, letterSpacing: "0.12em" }}>4D VISION</div>
            <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 9, letterSpacing: "0.15em" }}>WORLD WIDE 4D SOLUTION</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 24 }}>
          {["제품소개", "사업분야", "회사소개", "고객지원"].map(m => (
            <span key={m} style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>{m}</span>
          ))}
        </div>
      </div>

      {/* ── Hero */}
      <div style={{
        background: `linear-gradient(135deg, ${B.navy} 0%, ${B.navyLight} 60%, #1960D4 100%)`,
        padding: "80px 40px 90px",
        position: "relative", overflow: "hidden",
      }}>
        {/* decorative circles */}
        {[180, 300, 440].map((s, i) => (
          <div key={i} style={{
            position: "absolute", right: -s / 3, top: "50%", transform: "translateY(-50%)",
            width: s, height: s, borderRadius: "50%",
            border: "1px solid rgba(255,255,255,0.07)",
            pointerEvents: "none",
          }} />
        ))}
        <div style={{ maxWidth: 680, position: "relative" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)",
            borderRadius: 100, padding: "4px 14px", marginBottom: 20,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ADE80", display: "inline-block" }} />
            <span style={{ color: "rgba(255,255,255,0.85)", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em" }}>AI 전환 관리 플랫폼 v2.4.1</span>
          </div>
          <h1 style={{ color: "#fff", fontSize: 38, fontWeight: 900, lineHeight: 1.25, marginBottom: 16 }}>
            F.A.C.T<br />
            <span style={{ fontSize: 22, fontWeight: 400, opacity: 0.8 }}>FourD AI Convergence Transformer</span>
          </h1>
          <p style={{ color: "rgba(255,255,255,0.72)", fontSize: 15, lineHeight: 1.8, marginBottom: 32, maxWidth: 520 }}>
            ㈜포디비전의 현장 중심 AI 솔루션 관리 플랫폼입니다.<br />
            LLM 에이전트, RAG 검색, API 연동, 데이터 분석을 하나의 콘솔에서 운영하세요.
          </p>
          <div style={{ display: "flex", gap: 12 }}>
            <button
              onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
              onClick={onEnter}
              style={{
                background: hov ? "#fff" : "rgba(255,255,255,0.95)",
                color: B.navy, fontWeight: 800, fontSize: 14,
                border: "none", borderRadius: 10, padding: "12px 28px",
                cursor: "pointer", transition: "all 0.2s",
                boxShadow: hov ? "0 8px 24px rgba(0,0,0,0.25)" : "0 4px 16px rgba(0,0,0,0.2)",
              }}>
              어드민 콘솔 시작 →
            </button>
            <button style={{
              background: "transparent", color: "rgba(255,255,255,0.85)",
              border: "1px solid rgba(255,255,255,0.3)", borderRadius: 10, padding: "12px 24px",
              cursor: "pointer", fontSize: 13, fontWeight: 600,
            }}>
              브로셔 다운로드
            </button>
          </div>
        </div>
      </div>

      {/* ── Stats bar */}
      <div style={{ background: B.bg1, borderBottom: `1px solid ${B.border}` }}>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(4,1fr)" }}>
          {[
            ["2002", "설립 연도"],
            ["13+", "보유 특허 · 인증"],
            ["87%", "AI 판독 정확도"],
            ["24년", "3D 솔루션 경력"],
          ].map(([v, l]) => (
            <div key={l} style={{ padding: "20px 0", textAlign: "center", borderRight: `1px solid ${B.border}` }}>
              <div style={{ color: B.navy, fontSize: 26, fontWeight: 900, fontFamily: "monospace" }}>{v}</div>
              <div style={{ color: B.muted, fontSize: 11, marginTop: 2 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Products */}
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "56px 40px 40px" }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ color: B.blue, fontSize: 11, fontWeight: 700, letterSpacing: "0.15em", marginBottom: 8 }}>PRODUCT & SOLUTION</div>
          <h2 style={{ color: B.navy, fontSize: 24, fontWeight: 900 }}>포디비전 핵심 솔루션</h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
          {products.map(p => (
            <Card key={p.title} style={{ padding: 20, textAlign: "center", cursor: "pointer" }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>{p.icon}</div>
              <div style={{ color: B.navy, fontSize: 13, fontWeight: 800, marginBottom: 6 }}>{p.title}</div>
              <div style={{ color: B.muted, fontSize: 11, lineHeight: 1.7 }}>{p.desc}</div>
            </Card>
          ))}
        </div>
      </div>

      {/* ── Company intro */}
      <div style={{ background: B.bg1, padding: "48px 40px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40, alignItems: "center" }}>
          <div>
            <div style={{ color: B.blue, fontSize: 11, fontWeight: 700, letterSpacing: "0.15em", marginBottom: 8 }}>COMPANY</div>
            <h2 style={{ color: B.navy, fontSize: 22, fontWeight: 900, lineHeight: 1.4, marginBottom: 16 }}>
              2002년 설립,<br />대한민국 3D·AR 솔루션 선도기업
            </h2>
            <p style={{ color: B.textSub, fontSize: 13, lineHeight: 1.9, marginBottom: 20 }}>
              ㈜포디비전은 3D·AR 기반 컴퓨터 그래픽 솔루션 전문 개발사로, HMD 및 스마트글라스용 몰입형 AR 솔루션과 무안경 3D 디스플레이 시스템을 자체 개발·사업화하고 있습니다. 2010년부터 VR/AR 정부 프로젝트를 지속 수행하며 독자적 VR/AR 엔진 및 저작도구를 보유하고 있습니다.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {certs.map(c => <Chip key={c} color={B.navy}>{c}</Chip>)}
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {[
              { icon: "🏭", t: "경기도 고양시", s: "일산동 고봉로 32-19" },
              { icon: "📞", t: "031-901-4823", s: "031-629-6029" },
              { icon: "🌐", t: "www.4dvision.co.kr", s: "WORLD WIDE 4D SOLUTION" },
              { icon: "🔬", t: "기업부설연구소", s: "자체 VR/AR 엔진 보유" },
            ].map(x => (
              <div key={x.t} style={{ background: B.bg2, border: `1px solid ${B.border}`, borderRadius: 10, padding: "14px 16px" }}>
                <div style={{ fontSize: 20, marginBottom: 6 }}>{x.icon}</div>
                <div style={{ color: B.navy, fontSize: 12, fontWeight: 700 }}>{x.t}</div>
                <div style={{ color: B.muted, fontSize: 10, marginTop: 2 }}>{x.s}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── CTA */}
      <div style={{ background: `linear-gradient(135deg, ${B.navy}, ${B.navyLight})`, padding: "48px 40px", textAlign: "center" }}>
        <h2 style={{ color: "#fff", fontSize: 22, fontWeight: 900, marginBottom: 10 }}>F.A.C.T 어드민 콘솔로 시작하세요</h2>
        <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 13, marginBottom: 24 }}>LLM·RAG·API·Analytics를 하나의 대시보드에서 관리</p>
        <button onClick={onEnter} style={{
          background: "#fff", color: B.navy, fontWeight: 800, fontSize: 14,
          border: "none", borderRadius: 10, padding: "12px 32px", cursor: "pointer",
          boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
        }}>어드민 콘솔 입장 →</button>
      </div>

      {/* Footer */}
      <div style={{ background: B.navy, padding: "20px 40px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <LogoMark size={22} />
          <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 11 }}>COPYRIGHT 2007 4D VISION ALL RIGHTS RESERVED</span>
        </div>
        <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 10 }}>경기도 고양시 일산동 고봉로 32-19 남정씨티프라자 7차 504호 ㈜포디비전</span>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════
   LOGO MARK
═══════════════════════════════════════════════════ */
const LogoMark = ({ size = 32 }) => (
  <div style={{
    width: size, height: size, flexShrink: 0,
    background: "linear-gradient(135deg,#1960D4,#0EA5C8)",
    borderRadius: size * 0.28,
    display: "flex", alignItems: "center", justifyContent: "center",
    boxShadow: "0 2px 8px rgba(25,96,212,0.4)",
  }}>
    <span style={{ color: "#fff", fontWeight: 900, fontSize: size * 0.32, fontFamily: "monospace", letterSpacing: "-0.05em" }}>4D</span>
  </div>
);

/* ═══════════════════════════════════════════════════
   PAGES (same logic, light theme)
═══════════════════════════════════════════════════ */
const AgentEngineSettings = () => {
  const [model, setModel] = useState("claude-3-5-sonnet");
  const [temp, setTemp] = useState(0.7);
  const [topP, setTopP] = useState(0.9);
  const [topK, setTopK] = useState(40);
  const [maxTokens, setMaxTokens] = useState(4096);
  const [streaming, setStreaming] = useState(true);

  const models = [
    { name: "Claude 3.5 Sonnet", provider: "Anthropic", ctx: "200k", status: "active" },
    { name: "GPT-4o", provider: "OpenAI", ctx: "128k", status: "active" },
    { name: "Gemini 1.5 Pro", provider: "Google", ctx: "1M", status: "active" },
    { name: "Llama 3.1 70B", provider: "Meta", ctx: "128k", status: "idle" },
  ];

  const radarData = [
    { sub: "추론력", claude: 92, gpt: 90, gemini: 88 },
    { sub: "코딩", claude: 88, gpt: 92, gemini: 82 },
    { sub: "한국어", claude: 85, gpt: 80, gemini: 86 },
    { sub: "속도", claude: 78, gpt: 75, gemini: 90 },
    { sub: "비용", claude: 72, gpt: 65, gemini: 85 },
    { sub: "컨텍스트", claude: 95, gpt: 88, gemini: 98 },
  ];

  return (
    <div>
      <PageHeader title="엔진 설정 및 모델 관리" sub="베이스 LLM 모델 선택 및 생성 파라미터 최적화"
        actions={[<Btn key="s" variant="primary">설정 저장</Btn>, <Btn key="r" variant="ghost">초기화</Btn>]} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 20 }}>
        <div>
          <Card style={{ marginBottom: 20 }}>
            <CardHeader title="사용 가능한 모델" />
            <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 8 }}>
              {models.map(m => {
                const key = m.name.toLowerCase().replace(/\s/g, "-");
                const active = model === key;
                return (
                  <div key={m.name} onClick={() => setModel(key)}
                    style={{
                      display: "flex", alignItems: "center", gap: 12, padding: "12px 14px",
                      borderRadius: 9, cursor: "pointer", transition: "all 0.15s",
                      background: active ? `${B.blue}08` : B.bg2,
                      border: `1px solid ${active ? B.blue + "40" : B.border}`,
                    }}>
                    <StatusDot status={m.status} />
                    <div style={{ flex: 1 }}>
                      <div style={{ color: B.text, fontSize: 13, fontWeight: 700 }}>{m.name}</div>
                      <div style={{ color: B.muted, fontSize: 11 }}>{m.provider}</div>
                    </div>
                    <Chip color={B.cyan}>CTX {m.ctx}</Chip>
                    {active && <Chip color={B.green}>선택됨</Chip>}
                  </div>
                );
              })}
            </div>
          </Card>
          <Card>
            <CardHeader title="모델 성능 비교" />
            <div style={{ padding: 20 }}>
              <ResponsiveContainer width="100%" height={200}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke={B.border} />
                  <PolarAngleAxis dataKey="sub" tick={{ fill: B.muted, fontSize: 11 }} />
                  <PolarRadiusAxis tick={false} axisLine={false} />
                  <Radar dataKey="claude" stroke={B.blue} fill={B.blue} fillOpacity={0.1} strokeWidth={2} name="Claude" />
                  <Radar dataKey="gpt" stroke={B.violet} fill={B.violet} fillOpacity={0.06} strokeWidth={2} name="GPT-4o" />
                  <Radar dataKey="gemini" stroke={B.amber} fill={B.amber} fillOpacity={0.06} strokeWidth={2} name="Gemini" />
                  <Tooltip contentStyle={{ background: B.bg1, border: `1px solid ${B.border}`, borderRadius: 8, fontSize: 12 }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Card style={{ padding: 20 }}>
            <div style={{ color: B.navy, fontSize: 13, fontWeight: 700, marginBottom: 16, paddingBottom: 10, borderBottom: `1px solid ${B.border}` }}>생성 파라미터</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <Slider label="Temperature" value={temp} onChange={e => setTemp(+e.target.value)} min={0} max={2} step={0.05} />
              <Slider label="Top-p" value={topP} onChange={e => setTopP(+e.target.value)} />
              <Slider label="Top-k" value={topK} onChange={e => setTopK(+e.target.value)} min={1} max={100} step={1} format={v => v.toFixed(0)} />
              <Slider label="Max Tokens" value={maxTokens} onChange={e => setMaxTokens(+e.target.value)} min={256} max={16384} step={256} format={v => v + "t"} />
            </div>
          </Card>
          <Card style={{ padding: 20 }}>
            <div style={{ color: B.navy, fontSize: 13, fontWeight: 700, marginBottom: 14, paddingBottom: 10, borderBottom: `1px solid ${B.border}` }}>런타임 옵션</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <Toggle label="스트리밍 응답" on={streaming} onChange={setStreaming} />
              <Toggle label="Function Calling" on={true} onChange={() => { }} />
              <Toggle label="JSON 모드 강제" on={false} onChange={() => { }} />
              <Toggle label="응답 캐싱" on={true} onChange={() => { }} />
            </div>
          </Card>
          <Card style={{ padding: 20 }}>
            <div style={{ color: B.navy, fontSize: 13, fontWeight: 700, marginBottom: 12 }}>토큰 사용 현황</div>
            <ProgressBar label="입력 토큰" value={68} color={B.blue} />
            <div style={{ marginTop: 10 }} />
            <ProgressBar label="출력 토큰" value={42} color={B.cyan} />
            <div style={{ marginTop: 10 }} />
            <ProgressBar label="비용 한도" value={31} color={B.amber} />
            <div style={{ marginTop: 14, padding: "10px 14px", background: `${B.blue}09`, border: `1px solid ${B.blue}20`, borderRadius: 8 }}>
              <div style={{ color: B.muted, fontSize: 11 }}>누적 비용 (이번 달)</div>
              <div style={{ color: B.navy, fontSize: 20, fontWeight: 900, fontFamily: "monospace" }}>₩ 124,380</div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

const PromptCanvas = () => {
  const [sysPrompt, setSysPrompt] = useState(`당신은 ㈜포디비전 F.A.C.T 플랫폼의 AI 에이전트입니다.

역할: 기업 내부 문서 분석 및 업무 자동화 지원
언어: 한국어 우선

지시사항:
1. 구조화된 형식으로 응답하세요
2. 불확실한 정보는 명확히 표시하세요
3. 출처를 인용하여 신뢰성을 확보하세요`);
  const [userMsg, setUserMsg] = useState("AMR 판독 시스템의 이번 주 성능 리포트를 작성해주세요.");
  const [response, setResponse] = useState("");
  const [running, setRunning] = useState(false);
  const [score, setScore] = useState(null);

  const runTest = () => {
    setRunning(true); setResponse(""); setScore(null);
    const res = `## AMR 판독 시스템 주간 성능 리포트

**기간:** 2025년 3월 1일 ~ 7일

### 핵심 지표 요약

| 지표 | 이번 주 | 전주 | 변화율 |
|------|--------|------|--------|
| 판독 처리 건수 | 2,847건 | 2,634건 | **+8.1%** ↑ |
| 평균 처리 시간 | 3.8분 | 4.2분 | **-9.5%** ↓ |
| 판독 정확도 | 87.3% | 85.9% | **+1.4%p** ↑ |

### 결론
YOLOv8 모델 재학습 이후 정확도 지속 향상 중.
목표 85% 대비 **87.3% 달성**.`;
    let i = 0;
    const t = setInterval(() => {
      setResponse(res.slice(0, i += 4));
      if (i >= res.length) { clearInterval(t); setRunning(false); setScore({ clarity: 91, accuracy: 88, completeness: 94, format: 96 }); }
    }, 12);
  };

  return (
    <div>
      <PageHeader title="프롬프트 엔지니어링 캔버스" sub="업무별 시스템 프롬프트 설계 및 실시간 테스트 환경"
        actions={[<Btn key="s" variant="primary">템플릿 저장</Btn>]} />
      <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 20 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Card style={{ padding: 14 }}>
            <div style={{ color: B.muted, fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", marginBottom: 10 }}>저장된 템플릿</div>
            {["문서 분석 에이전트", "리포트 생성 에이전트", "데이터 요약 에이전트"].map((t, i) => (
              <div key={i} style={{
                padding: "8px 10px", borderRadius: 7, cursor: "pointer", marginBottom: 4,
                background: i === 0 ? `${B.blue}09` : "transparent",
                border: `1px solid ${i === 0 ? B.blue + "30" : "transparent"}`,
              }}>
                <div style={{ color: B.text, fontSize: 12, fontWeight: 600 }}>{t}</div>
              </div>
            ))}
          </Card>
          {score && (
            <Card style={{ padding: 14 }}>
              <div style={{ color: B.muted, fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", marginBottom: 12 }}>품질 평가</div>
              {Object.entries({ 명확성: score.clarity, 정확성: score.accuracy, 완결성: score.completeness }).map(([k, v]) => (
                <div key={k} style={{ marginBottom: 10 }}>
                  <ProgressBar label={k} value={v} color={v > 90 ? B.green : B.blue} />
                </div>
              ))}
            </Card>
          )}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Card>
            <CardHeader title="시스템 프롬프트" right={<Chip color={B.violet}>SYSTEM</Chip>} />
            <textarea value={sysPrompt} onChange={e => setSysPrompt(e.target.value)}
              style={{
                width: "100%", background: B.bg2, border: "none", padding: "14px 16px",
                color: B.navy, fontSize: 12, fontFamily: "monospace", resize: "vertical", minHeight: 150,
                outline: "none", boxSizing: "border-box", lineHeight: 1.7,
              }} />
          </Card>
          <Card>
            <CardHeader title="테스트 입력" right={<Chip color={B.blue}>USER</Chip>} />
            <textarea value={userMsg} onChange={e => setUserMsg(e.target.value)}
              style={{
                width: "100%", background: "transparent", border: "none", padding: "14px 16px",
                color: B.text, fontSize: 13, resize: "vertical", minHeight: 70,
                outline: "none", boxSizing: "border-box", lineHeight: 1.7,
              }} />
            <div style={{ padding: "10px 16px", display: "flex", justifyContent: "flex-end", borderTop: `1px solid ${B.border}` }}>
              <Btn variant="primary" onClick={runTest}>{running ? "실행 중…" : "▶ 테스트 실행"}</Btn>
            </div>
          </Card>
          {(running || response) && (
            <Card>
              <CardHeader title="어시스턴트 응답" right={<StatusDot status={running ? "active" : "idle"} />} />
              <div style={{ padding: "14px 16px", color: B.textSub, fontSize: 13, lineHeight: 1.9, fontFamily: "monospace", whiteSpace: "pre-wrap", minHeight: 80 }}>{response}</div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

const ConnectorSettings = () => {
  const connectors = [
    { name: "SAP ERP", type: "REST", status: "active", calls: 1284, latency: "142ms", auth: "OAuth 2.0" },
    { name: "MES 시스템", type: "REST", status: "active", calls: 876, latency: "89ms", auth: "API Key" },
    { name: "Salesforce CRM", type: "GraphQL", status: "warning", calls: 2341, latency: "310ms", auth: "OAuth 2.0" },
    { name: "Google Workspace", type: "REST", status: "active", calls: 445, latency: "201ms", auth: "Service Account" },
  ];
  const [selected, setSelected] = useState(0);
  const c = connectors[selected];

  return (
    <div>
      <PageHeader title="커넥터 설정" sub="REST API 기반 외부 시스템 연동 및 인증 관리"
        actions={[<Btn key="add" variant="primary">+ 커넥터 추가</Btn>]} />
      <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 20 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {connectors.map((cc, i) => (
            <Card key={i} style={{
              padding: "14px 16px", cursor: "pointer",
              border: `1px solid ${selected === i ? B.blue + "50" : B.border}`,
              background: selected === i ? `${B.blue}07` : B.bg1,
            }} onClick={() => setSelected(i)}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 7 }}>
                <span style={{ color: B.text, fontSize: 13, fontWeight: 700 }}>{cc.name}</span>
                <StatusDot status={cc.status} />
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <Chip color={B.blue}>{cc.type}</Chip>
                <Chip color={B.violet}>{cc.auth.split(" ")[0]}</Chip>
              </div>
              <div style={{ color: B.dim, fontSize: 11, marginTop: 6 }}>{cc.calls.toLocaleString()} calls/day</div>
            </Card>
          ))}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
            <StatCard icon="📡" label="일일 호출 수" value={c.calls.toLocaleString()} color={B.blue} trend={8} />
            <StatCard icon="⚡" label="평균 레이턴시" value={c.latency} color={B.cyan} />
            <StatCard icon="🛡️" label="인증 방식" value={c.auth.split(" ")[0]} color={B.violet} />
          </div>
          <Card style={{ padding: 20 }}>
            <div style={{ color: B.navy, fontSize: 14, fontWeight: 700, marginBottom: 16 }}>연결 설정 — {c.name}</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <Input label="Base URL" value="https://api.example.com/v2" />
              <Input label="인증 방식" value={c.auth} />
              <Input label="API 키 / 토큰" value="sk-••••••••••••" type="password" />
              <Input label="Timeout (ms)" value="5000" type="number" />
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <Btn variant="primary">연결 테스트</Btn>
              <Btn variant="ghost">저장</Btn>
              <Btn variant="danger">삭제</Btn>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

const ApiLogMonitor = () => {
  const [logs, setLogs] = useState(() => Array.from({ length: 12 }, (_, i) => ({
    id: `req-${(9999 - i).toString(16).toUpperCase()}`,
    func: ["get_amr_status", "create_report", "query_inventory", "send_notification"][i % 4],
    status: [200, 200, 200, 500, 200, 200, 429, 200, 200, 200, 200, 404][i],
    latency: Math.round(rand(60, 400)),
    time: new Date(Date.now() - i * 45000).toLocaleTimeString("ko-KR"),
    tokens: Math.round(rand(120, 800)),
  })));

  useInterval(() => {
    setLogs(p => [{
      id: `req-${Math.random().toString(16).slice(2, 8).toUpperCase()}`,
      func: ["get_amr_status", "create_report", "query_inventory"][Math.floor(rand(0, 3))],
      status: Math.random() > 0.1 ? 200 : 500,
      latency: Math.round(rand(60, 350)),
      time: new Date().toLocaleTimeString("ko-KR"),
      tokens: Math.round(rand(120, 600)),
    }, ...p.slice(0, 19)]);
  }, 3000);

  return (
    <div>
      <PageHeader title="연동 로그 모니터링" sub="실시간 API 호출 이력 및 에러 트래킹"
        actions={[<Chip key="live" color={B.green} bg={`${B.green}12`}>● LIVE</Chip>]} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 20 }}>
        <StatCard icon="📡" label="분당 요청" value="47.3" color={B.blue} trend={12} />
        <StatCard icon="✅" label="성공률" value={`${(logs.filter(l => l.status === 200).length / logs.length * 100).toFixed(0)}%`} color={B.green} />
        <StatCard icon="⚡" label="평균 레이턴시" value={`${Math.round(logs.reduce((a, l) => a + l.latency, 0) / logs.length)}ms`} color={B.cyan} />
        <StatCard icon="🔥" label="에러 건수" value={logs.filter(l => l.status !== 200).length} color={B.red} />
      </div>
      <Card>
        <CardHeader title="실시간 API 호출 로그" />
        <Table
          cols={[
            { key: "id", label: "요청 ID" },
            { key: "func", label: "함수" },
            { key: "statusBadge", label: "상태" },
            { key: "latency", label: "레이턴시" },
            { key: "tokens", label: "토큰" },
            { key: "time", label: "시간" },
          ]}
          rows={logs.map(l => ({
            ...l,
            statusBadge: <Chip color={l.status === 200 ? B.green : l.status === 429 ? B.amber : B.red}>{l.status}</Chip>,
            latency: <span style={{ fontFamily: "monospace", color: l.latency > 300 ? B.amber : B.text }}>{l.latency}ms</span>,
            func: <span style={{ fontFamily: "monospace", color: B.blue, fontSize: 11 }}>{l.func}</span>,
            tokens: <span style={{ fontFamily: "monospace" }}>{l.tokens}</span>,
          }))}
        />
      </Card>
    </div>
  );
};

const KnowledgeStore = () => {
  const [files] = useState([
    { name: "AMR 운영 매뉴얼 v3.2.pdf", size: "4.2MB", type: "PDF", chunks: 284, status: "indexed", date: "2025-02-28" },
    { name: "YOLOv8 판독 가이드라인.docx", size: "1.8MB", type: "DOCX", chunks: 156, status: "indexed", date: "2025-02-25" },
    { name: "F.A.C.T 기술 명세서.pdf", size: "6.7MB", type: "PDF", chunks: 412, status: "processing", date: "2025-03-01" },
    { name: "AGV 경로 최적화 데이터.csv", size: "12.4MB", type: "CSV", chunks: 1240, status: "indexed", date: "2025-02-15" },
  ]);
  const total = files.reduce((a, f) => a + (f.status === "indexed" ? f.chunks : 0), 0);

  return (
    <div>
      <PageHeader title="지식 저장소 관리" sub="기업 내부 문서 업로드 및 벡터 DB 인덱싱"
        actions={[<Btn key="r" variant="ghost">인덱스 재구축</Btn>]} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 20 }}>
        <StatCard icon="📄" label="총 문서 수" value={files.length} color={B.blue} />
        <StatCard icon="🧩" label="총 청크 수" value={total.toLocaleString()} color={B.cyan} />
        <StatCard icon="💾" label="저장 용량" value="24.9 MB" color={B.violet} />
        <StatCard icon="✅" label="인덱싱 완료" value={`${files.filter(f => f.status === "indexed").length}/${files.length}`} color={B.green} />
      </div>
      <Card style={{ marginBottom: 20, border: `2px dashed ${B.border}` }}>
        <div style={{ padding: 32, textAlign: "center" }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>📁</div>
          <div style={{ color: B.navy, fontSize: 14, fontWeight: 700, marginBottom: 6 }}>파일을 드래그하거나 클릭하여 업로드</div>
          <div style={{ color: B.muted, fontSize: 12, marginBottom: 14 }}>PDF, DOCX, XLSX, CSV, TXT 지원 (최대 50MB)</div>
          <Btn variant="primary">파일 선택</Btn>
        </div>
      </Card>
      <Card>
        <CardHeader title="업로드된 문서" />
        <Table cols={[
          { key: "name", label: "파일명" },
          { key: "typeBadge", label: "유형" },
          { key: "size", label: "크기" },
          { key: "chunkDisplay", label: "청크 수" },
          { key: "statusBadge", label: "상태" },
          { key: "date", label: "업로드일" },
          { key: "actions", label: "" },
        ]} rows={files.map(f => ({
          ...f,
          typeBadge: <Chip color={B.blue}>{f.type}</Chip>,
          chunkDisplay: <span style={{ fontFamily: "monospace", color: B.blue }}>{f.chunks}</span>,
          statusBadge: <Chip color={f.status === "indexed" ? B.green : B.amber}>{f.status === "indexed" ? "완료" : "처리 중"}</Chip>,
          actions: <div style={{ display: "flex", gap: 6 }}><Btn variant="ghost">보기</Btn><Btn variant="danger">삭제</Btn></div>,
        }))} />
      </Card>
    </div>
  );
};

const RealtimeDashboard = () => {
  const [kpis, setKpis] = useState({ amr: 87.3, eff: 91.2, uptime: 99.1, proc: 4.1 });
  useInterval(() => setKpis(p => ({
    amr: Math.min(100, Math.max(70, p.amr + rand(-0.5, 0.5))),
    eff: Math.min(100, Math.max(80, p.eff + rand(-0.4, 0.4))),
    uptime: Math.min(100, Math.max(95, p.uptime + rand(-0.1, 0.1))),
    proc: Math.max(2, Math.min(8, p.proc + rand(-0.2, 0.2))),
  })), 2000);

  const [throughput, setThroughput] = useState(() => Array.from({ length: 20 }, (_, i) => ({ t: i, amr: rand(80, 95), eff: rand(85, 98) })));
  useInterval(() => setThroughput(p => [...p.slice(1), { t: p[p.length - 1].t + 1, amr: rand(80, 95), eff: rand(85, 98) }]), 2000);

  const hourly = Array.from({ length: 12 }, (_, i) => ({ h: `${8 + i}시`, 건수: Math.round(rand(180, 320)), 오류: Math.round(rand(2, 18)) }));

  return (
    <div>
      <PageHeader title="실시간 대시보드" sub="KPI 자동 산출 및 운영 현황 시각화"
        badge="LIVE" actions={[]} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 20 }}>
        <StatCard icon="🤖" label="AMR 판독률" value={`${kpis.amr.toFixed(1)}%`} color={B.green} trend={1.4} />
        <StatCard icon="⚙️" label="공정 효율" value={`${kpis.eff.toFixed(1)}%`} color={B.blue} trend={0.8} />
        <StatCard icon="🟢" label="시스템 가동률" value={`${kpis.uptime.toFixed(1)}%`} color={B.cyan} />
        <StatCard icon="⏱️" label="평균 처리 시간" value={`${kpis.proc.toFixed(1)}분`} color={B.amber} trend={-9.5} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20, marginBottom: 20 }}>
        <Card>
          <CardHeader title="실시간 처리량" />
          <div style={{ padding: 20 }}>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={throughput}>
                <defs>
                  <linearGradient id="ag" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={B.green} stopOpacity={0.2} /><stop offset="100%" stopColor={B.green} stopOpacity={0} /></linearGradient>
                  <linearGradient id="eg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={B.blue} stopOpacity={0.15} /><stop offset="100%" stopColor={B.blue} stopOpacity={0} /></linearGradient>
                </defs>
                <CartesianGrid stroke={B.border} strokeDasharray="3 3" />
                <XAxis hide />
                <YAxis domain={[70, 100]} tick={{ fill: B.muted, fontSize: 10 }} />
                <Area type="monotone" dataKey="amr" stroke={B.green} fill="url(#ag)" strokeWidth={2} dot={false} name="AMR 판독률" />
                <Area type="monotone" dataKey="eff" stroke={B.blue} fill="url(#eg)" strokeWidth={2} dot={false} name="공정 효율" />
                <Tooltip contentStyle={{ background: B.bg1, border: `1px solid ${B.border}`, borderRadius: 8, fontSize: 12 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card>
          <CardHeader title="시간대별 처리 건수" />
          <div style={{ padding: 20 }}>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={hourly}>
                <CartesianGrid stroke={B.border} strokeDasharray="3 3" />
                <XAxis dataKey="h" tick={{ fill: B.muted, fontSize: 9 }} />
                <YAxis tick={{ fill: B.muted, fontSize: 10 }} />
                <Bar dataKey="건수" fill={B.blue} fillOpacity={0.85} radius={[3, 3, 0, 0]} name="처리 건수" />
                <Bar dataKey="오류" fill={B.red} fillOpacity={0.8} radius={[3, 3, 0, 0]} name="오류 건수" />
                <Tooltip contentStyle={{ background: B.bg1, border: `1px solid ${B.border}`, borderRadius: 8, fontSize: 12 }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
        {[{ label: "라인 A", amr: 89.2, eff: 93.4, status: "active" }, { label: "라인 B", amr: 84.7, eff: 88.1, status: "warning" }, { label: "라인 C", amr: 91.5, eff: 96.2, status: "active" }].map(l => (
          <Card key={l.label} style={{ padding: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
              <span style={{ color: B.navy, fontSize: 14, fontWeight: 700 }}>{l.label}</span>
              <StatusDot status={l.status} />
            </div>
            <ProgressBar label="AMR 판독률" value={l.amr} color={l.amr > 88 ? B.green : B.amber} />
            <div style={{ marginTop: 10 }} />
            <ProgressBar label="공정 효율" value={l.eff} color={B.blue} />
          </Card>
        ))}
      </div>
    </div>
  );
};

const DocumentGeneration = () => {
  const [docType, setDocType] = useState("proposal");
  const [title, setTitle] = useState("F.A.C.T AI 전환 도입 제안서");
  const [content, setContent] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);

  const generate = () => {
    setGenerating(true); setContent(""); setGenerated(false);
    const doc = `# ${title}

## 1. 개요

본 제안서는 ㈜포디비전의 **F.A.C.T** 솔루션을 활용하여 귀사의 업무 프로세스를 AI 기반으로 전환하는 방안을 제시합니다.

## 2. 현황 분석

- 수동 리포트 작성 소요 시간: 평균 **4.2시간/건**
- 데이터 분석 자동화율: **23%** (업계 평균 67% 대비 낮음)
- AMR 판독 정확도: **72%** (목표치 85% 미달)

## 3. 기대 효과

| 항목 | 현재 | 도입 후 | 개선율 |
|------|------|---------|--------|
| 리포트 생성 시간 | 4.2시간 | 0.5시간 | **88% 단축** |
| 판독 정확도 | 72% | 87% | **+15%p** |
| 연간 비용 절감 | — | ₩24,000,000 | — |`;
    let i = 0;
    const t = setInterval(() => { setContent(doc.slice(0, i += 8)); if (i >= doc.length) { clearInterval(t); setGenerating(false); setGenerated(true); } }, 16);
  };

  return (
    <div>
      <PageHeader title="문서 자동 작성" sub="제안서·보고서·매뉴얼 자동 생성 및 PDF 변환"
        actions={generated ? [<Btn key="p" variant="primary">📄 PDF 변환</Btn>, <Btn key="d" variant="ghost">DOCX 저장</Btn>] : []} />
      <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 20 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Card style={{ padding: 18 }}>
            <div style={{ color: B.navy, fontSize: 13, fontWeight: 700, marginBottom: 14 }}>문서 설정</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <Select label="문서 유형" value={docType} onChange={e => setDocType(e.target.value)}
                options={[{ v: "proposal", l: "제안서" }, { v: "report", l: "성과 보고서" }, { v: "manual", l: "운영 매뉴얼" }]} />
              <Input label="제목" value={title} onChange={e => setTitle(e.target.value)} />
              <Select label="대상 독자" value="executive" onChange={() => { }} options={[{ v: "executive", l: "경영진" }, { v: "tech", l: "기술팀" }]} />
              <Toggle label="목차 자동 생성" on={true} onChange={() => { }} />
              <Toggle label="차트 자동 생성" on={true} onChange={() => { }} />
            </div>
            <Btn variant="primary" onClick={generate} style={{ width: "100%", marginTop: 16, justifyContent: "center" }}>
              {generating ? "✨ 생성 중…" : "✨ 문서 자동 생성"}
            </Btn>
          </Card>
        </div>
        <Card>
          <CardHeader title="문서 미리보기" right={generating && <Chip color={B.amber}>생성 중...</Chip>} />
          <div style={{
            padding: 20, minHeight: 400, fontFamily: "monospace", fontSize: 12,
            color: B.textSub, lineHeight: 1.9, whiteSpace: "pre-wrap", overflowY: "auto",
          }}>
            {content || <div style={{ color: B.dim, textAlign: "center", marginTop: 80 }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📄</div>
              <div>설정 후 생성을 시작하세요</div>
            </div>}
          </div>
        </Card>
      </div>
    </div>
  );
};

const BottleneckDetection = () => {
  const zones = [
    { id: "Z1", name: "입고 구역 A", risk: "high", score: 82, avg: 12.4, cause: "AGV 집중 구간", color: B.red },
    { id: "Z2", name: "분류 라인 B", risk: "medium", score: 56, avg: 7.2, cause: "센서 응답 지연", color: B.amber },
    { id: "Z3", name: "출고 버퍼 C", risk: "low", score: 23, avg: 3.1, cause: "정상", color: B.green },
    { id: "Z4", name: "충전 스테이션", risk: "medium", score: 61, avg: 8.7, cause: "대기 AGV 과다", color: B.amber },
  ];
  const [selected, setSelected] = useState(0);
  const z = zones[selected];
  const histData = Array.from({ length: 24 }, (_, i) => ({ h: `${i}:00`, score: Math.round(rand(10, 90)) }));

  return (
    <div>
      <PageHeader title="병목 구간 탐지 현황" sub="시뮬레이션 로그 기반 지능형 병목 자동 탐지"
        actions={[<Btn key="s" variant="primary">🔍 전체 재스캔</Btn>]} />
      <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 20 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {zones.map((zz, i) => (
            <Card key={zz.id} style={{
              padding: "14px 16px", cursor: "pointer",
              border: `1px solid ${selected === i ? zz.color + "50" : B.border}`,
              background: selected === i ? `${zz.color}07` : B.bg1,
            }} onClick={() => setSelected(i)}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ color: B.text, fontSize: 13, fontWeight: 700 }}>{zz.name}</span>
                <Chip color={zz.color}>{zz.risk === "high" ? "위험" : zz.risk === "medium" ? "주의" : "정상"}</Chip>
              </div>
              <ProgressBar value={zz.score} color={zz.color} showPct={false} />
              <div style={{ color: B.muted, fontSize: 11, marginTop: 5 }}>병목 지수: <span style={{ color: zz.color, fontFamily: "monospace", fontWeight: 700 }}>{zz.score}/100</span></div>
            </Card>
          ))}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
            <StatCard icon="⚠️" label="병목 지수" value={z.score} color={z.color} />
            <StatCard icon="⏱️" label="평균 대기시간" value={`${z.avg}s`} color={B.cyan} />
            <StatCard icon="🔺" label="원인" value={z.cause} color={B.amber} />
          </div>
          <Card>
            <CardHeader title={`${z.name} — 24시간 추이`} />
            <div style={{ padding: 20 }}>
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={histData}>
                  <defs><linearGradient id="bnG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={z.color} stopOpacity={0.2} /><stop offset="100%" stopColor={z.color} stopOpacity={0} /></linearGradient></defs>
                  <CartesianGrid stroke={B.border} strokeDasharray="3 3" />
                  <XAxis dataKey="h" tick={{ fill: B.muted, fontSize: 9 }} interval={3} />
                  <YAxis tick={{ fill: B.muted, fontSize: 10 }} />
                  <Area type="monotone" dataKey="score" stroke={z.color} fill="url(#bnG)" strokeWidth={2} dot={false} />
                  <Tooltip contentStyle={{ background: B.bg1, border: `1px solid ${B.border}`, borderRadius: 8, fontSize: 12 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
          <Card style={{ padding: 20 }}>
            <div style={{ color: B.navy, fontSize: 13, fontWeight: 700, marginBottom: 12 }}>AI 진단 및 권장 조치</div>
            <div style={{ borderLeft: `3px solid ${z.color}`, paddingLeft: 14, background: `${z.color}07`, borderRadius: "0 8px 8px 0", padding: "12px 14px" }}>
              <div style={{ color: z.color, fontSize: 11, fontWeight: 700, marginBottom: 6 }}>
                {z.risk === "high" ? "🚨 긴급 대응 필요" : z.risk === "medium" ? "⚠️ 모니터링 강화" : "✅ 정상 운영"}
              </div>
              <div style={{ color: B.textSub, fontSize: 13, lineHeight: 1.8 }}>
                {z.risk === "high" ? "AGV 동시 진입 과다로 병목 발생. 경로 재분산 알고리즘 적용 및 진입 간격 15초 이상 조정 권장." : z.risk === "medium" ? "센서 응답 지연 평균 8.7초 (임계값 5초 초과). 펌웨어 업데이트 또는 센서 교체 검토." : "정상 운영 중. 다음 정기 점검: 2025년 3월 15일."}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════
   NAV STRUCTURE
═══════════════════════════════════════════════════ */
const NAV = [
  {
    id: "agent", icon: "🧠", label: "LLM Agent 엔진", color: B.blue,
    subs: [
      { id: "agent-settings", label: "엔진 설정 및 모델 관리", component: AgentEngineSettings },
      { id: "prompt-canvas", label: "프롬프트 엔지니어링 캔버스", component: PromptCanvas },
    ],
  },
  {
    id: "api", icon: "🔗", label: "LLM 기반 API 연동", color: B.violet,
    subs: [
      { id: "connector", label: "커넥터 설정", component: ConnectorSettings },
      { id: "api-logs", label: "연동 로그 모니터링", component: ApiLogMonitor },
    ],
  },
  {
    id: "rag", icon: "🔍", label: "RAG 지식검색", color: B.cyan,
    subs: [
      { id: "knowledge-store", label: "지식 저장소 관리", component: KnowledgeStore },
    ],
  },
  {
    id: "analytics", icon: "📊", label: "기업 데이터 분석", color: B.green,
    subs: [
      { id: "realtime", label: "실시간 대시보드", component: RealtimeDashboard },
      { id: "bottleneck", label: "병목 구간 탐지 현황", component: BottleneckDetection },
    ],
  },
  {
    id: "content", icon: "✍️", label: "자동 콘텐츠 생성", color: B.amber,
    subs: [
      { id: "doc-gen", label: "문서 자동 작성", component: DocumentGeneration },
    ],
  },
];

/* ═══════════════════════════════════════════════════
   SIDEBAR
═══════════════════════════════════════════════════ */
const Sidebar = ({ activePage, setActivePage, expanded, setExpanded, open }) => (
  <div style={{
    width: open ? 240 : 0, minWidth: open ? 240 : 0,
    background: B.navy,
    height: "100vh", overflow: "hidden auto",
    transition: "all 0.28s ease",
    display: "flex", flexDirection: "column", flexShrink: 0,
  }}>
    {/* Logo */}
    <div style={{ padding: "16px 18px 14px", borderBottom: "1px solid rgba(255,255,255,0.08)", flexShrink: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <LogoMark size={32} />
        <div>
          <div style={{ color: "#fff", fontWeight: 900, fontSize: 13, letterSpacing: "0.10em" }}>4D VISION</div>
          <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 9, letterSpacing: "0.12em" }}>F.A.C.T ADMIN</div>
        </div>
      </div>
    </div>

    {/* Version chips */}
    <div style={{ padding: "10px 14px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", gap: 5, flexWrap: "wrap" }}>
      {["YOLOv8", "Claude 3.5", "RAG"].map(t => (
        <span key={t} style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.6)", fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", padding: "2px 7px", borderRadius: 100, fontFamily: "monospace" }}>{t}</span>
      ))}
    </div>

    {/* Nav */}
    <nav style={{ padding: "10px 8px", flex: 1 }}>
      {NAV.map(sec => (
        <div key={sec.id} style={{ marginBottom: 4 }}>
          <div onClick={() => setExpanded(expanded === sec.id ? null : sec.id)}
            style={{
              display: "flex", alignItems: "center", gap: 10, padding: "9px 10px", borderRadius: 8,
              cursor: "pointer", transition: "all 0.18s",
              background: expanded === sec.id ? "rgba(255,255,255,0.10)" : "transparent",
            }}>
            <span style={{ fontSize: 15, flexShrink: 0 }}>{sec.icon}</span>
            <span style={{ color: expanded === sec.id ? "#fff" : "rgba(255,255,255,0.6)", fontSize: 12, fontWeight: 700, flex: 1, lineHeight: 1.3 }}>{sec.label}</span>
            <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 9, transform: expanded === sec.id ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>▶</span>
          </div>
          {expanded === sec.id && (
            <div style={{ marginLeft: 14, paddingLeft: 12, borderLeft: `1px solid ${sec.color}50`, marginTop: 2 }}>
              {sec.subs.map(sub => (
                <div key={sub.id} onClick={() => setActivePage(sub.id)}
                  style={{
                    padding: "7px 10px", borderRadius: 6, cursor: "pointer",
                    color: activePage === sub.id ? "#fff" : "rgba(255,255,255,0.5)",
                    background: activePage === sub.id ? `${sec.color}28` : "transparent",
                    fontSize: 11, fontWeight: activePage === sub.id ? 700 : 400,
                    transition: "all 0.15s", marginBottom: 2,
                  }}>
                  {sub.label}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </nav>

    {/* User */}
    <div style={{ padding: "12px 14px", borderTop: "1px solid rgba(255,255,255,0.08)", flexShrink: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ width: 30, height: 30, background: "rgba(255,255,255,0.15)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>👤</div>
        <div>
          <div style={{ color: "#fff", fontSize: 11, fontWeight: 700 }}>심현보 대표</div>
          <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 10 }}>㈜포디비전</div>
        </div>
        <StatusDot status="active" />
      </div>
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════
   TOP BAR
═══════════════════════════════════════════════════ */
const TopBar = ({ activePage, open, setOpen, onLogo }) => {
  const allSubs = NAV.flatMap(s => s.subs);
  const current = allSubs.find(s => s.id === activePage);
  const section = NAV.find(s => s.subs.some(sub => sub.id === activePage));
  const [now, setNow] = useState(new Date());
  useInterval(() => setNow(new Date()), 1000);

  return (
    <div style={{
      height: 52, background: B.bg1, borderBottom: `1px solid ${B.border}`,
      display: "flex", alignItems: "center", padding: "0 20px", gap: 12, flexShrink: 0,
    }}>
      <button onClick={() => setOpen(p => !p)}
        style={{ background: "none", border: "none", color: B.muted, cursor: "pointer", fontSize: 16, padding: "4px 6px", borderRadius: 4 }}>☰</button>

      <div onClick={onLogo} style={{ display: "flex", alignItems: "center", gap: 7, cursor: "pointer" }}>
        <LogoMark size={22} />
        <span style={{ color: B.navy, fontWeight: 900, fontSize: 12, letterSpacing: "0.08em" }}>4D VISION</span>
      </div>

      <div style={{ width: 1, height: 20, background: B.border }} />

      {section && <>
        <span style={{ color: B.muted, fontSize: 12 }}>{section.label}</span>
        <span style={{ color: B.dim, fontSize: 12 }}>›</span>
      </>}
      <span style={{ color: B.navy, fontSize: 13, fontWeight: 700 }}>{current?.label || ""}</span>

      <div style={{ flex: 1 }} />

      <div style={{ display: "flex", alignItems: "center", gap: 5, background: `${B.green}10`, border: `1px solid ${B.green}25`, borderRadius: 6, padding: "4px 10px" }}>
        <StatusDot status="active" />
        <span style={{ color: B.green, fontSize: 11, fontWeight: 600 }}>시스템 정상</span>
      </div>
      <span style={{ color: B.muted, fontSize: 11, fontFamily: "monospace" }}>{now.toLocaleTimeString("ko-KR")}</span>
      <Chip color={B.navy}>v2.4.1</Chip>
    </div>
  );
};

/* ═══════════════════════════════════════════════════
   APP ROOT
═══════════════════════════════════════════════════ */
function App() {
  const [showLanding, setShowLanding] = useState(true);
  const [activePage, setActivePage] = useState("agent-settings");
  const [expanded, setExpanded] = useState("agent");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const allSubs = NAV.flatMap(s => s.subs);
  const CurrentPage = allSubs.find(s => s.id === activePage)?.component || AgentEngineSettings;

  const handleSetPage = useCallback((id) => {
    setActivePage(id);
    const sec = NAV.find(s => s.subs.some(sub => sub.id === id));
    if (sec) setExpanded(sec.id);
  }, []);

  if (showLanding) return <LandingPage onEnter={() => setShowLanding(false)} />;

  return (
    <div style={{ display: "flex", height: "100vh", background: B.bg0, fontFamily: "'Noto Sans KR','Apple SD Gothic Neo',sans-serif", overflow: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;600;700;800;900&display=swap');
        * { margin:0; padding:0; box-sizing:border-box; }
        ::-webkit-scrollbar { width:4px; height:4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(13,43,94,0.15); border-radius:2px; }
        input, select, textarea, button { font-family: 'Noto Sans KR', sans-serif; }
        input[type=range]::-webkit-slider-thumb { cursor: pointer; }
      `}</style>

      {!RECHARTS_AVAILABLE && (
        <div style={{
          position: "fixed", top: 10, right: 10, zIndex: 9999,
          background: "#fff3cd", border: "1px solid #ffeeba",
          color: "#856404", fontSize: 11, padding: "6px 10px",
          borderRadius: 6, boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
        }}>
          차트 라이브러리를 불러오지 못했습니다. 일부 그래프가 표시되지 않을 수 있습니다.
        </div>
      )}

      <Sidebar activePage={activePage} setActivePage={handleSetPage} expanded={expanded} setExpanded={setExpanded} open={sidebarOpen} />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>
        <TopBar activePage={activePage} open={sidebarOpen} setOpen={setSidebarOpen} onLogo={() => setShowLanding(true)} />
        <div style={{ flex: 1, overflowY: "auto", padding: 24, background: B.bg0 }}>
          <CurrentPage />
        </div>
      </div>
    </div>
  );
}

const rootEl = document.getElementById("root");
if (rootEl && ReactDOM && ReactDOM.createRoot) {
  ReactDOM.createRoot(rootEl).render(<App />);
} else if (rootEl && ReactDOM && ReactDOM.render) {
  ReactDOM.render(<App />, rootEl);
}
