'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

// ---------------------------------------------------------------------------
// Types & data
// ---------------------------------------------------------------------------

interface Step {
  command: string;
  response: string;
  label: string;
}

const DRIVER_ID = 'b3f1a2c4-8d7e-4f6a-9c5b-1e2d3f4a5b6c';
const CONSENT_ID = 'e7d6c5b4-3a2f-4e1d-8b9c-0f1e2d3c4b5a';

const STEPS: Step[] = [
  {
    command: `curl -X POST https://app.consenthaul.com/api/v1/drivers \\
  -H "Authorization: Bearer ch_a1b2c3..." \\
  -H "Content-Type: application/json" \\
  -d '{"first_name":"Carlos","last_name":"Mendez","cdl_number":"28491037","cdl_state":"TX","phone":"+15125550147"}'`,
    response: `{
  "data": {
    "id": "${DRIVER_ID}",
    "first_name": "Carlos",
    "last_name": "Mendez",
    "cdl_number": "28491037",
    "cdl_state": "TX",
    "phone": "+15125550147",
    "preferred_language": "en",
    "is_active": true,
    "created_at": "2025-01-15T09:22:11Z"
  }
}`,
    label: 'Driver created',
  },
  {
    command: `curl -X POST https://app.consenthaul.com/api/v1/consents \\
  -H "Authorization: Bearer ch_a1b2c3..." \\
  -H "Content-Type: application/json" \\
  -d '{"driver_id":"${DRIVER_ID}","consent_type":"limited_query","delivery_method":"sms"}'`,
    response: `{
  "data": {
    "id": "${CONSENT_ID}",
    "driver_id": "${DRIVER_ID}",
    "consent_type": "limited_query",
    "status": "sent",
    "delivery_method": "sms",
    "signing_url": "https://app.consenthaul.com/sign/abc123",
    "created_at": "2025-01-15T09:22:45Z"
  }
}`,
    label: 'Consent sent via SMS',
  },
  {
    command: `curl "https://app.consenthaul.com/api/v1/consents?status=signed" \\
  -H "Authorization: Bearer ch_a1b2c3..."`,
    response: `{
  "data": [{
    "id": "${CONSENT_ID}",
    "driver_id": "${DRIVER_ID}",
    "consent_type": "limited_query",
    "status": "signed",
    "delivery_method": "sms",
    "signed_at": "2025-01-15T14:32:00Z"
  }],
  "pagination": {
    "page": 1,
    "per_page": 25,
    "total": 1,
    "total_pages": 1
  }
}`,
    label: '1 signed consent found',
  },
  {
    command: `curl "https://app.consenthaul.com/api/v1/consents/${CONSENT_ID}/pdf" \\
  -H "Authorization: Bearer ch_a1b2c3..."`,
    response: `HTTP/1.1 302 Found
Location: https://...supabase.co/storage/v1/.../consent.pdf
  (Signed URL — expires in 60 seconds)`,
    label: 'Signed PDF ready for download',
  },
];

const CHAR_DELAY = 20;
const RESPONSE_DELAY = 400;
const LABEL_DELAY = 600;
const STEP_GAP = 800;
const LOOP_PAUSE = 3000;

// ---------------------------------------------------------------------------
// Syntax highlighting for JSON
// ---------------------------------------------------------------------------

function highlightJson(json: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  const fullText = json;

  // Match keys, string values, numbers, booleans, null
  const tokens =
    /("[\w_]+")\s*:|"([^"]*)"|(true|false|null)|(\d+)/g;
  lastIndex = 0;

  while ((match = tokens.exec(fullText)) !== null) {
    // Text before this match
    if (match.index > lastIndex) {
      parts.push(
        <span key={`t-${lastIndex}`}>
          {fullText.slice(lastIndex, match.index)}
        </span>
      );
    }

    if (match[1]) {
      // Key
      parts.push(
        <span key={`k-${match.index}`} className="text-[#C8A75E]">
          {match[1]}
        </span>
      );
      parts.push(
        <span key={`c-${match.index}`}>:</span>
      );
    } else if (match[2] !== undefined) {
      // String value
      parts.push(
        <span key={`s-${match.index}`} className="text-[#6ec96e]">
          &quot;{match[2]}&quot;
        </span>
      );
    } else if (match[3]) {
      // Boolean / null
      parts.push(
        <span key={`b-${match.index}`} className="text-[#64aaed]">
          {match[3]}
        </span>
      );
    } else if (match[4]) {
      // Number
      parts.push(
        <span key={`n-${match.index}`} className="text-[#64aaed]">
          {match[4]}
        </span>
      );
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < fullText.length) {
    parts.push(
      <span key={`e-${lastIndex}`}>{fullText.slice(lastIndex)}</span>
    );
  }

  return parts;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ApiWorkflowDemo() {
  const [isVisible, setIsVisible] = useState(false);
  const [activeStep, setActiveStep] = useState(-1);
  const [typedCommand, setTypedCommand] = useState('');
  const [showResponse, setShowResponse] = useState(false);
  const [showLabel, setShowLabel] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const prefersReducedMotion = useRef(false);

  // Check reduced motion
  useEffect(() => {
    prefersReducedMotion.current = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;
  }, []);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [typedCommand, showResponse, showLabel, activeStep]);

  // Cleanup timeouts
  const clearAllTimeouts = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
  }, []);

  useEffect(() => {
    return () => clearAllTimeouts();
  }, [clearAllTimeouts]);

  // IntersectionObserver
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isVisible) {
          setIsVisible(true);
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [isVisible]);

  // Run animation
  const runDemo = useCallback(() => {
    clearAllTimeouts();
    setIsRunning(true);
    setCompletedSteps([]);
    setActiveStep(-1);
    setTypedCommand('');
    setShowResponse(false);
    setShowLabel(false);

    if (prefersReducedMotion.current) {
      // Show everything immediately
      setActiveStep(STEPS.length - 1);
      setCompletedSteps(STEPS.map((_, i) => i));
      setTypedCommand(STEPS[STEPS.length - 1].command);
      setShowResponse(true);
      setShowLabel(true);
      setIsRunning(false);
      return;
    }

    let totalDelay = 0;

    STEPS.forEach((step, stepIndex) => {
      // Start step
      const startDelay = totalDelay;
      const t1 = setTimeout(() => {
        setActiveStep(stepIndex);
        setTypedCommand('');
        setShowResponse(false);
        setShowLabel(false);
      }, startDelay);
      timeoutsRef.current.push(t1);

      // Type command char by char
      for (let i = 0; i < step.command.length; i++) {
        const charDelay = startDelay + (i + 1) * CHAR_DELAY;
        const t = setTimeout(() => {
          setTypedCommand(step.command.slice(0, i + 1));
        }, charDelay);
        timeoutsRef.current.push(t);
      }

      const afterTyping =
        startDelay + step.command.length * CHAR_DELAY;

      // Show response
      const t2 = setTimeout(() => {
        setShowResponse(true);
      }, afterTyping + RESPONSE_DELAY);
      timeoutsRef.current.push(t2);

      // Show label
      const t3 = setTimeout(() => {
        setShowLabel(true);
        setCompletedSteps((prev) => [...prev, stepIndex]);
      }, afterTyping + RESPONSE_DELAY + LABEL_DELAY);
      timeoutsRef.current.push(t3);

      totalDelay =
        afterTyping + RESPONSE_DELAY + LABEL_DELAY + STEP_GAP;
    });

    // Loop
    const loopT = setTimeout(() => {
      setIsRunning(false);
      const restartT = setTimeout(() => {
        runDemo();
      }, LOOP_PAUSE);
      timeoutsRef.current.push(restartT);
    }, totalDelay);
    timeoutsRef.current.push(loopT);
  }, [clearAllTimeouts]);

  // Start on visible
  useEffect(() => {
    if (isVisible && !isRunning && activeStep === -1) {
      runDemo();
    }
  }, [isVisible, isRunning, activeStep, runDemo]);

  const handleReplay = () => {
    clearAllTimeouts();
    runDemo();
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div ref={containerRef} className="max-w-3xl mx-auto">
      {/* Terminal window */}
      <div className="rounded-lg overflow-hidden border border-[#2a2e38] shadow-2xl">
        {/* Title bar */}
        <div className="bg-[#1a1e27] flex items-center gap-2 px-4 py-3">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
            <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
            <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
          </div>
          <span className="ml-3 text-xs text-[#6b6f76] font-mono">
            consenthaul-api
          </span>
        </div>

        {/* Terminal body */}
        <div
          ref={scrollRef}
          className="bg-[#0c0f14] p-4 sm:p-6 min-h-[340px] max-h-[440px] overflow-y-auto font-mono text-xs sm:text-sm leading-relaxed"
        >
          {STEPS.map((step, i) => {
            if (i > activeStep) return null;

            const isCurrent = i === activeStep;
            const cmdText = isCurrent ? typedCommand : step.command;
            const showResp = isCurrent ? showResponse : true;
            const showLbl = isCurrent ? showLabel : true;

            return (
              <div key={i} className={i > 0 ? 'mt-5' : ''}>
                {/* Prompt + command */}
                <div className="flex">
                  <span className="text-[#6ec96e] shrink-0 select-none">
                    ${' '}
                  </span>
                  <span className="text-[#e2e4e9] whitespace-pre-wrap break-all">
                    {cmdText}
                    {isCurrent && !showResp && (
                      <span className="terminal-cursor" />
                    )}
                  </span>
                </div>

                {/* Response */}
                {showResp && (
                  <div className="mt-2 text-[#a0a4ad] whitespace-pre-wrap animate-fade-in">
                    {highlightJson(step.response)}
                  </div>
                )}

                {/* Label */}
                {showLbl && (
                  <div className="mt-2 flex items-center gap-2 animate-fade-in">
                    <span className="inline-flex items-center gap-1 text-[#27c93f] text-xs font-semibold">
                      <svg
                        className="w-3.5 h-3.5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M5 13l4 4L19 7" />
                      </svg>
                      {step.label}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="mt-4 flex items-center justify-between">
        {/* Step dots */}
        <div className="flex items-center gap-2">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                completedSteps.includes(i)
                  ? 'bg-[#27c93f]'
                  : i === activeStep
                    ? 'bg-[#C8A75E]'
                    : 'bg-[#3a3f49]'
              }`}
            />
          ))}
        </div>

        {/* Replay */}
        <button
          type="button"
          onClick={handleReplay}
          className="flex items-center gap-1.5 text-xs font-semibold text-[#8b919a] hover:text-white transition-colors"
        >
          <svg
            className="w-3.5 h-3.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M1 4v6h6M23 20v-6h-6" />
            <path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15" />
          </svg>
          Replay
        </button>
      </div>
    </div>
  );
}
