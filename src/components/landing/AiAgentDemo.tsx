'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

// ---------------------------------------------------------------------------
// Types & data
// ---------------------------------------------------------------------------

interface Message {
  role: 'user' | 'assistant';
  tool?: string;
  text: string;
}

const MESSAGES: Message[] = [
  {
    role: 'user',
    text: 'Add Carlos Mendez as a new driver. CDL number 28491037, state TX, phone +1-512-555-0147.',
  },
  {
    role: 'assistant',
    tool: 'create_driver',
    text: 'Done — I created driver Carlos Mendez with CDL 28491037 (TX). Would you like to send him a consent?',
  },
  {
    role: 'user',
    text: 'Yes, send a limited query consent via SMS.',
  },
  {
    role: 'assistant',
    tool: 'create_consent',
    text: 'Sent! Carlos will receive an SMS with a signing link. 1 credit used — 46 remaining.',
  },
  {
    role: 'user',
    text: 'Check if any consents were signed today.',
  },
  {
    role: 'assistant',
    tool: 'list_consents',
    text: 'Carlos Mendez signed his limited query consent at 2:32 PM. The signed PDF is ready to download.',
  },
  {
    role: 'user',
    text: 'Get the signed PDF.',
  },
  {
    role: 'assistant',
    tool: 'get_consent_pdf_url',
    text: "Here's the signed PDF link (expires in 60 seconds). Consent is fully complete.",
  },
];

const TYPING_DOTS_DURATION = 800;
const TOOL_PILL_DURATION = 600;
const CHAR_DELAY = 18;
const MESSAGE_GAP = 500;
const LOOP_PAUSE = 4000;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AiAgentDemo() {
  const [isVisible, setIsVisible] = useState(false);
  const [visibleMessages, setVisibleMessages] = useState<number>(0);
  const [typingPhase, setTypingPhase] = useState<
    'idle' | 'dots' | 'tool' | 'typing'
  >('idle');
  const [typedText, setTypedText] = useState('');
  const [completedCount, setCompletedCount] = useState(0);
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
  }, [visibleMessages, typedText, typingPhase]);

  // Cleanup
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
    setVisibleMessages(0);
    setTypingPhase('idle');
    setTypedText('');
    setCompletedCount(0);

    if (prefersReducedMotion.current) {
      setVisibleMessages(MESSAGES.length);
      setCompletedCount(MESSAGES.length);
      setIsRunning(false);
      return;
    }

    let totalDelay = 300;

    MESSAGES.forEach((msg, i) => {
      if (msg.role === 'user') {
        // User messages appear instantly
        const t = setTimeout(() => {
          setVisibleMessages(i + 1);
          setCompletedCount(i + 1);
          setTypingPhase('idle');
          setTypedText('');
        }, totalDelay);
        timeoutsRef.current.push(t);
        totalDelay += MESSAGE_GAP;
      } else {
        // Assistant: dots → tool pill → type text
        // Show typing dots
        const t1 = setTimeout(() => {
          setVisibleMessages(i); // Don't show message content yet
          setTypingPhase('dots');
        }, totalDelay);
        timeoutsRef.current.push(t1);
        totalDelay += TYPING_DOTS_DURATION;

        // Show tool pill
        if (msg.tool) {
          const t2 = setTimeout(() => {
            setTypingPhase('tool');
            setVisibleMessages(i + 1); // Now show the message (will show tool pill)
            setTypedText('');
          }, totalDelay);
          timeoutsRef.current.push(t2);
          totalDelay += TOOL_PILL_DURATION;
        }

        // Type text char by char
        const textStartDelay = totalDelay;
        const t3 = setTimeout(() => {
          setTypingPhase('typing');
          setVisibleMessages(i + 1);
        }, textStartDelay);
        timeoutsRef.current.push(t3);

        for (let c = 0; c < msg.text.length; c++) {
          const charT = setTimeout(() => {
            setTypedText(msg.text.slice(0, c + 1));
          }, textStartDelay + (c + 1) * CHAR_DELAY);
          timeoutsRef.current.push(charT);
        }

        totalDelay =
          textStartDelay + msg.text.length * CHAR_DELAY + MESSAGE_GAP;

        // Mark complete
        const t4 = setTimeout(() => {
          setCompletedCount(i + 1);
          setTypingPhase('idle');
        }, totalDelay - MESSAGE_GAP + 100);
        timeoutsRef.current.push(t4);
      }
    });

    // Loop
    const loopT = setTimeout(() => {
      setIsRunning(false);
      const restartT = setTimeout(() => {
        runDemo();
      }, LOOP_PAUSE);
      timeoutsRef.current.push(restartT);
    }, totalDelay + 500);
    timeoutsRef.current.push(loopT);
  }, [clearAllTimeouts]);

  // Start on visible
  useEffect(() => {
    if (isVisible && !isRunning && visibleMessages === 0) {
      runDemo();
    }
  }, [isVisible, isRunning, visibleMessages, runDemo]);

  const handleReplay = () => {
    clearAllTimeouts();
    runDemo();
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div ref={containerRef} className="max-w-2xl mx-auto">
      {/* Chat window */}
      <div className="rounded-lg overflow-hidden border border-[#e8e8e3] shadow-lg bg-white">
        {/* Header */}
        <div className="bg-white border-b border-[#e8e8e3] flex items-center gap-3 px-4 py-3">
          <div className="w-8 h-8 rounded-full bg-[#0c0f14] flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 text-[#C8A75E]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a4 4 0 0 0-4 4v2H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V10a2 2 0 0 0-2-2h-2V6a4 4 0 0 0-4-4z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-bold text-[#0c0f14]">
              Claude + ConsentHaul MCP
            </p>
            <p className="text-[0.65rem] text-[#8b919a]">
              AI-powered compliance workflow
            </p>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-[#27c93f]" />
            <span className="text-[0.65rem] text-[#8b919a]">Connected</span>
          </div>
        </div>

        {/* Messages */}
        <div
          ref={scrollRef}
          className="p-4 sm:p-6 min-h-[360px] max-h-[480px] overflow-y-auto space-y-4 bg-[#fafaf8]"
        >
          {MESSAGES.map((msg, i) => {
            if (i >= visibleMessages) return null;

            const isCurrentAssistant =
              msg.role === 'assistant' && i === visibleMessages - 1 && completedCount <= i;
            const displayText = isCurrentAssistant
              ? typedText
              : msg.text;

            if (msg.role === 'user') {
              return (
                <div
                  key={i}
                  className="flex justify-end slide-in-right"
                >
                  <div className="max-w-[85%] sm:max-w-[75%] bg-[#0c0f14] text-white px-4 py-3 rounded-2xl rounded-br-md">
                    <p className="text-sm leading-relaxed">{msg.text}</p>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={i}
                className="flex justify-start slide-in-left"
              >
                <div className="max-w-[85%] sm:max-w-[75%]">
                  {/* Tool call pill */}
                  {msg.tool && (
                    <div className="mb-1.5">
                      <span className="inline-flex items-center gap-1 text-[0.65rem] font-mono font-semibold text-[#6b6f76] bg-[#f0f0ed] border border-[#e8e8e3] px-2 py-0.5 rounded-full">
                        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="3" />
                          <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
                        </svg>
                        {msg.tool}
                      </span>
                    </div>
                  )}
                  {/* Message bubble */}
                  <div className="bg-white border border-[#e8e8e3] px-4 py-3 rounded-2xl rounded-bl-md">
                    <p className="text-sm leading-relaxed text-[#3a3f49]">
                      {displayText}
                      {isCurrentAssistant &&
                        typingPhase === 'typing' &&
                        typedText.length < msg.text.length && (
                          <span className="terminal-cursor inline-block w-0.5 h-4 bg-[#3a3f49] ml-0.5 align-text-bottom" />
                        )}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Typing dots (shown before assistant message appears) */}
          {typingPhase === 'dots' && (
            <div className="flex justify-start">
              <div className="bg-white border border-[#e8e8e3] px-4 py-3 rounded-2xl rounded-bl-md">
                <div className="flex items-center gap-1">
                  <span className="typing-dot w-2 h-2 rounded-full bg-[#8b919a]" style={{ animationDelay: '0ms' }} />
                  <span className="typing-dot w-2 h-2 rounded-full bg-[#8b919a]" style={{ animationDelay: '200ms' }} />
                  <span className="typing-dot w-2 h-2 rounded-full bg-[#8b919a]" style={{ animationDelay: '400ms' }} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="mt-4 flex items-center justify-between">
        {/* Step dots */}
        <div className="flex items-center gap-2">
          {MESSAGES.map((_, i) => (
            <div
              key={i}
              className={`w-1.5 h-1.5 rounded-full transition-colors duration-300 ${
                i < completedCount
                  ? 'bg-[#27c93f]'
                  : i < visibleMessages
                    ? 'bg-[#C8A75E]'
                    : 'bg-[#d4d4cf]'
              }`}
            />
          ))}
        </div>

        {/* Replay */}
        <button
          type="button"
          onClick={handleReplay}
          className="flex items-center gap-1.5 text-xs font-semibold text-[#8b919a] hover:text-[#0c0f14] transition-colors"
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
