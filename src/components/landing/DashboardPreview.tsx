'use client';

export function DashboardPreview() {
  return (
    <div className="relative">
      {/* Ambient glow */}
      <div className="absolute inset-0 -m-16 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-[#C8A75E]/[0.03] blur-[100px] rounded-full" />
      </div>

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

                  {/* Logo area */}
                  <rect x="16" y="12" width="14" height="14" rx="3" stroke="#C8A75E" strokeWidth="1" fill="none" opacity="0.7" />
                  <path d="M21 17 L23 19.5 L28 15" stroke="#C8A75E" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
                  <text x="38" y="23" fill="#d4d4cf" fontSize="5.5" fontWeight="700" fontFamily="system-ui" letterSpacing="1">CONSENTHAUL</text>

                  {/* Org switcher */}
                  <rect x="12" y="38" width="176" height="30" rx="4" fill="#1e2129" opacity="0.7" />
                  <rect x="22" y="46" width="14" height="14" rx="3" fill="#C8A75E" opacity="0.15" />
                  <text x="28" y="56" textAnchor="middle" fill="#C8A75E" fontSize="5.5" fontWeight="700" fontFamily="system-ui">A</text>
                  <text x="44" y="53" fill="#d4d4cf" fontSize="5" fontWeight="600" fontFamily="system-ui" opacity="0.7">Acme Freight LLC</text>
                  <text x="44" y="61" fill="#5c6370" fontSize="3.5" fontFamily="system-ui" opacity="0.5">Owner</text>
                  <path d="M172 52 l4 3 4-3" stroke="#5c6370" strokeWidth="0.8" strokeLinecap="round" opacity="0.3" />

                  {/* Nav items with labels */}
                  {[
                    { y: 84, label: 'Dashboard', icon: 'grid', a: true },
                    { y: 108, label: 'Drivers', icon: 'users', a: false },
                    { y: 132, label: 'Consents', icon: 'file', a: false },
                    { y: 156, label: 'Templates', icon: 'layout', a: false },
                    { y: 180, label: 'Billing', icon: 'credit', a: false },
                    { y: 210, label: 'Settings', icon: 'gear', a: false },
                    { y: 234, label: 'API Docs', icon: 'code', a: false },
                  ].map((n, i) => (
                    <g key={i}>
                      {n.a && <rect x="6" y={n.y - 2} width="188" height="22" rx="4" fill="#C8A75E" opacity="0.08" />}
                      {n.a && <rect x="6" y={n.y + 2} width="2" height="14" rx="1" fill="#C8A75E" opacity="0.7" />}
                      <text x="38" y={n.y + 13} fill={n.a ? '#C8A75E' : '#6b6f76'} fontSize="5" fontWeight={n.a ? '600' : '500'} fontFamily="system-ui" opacity={n.a ? 0.85 : 0.45}>{n.label}</text>
                    </g>
                  ))}

                  {/* Sidebar divider */}
                  <line x1="16" y1="258" x2="184" y2="258" stroke="#1e2129" strokeWidth="0.5" />

                  {/* Credits indicator */}
                  <rect x="14" y="270" width="172" height="34" rx="4" fill="#C8A75E" opacity="0.05" />
                  <text x="24" y="283" fill="#C8A75E" fontSize="4" fontWeight="600" fontFamily="system-ui" opacity="0.5" letterSpacing="0.5">CREDITS REMAINING</text>
                  <text x="24" y="296" fill="#C8A75E" fontSize="9" fontWeight="800" fontFamily="system-ui" opacity="0.7">47</text>
                  <text x="48" y="296" fill="#5c6370" fontSize="4" fontFamily="system-ui" opacity="0.35">of 50 purchased</text>
                  <rect x="120" y="281" width="52" height="14" rx="3" fill="#C8A75E" opacity="0.12" />
                  <text x="146" y="290.5" textAnchor="middle" fill="#C8A75E" fontSize="4" fontWeight="600" fontFamily="system-ui" opacity="0.6">Buy More</text>

                  {/* Sidebar user */}
                  <line x1="12" y1="572" x2="188" y2="572" stroke="#1e2129" strokeWidth="0.5" />
                  <rect x="20" y="582" width="20" height="20" rx="4" fill="#1e2129" />
                  <text x="30" y="595" textAnchor="middle" fill="#C8A75E" fontSize="6" fontWeight="700" fontFamily="system-ui">JS</text>
                  <text x="48" y="591" fill="#d4d4cf" fontSize="4.5" fontWeight="500" fontFamily="system-ui" opacity="0.6">John Sandoval</text>
                  <text x="48" y="599" fill="#5c6370" fontSize="3.5" fontFamily="system-ui" opacity="0.35">john@acmefreight.com</text>

                  {/* ── HEADER BAR ── */}
                  <rect x="200" y="0" width="1000" height="42" fill="white" />
                  <line x1="200" y1="42" x2="1200" y2="42" stroke="#e8e8e3" strokeWidth="0.5" />
                  <text x="224" y="26" fill="#0c0f14" fontSize="7" fontWeight="700" fontFamily="system-ui">Dashboard</text>

                  {/* Search bar */}
                  <rect x="860" y="10" width="180" height="22" rx="4" fill="none" stroke="#e8e8e3" strokeWidth="0.5" />
                  <text x="876" y="24" fill="#b5b5ae" fontSize="4.5" fontFamily="system-ui">Search drivers, consents...</text>
                  <rect x="1010" y="14" width="20" height="13" rx="2" fill="#f0f0ec" />
                  <text x="1020" y="23" textAnchor="middle" fill="#8b919a" fontSize="4" fontWeight="600" fontFamily="system-ui">/</text>

                  {/* New Consent button */}
                  <rect x="1054" y="10" width="72" height="22" rx="4" fill="#0c0f14" />
                  <text x="1076" y="24" fill="white" fontSize="4.5" fontWeight="600" fontFamily="system-ui">+ New Consent</text>

                  {/* User avatar */}
                  <rect x="1140" y="10" width="22" height="22" rx="4" fill="#0c0f14" />
                  <text x="1151" y="24" textAnchor="middle" fill="white" fontSize="5.5" fontWeight="700" fontFamily="system-ui">JS</text>

                  {/* ── MAIN CONTENT ── */}

                  {/* Page title area */}
                  <rect x="228" y="58" width="22" height="1.5" rx="0.75" fill="#C8A75E" />
                  <text x="228" y="76" fill="#0c0f14" fontSize="9" fontWeight="800" fontFamily="system-ui" opacity="0.85">Overview</text>
                  <text x="228" y="86" fill="#8b919a" fontSize="4" fontFamily="system-ui" opacity="0.5">Last 30 days</text>

                  {/* ── STAT CARDS ── */}
                  {[
                    { x: 228, label: 'Total Drivers', value: '24', sub: '+3 this month', color: '#0c0f14' },
                    { x: 464, label: 'Consents Sent', value: '156', sub: '142 signed', color: '#0c0f14' },
                    { x: 700, label: 'Pending', value: '12', sub: '8 opened, 4 sent', color: '#f59e0b' },
                    { x: 936, label: 'Credits', value: '47', sub: '$0.75 avg cost', color: '#C8A75E', gold: true },
                  ].map((c, i) => (
                    <g key={i} opacity="0">
                      <animate attributeName="opacity" from="0" to="1" dur="0.35s" begin={`${0.15 + i * 0.1}s`} fill="freeze" />
                      <rect x={c.x} y="98" width="206" height="76" rx="4" fill="white" stroke="#e8e8e3" strokeWidth="0.5" />

                      {/* Card label */}
                      <text x={c.x + 14} y="116" fill="#8b919a" fontSize="4" fontWeight="500" fontFamily="system-ui">{c.label}</text>

                      {/* Value */}
                      <text x={c.x + 14} y="148" fill={c.gold ? '#C8A75E' : '#0c0f14'} fontSize="20" fontWeight="800" fontFamily="system-ui" opacity="0.85">{c.value}</text>

                      {/* Subtext */}
                      <text x={c.x + 14} y="162" fill="#8b919a" fontSize="3.8" fontFamily="system-ui" opacity="0.5">{c.sub}</text>

                      {/* Mini sparkline */}
                      <path
                        d={`M${c.x + 140} 155 l8 -${3 + i} l8 ${2 + i * 0.5} l8 -${4 + i} l8 ${1} l8 -${2 + i * 0.3} l12 -3`}
                        stroke={c.gold ? '#C8A75E' : '#0c0f14'} strokeWidth="1" fill="none" strokeLinecap="round" opacity="0.2"
                      />
                    </g>
                  ))}

                  {/* ── RECENT CONSENTS TABLE ── */}
                  <g opacity="0">
                    <animate attributeName="opacity" from="0" to="1" dur="0.4s" begin="0.6s" fill="freeze" />
                    <rect x="228" y="192" width="914" height="240" rx="4" fill="white" stroke="#e8e8e3" strokeWidth="0.5" />

                    {/* Table header */}
                    <text x="244" y="210" fill="#0c0f14" fontSize="5.5" fontWeight="700" fontFamily="system-ui" opacity="0.7">Recent Consents</text>
                    <text x="1100" y="210" fill="#0c0f14" fontSize="4" fontFamily="system-ui" opacity="0.25" textAnchor="end">View All</text>

                    {/* Column headers */}
                    <line x1="244" y1="220" x2="1126" y2="220" stroke="#e8e8e3" strokeWidth="0.5" />
                    <text x="244" y="232" fill="#8b919a" fontSize="3.8" fontWeight="600" fontFamily="system-ui" letterSpacing="0.3">DRIVER</text>
                    <text x="440" y="232" fill="#8b919a" fontSize="3.8" fontWeight="600" fontFamily="system-ui" letterSpacing="0.3">TYPE</text>
                    <text x="620" y="232" fill="#8b919a" fontSize="3.8" fontWeight="600" fontFamily="system-ui" letterSpacing="0.3">STATUS</text>
                    <text x="790" y="232" fill="#8b919a" fontSize="3.8" fontWeight="600" fontFamily="system-ui" letterSpacing="0.3">SENT VIA</text>
                    <text x="920" y="232" fill="#8b919a" fontSize="3.8" fontWeight="600" fontFamily="system-ui" letterSpacing="0.3">DATE</text>
                    <text x="1070" y="232" fill="#8b919a" fontSize="3.8" fontWeight="600" fontFamily="system-ui" letterSpacing="0.3">ACTION</text>
                    <line x1="244" y1="238" x2="1126" y2="238" stroke="#f0f0ec" strokeWidth="0.5" />
                  </g>

                  {/* Table rows with real data */}
                  {[
                    { name: 'Carlos Mendez', cdl: 'TX-28491037', type: 'Limited Query', status: 'Signed', sc: '#28c840', via: 'SMS', date: 'Feb 21, 2026', action: 'PDF' },
                    { name: 'James Wheeler', cdl: 'CA-99173822', type: 'Pre-Employment', status: 'Viewed', sc: '#3b82f6', via: 'WhatsApp', date: 'Feb 21, 2026', action: 'Resend' },
                    { name: 'Maria Santos', cdl: 'FL-55920184', type: 'Limited Query', status: 'Signed', sc: '#28c840', via: 'Email', date: 'Feb 20, 2026', action: 'PDF' },
                    { name: 'Robert Jackson', cdl: 'OH-41038276', type: 'Blanket', status: 'Pending', sc: '#f59e0b', via: 'SMS', date: 'Feb 20, 2026', action: 'Resend' },
                    { name: 'David Nguyen', cdl: 'IL-73829104', type: 'Limited Query', status: 'Signed', sc: '#28c840', via: 'SMS', date: 'Feb 19, 2026', action: 'PDF' },
                    { name: 'Sarah Mitchell', cdl: 'PA-62048391', type: 'Limited Query', status: 'Expired', sc: '#ef4444', via: 'Email', date: 'Feb 14, 2026', action: 'Retry' },
                    { name: 'Luis Hernandez', cdl: 'AZ-88210473', type: 'Pre-Employment', status: 'Signed', sc: '#28c840', via: 'WhatsApp', date: 'Feb 13, 2026', action: 'PDF' },
                  ].map((r, i) => {
                    const y = 244 + i * 26;
                    return (
                      <g key={i} opacity="0">
                        <animate attributeName="opacity" from="0" to="1" dur="0.3s" begin={`${0.7 + i * 0.07}s`} fill="freeze" />
                        <line x1="244" y1={y} x2="1126" y2={y} stroke="#f0f0ec" strokeWidth="0.3" />

                        {/* Driver name + CDL */}
                        <text x="244" y={y + 12} fill="#0c0f14" fontSize="4.5" fontWeight="600" fontFamily="system-ui" opacity="0.75">{r.name}</text>
                        <text x="244" y={y + 19} fill="#8b919a" fontSize="3.2" fontFamily="system-ui" opacity="0.4">{r.cdl}</text>

                        {/* Consent type */}
                        <text x="440" y={y + 14} fill="#6b6f76" fontSize="4" fontFamily="system-ui" opacity="0.55">{r.type}</text>

                        {/* Status badge */}
                        <rect x="620" y={y + 5} width={r.status.length * 4.2 + 14} height="14" rx="3" fill={r.sc} opacity="0.08" />
                        <circle cx="628" cy={y + 12} r="2" fill={r.sc} opacity="0.5" />
                        <text x="634" y={y + 15} fill={r.sc} fontSize="3.8" fontWeight="600" fontFamily="system-ui" opacity="0.75">{r.status}</text>

                        {/* Sent via */}
                        <text x="790" y={y + 14} fill="#6b6f76" fontSize="4" fontFamily="system-ui" opacity="0.45">{r.via}</text>

                        {/* Date */}
                        <text x="920" y={y + 14} fill="#8b919a" fontSize="3.8" fontFamily="system-ui" opacity="0.4">{r.date}</text>

                        {/* Action link */}
                        <text x="1070" y={y + 14} fill={r.action === 'PDF' ? '#0c0f14' : '#C8A75E'} fontSize="3.8" fontWeight="600" fontFamily="system-ui" opacity="0.5" textDecoration="underline">{r.action}</text>
                      </g>
                    );
                  })}

                  {/* ── QUICK ACTIONS ROW ── */}
                  {[
                    { x: 228, title: 'New Consent', desc: 'Send a consent request to a driver' },
                    { x: 534, title: 'Add Driver', desc: 'Add a new driver to your roster' },
                    { x: 840, title: 'Import CSV', desc: 'Bulk import drivers from spreadsheet' },
                  ].map((a, i) => (
                    <g key={i} opacity="0">
                      <animate attributeName="opacity" from="0" to="1" dur="0.3s" begin={`${1.3 + i * 0.1}s`} fill="freeze" />
                      <rect x={a.x} y="448" width="276" height="44" rx="4" fill="white" stroke="#e8e8e3" strokeWidth="0.5" />

                      {/* Icon box */}
                      <rect x={a.x + 12} y="458" width="24" height="24" rx="4" fill="#0c0f14" />
                      {i === 0 && <path d={`M${a.x + 24} 465 v10 M${a.x + 19} 470 h10`} stroke="#C8A75E" strokeWidth="1.2" strokeLinecap="round" />}
                      {i === 1 && <>
                        <circle cx={a.x + 24} cy={467} r="3" stroke="#C8A75E" strokeWidth="1" fill="none" />
                        <path d={`M${a.x + 19} 477 a8 6 0 0 1 10 0`} stroke="#C8A75E" strokeWidth="1" fill="none" strokeLinecap="round" />
                      </>}
                      {i === 2 && <>
                        <path d={`M${a.x + 20} 467 h8 v8 h-8 z`} stroke="#C8A75E" strokeWidth="1" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                        <path d={`M${a.x + 22} 472 l2 2 4 -4`} stroke="#C8A75E" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round" />
                      </>}

                      {/* Text */}
                      <text x={a.x + 46} y={466} fill="#0c0f14" fontSize="4.5" fontWeight="600" fontFamily="system-ui" opacity="0.7">{a.title}</text>
                      <text x={a.x + 46} y={475} fill="#8b919a" fontSize="3.5" fontFamily="system-ui" opacity="0.4">{a.desc}</text>
                    </g>
                  ))}

                  {/* ── WARNING BAR — Low credits ── */}
                  <g opacity="0">
                    <animate attributeName="opacity" from="0" to="1" dur="0.3s" begin="1.6s" fill="freeze" />
                    <rect x="228" y="506" width="914" height="34" rx="4" fill="#fffbeb" stroke="#fde68a" strokeWidth="0.5" />
                    <circle cx="248" cy="523" r="6" fill="#f59e0b" opacity="0.12" />
                    <text x="248" y="526" textAnchor="middle" fill="#f59e0b" fontSize="7" fontWeight="700" fontFamily="system-ui" opacity="0.5">!</text>
                    <text x="262" y="520" fill="#92400e" fontSize="4.2" fontWeight="600" fontFamily="system-ui" opacity="0.6">Low credit balance</text>
                    <text x="262" y="528" fill="#92400e" fontSize="3.5" fontFamily="system-ui" opacity="0.35">You have 3 credits remaining. Purchase more to continue sending consents.</text>
                    <rect x="1060" y="512" width="62" height="20" rx="3" fill="#0c0f14" />
                    <text x="1091" y="525" textAnchor="middle" fill="white" fontSize="3.8" fontWeight="600" fontFamily="system-ui" opacity="0.85">Buy Credits</text>
                  </g>

                  {/* Subtle live indicator */}
                  <circle cx="656" cy="255" r="2" fill="#28c840" opacity="0">
                    <animate attributeName="opacity" values="0;0.4;0" dur="2.5s" begin="2s" repeatCount="indefinite" />
                    <animate attributeName="r" values="2;5;2" dur="2.5s" begin="2s" repeatCount="indefinite" />
                  </circle>
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
            iPHONE — Driver signing experience
        ══════════════════════════════════════════════════════════════════ */}
        <div
          className="relative z-[2] -ml-6 sm:-ml-10 lg:-ml-14 mb-4 sm:mb-6 lg:mb-8 shrink-0 w-[120px] sm:w-[155px] lg:w-[180px]"
          style={{ transform: 'rotate(3deg)' }}
        >
          {/* Phone body */}
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

                {/* App header — dark bar */}
                <rect y="20" width="340" height="38" fill="#0c0f14" />
                <rect x="14" y="30" width="10" height="10" rx="2" stroke="#C8A75E" strokeWidth="0.8" fill="none" opacity="0.6" />
                <path d="M17 33 L19 35.5 L23 31" stroke="#C8A75E" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
                <text x="30" y="37" fill="#d4d4cf" fontSize="5" fontWeight="700" fontFamily="system-ui" letterSpacing="0.8" opacity="0.7">CONSENTHAUL</text>

                {/* Language toggle */}
                <rect x="260" y="30" width="60" height="16" rx="8" fill="#1e2129" />
                <rect x="262" y="32" width="28" height="12" rx="6" fill="#C8A75E" opacity="0.2" />
                <text x="276" y="41" textAnchor="middle" fill="#C8A75E" fontSize="5" fontWeight="700" fontFamily="system-ui" opacity="0.8">EN</text>
                <text x="304" y="41" textAnchor="middle" fill="#5c6370" fontSize="5" fontWeight="600" fontFamily="system-ui" opacity="0.4">ES</text>

                {/* Gold accent line */}
                <rect y="58" width="340" height="1.5" fill="#C8A75E" opacity="0.3" />

                {/* ── CONSENT DOCUMENT ── */}

                {/* Title */}
                <text x="170" y="80" textAnchor="middle" fill="#0c0f14" fontSize="7" fontWeight="800" fontFamily="system-ui" letterSpacing="1.5" opacity="0.55">FMCSA CLEARINGHOUSE</text>
                <text x="170" y="92" textAnchor="middle" fill="#0c0f14" fontSize="6" fontWeight="700" fontFamily="system-ui" letterSpacing="1" opacity="0.4">LIMITED QUERY CONSENT</text>

                {/* SIGNED badge — animates in */}
                <g opacity="0">
                  <animate attributeName="opacity" from="0" to="1" dur="0.5s" begin="1s" fill="freeze" />
                  <rect x="110" y="102" width="120" height="22" rx="4" fill="#28c840" opacity="0.06" />
                  <circle cx="130" cy="113" r="5.5" fill="#28c840" opacity="0.1" />
                  <path d="M127 113 L129.5 115.5 L134 110" stroke="#28c840" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
                  <text x="180" y="116" textAnchor="middle" fill="#28c840" fontSize="6" fontWeight="800" fontFamily="system-ui" letterSpacing="1" opacity="0.7">SIGNED</text>
                </g>

                <line x1="20" y1="132" x2="320" y2="132" stroke="#e8e8e3" strokeWidth="0.5" />

                {/* Driver info fields — real labels and values */}
                {[
                  { y: 146, label: 'Driver Name', value: 'Carlos Mendez' },
                  { y: 162, label: 'CDL Number', value: 'TX-28491037' },
                  { y: 178, label: 'DOB', value: '03/14/1988' },
                  { y: 194, label: 'Carrier', value: 'Acme Freight LLC' },
                  { y: 210, label: 'Consent Type', value: 'Limited Query' },
                ].map((f, i) => (
                  <g key={i}>
                    <text x="24" y={f.y + 4} fill="#8b919a" fontSize="4" fontWeight="500" fontFamily="system-ui" opacity="0.6">{f.label}</text>
                    <text x="120" y={f.y + 4} fill="#0c0f14" fontSize="4.5" fontWeight="600" fontFamily="system-ui" opacity="0.7">{f.value}</text>
                  </g>
                ))}

                {/* Consent body header */}
                <line x1="20" y1="228" x2="320" y2="228" stroke="#e8e8e3" strokeWidth="0.5" />
                <text x="24" y="242" fill="#0c0f14" fontSize="4.5" fontWeight="700" fontFamily="system-ui" opacity="0.5">Consent Authorization</text>

                {/* Consent body — actual text lines */}
                <text x="24" y="256" fill="#6b6f76" fontSize="3.5" fontFamily="system-ui" opacity="0.45">I hereby authorize the above-named carrier/employer</text>
                <text x="24" y="264" fill="#6b6f76" fontSize="3.5" fontFamily="system-ui" opacity="0.45">to conduct a limited query of the FMCSA Commercial</text>
                <text x="24" y="272" fill="#6b6f76" fontSize="3.5" fontFamily="system-ui" opacity="0.45">{"Driver's License Drug and Alcohol Clearinghouse to"}</text>
                <text x="24" y="280" fill="#6b6f76" fontSize="3.5" fontFamily="system-ui" opacity="0.45">determine whether drug or alcohol violation information</text>
                <text x="24" y="288" fill="#6b6f76" fontSize="3.5" fontFamily="system-ui" opacity="0.45">about me exists in the Clearinghouse.</text>

                <text x="24" y="304" fill="#6b6f76" fontSize="3.5" fontFamily="system-ui" opacity="0.45">I understand that if the limited query shows that drug</text>
                <text x="24" y="312" fill="#6b6f76" fontSize="3.5" fontFamily="system-ui" opacity="0.45">or alcohol violation information about me exists in the</text>
                <text x="24" y="320" fill="#6b6f76" fontSize="3.5" fontFamily="system-ui" opacity="0.45">Clearinghouse, FMCSA will not disclose that information</text>
                <text x="24" y="328" fill="#6b6f76" fontSize="3.5" fontFamily="system-ui" opacity="0.45">to the employer without first obtaining additional</text>
                <text x="24" y="336" fill="#6b6f76" fontSize="3.5" fontFamily="system-ui" opacity="0.45">specific consent from me. 49 CFR Part 40.</text>

                {/* Checkbox acknowledgment */}
                <g opacity="0">
                  <animate attributeName="opacity" from="0" to="1" dur="0.4s" begin="1.3s" fill="freeze" />
                  <rect x="20" y="352" width="300" height="28" rx="4" fill="#0c0f14" opacity="0.02" />
                  <rect x="26" y="360" width="10" height="10" rx="2" fill="none" stroke="#0c0f14" strokeWidth="0.7" opacity="0.25" />
                  <path d="M28 365 L30 367 L34 362" stroke="#0c0f14" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
                  <text x="42" y="366" fill="#6b6f76" fontSize="3.5" fontFamily="system-ui" opacity="0.45">I have read and understand the above consent</text>
                  <text x="42" y="374" fill="#6b6f76" fontSize="3.5" fontFamily="system-ui" opacity="0.4">and I agree to authorize this query.</text>
                </g>

                {/* Signature area */}
                <text x="24" y="398" fill="#8b919a" fontSize="4" fontWeight="600" fontFamily="system-ui" opacity="0.45">Signature</text>
                <line x1="20" y1="404" x2="320" y2="404" stroke="#e8e8e3" strokeWidth="0.5" />
                <rect x="20" y="410" width="300" height="56" rx="4" fill="#fafaf8" stroke="#e8e8e3" strokeDasharray="3 3" strokeWidth="0.5" />

                {/* Animated signature drawing */}
                <g opacity="0">
                  <animate attributeName="opacity" from="0" to="1" dur="0.7s" begin="1.5s" fill="freeze" />
                  <path
                    d="M45 444 C55 424, 72 426, 82 436 S100 450, 115 434 S130 418, 148 434 S165 444, 180 432 C190 422, 198 434, 215 430 S240 436, 260 428"
                    stroke="#0c0f14" strokeWidth="1.2" fill="none" strokeLinecap="round" opacity="0.5"
                  />
                </g>

                {/* Date + IP info */}
                <text x="24" y="484" fill="#8b919a" fontSize="3.5" fontFamily="system-ui" opacity="0.4">Signed on</text>
                <text x="70" y="484" fill="#0c0f14" fontSize="3.8" fontWeight="500" fontFamily="system-ui" opacity="0.5">Feb 21, 2026 at 2:14 PM CST</text>
                <text x="24" y="494" fill="#8b919a" fontSize="3.5" fontFamily="system-ui" opacity="0.4">IP Address</text>
                <text x="70" y="494" fill="#0c0f14" fontSize="3.8" fontWeight="500" fontFamily="system-ui" opacity="0.5">172.58.xxx.xxx</text>
                <text x="24" y="504" fill="#8b919a" fontSize="3.5" fontFamily="system-ui" opacity="0.4">Consent ID</text>
                <text x="70" y="504" fill="#0c0f14" fontSize="3.8" fontWeight="500" fontFamily="system-ui" opacity="0.5">CNS-2026-00847</text>

                {/* Compliance badge */}
                <rect x="20" y="518" width="300" height="22" rx="4" fill="#0c0f14" opacity="0.02" />
                <text x="170" y="532" textAnchor="middle" fill="#8b919a" fontSize="3.2" fontFamily="system-ui" opacity="0.35">ESIGN Act & UETA Compliant  ·  Retained 3 Years  ·  49 CFR §40</text>

                {/* Download PDF button */}
                <rect y="550" width="340" height="80" fill="#fafaf8" />
                <rect x="24" y="558" width="292" height="36" rx="6" fill="#C8A75E" opacity="0.9" />
                <text x="170" y="580" textAnchor="middle" fill="#0c0f14" fontSize="6" fontWeight="800" fontFamily="system-ui" letterSpacing="1.2">DOWNLOAD SIGNED PDF</text>

                {/* Home indicator */}
                <rect y="630" width="340" height="50" fill="white" />
                <rect x="120" y="648" width="100" height="4" rx="2" fill="#0c0f14" opacity="0.2" />
              </svg>
            </div>
          </div>

          {/* Connection line between laptop and phone */}
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
        <span className="text-[0.5rem] font-bold text-[#C8A75E]/40 uppercase tracking-[0.15em]">Admin dashboard</span>
      </div>
      <div className="absolute -right-2 top-[45%] hidden xl:flex items-center gap-2" style={{ animation: 'lbl 0.4s 1.8s both' }}>
        <div className="w-5 h-px bg-[#C8A75E]/25" />
        <span className="text-[0.5rem] font-bold text-[#C8A75E]/40 uppercase tracking-[0.15em]">Real-time tracking</span>
      </div>
      <div className="absolute right-[10%] -bottom-6 hidden xl:flex items-center gap-2" style={{ animation: 'lbl 0.4s 2.1s both' }}>
        <div className="w-5 h-px bg-[#C8A75E]/25" />
        <span className="text-[0.5rem] font-bold text-[#C8A75E]/40 uppercase tracking-[0.15em]">Driver signs on phone</span>
      </div>
      <div className="absolute -left-2 top-[28%] hidden xl:flex items-center gap-2" style={{ animation: 'lbl 0.4s 2s both' }}>
        <span className="text-[0.5rem] font-bold text-[#C8A75E]/40 uppercase tracking-[0.15em]">Fleet management</span>
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
