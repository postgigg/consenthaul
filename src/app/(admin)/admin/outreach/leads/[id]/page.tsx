'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Sparkles, Mail, Phone, MapPin, Truck, Building2, Clock } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface Lead {
  id: string;
  company_name: string;
  dot_number: string | null;
  mc_number: string | null;
  phone: string | null;
  email: string | null;
  contact_name: string | null;
  contact_title: string | null;
  address_line1: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  fleet_size: number | null;
  driver_count: number | null;
  carrier_operation: string | null;
  operating_status: string | null;
  pipeline_stage: string;
  lead_score: number;
  lead_source: string | null;
  ai_summary: string | null;
  tags: string[];
  do_not_contact: boolean;
  last_contacted_at: string | null;
  created_at: string;
  events: Event[];
  enrollments: Enrollment[];
}

interface Event {
  id: string;
  event_type: string;
  ai_reply_classification: string | null;
  ai_reply_summary: string | null;
  details: Record<string, unknown>;
  created_at: string;
}

interface Enrollment {
  id: string;
  campaign_id: string;
  status: string;
  current_step: number;
  outreach_campaigns: { name: string; status: string } | null;
}

const STAGES = ['lead', 'contacted', 'replied', 'demo', 'trial', 'customer', 'lost'] as const;
const STAGE_COLORS: Record<string, string> = {
  lead: 'bg-gray-100 text-gray-700 border-gray-200',
  contacted: 'bg-blue-100 text-blue-700 border-blue-200',
  replied: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  demo: 'bg-purple-100 text-purple-700 border-purple-200',
  trial: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  customer: 'bg-green-100 text-green-700 border-green-200',
  lost: 'bg-red-100 text-red-700 border-red-200',
};

const EVENT_LABELS: Record<string, string> = {
  sent: 'Email Sent',
  delivered: 'Delivered',
  opened: 'Opened',
  clicked: 'Link Clicked',
  replied: 'Reply Received',
  bounced: 'Bounced',
  unsubscribed: 'Unsubscribed',
  complaint: 'Complaint',
};

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatingEmail, setGeneratingEmail] = useState(false);
  const [generatedEmail, setGeneratedEmail] = useState<{ subject: string; body: string } | null>(null);
  const [enriching, setEnriching] = useState(false);

  const fetchLead = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/outreach/leads/${params.id}`);
      const json = await res.json();
      setLead(json.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    fetchLead();
  }, [fetchLead]);

  const updateStage = async (stage: string) => {
    if (!lead) return;
    await fetch(`/api/admin/outreach/leads/${lead.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pipeline_stage: stage }),
    });
    setLead({ ...lead, pipeline_stage: stage });
  };

  const generateEmail = async () => {
    if (!lead) return;
    setGeneratingEmail(true);
    try {
      const res = await fetch(`/api/admin/outreach/leads/${lead.id}/generate-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step: 1, campaignGoal: 'Get them to sign up for a free trial' }),
      });
      const json = await res.json();
      setGeneratedEmail(json.data);
    } catch (err) {
      console.error(err);
    } finally {
      setGeneratingEmail(false);
    }
  };

  const enrichLead = async () => {
    if (!lead) return;
    setEnriching(true);
    try {
      await fetch('/api/admin/outreach/leads/enrich', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead_ids: [lead.id] }),
      });
      fetchLead();
    } catch (err) {
      console.error(err);
    } finally {
      setEnriching(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#C8A75E] border-t-transparent" />
      </div>
    );
  }

  if (!lead) {
    return <p className="text-center text-[#8b919a] py-12">Lead not found</p>;
  }

  return (
    <div className="space-y-6">
      {/* Back nav */}
      <button
        onClick={() => router.push('/admin/outreach/leads')}
        className="flex items-center gap-1 text-sm text-[#8b919a] hover:text-[#0c0f14] transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Leads
      </button>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#0c0f14]">{lead.company_name}</h1>
          <div className="flex items-center gap-3 mt-1 text-sm text-[#8b919a]">
            {lead.dot_number && <span>DOT# {lead.dot_number}</span>}
            {lead.mc_number && <span>{lead.mc_number}</span>}
            {lead.lead_source && <span className="capitalize">{lead.lead_source.replace('_', ' ')}</span>}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-2xl font-bold text-[#0c0f14] tabular-nums">{lead.lead_score}</div>
            <div className="text-xs text-[#8b919a]">AI Score</div>
          </div>
          <div
            className="h-12 w-12 rounded-full flex items-center justify-center text-lg font-bold"
            style={{
              backgroundColor:
                lead.lead_score >= 70 ? '#dcfce7' : lead.lead_score >= 40 ? '#fef3c7' : '#fee2e2',
              color:
                lead.lead_score >= 70 ? '#15803d' : lead.lead_score >= 40 ? '#92400e' : '#dc2626',
            }}
          >
            {lead.lead_score}
          </div>
        </div>
      </div>

      {/* AI Summary */}
      {lead.ai_summary && (
        <div className="flex items-start gap-2 p-3 bg-[#C8A75E]/5 border border-[#C8A75E]/20">
          <Sparkles className="h-4 w-4 text-[#C8A75E] mt-0.5 shrink-0" />
          <p className="text-sm text-[#0c0f14]">{lead.ai_summary}</p>
        </div>
      )}

      {/* Pipeline Stage Selector */}
      <div className="flex gap-1 flex-wrap">
        {STAGES.map((s) => (
          <button
            key={s}
            onClick={() => updateStage(s)}
            className={`px-3 py-1.5 text-xs font-medium border transition-colors capitalize ${
              lead.pipeline_stage === s
                ? STAGE_COLORS[s]
                : 'border-[#e8e8e3] text-[#8b919a] hover:bg-[#f0f0ec]'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* AI Email Generation */}
          <div className="border border-[#e8e8e3] bg-white p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-[#0c0f14] flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[#C8A75E]" />
                AI Email Writer
              </h3>
              <button
                onClick={generateEmail}
                disabled={generatingEmail}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-[#C8A75E] text-white hover:bg-[#b8974e] transition-colors disabled:opacity-50"
              >
                <Mail className="h-3.5 w-3.5" />
                {generatingEmail ? 'Generating...' : 'Generate Email'}
              </button>
            </div>
            {generatedEmail && (
              <div className="space-y-2">
                <div className="p-3 bg-[#fafaf8] border border-[#e8e8e3]">
                  <p className="text-xs text-[#8b919a] mb-1">Subject:</p>
                  <p className="text-sm font-medium text-[#0c0f14]">{generatedEmail.subject}</p>
                </div>
                <div className="p-3 bg-[#fafaf8] border border-[#e8e8e3]">
                  <p className="text-xs text-[#8b919a] mb-1">Body:</p>
                  <pre className="text-sm text-[#0c0f14] whitespace-pre-wrap font-sans">
                    {generatedEmail.body}
                  </pre>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => navigator.clipboard.writeText(`Subject: ${generatedEmail.subject}\n\n${generatedEmail.body}`)}
                    className="px-3 py-1.5 text-xs font-medium border border-[#e8e8e3] bg-white hover:bg-[#f0f0ec] transition-colors"
                  >
                    Copy to Clipboard
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Activity Timeline */}
          <div className="border border-[#e8e8e3] bg-white p-4">
            <h3 className="font-medium text-[#0c0f14] mb-3 flex items-center gap-2">
              <Clock className="h-4 w-4 text-[#8b919a]" />
              Activity Timeline
            </h3>
            {lead.events.length === 0 ? (
              <p className="text-sm text-[#8b919a]">No activity yet</p>
            ) : (
              <div className="space-y-3">
                {lead.events.map((event) => (
                  <div key={event.id} className="flex items-start gap-3 text-sm">
                    <div className="h-2 w-2 rounded-full bg-[#C8A75E] mt-1.5 shrink-0" />
                    <div className="flex-1">
                      <span className="font-medium text-[#0c0f14]">
                        {EVENT_LABELS[event.event_type] ?? event.event_type}
                      </span>
                      {event.ai_reply_classification && (
                        <span className="ml-2 px-1.5 py-0.5 text-xs bg-[#C8A75E]/10 text-[#C8A75E] rounded">
                          {event.ai_reply_classification}
                        </span>
                      )}
                      {event.ai_reply_summary && (
                        <p className="text-[#8b919a] mt-0.5">{event.ai_reply_summary}</p>
                      )}
                      <p className="text-xs text-[#8b919a]">{formatDate(event.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Campaigns Enrolled */}
          {lead.enrollments.length > 0 && (
            <div className="border border-[#e8e8e3] bg-white p-4">
              <h3 className="font-medium text-[#0c0f14] mb-3">Campaigns</h3>
              <div className="space-y-2">
                {lead.enrollments.map((e) => (
                  <div
                    key={e.id}
                    className="flex items-center justify-between p-2 bg-[#fafaf8] border border-[#e8e8e3]"
                  >
                    <span className="text-sm font-medium">
                      {e.outreach_campaigns?.name ?? 'Unknown'}
                    </span>
                    <span className="text-xs text-[#8b919a] capitalize">
                      Step {e.current_step} &middot; {e.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Info */}
        <div className="space-y-4">
          {/* Contact Info */}
          <div className="border border-[#e8e8e3] bg-white p-4 space-y-3">
            <h3 className="font-medium text-[#0c0f14]">Contact</h3>
            {lead.contact_name && (
              <div className="flex items-center gap-2 text-sm">
                <Building2 className="h-4 w-4 text-[#8b919a]" />
                <span>{lead.contact_name}</span>
                {lead.contact_title && (
                  <span className="text-[#8b919a]">({lead.contact_title})</span>
                )}
              </div>
            )}
            {lead.email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-[#8b919a]" />
                <a href={`mailto:${lead.email}`} className="text-blue-600 hover:underline">
                  {lead.email}
                </a>
              </div>
            )}
            {lead.phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-[#8b919a]" />
                <span>{lead.phone}</span>
              </div>
            )}
            {(lead.city || lead.state) && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-[#8b919a]" />
                <span>
                  {[lead.city, lead.state, lead.zip].filter(Boolean).join(', ')}
                </span>
              </div>
            )}
          </div>

          {/* Fleet Info */}
          <div className="border border-[#e8e8e3] bg-white p-4 space-y-3">
            <h3 className="font-medium text-[#0c0f14] flex items-center gap-2">
              <Truck className="h-4 w-4 text-[#8b919a]" />
              Fleet Details
            </h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-[#8b919a]">Fleet Size</p>
                <p className="font-medium">{lead.fleet_size ?? '---'}</p>
              </div>
              <div>
                <p className="text-[#8b919a]">Drivers</p>
                <p className="font-medium">{lead.driver_count ?? '---'}</p>
              </div>
              <div>
                <p className="text-[#8b919a]">Operation</p>
                <p className="font-medium capitalize">{lead.carrier_operation ?? '---'}</p>
              </div>
              <div>
                <p className="text-[#8b919a]">Status</p>
                <p className="font-medium">{lead.operating_status ?? '---'}</p>
              </div>
            </div>
          </div>

          {/* Enrich Button */}
          <button
            onClick={enrichLead}
            disabled={enriching}
            className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium bg-[#C8A75E] text-white hover:bg-[#b8974e] transition-colors disabled:opacity-50"
          >
            <Sparkles className="h-4 w-4" />
            {enriching ? 'Enriching...' : 'Enrich with FMCSA + AI'}
          </button>

          {/* Tags */}
          <div className="border border-[#e8e8e3] bg-white p-4">
            <h3 className="font-medium text-[#0c0f14] mb-2">Tags</h3>
            <div className="flex flex-wrap gap-1">
              {lead.tags.length > 0 ? (
                lead.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 text-xs bg-[#f0f0ec] text-[#5c6370] border border-[#e8e8e3]"
                  >
                    {tag}
                  </span>
                ))
              ) : (
                <p className="text-sm text-[#8b919a]">No tags</p>
              )}
            </div>
          </div>

          {/* Meta */}
          <div className="text-xs text-[#8b919a] space-y-1">
            <p>Created: {formatDate(lead.created_at)}</p>
            <p>Last Contact: {lead.last_contacted_at ? formatDate(lead.last_contacted_at) : 'Never'}</p>
            {lead.do_not_contact && (
              <p className="text-red-600 font-medium">Do Not Contact</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
