'use client';

import { useEffect, useState, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Shield, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
import type { Database, RegulatoryAlertStatus } from '@/types/database';

type AlertRow = Database['public']['Tables']['regulatory_alerts']['Row'] & {
  regulatory_sources: { name: string } | null;
};

const STATUS_TABS: { label: string; value: string }[] = [
  { label: 'All', value: 'all' },
  { label: 'New', value: 'new' },
  { label: 'Reviewing', value: 'reviewing' },
  { label: 'Action Required', value: 'action_required' },
  { label: 'Resolved', value: 'resolved' },
  { label: 'Dismissed', value: 'dismissed' },
];

const STATUS_VARIANTS: Record<RegulatoryAlertStatus, 'warning' | 'secondary' | 'destructive' | 'success' | 'gold'> = {
  new: 'warning',
  reviewing: 'gold',
  action_required: 'destructive',
  resolved: 'success',
  dismissed: 'secondary',
};

function relevanceBadge(score: number) {
  if (score >= 8) return <span className="inline-flex items-center px-2 py-0.5 text-xs font-bold bg-red-100 text-red-800">{score}/10</span>;
  if (score >= 5) return <span className="inline-flex items-center px-2 py-0.5 text-xs font-bold bg-amber-100 text-amber-800">{score}/10</span>;
  return <span className="inline-flex items-center px-2 py-0.5 text-xs font-bold bg-gray-100 text-gray-600">{score}/10</span>;
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function AdminRegulatoryPage() {
  const [alerts, setAlerts] = useState<AlertRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchAlerts = useCallback(async () => {
    try {
      const url = `/api/admin/regulatory/alerts?status=${activeTab}`;
      const res = await fetch(url);
      if (res.ok) {
        const { data } = await res.json();
        setAlerts(data ?? []);
      }
    } catch (err) {
      console.error('Failed to fetch alerts:', err);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    setLoading(true);
    fetchAlerts();
  }, [fetchAlerts]);

  async function handleRunScan() {
    setScanning(true);
    try {
      await fetch('/api/admin/regulatory/scan', { method: 'POST' });
      await fetchAlerts();
    } catch (err) {
      console.error('Scan failed:', err);
    } finally {
      setScanning(false);
    }
  }

  async function handleStatusChange(id: string, status: RegulatoryAlertStatus) {
    try {
      await fetch(`/api/admin/regulatory/alerts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      fetchAlerts();
    } catch (err) {
      console.error('Status update failed:', err);
    }
  }

  async function handleSaveNotes(id: string) {
    setSaving(true);
    try {
      await fetch(`/api/admin/regulatory/alerts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ admin_notes: adminNotes }),
      });
      setEditingId(null);
      setAdminNotes('');
      fetchAlerts();
    } catch (err) {
      console.error('Save notes failed:', err);
    } finally {
      setSaving(false);
    }
  }

  // Stat calculations
  const totalAlerts = alerts.length;
  const newAlerts = alerts.filter((a) => a.status === 'new').length;
  const actionRequired = alerts.filter((a) => a.status === 'action_required').length;
  const criticalAlerts = alerts.filter((a) => a.relevance_score >= 8).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-[#0c0f14] tracking-tight flex items-center gap-2">
            <Shield className="h-5 w-5 text-[#C8A75E]" />
            Regulatory Intelligence
          </h1>
          <p className="mt-1 text-sm text-[#8b919a]">
            AI-powered monitoring of FMCSA and DOT regulatory changes.
          </p>
        </div>
        <Button
          onClick={handleRunScan}
          disabled={scanning}
          className="bg-[#0c0f14] text-white hover:bg-[#1e2129]"
        >
          {scanning ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          {scanning ? 'Scanning...' : 'Run Scan Now'}
        </Button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Alerts', value: totalAlerts, color: 'text-[#0c0f14]' },
          { label: 'New', value: newAlerts, color: 'text-amber-600' },
          { label: 'Action Required', value: actionRequired, color: 'text-red-600' },
          { label: 'Critical (8+)', value: criticalAlerts, color: 'text-red-700' },
        ].map((stat) => (
          <div key={stat.label} className="border border-[#e8e8e3] bg-white p-4">
            <p className="text-xs font-medium text-[#8b919a] uppercase tracking-wider">{stat.label}</p>
            <p className={`mt-1 text-2xl font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 border-b border-[#e8e8e3]">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.value
                ? 'border-[#C8A75E] text-[#0c0f14]'
                : 'border-transparent text-[#8b919a] hover:text-[#3a3f49]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Alert list */}
      {loading ? (
        <div className="flex items-center justify-center h-32 text-[#8b919a]">
          Loading alerts...
        </div>
      ) : alerts.length === 0 ? (
        <div className="border border-[#e8e8e3] bg-white p-8 text-center text-sm text-[#8b919a]">
          No alerts found. Run a scan to check regulatory sources.
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => {
            const isExpanded = expandedId === alert.id;
            const isEditing = editingId === alert.id;

            return (
              <div key={alert.id} className="border border-[#e8e8e3] bg-white">
                {/* Header */}
                <div
                  className="px-5 py-3 flex items-start justify-between cursor-pointer hover:bg-[#fafaf8] transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : alert.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {relevanceBadge(alert.relevance_score)}
                      <Badge variant={STATUS_VARIANTS[alert.status]}>
                        {alert.status.replace(/_/g, ' ')}
                      </Badge>
                      {alert.category && (
                        <span className="text-xs text-[#8b919a] bg-[#f8f8f6] px-2 py-0.5">
                          {alert.category}
                        </span>
                      )}
                    </div>
                    <h3 className="mt-2 text-sm font-medium text-[#0c0f14] line-clamp-2">
                      {alert.title}
                    </h3>
                    <div className="mt-1 flex items-center gap-3 text-xs text-[#8b919a]">
                      {alert.regulatory_sources?.name && (
                        <span>{alert.regulatory_sources.name}</span>
                      )}
                      <span>{formatDate(alert.created_at)}</span>
                    </div>
                  </div>
                  <div className="ml-3 shrink-0">
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-[#8b919a]" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-[#8b919a]" />
                    )}
                  </div>
                </div>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="border-t border-[#e8e8e3]">
                    <div className="px-5 py-4 space-y-4">
                      {/* Summary */}
                      {alert.summary && (
                        <div>
                          <p className="text-xs font-bold text-[#8b919a] uppercase tracking-wider mb-1">Summary</p>
                          <p className="text-sm text-[#3a3f49]">{alert.summary}</p>
                        </div>
                      )}

                      {/* Impact assessment */}
                      {alert.impact_assessment && (
                        <div>
                          <p className="text-xs font-bold text-[#8b919a] uppercase tracking-wider mb-1">Impact Assessment</p>
                          <p className="text-sm text-[#3a3f49] whitespace-pre-wrap">{alert.impact_assessment}</p>
                        </div>
                      )}

                      {/* Recommended actions */}
                      {alert.recommended_actions && (
                        <div>
                          <p className="text-xs font-bold text-[#8b919a] uppercase tracking-wider mb-1">Recommended Actions</p>
                          <p className="text-sm text-[#3a3f49] whitespace-pre-wrap">{alert.recommended_actions}</p>
                        </div>
                      )}

                      {/* Affected areas */}
                      {alert.affected_areas?.length > 0 && (
                        <div>
                          <p className="text-xs font-bold text-[#8b919a] uppercase tracking-wider mb-1">Affected Areas</p>
                          <div className="flex flex-wrap gap-1">
                            {alert.affected_areas.map((area) => (
                              <span key={area} className="text-xs bg-[#f0f0ed] text-[#3a3f49] px-2 py-0.5">
                                {area.replace(/_/g, ' ')}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Source link */}
                      {alert.url && (
                        <a
                          href={alert.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block text-xs text-[#C8A75E] hover:underline"
                        >
                          View source article &rarr;
                        </a>
                      )}

                      {/* Admin notes */}
                      {alert.admin_notes && !isEditing && (
                        <div className="bg-[#fafaf8] p-3 border border-[#e8e8e3]">
                          <p className="text-xs font-bold text-[#8b919a] uppercase tracking-wider mb-1">Admin Notes</p>
                          <p className="text-sm text-[#3a3f49]">{alert.admin_notes}</p>
                        </div>
                      )}

                      {/* Edit notes */}
                      {isEditing && (
                        <div className="space-y-2">
                          <textarea
                            value={adminNotes}
                            onChange={(e) => setAdminNotes(e.target.value)}
                            placeholder="Add admin notes..."
                            rows={3}
                            className="w-full border border-[#e8e8e3] px-3 py-2 text-sm focus:border-[#C8A75E] focus:outline-none"
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleSaveNotes(alert.id)}
                              disabled={saving}
                              className="bg-[#C8A75E] text-[#0c0f14] hover:bg-[#b8974e]"
                            >
                              {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Save Notes'}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => { setEditingId(null); setAdminNotes(''); }}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Actions bar */}
                    <div className="border-t border-[#e8e8e3] px-5 py-3 flex gap-2 flex-wrap">
                      {alert.status === 'new' && (
                        <>
                          <Button size="sm" onClick={() => handleStatusChange(alert.id, 'reviewing')}>
                            Start Review
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleStatusChange(alert.id, 'dismissed')}>
                            Dismiss
                          </Button>
                        </>
                      )}
                      {alert.status === 'reviewing' && (
                        <>
                          <Button
                            size="sm"
                            className="bg-red-600 text-white hover:bg-red-700"
                            onClick={() => handleStatusChange(alert.id, 'action_required')}
                          >
                            Mark Action Required
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleStatusChange(alert.id, 'resolved')}>
                            Resolve
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleStatusChange(alert.id, 'dismissed')}>
                            Dismiss
                          </Button>
                        </>
                      )}
                      {alert.status === 'action_required' && (
                        <Button size="sm" onClick={() => handleStatusChange(alert.id, 'resolved')}>
                          Mark Resolved
                        </Button>
                      )}
                      {!isEditing && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => { setEditingId(alert.id); setAdminNotes(alert.admin_notes ?? ''); }}
                        >
                          {alert.admin_notes ? 'Edit Notes' : 'Add Notes'}
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
