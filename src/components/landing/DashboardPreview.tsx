'use client';

export function DashboardPreview() {
  return (
    <div className="relative">
      {/* Ambient glow */}
      <div className="absolute inset-0 -m-16 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-[#C8A75E]/[0.03] blur-[100px] rounded-full" />
      </div>

      {/* Guide overlays */}
      <svg className="absolute -inset-6 sm:-inset-8 w-[calc(100%+48px)] sm:w-[calc(100%+64px)] h-[calc(100%+48px)] sm:h-[calc(100%+64px)] pointer-events-none z-20" viewBox="0 0 1000 520" fill="none" preserveAspectRatio="none">
        {['M24 60 L24 28 L56 28','M944 28 L976 28 L976 60','M24 460 L24 492 L56 492','M944 492 L976 492 L976 460'].map((d, i) => (
          <path key={i} d={d} stroke="#C8A75E" strokeWidth="1" strokeLinecap="round">
            <animate attributeName="opacity" values="0.12;0.4;0.12" dur="4s" begin={`${i * 0.8}s`} repeatCount="indefinite" />
          </path>
        ))}
        <line x1="36" y1="0" x2="964" y2="0" stroke="url(#sg)" strokeWidth="1">
          <animateTransform attributeName="transform" type="translate" values="0,40;0,480;0,40" dur="12s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0;0.25;0.25;0" dur="12s" repeatCount="indefinite" />
        </line>
        <defs>
          <linearGradient id="sg" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#C8A75E" stopOpacity="0" />
            <stop offset="30%" stopColor="#C8A75E" stopOpacity="0.35" />
            <stop offset="50%" stopColor="#C8A75E" stopOpacity="0.5" />
            <stop offset="70%" stopColor="#C8A75E" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#C8A75E" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>

      {/* Layout */}
      <div className="relative flex items-end">

        {/* ══════════════════════════════════════════════════════════════════
            LAPTOP — MacBook-style
        ══════════════════════════════════════════════════════════════════ */}
        <div className="flex-1 relative z-[1] min-w-0">
          {/* Lid / Screen */}
          <div className="relative">
            {/* Outer bezel — dark aluminum */}
            <div className="bg-[#2a2a2c] rounded-t-[12px] sm:rounded-t-[16px] p-[6px] sm:p-[8px] pb-[10px] sm:pb-[12px] shadow-[0_-2px_20px_rgba(0,0,0,0.15)]">
              {/* Inner bezel — black glass edge */}
              <div className="bg-[#0c0f14] rounded-t-[6px] sm:rounded-t-[8px] p-[3px] sm:p-[4px] pb-0">
                {/* Webcam notch */}
                <div className="flex justify-center pb-[4px] sm:pb-[6px]">
                  <div className="w-[6px] h-[6px] sm:w-[8px] sm:h-[8px] rounded-full bg-[#1a1a1e] border border-[#333] flex items-center justify-center">
                    <div className="w-[2px] h-[2px] sm:w-[3px] sm:h-[3px] rounded-full bg-[#2a4a2a]" />
                  </div>
                </div>

                {/* Screen content */}
                <svg viewBox="0 0 1200 620" fill="none" className="w-full block rounded-[2px]" style={{ background: '#fafaf8' }}>
                  {/* ── SIDEBAR ── */}
                  <rect width="200" height="620" fill="#0c0f14" />
                  <rect x="18" y="14" width="12" height="12" fill="#C8A75E" opacity="0.85" />
                  <rect x="36" y="16" width="64" height="4.5" rx="2" fill="#d4d4cf" opacity="0.5" />
                  <rect x="36" y="23" width="38" height="3" rx="1.5" fill="#5c6370" opacity="0.25" />
                  <rect x="12" y="42" width="176" height="36" fill="#1e2129" opacity="0.55" />
                  <rect x="22" y="50" width="18" height="18" fill="#C8A75E" opacity="0.1" />
                  <rect x="46" y="54" width="72" height="4" rx="2" fill="#d4d4cf" opacity="0.4" />
                  <rect x="46" y="61" width="42" height="2.5" rx="1.25" fill="#5c6370" opacity="0.2" />

                  {/* Nav */}
                  {[
                    { y: 92, w: 56, a: true },
                    { y: 116, w: 38, a: false },
                    { y: 140, w: 48, a: false },
                    { y: 164, w: 52, a: false },
                    { y: 188, w: 32, a: false },
                    { y: 212, w: 18, a: false },
                    { y: 236, w: 44, a: false },
                  ].map((n, i) => (
                    <g key={i}>
                      {n.a && <rect x="8" y={n.y - 2} width="184" height="22" fill="#C8A75E" opacity="0.1" />}
                      <rect x="22" y={n.y + 3} width="9" height="9" rx="1.5" fill={n.a ? '#C8A75E' : '#5c6370'} opacity={n.a ? 0.7 : 0.25} />
                      <rect x="38" y={n.y + 5} width={n.w} height="3.5" rx="1.75" fill={n.a ? '#C8A75E' : '#6b6f76'} opacity={n.a ? 0.6 : 0.22} />
                      {n.a && <rect x="180" y={n.y + 6} width="4" height="4" fill="#C8A75E" opacity="0.55" />}
                    </g>
                  ))}

                  {/* Sidebar user */}
                  <line x1="12" y1="568" x2="188" y2="568" stroke="#1e2129" />
                  <rect x="22" y="580" width="20" height="20" fill="#1e2129" />
                  <text x="32" y="594" textAnchor="middle" fill="#C8A75E" fontSize="6" fontWeight="700" fontFamily="system-ui">JS</text>
                  <rect x="48" y="583" width="56" height="4" rx="2" fill="#d4d4cf" opacity="0.4" />
                  <rect x="48" y="590" width="80" height="2.5" rx="1.25" fill="#5c6370" opacity="0.2" />

                  {/* ── HEADER ── */}
                  <rect x="200" y="0" width="1000" height="42" fill="white" />
                  <line x1="200" y1="42" x2="1200" y2="42" stroke="#e8e8e3" />
                  <rect x="220" y="15" width="64" height="5" rx="2" fill="#0c0f14" opacity="0.6" />
                  <rect x="1008" y="10" width="68" height="20" fill="none" stroke="#e8e8e3" />
                  <circle cx="1020" cy="20" r="4" fill="#C8A75E" opacity="0.5" />
                  <rect x="1028" y="17.5" width="24" height="3.5" rx="1.75" fill="#3a3f49" opacity="0.4" />
                  <rect x="1092" y="10" width="22" height="22" fill="#0c0f14" />
                  <text x="1103" y="25" textAnchor="middle" fill="white" fontSize="6" fontWeight="700" fontFamily="system-ui">JS</text>

                  {/* ── MAIN ── */}
                  <rect x="228" y="60" width="22" height="1.5" fill="#C8A75E" />
                  <rect x="228" y="70" width="80" height="6" rx="2" fill="#0c0f14" opacity="0.6" />
                  <rect x="228" y="82" width="200" height="3" rx="1.5" fill="#8b919a" opacity="0.3" />

                  {/* Stat cards */}
                  {[
                    { x: 228, v: '24' },
                    { x: 464, v: '156' },
                    { x: 700, v: '12' },
                    { x: 936, v: '47', gold: true },
                  ].map((c, i) => (
                    <g key={i} opacity="0">
                      <animate attributeName="opacity" from="0" to="1" dur="0.35s" begin={`${0.15 + i * 0.1}s`} fill="freeze" />
                      <rect x={c.x} y="98" width="206" height="76" fill="white" stroke="#e8e8e3" />
                      <rect x={c.x + 12} y="110" width="10" height="10" rx="2" fill={c.gold ? '#C8A75E' : '#8b919a'} opacity="0.2" />
                      <path d={`M${c.x + 186} 114 l6 0`} stroke="#d4d4cf" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
                      <path d={`M${c.x + 190} 112 l2 2 -2 2`} stroke="#d4d4cf" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" opacity="0.4" />
                      <text x={c.x + 12} y="148" fill="#0c0f14" fontSize="18" fontWeight="800" fontFamily="system-ui" opacity="0.8">{c.v}</text>
                      <rect x={c.x + 12} y="155" width={36 + i * 6} height="3" rx="1.5" fill="#3a3f49" opacity="0.4" />
                      <rect x={c.x + 12} y="162" width={24 + i * 3} height="2.5" rx="1.25" fill="#b5b5ae" opacity="0.3" />
                    </g>
                  ))}

                  {/* Table */}
                  <g opacity="0">
                    <animate attributeName="opacity" from="0" to="1" dur="0.4s" begin="0.6s" fill="freeze" />
                    <rect x="228" y="192" width="914" height="232" fill="white" stroke="#e8e8e3" />
                    <rect x="244" y="206" width="95" height="5" rx="2" fill="#0c0f14" opacity="0.45" />
                    <rect x="1068" y="206" width="40" height="3.5" rx="1.75" fill="#0c0f14" opacity="0.2" />
                    <line x1="244" y1="222" x2="1126" y2="222" stroke="#e8e8e3" />
                    <rect x="244" y="228" width="40" height="2.5" rx="1.25" fill="#8b919a" opacity="0.3" />
                    <rect x="480" y="228" width="24" height="2.5" rx="1.25" fill="#8b919a" opacity="0.3" />
                    <rect x="660" y="228" width="32" height="2.5" rx="1.25" fill="#8b919a" opacity="0.3" />
                    <rect x="850" y="228" width="24" height="2.5" rx="1.25" fill="#8b919a" opacity="0.3" />
                    <rect x="1020" y="228" width="28" height="2.5" rx="1.25" fill="#8b919a" opacity="0.3" />
                  </g>

                  {/* Table rows */}
                  {[
                    { y: 240, nw: 50, tw: 58, sc: '#28c840', sw: 32 },
                    { y: 264, nw: 62, tw: 68, sc: '#0c0f14', sw: 22 },
                    { y: 288, nw: 56, tw: 58, sc: '#C8A75E', sw: 36 },
                    { y: 312, nw: 46, tw: 34, sc: '#febc2e', sw: 40 },
                    { y: 336, nw: 58, tw: 58, sc: '#28c840', sw: 32 },
                    { y: 360, nw: 52, tw: 46, sc: '#0c0f14', sw: 28 },
                    { y: 384, nw: 44, tw: 58, sc: '#28c840', sw: 32 },
                  ].map((r, i) => (
                    <g key={i} opacity="0">
                      <animate attributeName="opacity" from="0" to="1" dur="0.3s" begin={`${0.7 + i * 0.08}s`} fill="freeze" />
                      <line x1="244" y1={r.y} x2="1126" y2={r.y} stroke="#f0f0ec" />
                      <rect x="244" y={r.y + 9} width={r.nw} height="3.5" rx="1.75" fill="#0c0f14" opacity="0.5" />
                      <rect x="480" y={r.y + 9} width={r.tw} height="3.5" rx="1.75" fill="#6b6f76" opacity="0.3" />
                      <rect x="660" y={r.y + 6} width={r.sw + 8} height="12" fill={r.sc} opacity="0.08" />
                      <rect x="664" y={r.y + 9.5} width={r.sw - 4} height="3" rx="1.5" fill={r.sc} opacity="0.6" />
                      <rect x="850" y={r.y + 9} width="28" height="3" rx="1.5" fill="#8b919a" opacity="0.22" />
                      <rect x="1020" y={r.y + 9} width="20" height="3" rx="1.5" fill="#0c0f14" opacity="0.1" />
                    </g>
                  ))}

                  {/* Quick actions */}
                  {[228, 534, 840].map((x, i) => (
                    <g key={i} opacity="0">
                      <animate attributeName="opacity" from="0" to="1" dur="0.3s" begin={`${1.3 + i * 0.1}s`} fill="freeze" />
                      <rect x={x} y="440" width="276" height="50" fill="white" stroke="#e8e8e3" />
                      <rect x={x + 12} y="452" width="24" height="24" fill="#0c0f14" />
                      <rect x={x + 18} y="458" width="12" height="12" rx="1" fill="#C8A75E" opacity="0.4" />
                      <rect x={x + 46} y="456" width={44 + i * 8} height="4" rx="2" fill="#0c0f14" opacity="0.5" />
                      <rect x={x + 46} y="464" width={56 + i * 4} height="2.5" rx="1.25" fill="#8b919a" opacity="0.25" />
                    </g>
                  ))}

                  {/* Warning bar */}
                  <g opacity="0">
                    <animate attributeName="opacity" from="0" to="1" dur="0.3s" begin="1.6s" fill="freeze" />
                    <rect x="228" y="506" width="914" height="36" fill="#fffbeb" stroke="#fde68a" strokeWidth="0.5" />
                    <circle cx="248" cy="524" r="6" fill="#f59e0b" opacity="0.15" />
                    <path d="M246 522 l2 4 2-4" stroke="#f59e0b" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
                    <rect x="262" y="519" width="100" height="3.5" rx="1.75" fill="#92400e" opacity="0.45" />
                    <rect x="262" y="526" width="180" height="2.5" rx="1.25" fill="#92400e" opacity="0.25" />
                    <rect x="1058" y="514" width="68" height="20" fill="#0c0f14" />
                    <rect x="1068" y="521" width="48" height="3" rx="1.5" fill="white" opacity="0.8" />
                  </g>

                  {/* Animated accents */}
                  <circle cx="656" cy="255" r="2.5" fill="#28c840" opacity="0">
                    <animate attributeName="opacity" values="0;0.45;0" dur="2.5s" begin="2s" repeatCount="indefinite" />
                    <animate attributeName="r" values="2.5;6;2.5" dur="2.5s" begin="2s" repeatCount="indefinite" />
                  </circle>
                  <circle cx="1050" cy="20" r="2" fill="#C8A75E" opacity="0">
                    <animate attributeName="opacity" values="0;0.6;0" dur="3s" begin="4s" repeatCount="indefinite" />
                    <animate attributeName="r" values="2;6;2" dur="3s" begin="4s" repeatCount="indefinite" />
                  </circle>
                  <rect x="228" y="384" width="914" height="24" fill="#C8A75E" opacity="0">
                    <animate attributeName="opacity" values="0;0.04;0" dur="4s" begin="3s" repeatCount="indefinite" />
                  </rect>
                </svg>
              </div>
            </div>
          </div>

          {/* Laptop bottom — keyboard deck / hinge */}
          <div className="relative">
            {/* Hinge strip */}
            <div className="h-[6px] sm:h-[8px] bg-gradient-to-b from-[#3a3a3c] to-[#2a2a2c] rounded-b-sm mx-[2px]" />
            {/* Keyboard deck */}
            <div className="bg-[#2a2a2c] rounded-b-[10px] sm:rounded-b-[14px] mx-[-4px] sm:mx-[-6px] h-[10px] sm:h-[14px] shadow-[0_4px_12px_rgba(0,0,0,0.15)]">
              {/* Front edge lip */}
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[15%] h-[3px] sm:h-[4px] bg-[#1e1e20] rounded-t-sm" />
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            iPHONE — realistic frame
        ══════════════════════════════════════════════════════════════════ */}
        <div
          className="relative z-[2] -ml-6 sm:-ml-10 lg:-ml-14 mb-4 sm:mb-6 lg:mb-8 shrink-0 w-[120px] sm:w-[155px] lg:w-[180px]"
          style={{ transform: 'rotate(3deg)' }}
        >
          {/* Phone body — rounded aluminum frame */}
          <div className="bg-[#1a1a1c] rounded-[18px] sm:rounded-[24px] lg:rounded-[30px] p-[3px] sm:p-[4px] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5),_inset_0_0_0_1px_rgba(255,255,255,0.05)]">
            {/* Inner black bezel */}
            <div className="bg-[#000] rounded-[15px] sm:rounded-[20px] lg:rounded-[26px] overflow-hidden">
              {/* Dynamic Island */}
              <div className="bg-black flex justify-center pt-[8px] sm:pt-[10px] lg:pt-[12px] pb-[4px] sm:pb-[5px]">
                <div className="w-[52px] sm:w-[64px] lg:w-[76px] h-[12px] sm:h-[16px] lg:h-[18px] bg-[#000] rounded-full border border-[#1a1a1c] flex items-center justify-center gap-[6px] sm:gap-[8px]">
                  <div className="w-[4px] h-[4px] sm:w-[5px] sm:h-[5px] rounded-full bg-[#0a0a0c] border border-[#222]" />
                  <div className="w-[3px] h-[3px] sm:w-[4px] sm:h-[4px] rounded-full bg-[#111]" />
                </div>
              </div>

              {/* Screen */}
              <svg viewBox="0 0 340 680" fill="none" className="w-full block bg-white">
                {/* Status bar */}
                <rect width="340" height="20" fill="white" />
                <text x="170" y="14" textAnchor="middle" fill="#0c0f14" fontSize="9.5" fontWeight="700" fontFamily="system-ui">9:41</text>
                {/* Signal bars */}
                <rect x="22" y="7" width="3" height="5" rx="0.5" fill="#0c0f14" opacity="0.8" />
                <rect x="27" y="5.5" width="3" height="6.5" rx="0.5" fill="#0c0f14" opacity="0.8" />
                <rect x="32" y="4" width="3" height="8" rx="0.5" fill="#0c0f14" opacity="0.8" />
                <rect x="37" y="2.5" width="3" height="9.5" rx="0.5" fill="#0c0f14" opacity="0.25" />
                {/* WiFi */}
                <path d="M50 9 C53 5, 59 5, 62 9" stroke="#0c0f14" strokeWidth="1.2" strokeLinecap="round" fill="none" opacity="0.7" />
                <path d="M53 11 C54.5 9, 57.5 9, 59 11" stroke="#0c0f14" strokeWidth="1.2" strokeLinecap="round" fill="none" opacity="0.7" />
                <circle cx="56" cy="13" r="1" fill="#0c0f14" opacity="0.7" />
                {/* Battery */}
                <rect x="290" y="4" width="22" height="11" rx="3" fill="none" stroke="#0c0f14" strokeWidth="1" opacity="0.6" />
                <rect x="312" y="7" width="1.5" height="5" rx="0.75" fill="#0c0f14" opacity="0.4" />
                <rect x="292" y="6" width="16" height="7" rx="1.5" fill="#28c840" opacity="0.75" />

                {/* App header */}
                <rect y="20" width="340" height="40" fill="#0c0f14" />
                <rect x="14" y="32" width="10" height="10" fill="#C8A75E" opacity="0.7" />
                <rect x="30" y="33" width="64" height="4.5" rx="2" fill="#d4d4cf" opacity="0.45" />
                <rect x="30" y="41" width="38" height="3" rx="1.5" fill="#5c6370" opacity="0.25" />

                {/* Gold accent line */}
                <rect y="60" width="340" height="1.5" fill="#C8A75E" opacity="0.35" />

                {/* ── PDF Content ── */}
                <rect x="20" y="72" width="300" height="20" fill="#0c0f14" opacity="0.03" />
                <text x="170" y="86" textAnchor="middle" fill="#0c0f14" fontSize="8" fontWeight="800" fontFamily="system-ui" letterSpacing="2" opacity="0.6">FMCSA CONSENT FORM</text>

                {/* SIGNED badge */}
                <g opacity="0">
                  <animate attributeName="opacity" from="0" to="1" dur="0.5s" begin="1s" fill="freeze" />
                  <rect x="115" y="100" width="110" height="24" fill="#28c840" opacity="0.07" />
                  <circle cx="136" cy="112" r="6.5" fill="#28c840" opacity="0.12" />
                  <path d="M133 112 L135.5 114.5 L140 109.5" stroke="#28c840" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.75" />
                  <text x="178" y="115.5" textAnchor="middle" fill="#28c840" fontSize="7" fontWeight="800" fontFamily="system-ui" letterSpacing="1.2" opacity="0.75">SIGNED</text>
                </g>

                <line x1="20" y1="134" x2="320" y2="134" stroke="#e8e8e3" />

                {/* Driver info */}
                {[
                  { y: 146, lw: 32, vw: 90 },
                  { y: 164, lw: 38, vw: 70 },
                  { y: 182, lw: 26, vw: 82 },
                  { y: 200, lw: 44, vw: 55 },
                  { y: 218, lw: 36, vw: 48 },
                ].map((f, i) => (
                  <g key={i}>
                    <rect x="20" y={f.y} width={f.lw} height="3" rx="1.5" fill="#8b919a" opacity="0.28" />
                    <rect x="110" y={f.y} width={f.vw} height="3.5" rx="1.75" fill="#0c0f14" opacity="0.45" />
                  </g>
                ))}

                {/* Consent text */}
                <rect x="20" y="244" width="70" height="3" rx="1.5" fill="#8b919a" opacity="0.35" />
                <line x1="20" y1="252" x2="320" y2="252" stroke="#e8e8e3" />
                {[262, 274, 286, 298, 310, 322, 334, 350, 362, 374, 386, 398].map((y, i) => (
                  <rect key={y} x="20" y={y} width={i === 7 || i === 11 ? 160 : (i === 3 ? 280 : 300)} height="2.5" rx="1.25" fill="#6b6f76" opacity={i === 7 || i === 11 ? 0.12 : 0.14} />
                ))}

                {/* Checkbox */}
                <g opacity="0">
                  <animate attributeName="opacity" from="0" to="1" dur="0.4s" begin="1.3s" fill="freeze" />
                  <rect x="20" y="416" width="300" height="30" fill="#0c0f14" opacity="0.02" />
                  <rect x="24" y="424" width="10" height="10" fill="none" stroke="#0c0f14" strokeWidth="0.8" opacity="0.3" />
                  <path d="M26 429 L28 431 L32 426" stroke="#0c0f14" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
                  <rect x="42" y="424" width="240" height="2.5" rx="1.25" fill="#6b6f76" opacity="0.2" />
                  <rect x="42" y="431" width="160" height="2.5" rx="1.25" fill="#6b6f76" opacity="0.15" />
                </g>

                {/* Signature */}
                <rect x="20" y="458" width="55" height="3" rx="1.5" fill="#8b919a" opacity="0.35" />
                <line x1="20" y1="466" x2="320" y2="466" stroke="#e8e8e3" />
                <rect x="20" y="474" width="300" height="60" fill="#fafaf8" stroke="#e8e8e3" strokeDasharray="3 3" />
                <g opacity="0">
                  <animate attributeName="opacity" from="0" to="1" dur="0.7s" begin="1.5s" fill="freeze" />
                  <path
                    d="M45 510 C55 490, 72 492, 82 502 S100 516, 115 500 S130 484, 148 500 S165 510, 180 498 C190 488, 198 500, 215 496 S240 502, 260 494"
                    stroke="#0c0f14" strokeWidth="1.2" fill="none" strokeLinecap="round" opacity="0.55"
                  />
                </g>

                {/* Date + IP */}
                <rect x="20" y="548" width="38" height="2.5" rx="1.25" fill="#8b919a" opacity="0.25" />
                <rect x="70" y="548" width="72" height="3" rx="1.5" fill="#0c0f14" opacity="0.35" />
                <rect x="20" y="560" width="22" height="2.5" rx="1.25" fill="#8b919a" opacity="0.25" />
                <rect x="70" y="560" width="95" height="3" rx="1.5" fill="#0c0f14" opacity="0.35" />

                {/* Download button */}
                <rect y="584" width="340" height="46" fill="#0c0f14" />
                <rect x="88" y="595" width="164" height="24" fill="#C8A75E" opacity="0.9" />
                <text x="170" y="611" textAnchor="middle" fill="#0c0f14" fontSize="7" fontWeight="800" fontFamily="system-ui" letterSpacing="1.5">DOWNLOAD PDF</text>

                {/* Home indicator */}
                <rect y="630" width="340" height="50" fill="white" />
                <rect x="120" y="648" width="100" height="4" rx="2" fill="#0c0f14" opacity="0.2" />
              </svg>
            </div>
          </div>

          {/* Connection line */}
          <svg className="absolute -left-5 top-[30%] w-7 h-14 pointer-events-none hidden sm:block" viewBox="0 0 28 56" fill="none">
            <path d="M0 28 C14 28, 14 14, 28 14" stroke="#C8A75E" strokeWidth="0.6" strokeDasharray="2 3" opacity="0.25">
              <animate attributeName="opacity" values="0.1;0.3;0.1" dur="3s" repeatCount="indefinite" />
            </path>
            <circle cx="0" cy="28" r="1.5" fill="#C8A75E" opacity="0.3" />
            <circle cx="28" cy="14" r="1.5" fill="#C8A75E" opacity="0.3" />
          </svg>
        </div>
      </div>

      {/* Labels */}
      <div className="absolute -right-2 top-[10%] hidden xl:flex items-center gap-2" style={{ animation: 'lbl 0.4s 1.5s both' }}>
        <div className="w-5 h-px bg-[#C8A75E]/25" />
        <span className="text-[0.5rem] font-bold text-[#C8A75E]/40 uppercase tracking-[0.15em]">Live dashboard</span>
      </div>
      <div className="absolute -right-2 top-[45%] hidden xl:flex items-center gap-2" style={{ animation: 'lbl 0.4s 1.8s both' }}>
        <div className="w-5 h-px bg-[#C8A75E]/25" />
        <span className="text-[0.5rem] font-bold text-[#C8A75E]/40 uppercase tracking-[0.15em]">Consent tracking</span>
      </div>
      <div className="absolute right-[10%] -bottom-6 hidden xl:flex items-center gap-2" style={{ animation: 'lbl 0.4s 2.1s both' }}>
        <div className="w-5 h-px bg-[#C8A75E]/25" />
        <span className="text-[0.5rem] font-bold text-[#C8A75E]/40 uppercase tracking-[0.15em]">Signed PDF</span>
      </div>
      <div className="absolute -left-2 top-[28%] hidden xl:flex items-center gap-2" style={{ animation: 'lbl 0.4s 2s both' }}>
        <span className="text-[0.5rem] font-bold text-[#C8A75E]/40 uppercase tracking-[0.15em]">Navigation</span>
        <div className="w-5 h-px bg-[#C8A75E]/25" />
      </div>

      <style jsx>{`
        @keyframes lbl {
          from { opacity: 0; transform: translateX(-4px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
