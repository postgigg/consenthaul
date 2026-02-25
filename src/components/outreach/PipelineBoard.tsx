'use client';

import { useState, useRef } from 'react';

interface Lead {
  id: string;
  company_name: string;
  fleet_size: number | null;
  lead_score: number;
  last_contacted_at: string | null;
  pipeline_stage: string;
}

interface PipelineBoardProps {
  leads: Lead[];
  onStageChange: (leadId: string, newStage: string) => void;
}

const STAGES = [
  { key: 'lead', label: 'Lead', color: '#6b7280' },
  { key: 'contacted', label: 'Contacted', color: '#3b82f6' },
  { key: 'replied', label: 'Replied', color: '#eab308' },
  { key: 'demo', label: 'Demo', color: '#8b5cf6' },
  { key: 'trial', label: 'Trial', color: '#6366f1' },
  { key: 'customer', label: 'Customer', color: '#22c55e' },
  { key: 'lost', label: 'Lost', color: '#ef4444' },
];

export function PipelineBoard({ leads, onStageChange }: PipelineBoardProps) {
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const dragRef = useRef<HTMLDivElement | null>(null);

  const grouped = STAGES.reduce<Record<string, Lead[]>>((acc, s) => {
    acc[s.key] = leads.filter((l) => l.pipeline_stage === s.key);
    return acc;
  }, {});

  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    setDraggedId(leadId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', leadId);
  };

  const handleDragOver = (e: React.DragEvent, stage: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDropTarget(stage);
  };

  const handleDrop = (e: React.DragEvent, stage: string) => {
    e.preventDefault();
    const leadId = e.dataTransfer.getData('text/plain');
    if (leadId) {
      onStageChange(leadId, stage);
    }
    setDraggedId(null);
    setDropTarget(null);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDropTarget(null);
  };

  return (
    <div className="grid grid-cols-7 gap-3 min-h-[500px]" ref={dragRef}>
      {STAGES.map((stage) => (
        <div
          key={stage.key}
          onDragOver={(e) => handleDragOver(e, stage.key)}
          onDragLeave={() => setDropTarget(null)}
          onDrop={(e) => handleDrop(e, stage.key)}
          className={`flex flex-col rounded border transition-colors ${
            dropTarget === stage.key
              ? 'border-[#C8A75E] bg-[#C8A75E]/5'
              : 'border-[#e8e8e3] bg-[#fafaf8]'
          }`}
        >
          {/* Column header */}
          <div className="p-2 border-b border-[#e8e8e3] flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <div
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: stage.color }}
              />
              <span className="text-xs font-medium text-[#0c0f14]">{stage.label}</span>
            </div>
            <span className="text-xs text-[#8b919a] tabular-nums">
              {grouped[stage.key]?.length ?? 0}
            </span>
          </div>

          {/* Cards */}
          <div className="flex-1 p-1.5 space-y-1.5 overflow-y-auto">
            {(grouped[stage.key] ?? []).map((lead) => (
              <div
                key={lead.id}
                draggable
                onDragStart={(e) => handleDragStart(e, lead.id)}
                onDragEnd={handleDragEnd}
                className={`p-2 bg-white border border-[#e8e8e3] cursor-grab active:cursor-grabbing transition-opacity hover:shadow-sm ${
                  draggedId === lead.id ? 'opacity-50' : ''
                }`}
              >
                <p className="text-xs font-medium text-[#0c0f14] truncate">
                  {lead.company_name}
                </p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[10px] text-[#8b919a]">
                    {lead.fleet_size ? `${lead.fleet_size} trucks` : '---'}
                  </span>
                  <div className="flex items-center gap-1">
                    <div className="h-1 w-8 bg-[#e8e8e3] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${lead.lead_score}%`,
                          backgroundColor:
                            lead.lead_score >= 70
                              ? '#22c55e'
                              : lead.lead_score >= 40
                                ? '#C8A75E'
                                : '#ef4444',
                        }}
                      />
                    </div>
                    <span className="text-[10px] text-[#8b919a] tabular-nums">
                      {lead.lead_score}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
