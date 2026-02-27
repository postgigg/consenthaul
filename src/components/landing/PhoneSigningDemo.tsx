'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Animated phone mockup showing the full driver signing flow:
 * 1. SMS notification arrives
 * 2. Consent form loads
 * 3. Driver scrolls through the document
 * 4. Checkbox gets checked
 * 5. Signature is drawn
 * 6. Submit button pressed
 * 7. Confetti + "Signed" confirmation
 * 8. Loop back
 */

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  rotation: number;
  dx: number;
  dy: number;
  dr: number;
  opacity: number;
  shape: 'rect' | 'circle' | 'triangle';
}

const CONFETTI_COLORS = ['#C8A75E', '#28c840', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

function generateConfetti(count: number): Particle[] {
  const particles: Particle[] = [];
  for (let i = 0; i < count; i++) {
    const shapeRand = Math.random();
    particles.push({
      id: i,
      x: 197 + (Math.random() - 0.5) * 120,
      y: 300 + (Math.random() - 0.5) * 70,
      size: 4 + Math.random() * 7,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      rotation: Math.random() * 360,
      dx: (Math.random() - 0.5) * 14,
      dy: -(4 + Math.random() * 10),
      dr: (Math.random() - 0.5) * 20,
      opacity: 1,
      shape: shapeRand > 0.66 ? 'triangle' : shapeRand > 0.33 ? 'rect' : 'circle',
    });
  }
  return particles;
}

type Phase =
  | 'sms'
  | 'loading'
  | 'form'          // Form appears, pause to let user see top
  | 'scrolling'     // Scroll down to reveal checkbox/signature/submit
  | 'checkbox'
  | 'signing'
  | 'submitting'
  | 'confetti'
  | 'done';

// The viewBox is 393x852. The form clip area starts at y=72 and goes to y=780.
// Visible height = 708px. Content extends to ~1100px, so we need to scroll ~390px
// to bring the checkbox, signature box, and submit button into view.
const FORM_CLIP_TOP = 72;
const FORM_CLIP_BOTTOM = 780;
const MAX_SCROLL = 390;

// Finger cursor positions
function getCursorPos(phase: Phase, scrollY: number, signatureProgress: number): { x: number; y: number; visible: boolean; tapping: boolean } {
  switch (phase) {
    case 'sms': return { x: 197, y: 360, visible: true, tapping: true };
    case 'loading': return { x: 197, y: 420, visible: false, tapping: false };
    case 'form': return { x: 197, y: 600, visible: true, tapping: false };
    case 'scrolling': return { x: 197, y: 500, visible: true, tapping: false };
    case 'checkbox': return { x: 50, y: 800 - MAX_SCROLL, visible: true, tapping: true };
    case 'signing': {
      const t = signatureProgress;
      const sx = 58 + t * 252;
      const sy = (908 - MAX_SCROLL) + Math.sin(t * Math.PI * 4) * 10;
      return { x: sx, y: sy, visible: true, tapping: false };
    }
    case 'submitting': return { x: 197, y: 984 - MAX_SCROLL, visible: true, tapping: true };
    case 'confetti': return { x: 197, y: 400, visible: false, tapping: false };
    case 'done': return { x: 197, y: 400, visible: false, tapping: false };
    default: return { x: 197, y: 400, visible: false, tapping: false };
  }
}

export function PhoneSigningDemo() {
  const [phase, setPhase] = useState<Phase>('sms');
  const [scrollY, setScrollY] = useState(0);
  const [signatureProgress, setSignatureProgress] = useState(0);
  const [confettiParticles, setConfettiParticles] = useState<Particle[]>([]);
  const [checkmark, setCheckmark] = useState(false);
  const rafRef = useRef<number>(0);

  const resetDemo = useCallback(() => {
    setPhase('sms');
    setScrollY(0);
    setSignatureProgress(0);
    setConfettiParticles([]);
    setCheckmark(false);
  }, []);

  // Phase state machine
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    let timer2: ReturnType<typeof setTimeout>;

    switch (phase) {
      case 'sms':
        timer = setTimeout(() => setPhase('loading'), 2500);
        break;
      case 'loading':
        timer = setTimeout(() => setPhase('form'), 1000);
        break;
      case 'form':
        timer = setTimeout(() => setPhase('scrolling'), 800);
        break;
      case 'scrolling':
        // handled by rAF
        break;
      case 'checkbox':
        timer = setTimeout(() => {
          setCheckmark(true);
          timer2 = setTimeout(() => setPhase('signing'), 600);
        }, 400);
        break;
      case 'signing':
        // handled by rAF
        break;
      case 'submitting':
        timer = setTimeout(() => {
          setConfettiParticles(generateConfetti(45));
          setPhase('confetti');
        }, 500);
        break;
      case 'confetti':
        timer = setTimeout(() => setPhase('done'), 2500);
        break;
      case 'done':
        timer = setTimeout(() => resetDemo(), 2000);
        break;
    }

    return () => {
      clearTimeout(timer);
      clearTimeout(timer2);
    };
  }, [phase, resetDemo]);

  // Scroll animation with rAF
  useEffect(() => {
    if (phase !== 'scrolling') return;
    const duration = 3500;
    let startTime: number | null = null;
    let startScroll = 0;
    setScrollY(prev => { startScroll = prev; return prev; });

    const animate = (timestamp: number) => {
      if (startTime === null) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const newScroll = startScroll + (MAX_SCROLL - startScroll) * eased;
      setScrollY(newScroll);

      if (progress >= 1) {
        setScrollY(MAX_SCROLL);
        setPhase('checkbox');
        return;
      }
      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [phase]);

  // Signature animation with rAF
  useEffect(() => {
    if (phase !== 'signing') return;
    const duration = 1200;
    let startTime: number | null = null;

    const animate = (timestamp: number) => {
      if (startTime === null) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;
      setSignatureProgress(eased);

      if (progress >= 1) {
        setSignatureProgress(1);
        setTimeout(() => setPhase('submitting'), 400);
        return;
      }
      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [phase]);

  // Confetti physics with rAF
  useEffect(() => {
    if (phase !== 'confetti' || confettiParticles.length === 0) return;
    let lastTime: number | null = null;

    const animate = (timestamp: number) => {
      if (lastTime === null) lastTime = timestamp;
      const dt = Math.min((timestamp - lastTime) / 16.67, 3);
      lastTime = timestamp;

      setConfettiParticles(prev => {
        const next = prev
          .map(p => ({
            ...p,
            x: p.x + p.dx * dt,
            y: p.y + p.dy * dt,
            dy: p.dy + 0.25 * dt,
            rotation: p.rotation + p.dr * dt,
            opacity: Math.max(0, p.opacity - 0.012 * dt),
          }))
          .filter(p => p.opacity > 0);
        if (next.length === 0) return [];
        return next;
      });

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [phase, confettiParticles.length]);

  const showForm = phase !== 'sms' && phase !== 'loading';
  const showSuccess = phase === 'confetti' || phase === 'done';

  // After scrolling, cursor positions are relative to the clipped viewport.
  // The form content uses a translateY(-scrollY) so elements at absolute Y
  // appear at (Y - scrollY) in the viewport. Cursor positions for checkbox/signing/submit
  // are given in viewport coords (relative to the clip area).

  return (
    <div className="relative flex justify-center lg:justify-end">
      {/* Ambient glow behind phone */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] h-[440px] bg-[#C8A75E]/[0.04] blur-[80px] rounded-full pointer-events-none" />

      {/* ── Floating shapes — streamlined (12 elements) ── */}
      <div className="absolute -top-10 -left-16 w-28 h-28 rounded-full bg-[#C8A75E]/[0.06] blur-xl pointer-events-none" style={{ animation: 'float1 7s ease-in-out infinite' }} />
      <div className="absolute -bottom-12 -right-8 w-32 h-32 rounded-full bg-[#C8A75E]/[0.04] blur-xl pointer-events-none" style={{ animation: 'float2 10s ease-in-out infinite' }} />
      <div className="absolute top-[40%] -left-20 w-24 h-24 rounded-full bg-[#0c0f14]/[0.03] blur-lg pointer-events-none" style={{ animation: 'float5 9s ease-in-out infinite' }} />

      <div className="absolute top-[18%] -right-14 w-16 h-16 rounded-full bg-[#C8A75E]/[0.08] blur-sm pointer-events-none" style={{ animation: 'float4 6s ease-in-out infinite' }} />
      <div className="absolute bottom-[25%] -left-10 w-12 h-12 rounded-full bg-[#C8A75E]/[0.06] blur-sm pointer-events-none" style={{ animation: 'drift-diagonal 8s ease-in-out infinite' }} />

      <div className="absolute top-[30%] -right-12 w-10 h-10 rounded-full bg-[#28c840]/[0.06] blur-sm pointer-events-none" style={{ animation: 'float2 7s ease-in-out infinite' }} />
      <div className="absolute bottom-[10%] left-[-24px] w-6 h-6 rounded-full bg-[#28c840]/[0.08] pointer-events-none" style={{ animation: 'float3 5s ease-in-out infinite' }} />

      <div className="absolute bottom-[18%] -right-6 w-10 h-10 rounded-lg bg-[#0c0f14]/[0.04] blur-sm pointer-events-none rotate-12" style={{ animation: 'float3 7.5s ease-in-out infinite' }} />
      <div className="absolute top-[8%] -left-8 w-8 h-8 rounded-lg bg-[#e8e8e3]/[0.4] pointer-events-none rotate-[-15deg]" style={{ animation: 'drift-diagonal 9s ease-in-out infinite reverse' }} />

      <div className="absolute top-[5%] right-[-22px] w-3 h-3 rounded-full bg-[#C8A75E]/[0.2] pointer-events-none" style={{ animation: 'pulse-soft 3s ease-in-out infinite' }} />
      <div className="absolute bottom-[42%] -left-4 w-2.5 h-2.5 rounded-full bg-[#C8A75E]/[0.25] pointer-events-none" style={{ animation: 'pulse-soft 4s ease-in-out infinite 1s' }} />
      <div className="absolute top-[72%] -right-3 w-2 h-2 rounded-full bg-[#28c840]/[0.2] pointer-events-none" style={{ animation: 'pulse-soft 3.5s ease-in-out infinite 0.5s' }} />

      {/* Phone frame */}
      <div className="relative w-[280px] sm:w-[310px] lg:w-[340px]">
        <div
          className="rounded-[38px] sm:rounded-[44px] lg:rounded-[50px] p-[5px] sm:p-[5.5px] lg:p-[6px]"
          style={{
            background: 'linear-gradient(145deg, #7a7a7e 0%, #636366 8%, #4a4a4e 20%, #3a3a3c 35%, #2c2c2e 50%, #3a3a3c 65%, #4a4a4e 80%, #636366 92%, #7a7a7e 100%)',
            boxShadow: '0 60px 120px -20px rgba(0,0,0,0.55), 0 30px 60px -15px rgba(0,0,0,0.35), 0 0 40px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.2), inset 0 -1px 0 rgba(0,0,0,0.35), inset 1px 0 0 rgba(255,255,255,0.08), inset -1px 0 0 rgba(255,255,255,0.08)',
          }}
        >
          <div
            className="rounded-[34px] sm:rounded-[40px] lg:rounded-[46px] p-[1.5px]"
            style={{
              background: 'linear-gradient(145deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.04) 25%, rgba(0,0,0,0.2) 50%, rgba(255,255,255,0.03) 75%, rgba(255,255,255,0.1) 100%)',
            }}
          >
            {/* Silent switch */}
            <div className="absolute -left-[3px] top-[80px] w-[4px] h-[14px] rounded-l-[2px]" style={{ background: 'linear-gradient(180deg, #6a6a6e 0%, #555558 20%, #3a3a3c 50%, #555558 80%, #6a6a6e 100%)', boxShadow: '-1px 0 2px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)' }} />
            {/* Volume up */}
            <div className="absolute -left-[3px] top-[112px] w-[4px] h-[30px] rounded-l-[2px]" style={{ background: 'linear-gradient(180deg, #6a6a6e 0%, #555558 20%, #3a3a3c 50%, #555558 80%, #6a6a6e 100%)', boxShadow: '-1px 0 2px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)' }} />
            {/* Volume down */}
            <div className="absolute -left-[3px] top-[150px] w-[4px] h-[30px] rounded-l-[2px]" style={{ background: 'linear-gradient(180deg, #6a6a6e 0%, #555558 20%, #3a3a3c 50%, #555558 80%, #6a6a6e 100%)', boxShadow: '-1px 0 2px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)' }} />
            {/* Power button */}
            <div className="absolute -right-[3px] top-[122px] w-[4px] h-[42px] rounded-r-[2px]" style={{ background: 'linear-gradient(180deg, #6a6a6e 0%, #555558 20%, #3a3a3c 50%, #555558 80%, #6a6a6e 100%)', boxShadow: '1px 0 2px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)' }} />
            {/* 5G antenna line */}
            <div className="absolute -right-[3px] bottom-[30%] w-[4px] h-[16px] rounded-r-[2px]" style={{ background: 'linear-gradient(180deg, #6a6a6e 0%, #555558 20%, #3a3a3c 50%, #555558 80%, #6a6a6e 100%)', boxShadow: '1px 0 2px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)' }} />

            <div className="bg-[#000] rounded-[33px] sm:rounded-[39px] lg:rounded-[45px] overflow-hidden" style={{ boxShadow: 'inset 0 0 2px rgba(0,0,0,0.5), inset 0 1px 3px rgba(0,0,0,0.3)' }}>
              <div className="bg-black flex justify-center pt-[8px] sm:pt-[10px] lg:pt-[12px] pb-[3px] sm:pb-[4px]">
                <div className="w-[80px] sm:w-[92px] lg:w-[100px] h-[16px] sm:h-[19px] lg:h-[21px] bg-[#000] rounded-full flex items-center justify-center gap-[8px] sm:gap-[10px]" style={{ boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.8), inset 0 0 0 0.5px rgba(50,50,54,0.6)' }}>
                  {/* Camera lens with concentric ring */}
                  <div className="w-[5px] h-[5px] sm:w-[6px] sm:h-[6px] rounded-full bg-[#08080a]" style={{ boxShadow: 'inset 0 0 0 0.5px rgba(60,60,65,0.5), inset 0 0 1px rgba(30,30,40,0.8), 0 0 0 0.5px rgba(40,40,45,0.4)' }} />
                  {/* Ambient light / proximity sensor */}
                  <div className="w-[3px] h-[3px] sm:w-[4px] sm:h-[4px] rounded-full bg-[#0a0a0c]" style={{ boxShadow: 'inset 0 0 1px rgba(20,20,30,0.6)' }} />
                </div>
              </div>

              <div className="relative bg-white" style={{ height: 'calc(100% - 40px)' }}>
                {/* Screen edge vignette */}
                <div
                  className="absolute inset-0 pointer-events-none z-10"
                  style={{
                    background: 'radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,0.03) 100%)',
                  }}
                />
                {/* Glass reflection overlay */}
                <div
                  className="absolute inset-0 pointer-events-none z-10"
                  style={{
                    background: 'linear-gradient(125deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.03) 25%, transparent 50%)',
                  }}
                />
                <svg viewBox="0 0 393 852" fill="none" className="w-full block">
                  {/* ── STATUS BAR ── */}
                  <rect width="393" height="24" fill="white" />
                  <text x="197" y="17" textAnchor="middle" fill="#0c0f14" fontSize="11" fontWeight="700" fontFamily="system-ui">9:41</text>
                  <rect x="26" y="8" width="3.5" height="6" rx="0.7" fill="#0c0f14" opacity="0.8" />
                  <rect x="31.5" y="6.5" width="3.5" height="7.5" rx="0.7" fill="#0c0f14" opacity="0.8" />
                  <rect x="37" y="5" width="3.5" height="9" rx="0.7" fill="#0c0f14" opacity="0.8" />
                  <rect x="42.5" y="3" width="3.5" height="11" rx="0.7" fill="#0c0f14" opacity="0.25" />
                  <path d="M58 10 C61.5 5.5, 68.5 5.5, 72 10" stroke="#0c0f14" strokeWidth="1.4" strokeLinecap="round" fill="none" opacity="0.7" />
                  <path d="M61.5 13 C63 10.5, 67 10.5, 68.5 13" stroke="#0c0f14" strokeWidth="1.4" strokeLinecap="round" fill="none" opacity="0.7" />
                  <circle cx="65" cy="15.5" r="1.2" fill="#0c0f14" opacity="0.7" />
                  <rect x="335" y="5" width="26" height="13" rx="3.5" fill="none" stroke="#0c0f14" strokeWidth="1.2" opacity="0.6" />
                  <rect x="361" y="8.5" width="1.8" height="6" rx="0.9" fill="#0c0f14" opacity="0.4" />
                  <rect x="337.5" y="7.5" width="19" height="8" rx="2" fill="#28c840" opacity="0.75" />

                  {/* ── PHASE: SMS NOTIFICATION ── */}
                  {phase === 'sms' && (
                    <g>
                      <rect y="24" width="393" height="828" fill="#f2f2f7" />
                      <text x="197" y="220" textAnchor="middle" fill="#0c0f14" fontSize="52" fontWeight="700" fontFamily="system-ui" letterSpacing="-1.5">9:41</text>
                      <text x="197" y="245" textAnchor="middle" fill="#6b6f76" fontSize="11" fontWeight="500" fontFamily="system-ui">Monday, February 24</text>

                      <g opacity="0">
                        <animate attributeName="opacity" from="0" to="1" dur="0.4s" begin="0.5s" fill="freeze" />
                        <animateTransform attributeName="transform" type="translate" values="0,-30;0,4;0,-1;0,0" keyTimes="0;0.5;0.8;1" keySplines="0.25 0.46 0.45 0.94;0.25 0.46 0.45 0.94;0.25 0.46 0.45 0.94" calcMode="spline" dur="0.6s" begin="0.5s" fill="freeze" />

                        <rect x="18" y="300" width="357" height="102" rx="16" fill="black" opacity="0.06" transform="translate(0, 3)" filter="url(#notifShadow)" />
                        <defs>
                          <filter id="notifShadow" x="-10%" y="-10%" width="120%" height="140%">
                            <feGaussianBlur in="SourceGraphic" stdDeviation="4" />
                          </filter>
                        </defs>

                        <rect x="18" y="300" width="357" height="102" rx="16" fill="white" opacity="0.97" />
                        <rect x="18" y="300" width="357" height="102" rx="16" fill="none" stroke="#e0e0e0" strokeWidth="0.5" />

                        <rect x="32" y="314" width="30" height="30" rx="7" fill="#28c840" />
                        <text x="47" y="334" textAnchor="middle" fill="white" fontSize="14" fontWeight="700" fontFamily="system-ui">M</text>
                        <circle cx="58" cy="316" r="5" fill="#ef4444" />
                        <text x="58" y="319" textAnchor="middle" fill="white" fontSize="5" fontWeight="700" fontFamily="system-ui">1</text>

                        <text x="72" y="325" fill="#8b919a" fontSize="7" fontWeight="600" fontFamily="system-ui">MESSAGES</text>
                        <text x="345" y="325" fill="#8b919a" fontSize="6" fontFamily="system-ui" opacity="0.5" textAnchor="end">now</text>
                        <text x="72" y="341" fill="#0c0f14" fontSize="8" fontWeight="600" fontFamily="system-ui">ConsentHaul</text>
                        <text x="72" y="357" fill="#6b6f76" fontSize="7.5" fontFamily="system-ui">Acme Freight LLC needs your consent</text>
                        <text x="72" y="371" fill="#6b6f76" fontSize="7.5" fontFamily="system-ui">for an FMCSA query. Sign here:</text>
                        <text x="72" y="385" fill="#3b82f6" fontSize="7.5" fontFamily="system-ui">app.consenthaul.com/sign/abc123</text>
                      </g>
                    </g>
                  )}

                  {/* ── PHASE: LOADING ── */}
                  {phase === 'loading' && (
                    <g>
                      <rect y="24" width="393" height="828" fill="white" />
                      <rect y="24" width="393" height="46" fill="#0c0f14" />
                      {/* Real logo icon */}
                      <g transform="translate(16, 36) scale(0.25)">
                        <rect x="3" y="3" width="42" height="42" rx="9" stroke="#C8A75E" strokeWidth="2" fill="none" opacity="0.7" />
                        <path d="M32 11 H37 V16" stroke="#C8A75E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
                        <path d="M15.5 26.2 L20.8 31.0 L32.8 18.8" stroke="#C8A75E" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
                        <circle cx="35.5" cy="35.5" r="2.6" fill="#C8A75E" />
                      </g>
                      <text x="34" y="45" fill="#d4d4cf" fontSize="6" fontWeight="700" fontFamily="system-ui" letterSpacing="1" opacity="0.7">CONSENTHAUL</text>
                      <rect y="70" width="393" height="2" fill="#C8A75E" opacity="0.3" />
                      <circle cx="197" cy="420" r="15" fill="none" stroke="#e8e8e3" strokeWidth="2.5" />
                      <path d="M197 405 A15 15 0 0 1 212 420" fill="none" stroke="#C8A75E" strokeWidth="2.5" strokeLinecap="round">
                        <animateTransform attributeName="transform" type="rotate" from="0 197 420" to="360 197 420" dur="0.8s" repeatCount="indefinite" />
                      </path>
                      <text x="197" y="452" textAnchor="middle" fill="#8b919a" fontSize="6" fontFamily="system-ui">Loading consent form...</text>
                    </g>
                  )}

                  {/* ── PHASE: FORM / SCROLLING / CHECKBOX / SIGNING / SUBMIT ── */}
                  {showForm && !showSuccess && (
                    <g>
                      {/* App header bar — fixed, not scrolled */}
                      <rect y="24" width="393" height="46" fill="#0c0f14" />
                      {/* Real logo icon */}
                      <g transform="translate(16, 36) scale(0.25)">
                        <rect x="3" y="3" width="42" height="42" rx="9" stroke="#C8A75E" strokeWidth="2" fill="none" opacity="0.7" />
                        <path d="M32 11 H37 V16" stroke="#C8A75E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
                        <path d="M15.5 26.2 L20.8 31.0 L32.8 18.8" stroke="#C8A75E" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
                        <circle cx="35.5" cy="35.5" r="2.6" fill="#C8A75E" />
                      </g>
                      <text x="34" y="45" fill="#d4d4cf" fontSize="6" fontWeight="700" fontFamily="system-ui" letterSpacing="1" opacity="0.7">CONSENTHAUL</text>

                      <rect x="305" y="36" width="66" height="18" rx="9" fill="#1e2129" />
                      <rect x="307" y="38" width="30" height="14" rx="7" fill="#C8A75E" opacity="0.2" />
                      <text x="322" y="49" textAnchor="middle" fill="#C8A75E" fontSize="6" fontWeight="700" fontFamily="system-ui" opacity="0.8">EN</text>
                      <text x="354" y="49" textAnchor="middle" fill="#5c6370" fontSize="6" fontWeight="600" fontFamily="system-ui" opacity="0.4">ES</text>

                      <rect y="70" width="393" height="2" fill="#C8A75E" opacity="0.3" />

                      {/* Scrollable form content — clipped to the viewport below header */}
                      <clipPath id="formClip">
                        <rect x="0" y={FORM_CLIP_TOP} width="393" height={FORM_CLIP_BOTTOM - FORM_CLIP_TOP} />
                      </clipPath>

                      <g clipPath="url(#formClip)">
                        <g style={{ transform: `translateY(${-scrollY}px)` }}>
                          {/* White background for full scrollable content */}
                          <rect x="0" y={FORM_CLIP_TOP} width="393" height="1200" fill="white" />

                          <text x="197" y="104" textAnchor="middle" fill="#0c0f14" fontSize="9" fontWeight="800" fontFamily="system-ui" letterSpacing="1.5" opacity="0.55">FMCSA CLEARINGHOUSE</text>
                          <text x="197" y="120" textAnchor="middle" fill="#0c0f14" fontSize="7" fontWeight="700" fontFamily="system-ui" letterSpacing="1" opacity="0.4">LIMITED QUERY CONSENT</text>

                          <line x1="22" y1="136" x2="371" y2="136" stroke="#e8e8e3" strokeWidth="0.8" />

                          {/* Driver info fields */}
                          {[
                            { y: 158, label: 'Driver Name', value: 'Carlos Mendez' },
                            { y: 184, label: 'CDL Number', value: '28491037' },
                            { y: 210, label: 'CDL State', value: 'TX' },
                            { y: 236, label: 'Carrier', value: 'Acme Freight LLC' },
                            { y: 262, label: 'Consent Type', value: 'Limited Query' },
                          ].map((f, i) => (
                            <g key={i}>
                              {i % 2 === 1 && (
                                <rect x="22" y={f.y - 12} width="349" height="26" fill="#fafaf8" />
                              )}
                              <text x="22" y={f.y + 5} fill="#8b919a" fontSize="6.5" fontWeight="500" fontFamily="system-ui" opacity="0.6">{f.label}</text>
                              <text x="160" y={f.y + 5} fill="#0c0f14" fontSize="7" fontWeight="600" fontFamily="system-ui" opacity="0.75">{f.value}</text>
                            </g>
                          ))}

                          <line x1="22" y1="290" x2="371" y2="290" stroke="#e8e8e3" strokeWidth="0.8" />

                          {/* Consent Authorization heading */}
                          <text x="22" y="316" fill="#0c0f14" fontSize="6.5" fontWeight="700" fontFamily="system-ui" opacity="0.55">Consent Authorization</text>

                          {/* Long consent text — this is the content that requires scrolling */}
                          {[
                            { y: 340, text: 'I hereby authorize the above-named employer to' },
                            { y: 355, text: 'conduct a limited query of the FMCSA Commercial' },
                            { y: 370, text: "Driver's License Drug and Alcohol Clearinghouse" },
                            { y: 385, text: '(Clearinghouse) to determine whether drug or' },
                            { y: 400, text: 'alcohol violation information about me exists in' },
                            { y: 415, text: 'the Clearinghouse.' },
                            { y: 440, text: 'I understand that if the limited query indicates' },
                            { y: 455, text: 'that drug or alcohol violation information about' },
                            { y: 470, text: 'me exists in the Clearinghouse, FMCSA will not' },
                            { y: 485, text: 'disclose that information to the employer without' },
                            { y: 500, text: 'first obtaining additional specific consent from' },
                            { y: 515, text: 'me. 49 CFR Part 40.' },
                            { y: 540, text: 'I understand that if I refuse to provide consent' },
                            { y: 555, text: 'for the limited query, the employer must conduct' },
                            { y: 570, text: 'a full query per §382.701(b), which requires' },
                            { y: 585, text: 'separate electronic consent through the' },
                            { y: 600, text: 'Clearinghouse.' },
                            { y: 625, text: 'This consent is valid for the duration of my' },
                            { y: 640, text: 'employment with the above-named employer, or' },
                            { y: 655, text: 'until I revoke this consent in writing. I may' },
                            { y: 670, text: 'revoke this consent at any time by submitting a' },
                            { y: 685, text: 'written request to the employer.' },
                            { y: 710, text: 'I certify that all information provided herein is' },
                            { y: 725, text: 'true, accurate, and complete to the best of my' },
                            { y: 740, text: 'knowledge and belief.' },
                          ].map((line, i) => (
                            <text key={i} x="22" y={line.y} fill="#6b6f76" fontSize="6" fontFamily="system-ui" opacity="0.55">{line.text}</text>
                          ))}

                          <line x1="22" y1="765" x2="371" y2="765" stroke="#e8e8e3" strokeWidth="0.8" />

                          {/* ── Below the fold: checkbox, signature, submit ── */}
                          {/* These start at y=780, which is at viewport y=780-72=708 from the clip top. */}
                          {/* The visible clip height is 780-72=708. So at scroll=0, content at y=780+ is hidden. */}
                          {/* After scrolling 390px, y=780 appears at viewport position 780-390=390 from top of SVG, */}
                          {/* which is 390-72=318px into the visible area — comfortably visible. */}

                          <rect x="18" y="780" width="357" height="46" rx="7" fill="#0c0f14" opacity="0.02" />
                          <rect x="30" y="794" width="15" height="15" rx="3.5" fill="none" stroke={checkmark ? '#28c840' : '#0c0f14'} strokeWidth={checkmark ? 1.4 : 1} opacity={checkmark ? 0.7 : 0.3} />
                          {checkmark && (
                            <path d="M33.5 801.5 L36.5 804.5 L42 799" stroke="#28c840" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.8" />
                          )}
                          <text x="54" y="801" fill="#6b6f76" fontSize="5.5" fontFamily="system-ui" opacity="0.55">I have read and understand the above</text>
                          <text x="54" y="813" fill="#6b6f76" fontSize="5.5" fontFamily="system-ui" opacity="0.5">consent and agree to authorize this query.</text>

                          <text x="22" y="852" fill="#8b919a" fontSize="6" fontWeight="600" fontFamily="system-ui" opacity="0.5">Your Signature</text>
                          <rect x="22" y="862" width="349" height="78" rx="7" fill="#fafaf8" stroke="#e8e8e3" strokeDasharray="5 3" strokeWidth="0.5" />

                          {signatureProgress > 0 && (
                            <path
                              d="M58 908 C68 886, 86 888, 98 900 S118 918, 136 898 S156 876, 176 898 S198 910, 214 896 C226 884, 236 898, 256 892 S280 900, 310 888"
                              stroke="#0c0f14"
                              strokeWidth="1.6"
                              fill="none"
                              strokeLinecap="round"
                              opacity="0.5"
                              strokeDasharray="300"
                              strokeDashoffset={300 * (1 - signatureProgress)}
                            />
                          )}

                          {signatureProgress === 0 && phase !== 'checkbox' && (
                            <text x="197" y="906" textAnchor="middle" fill="#d4d4cf" fontSize="5.5" fontFamily="system-ui" opacity="0.5">Draw your signature here</text>
                          )}

                          <rect x="22" y="960" width="349" height="48" rx="10" fill={phase === 'submitting' ? '#C8A75E' : (signatureProgress >= 1 ? '#C8A75E' : '#e8e8e3')} opacity={phase === 'submitting' ? 1 : (signatureProgress >= 1 ? 0.9 : 0.5)} />
                          <text
                            x="197" y="989"
                            textAnchor="middle"
                            fill={signatureProgress >= 1 ? '#0c0f14' : '#8b919a'}
                            fontSize="7" fontWeight="800" fontFamily="system-ui" letterSpacing="1.2"
                          >
                            {phase === 'submitting' ? 'SUBMITTING...' : 'SUBMIT CONSENT'}
                          </text>

                          <text x="197" y="1034" textAnchor="middle" fill="#8b919a" fontSize="3.8" fontFamily="system-ui" opacity="0.3">ESIGN Act & UETA Compliant · 49 CFR §40</text>
                        </g>
                      </g>

                      {/* Scroll hint — only before scrolling starts */}
                      {phase === 'form' && (
                        <g opacity="0">
                          <animate attributeName="opacity" values="0;0.6;0" dur="1.5s" repeatCount="3" fill="freeze" />
                          <rect x="178" y="790" width="36" height="24" rx="12" fill="none" stroke="#8b919a" strokeWidth="1" opacity="0.4" />
                          <circle cx="197" cy="798" r="2.5" fill="#8b919a" opacity="0.4">
                            <animate attributeName="cy" values="796;806;796" dur="1.5s" repeatCount="indefinite" />
                          </circle>
                        </g>
                      )}

                      {/* Scroll progress bar on right edge */}
                      {(phase === 'scrolling' || phase === 'checkbox' || phase === 'signing' || phase === 'submitting') && (
                        <g>
                          <rect x="388" y={FORM_CLIP_TOP + 4} width="3" height={FORM_CLIP_BOTTOM - FORM_CLIP_TOP - 8} rx="1.5" fill="#0c0f14" opacity="0.06" />
                          <rect
                            x="388"
                            y={FORM_CLIP_TOP + 4 + (scrollY / MAX_SCROLL) * ((FORM_CLIP_BOTTOM - FORM_CLIP_TOP - 8) * 0.45)}
                            width="3"
                            height={(FORM_CLIP_BOTTOM - FORM_CLIP_TOP - 8) * 0.55}
                            rx="1.5"
                            fill="#0c0f14"
                            opacity="0.15"
                          />
                        </g>
                      )}
                    </g>
                  )}

                  {/* ── PHASE: SUCCESS + CONFETTI ── */}
                  {showSuccess && (
                    <g>
                      <rect y="24" width="393" height="46" fill="#0c0f14" />
                      {/* Real logo icon */}
                      <g transform="translate(16, 36) scale(0.25)">
                        <rect x="3" y="3" width="42" height="42" rx="9" stroke="#C8A75E" strokeWidth="2" fill="none" opacity="0.7" />
                        <path d="M32 11 H37 V16" stroke="#C8A75E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
                        <path d="M15.5 26.2 L20.8 31.0 L32.8 18.8" stroke="#C8A75E" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
                        <circle cx="35.5" cy="35.5" r="2.6" fill="#C8A75E" />
                      </g>
                      <text x="34" y="45" fill="#d4d4cf" fontSize="6" fontWeight="700" fontFamily="system-ui" letterSpacing="1" opacity="0.7">CONSENTHAUL</text>
                      <rect y="70" width="393" height="2" fill="#C8A75E" opacity="0.3" />

                      <rect y="72" width="393" height="780" fill="white" />

                      <circle cx="197" cy="340" r="60" fill="#28c840" opacity="0">
                        <animate attributeName="r" from="0" to="60" dur="0.5s" fill="freeze" />
                        <animate attributeName="opacity" from="0.12" to="0.04" dur="0.5s" fill="freeze" />
                      </circle>
                      <circle cx="197" cy="340" r="45" fill="#28c840" opacity="0">
                        <animate attributeName="r" values="0;48;45" keyTimes="0;0.7;1" dur="0.45s" fill="freeze" />
                        <animate attributeName="opacity" from="0.06" to="0.08" dur="0.45s" fill="freeze" />
                      </circle>
                      <circle cx="197" cy="340" r="34" fill="#28c840" opacity="0">
                        <animate attributeName="r" values="0;37;34" keyTimes="0;0.75;1" dur="0.4s" fill="freeze" />
                        <animate attributeName="opacity" from="0" to="0.14" dur="0.4s" fill="freeze" />
                      </circle>
                      <circle cx="197" cy="340" r="34" fill="none" stroke="#28c840" strokeWidth="1.2" opacity="0">
                        <animate attributeName="r" from="34" to="75" dur="1s" begin="0.3s" fill="freeze" />
                        <animate attributeName="opacity" from="0.3" to="0" dur="1s" begin="0.3s" fill="freeze" />
                      </circle>

                      <path
                        d="M179 340 L192 353 L216 326"
                        stroke="#28c840"
                        strokeWidth="5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        fill="none"
                        opacity="0.85"
                        strokeDasharray="60"
                        strokeDashoffset="60"
                      >
                        <animate attributeName="strokeDashoffset" from="60" to="0" dur="0.4s" begin="0.2s" fill="freeze" />
                        <animate attributeName="opacity" from="0" to="0.85" dur="0.1s" begin="0.2s" fill="freeze" />
                      </path>

                      <text x="197" y="415" textAnchor="middle" fill="#0c0f14" fontSize="14" fontWeight="800" fontFamily="system-ui" letterSpacing="0.5" opacity="0">
                        <animate attributeName="opacity" from="0" to="0.8" dur="0.3s" begin="0.3s" fill="freeze" />
                        Consent Signed
                      </text>
                      <text x="197" y="436" textAnchor="middle" fill="#8b919a" fontSize="6" fontFamily="system-ui" opacity="0">
                        <animate attributeName="opacity" from="0" to="0.5" dur="0.3s" begin="0.4s" fill="freeze" />
                        Your signed PDF is ready for download
                      </text>

                      <rect x="42" y="465" width="309" height="126" rx="10" fill="#fafaf8" stroke="#e8e8e3" strokeWidth="0.5" opacity="0">
                        <animate attributeName="opacity" from="0" to="1" dur="0.3s" begin="0.5s" fill="freeze" />
                      </rect>
                      <g opacity="0">
                        <animate attributeName="opacity" from="0" to="1" dur="0.3s" begin="0.5s" fill="freeze" />
                        <text x="60" y="492" fill="#8b919a" fontSize="4.5" fontFamily="system-ui" opacity="0.5">Driver</text>
                        <text x="150" y="492" fill="#0c0f14" fontSize="5.2" fontWeight="600" fontFamily="system-ui" opacity="0.65">Carlos Mendez</text>
                        <text x="60" y="510" fill="#8b919a" fontSize="4.5" fontFamily="system-ui" opacity="0.5">Type</text>
                        <text x="150" y="510" fill="#0c0f14" fontSize="5.2" fontWeight="600" fontFamily="system-ui" opacity="0.65">Limited Query</text>
                        <text x="60" y="528" fill="#8b919a" fontSize="4.5" fontFamily="system-ui" opacity="0.5">Signed</text>
                        <text x="150" y="528" fill="#0c0f14" fontSize="5.2" fontWeight="600" fontFamily="system-ui" opacity="0.65">Feb 24, 2026 at 9:41 AM</text>
                        <text x="60" y="546" fill="#8b919a" fontSize="4.5" fontFamily="system-ui" opacity="0.5">Consent ID</text>
                        <text x="150" y="546" fill="#0c0f14" fontSize="5.2" fontWeight="600" fontFamily="system-ui" opacity="0.65">e7d6c5b4-3a2f-...</text>
                        <text x="60" y="564" fill="#8b919a" fontSize="4.5" fontFamily="system-ui" opacity="0.5">Retention</text>
                        <text x="150" y="564" fill="#28c840" fontSize="5.2" fontWeight="600" fontFamily="system-ui" opacity="0.65">3 years (until Feb 2029)</text>
                      </g>

                      <rect x="42" y="612" width="309" height="48" rx="10" fill="#C8A75E" opacity="0">
                        <animate attributeName="opacity" from="0" to="0.9" dur="0.3s" begin="0.6s" fill="freeze" />
                      </rect>
                      <text x="197" y="641" textAnchor="middle" fill="#0c0f14" fontSize="6.5" fontWeight="800" fontFamily="system-ui" letterSpacing="1.2" opacity="0">
                        <animate attributeName="opacity" from="0" to="1" dur="0.3s" begin="0.6s" fill="freeze" />
                        DOWNLOAD SIGNED PDF
                      </text>

                      {confettiParticles.map(p => (
                        <g key={p.id} transform={`translate(${p.x}, ${p.y}) rotate(${p.rotation})`} opacity={p.opacity}>
                          {p.shape === 'rect' ? (
                            <rect x={-p.size / 2} y={-p.size / 4} width={p.size} height={p.size / 2} fill={p.color} rx="0.5" />
                          ) : p.shape === 'triangle' ? (
                            <polygon points={`0,${-p.size / 2} ${p.size / 2},${p.size / 2} ${-p.size / 2},${p.size / 2}`} fill={p.color} />
                          ) : (
                            <circle r={p.size / 2.5} fill={p.color} />
                          )}
                        </g>
                      ))}
                    </g>
                  )}

                  {/* ── FINGER CURSOR ── */}
                  {(() => {
                    const cur = getCursorPos(phase, scrollY, signatureProgress);
                    if (!cur.visible) return null;
                    const cx = cur.x;
                    const cy = cur.y;
                    return (
                      <g style={{ filter: 'blur(0.3px)' }}>
                        <circle cx={cx} cy={cy + 2} r="20" fill="#0c0f14" opacity="0.02" />
                        <circle cx={cx} cy={cy} r="18" fill="#0c0f14" opacity="0.03" />
                        {cur.tapping && (
                          <>
                            <circle cx={cx} cy={cy} r="7" fill="#C8A75E" opacity="0">
                              <animate attributeName="r" from="7" to="30" dur="0.6s" fill="freeze" />
                              <animate attributeName="opacity" from="0.25" to="0" dur="0.6s" fill="freeze" />
                            </circle>
                            <circle cx={cx} cy={cy} r="7" fill="none" stroke="#C8A75E" strokeWidth="0.6" opacity="0">
                              <animate attributeName="r" from="7" to="38" dur="0.8s" fill="freeze" />
                              <animate attributeName="opacity" from="0.2" to="0" dur="0.8s" fill="freeze" />
                            </circle>
                          </>
                        )}
                        <circle cx={cx} cy={cy} r="12" fill="#0c0f14" opacity="0.06" />
                        <circle cx={cx} cy={cy} r={cur.tapping ? 5 : 6} fill="#0c0f14" opacity="0.18">
                          {cur.tapping ? (
                            <animate attributeName="r" values="6;5;6" dur="0.3s" fill="freeze" />
                          ) : (
                            <>
                              <animate attributeName="r" values="6;6.5;6" dur="1s" repeatCount="indefinite" />
                              <animate attributeName="opacity" values="0.18;0.12;0.18" dur="1s" repeatCount="indefinite" />
                            </>
                          )}
                        </circle>
                      </g>
                    );
                  })()}

                  {/* Home indicator */}
                  <rect x="140" y="835" width="113" height="5" rx="2.5" fill="#0c0f14" opacity="0.15" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Step indicator below phone */}
        <div className="flex justify-center gap-2 mt-5">
          {(['sms', 'form', 'signing', 'confetti'] as const).map((step, i) => {
            const labels = ['SMS sent', 'Review form', 'Sign', 'Done'];
            const isActive =
              (step === 'sms' && phase === 'sms') ||
              (step === 'form' && (phase === 'loading' || phase === 'form' || phase === 'scrolling' || phase === 'checkbox')) ||
              (step === 'signing' && (phase === 'signing' || phase === 'submitting')) ||
              (step === 'confetti' && (phase === 'confetti' || phase === 'done'));
            const isPast =
              (step === 'sms' && phase !== 'sms') ||
              (step === 'form' && ['signing', 'submitting', 'confetti', 'done'].includes(phase)) ||
              (step === 'signing' && ['confetti', 'done'].includes(phase));
            return (
              <div key={step} className="flex items-center gap-1.5">
                <div className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${isActive ? 'bg-[#C8A75E] scale-125' : isPast ? 'bg-[#28c840]' : 'bg-[#d4d4cf]'}`} />
                <span className={`text-[0.6rem] font-medium transition-colors duration-300 ${isActive ? 'text-[#0c0f14]' : 'text-[#8b919a]'}`}>
                  {labels[i]}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
