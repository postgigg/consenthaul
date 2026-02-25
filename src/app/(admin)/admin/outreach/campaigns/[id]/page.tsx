'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { StatCard } from '@/components/admin/StatCard';
import {
  ArrowLeft, Users, Send, Eye, MessageSquare, Plus, Trash2, Sparkles,
  Play, Pause, CheckCircle2,
} from 'lucide-react';

interface Step {
  id: string;
  step_order: number;
  delay_days: number;
  subject: string | null;
  body_html: string | null;
  body_text: string | null;
  use_ai_generation: boolean;
  ai_prompt: string | null;
}

interface Enrollment {
  id: string;
  lead_id: string;
  status: string;
  current_step: number;
  outreach_leads: { company_name: string; email: string | null; pipeline_stage: string } | null;
}

interface Campaign {
  id: string;
  name: string;
  description: string | null;
  status: string;
  target_filters: Record<string, unknown>;
  send_settings: Record<string, unknown>;
  stats_sent: number;
  stats_opened: number;
  stats_clicked: number;
  stats_replied: number;
  stats_bounced: number;
  enrolled_count: number;
  steps: Step[];
  enrollments: Enrollment[];
}

export default function CampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddStep, setShowAddStep] = useState(false);
  const [newStepSubject, setNewStepSubject] = useState('');
  const [newStepBody, setNewStepBody] = useState('');
  const [newStepDelay, setNewStepDelay] = useState('3');
  const [useAI, setUseAI] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchCampaign = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/outreach/campaigns/${params.id}`);
      const json = await res.json();
      setCampaign(json.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    fetchCampaign();
  }, [fetchCampaign]);

  const updateStatus = async (status: string) => {
    await fetch(`/api/admin/outreach/campaigns/${params.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    fetchCampaign();
  };

  const addStep = async () => {
    if (!newStepSubject && !useAI) return;
    setSaving(true);
    try {
      const stepOrder = (campaign?.steps.length ?? 0) + 1;
      await fetch(`/api/admin/outreach/campaigns/${params.id}/steps`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step_order: stepOrder,
          delay_days: parseInt(newStepDelay, 10) || 0,
          subject: newStepSubject || null,
          body_text: newStepBody || null,
          body_html: newStepBody ? `<p>${newStepBody.replace(/\n/g, '</p><p>')}</p>` : null,
          use_ai_generation: useAI,
          ai_prompt: useAI ? aiPrompt : null,
        }),
      });
      setShowAddStep(false);
      setNewStepSubject('');
      setNewStepBody('');
      setNewStepDelay('3');
      setUseAI(false);
      setAiPrompt('');
      fetchCampaign();
    } finally {
      setSaving(false);
    }
  };

  const deleteStep = async (stepId: string) => {
    await fetch(`/api/admin/outreach/campaigns/${params.id}/steps?stepId=${stepId}`, {
      method: 'DELETE',
    });
    fetchCampaign();
  };

  const generateStepContent = async () => {
    if (!aiPrompt) return;
    setGenerating(true);
    try {
      const res = await fetch(`/api/admin/outreach/campaigns/${params.id}/generate-step`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step_number: (campaign?.steps.length ?? 0) + 1,
          ai_prompt: aiPrompt,
        }),
      });
      const json = await res.json();
      if (json.data) {
        setNewStepSubject(json.data.subject ?? '');
        setNewStepBody(json.data.body_text ?? '');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#C8A75E] border-t-transparent" />
      </div>
    );
  }

  if (!campaign) {
    return <p className="text-center text-[#8b919a] py-12">Campaign not found</p>;
  }

  const openRate = campaign.stats_sent > 0 ? Math.round((campaign.stats_opened / campaign.stats_sent) * 100) : 0;
  const replyRate = campaign.stats_sent > 0 ? Math.round((campaign.stats_replied / campaign.stats_sent) * 100) : 0;

  return (
    <div className="space-y-6">
      <button
        onClick={() => router.push('/admin/outreach/campaigns')}
        className="flex items-center gap-1 text-sm text-[#8b919a] hover:text-[#0c0f14] transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Campaigns
      </button>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#0c0f14]">{campaign.name}</h1>
          {campaign.description && (
            <p className="text-sm text-[#8b919a] mt-1">{campaign.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {campaign.status === 'draft' && (
            <button
              onClick={() => updateStatus('active')}
              className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium bg-green-600 text-white hover:bg-green-700 transition-colors"
            >
              <Play className="h-3.5 w-3.5" />
              Start
            </button>
          )}
          {campaign.status === 'active' && (
            <button
              onClick={() => updateStatus('paused')}
              className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium bg-yellow-600 text-white hover:bg-yellow-700 transition-colors"
            >
              <Pause className="h-3.5 w-3.5" />
              Pause
            </button>
          )}
          {campaign.status === 'paused' && (
            <>
              <button
                onClick={() => updateStatus('active')}
                className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium bg-green-600 text-white hover:bg-green-700 transition-colors"
              >
                <Play className="h-3.5 w-3.5" />
                Resume
              </button>
              <button
                onClick={() => updateStatus('completed')}
                className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium border border-[#e8e8e3] bg-white hover:bg-[#f0f0ec] transition-colors"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Complete
              </button>
            </>
          )}
          <span
            className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${
              campaign.status === 'active'
                ? 'bg-green-100 text-green-700'
                : campaign.status === 'paused'
                  ? 'bg-yellow-100 text-yellow-800'
                  : campaign.status === 'completed'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-700'
            }`}
          >
            {campaign.status}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Enrolled" value={campaign.enrolled_count} />
        <StatCard icon={Send} label="Sent" value={campaign.stats_sent} />
        <StatCard icon={Eye} label="Open Rate" value={`${openRate}%`} />
        <StatCard icon={MessageSquare} label="Reply Rate" value={`${replyRate}%`} />
      </div>

      {/* Sequence Steps */}
      <div className="border border-[#e8e8e3] bg-white p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-[#0c0f14]">Sequence Steps</h3>
          <button
            onClick={() => setShowAddStep(!showAddStep)}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium bg-[#C8A75E] text-white hover:bg-[#b8974e] transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Step
          </button>
        </div>

        {campaign.steps.length === 0 && !showAddStep && (
          <p className="text-sm text-[#8b919a] text-center py-8">
            No steps yet. Add your first email step to get started.
          </p>
        )}

        <div className="space-y-3">
          {campaign.steps.map((step) => (
            <div key={step.id} className="border border-[#e8e8e3] p-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center bg-[#C8A75E]/10 text-xs font-bold text-[#C8A75E]">
                    {step.step_order}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-[#0c0f14]">
                      {step.subject ?? (step.use_ai_generation ? 'AI Generated' : 'No subject')}
                    </p>
                    <p className="text-xs text-[#8b919a]">
                      {step.delay_days === 0 ? 'Send immediately' : `Wait ${step.delay_days} day${step.delay_days > 1 ? 's' : ''}`}
                      {step.use_ai_generation && (
                        <span className="ml-2 inline-flex items-center gap-0.5 text-[#C8A75E]">
                          <Sparkles className="h-3 w-3" /> AI
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => deleteStep(step.id)}
                  className="p-1 text-[#8b919a] hover:text-red-600 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              {step.body_text && (
                <pre className="mt-2 p-2 bg-[#fafaf8] text-xs text-[#5c6370] whitespace-pre-wrap font-sans max-h-24 overflow-y-auto">
                  {step.body_text}
                </pre>
              )}
              {step.ai_prompt && (
                <p className="mt-1 text-xs text-[#C8A75E]">AI Prompt: {step.ai_prompt}</p>
              )}
            </div>
          ))}
        </div>

        {/* Add Step Form */}
        {showAddStep && (
          <div className="mt-4 border border-[#C8A75E]/30 bg-[#C8A75E]/5 p-4 space-y-3">
            <h4 className="font-medium text-sm text-[#0c0f14]">
              Step {(campaign.steps.length ?? 0) + 1}
            </h4>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={useAI}
                  onChange={(e) => setUseAI(e.target.checked)}
                  className="accent-[#C8A75E]"
                />
                <Sparkles className="h-3.5 w-3.5 text-[#C8A75E]" />
                Use AI to generate email
              </label>
            </div>

            {useAI && (
              <div>
                <label className="block text-sm font-medium text-[#0c0f14] mb-1">
                  AI Prompt
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    className="flex-1 px-3 py-2 text-sm border border-[#e8e8e3] bg-white focus:outline-none focus:border-[#C8A75E]"
                    placeholder="e.g. Follow up mentioning annual query deadline"
                  />
                  <button
                    onClick={generateStepContent}
                    disabled={generating || !aiPrompt}
                    className="px-3 py-2 text-sm font-medium bg-[#C8A75E] text-white hover:bg-[#b8974e] transition-colors disabled:opacity-50"
                  >
                    {generating ? 'Generating...' : 'Generate'}
                  </button>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-[#0c0f14] mb-1">Delay (days)</label>
              <input
                type="number"
                value={newStepDelay}
                onChange={(e) => setNewStepDelay(e.target.value)}
                className="w-32 px-3 py-2 text-sm border border-[#e8e8e3] bg-white focus:outline-none focus:border-[#C8A75E]"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#0c0f14] mb-1">Subject</label>
              <input
                type="text"
                value={newStepSubject}
                onChange={(e) => setNewStepSubject(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-[#e8e8e3] bg-white focus:outline-none focus:border-[#C8A75E]"
                placeholder="Email subject line (use {{company_name}} etc.)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#0c0f14] mb-1">Body</label>
              <textarea
                value={newStepBody}
                onChange={(e) => setNewStepBody(e.target.value)}
                rows={6}
                className="w-full px-3 py-2 text-sm border border-[#e8e8e3] bg-white focus:outline-none focus:border-[#C8A75E] resize-none font-mono"
                placeholder="Email body (use {{company_name}}, {{contact_name}}, {{fleet_size}}, etc.)"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={addStep}
                disabled={saving}
                className="px-4 py-2 text-sm font-medium bg-[#C8A75E] text-white hover:bg-[#b8974e] transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Step'}
              </button>
              <button
                onClick={() => setShowAddStep(false)}
                className="px-4 py-2 text-sm font-medium border border-[#e8e8e3] bg-white hover:bg-[#f0f0ec] transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Enrolled Leads */}
      <div className="border border-[#e8e8e3] bg-white p-4">
        <h3 className="font-medium text-[#0c0f14] mb-3">Enrolled Leads ({campaign.enrolled_count})</h3>
        {campaign.enrollments.length === 0 ? (
          <p className="text-sm text-[#8b919a] text-center py-4">
            No leads enrolled. Go to Leads and enroll them in this campaign.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#e8e8e3]">
                  <th className="text-left py-2 px-2 font-medium text-[#8b919a]">Company</th>
                  <th className="text-left py-2 px-2 font-medium text-[#8b919a]">Email</th>
                  <th className="text-left py-2 px-2 font-medium text-[#8b919a]">Step</th>
                  <th className="text-left py-2 px-2 font-medium text-[#8b919a]">Status</th>
                </tr>
              </thead>
              <tbody>
                {campaign.enrollments.map((e) => (
                  <tr key={e.id} className="border-b border-[#e8e8e3] last:border-0">
                    <td className="py-2 px-2 font-medium">
                      {e.outreach_leads?.company_name ?? '---'}
                    </td>
                    <td className="py-2 px-2 text-[#8b919a]">
                      {e.outreach_leads?.email ?? '---'}
                    </td>
                    <td className="py-2 px-2 tabular-nums">{e.current_step}</td>
                    <td className="py-2 px-2 capitalize">{e.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
