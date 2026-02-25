'use client';

import { useState, useEffect } from 'react';

const LINES = [
  { type: 'comment', text: '# Create driver' },
  { type: 'cmd', text: 'curl', rest: ' -X POST /api/v1/drivers \\' },
  { type: 'arg', text: '  -d ', str: '\'{"name":"John Doe",' },
  { type: 'str', text: '    "cdl":"D1234567"}\'' },
  { type: 'blank', text: '' },
  { type: 'comment', text: '# Send consent' },
  { type: 'cmd', text: 'curl', rest: ' -X POST /api/v1/consents \\' },
  { type: 'arg', text: '  -d ', str: '\'{"driver_id":"...",' },
  { type: 'str', text: '    "method":"sms"}\'' },
  { type: 'blank', text: '' },
  { type: 'comment', text: '# Check status' },
  { type: 'cmd', text: 'curl', rest: ' GET /api/v1/consents' },
  { type: 'blank', text: '' },
  { type: 'comment', text: '# Download PDF' },
  { type: 'cmd', text: 'curl', rest: ' GET /api/v1/consents/{id}' },
];

function renderLine(line: (typeof LINES)[number]) {
  switch (line.type) {
    case 'comment':
      return <span className="text-[#5c6370]">{line.text}</span>;
    case 'cmd':
      return (
        <>
          <span className="text-[#C8A75E]">{line.text}</span>
          <span className="text-[#8b919a]">{line.rest}</span>
        </>
      );
    case 'arg':
      return (
        <>
          <span className="text-[#8b919a]">{line.text}</span>
          <span className="text-[#98c379]">{line.str}</span>
        </>
      );
    case 'str':
      return <span className="text-[#98c379]">{line.text}</span>;
    case 'blank':
      return null;
    default:
      return <span className="text-[#8b919a]">{line.text}</span>;
  }
}

export function TerminalTyping() {
  const [visibleLines, setVisibleLines] = useState(0);

  useEffect(() => {
    if (visibleLines >= LINES.length) return;

    const line = LINES[visibleLines];
    const delay = line.type === 'blank' ? 80 : line.type === 'comment' ? 400 : 180;

    const timer = setTimeout(() => {
      setVisibleLines((v) => v + 1);
    }, delay);

    return () => clearTimeout(timer);
  }, [visibleLines]);

  return (
    <div className="bg-[#0c0f14] p-6 w-[340px] border border-[#1e2129]">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
        <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
        <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
        <span className="ml-2 text-[0.6rem] text-[#5c6370] font-mono">integrate.sh</span>
      </div>
      <pre className="text-[0.7rem] leading-relaxed font-mono overflow-x-auto">
        <code>
          {LINES.slice(0, visibleLines).map((line, i) => (
            <span key={i} className="animate-fade-in block" style={{ minHeight: line.type === 'blank' ? '0.7rem' : undefined }}>
              {renderLine(line)}
            </span>
          ))}
          <span className="terminal-cursor" />
        </code>
      </pre>
    </div>
  );
}
