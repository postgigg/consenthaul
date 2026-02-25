'use client';

import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Plus, Rss, Trash2, Pencil, X } from 'lucide-react';
import type { Database, RegulatorySourceType } from '@/types/database';

type SourceRow = Database['public']['Tables']['regulatory_sources']['Row'];

const SOURCE_TYPE_LABELS: Record<RegulatorySourceType, string> = {
  rss: 'RSS Feed',
  webpage: 'Webpage',
  api: 'API',
};

function formatDate(date: string | null) {
  if (!date) return 'Never';
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

const EMPTY_FORM = {
  name: '',
  url: '',
  source_type: 'rss' as RegulatorySourceType,
  check_frequency_hours: 24,
  is_active: true,
};

export default function AdminRegulatorySourcesPage() {
  const [sources, setSources] = useState<SourceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchSources = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/regulatory/sources');
      if (res.ok) {
        const { data } = await res.json();
        setSources(data ?? []);
      }
    } catch (err) {
      console.error('Failed to fetch sources:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSources();
  }, [fetchSources]);

  function resetForm() {
    setForm(EMPTY_FORM);
    setShowForm(false);
    setEditingId(null);
  }

  function startEdit(source: SourceRow) {
    setForm({
      name: source.name,
      url: source.url,
      source_type: source.source_type,
      check_frequency_hours: source.check_frequency_hours,
      is_active: source.is_active,
    });
    setEditingId(source.id);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      if (editingId) {
        await fetch(`/api/admin/regulatory/sources/${editingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
      } else {
        await fetch('/api/admin/regulatory/sources', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
      }
      resetForm();
      fetchSources();
    } catch (err) {
      console.error('Save failed:', err);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this source? Existing alerts from it will be kept.')) return;
    setDeleting(id);
    try {
      await fetch(`/api/admin/regulatory/sources/${id}`, { method: 'DELETE' });
      fetchSources();
    } catch (err) {
      console.error('Delete failed:', err);
    } finally {
      setDeleting(null);
    }
  }

  async function handleToggleActive(source: SourceRow) {
    try {
      await fetch(`/api/admin/regulatory/sources/${source.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !source.is_active }),
      });
      fetchSources();
    } catch (err) {
      console.error('Toggle failed:', err);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-[#0c0f14] tracking-tight flex items-center gap-2">
            <Rss className="h-5 w-5 text-[#C8A75E]" />
            Regulatory Sources
          </h1>
          <p className="mt-1 text-sm text-[#8b919a]">
            Manage RSS feeds and webpages monitored for regulatory changes.
          </p>
        </div>
        {!showForm && (
          <Button
            onClick={() => { setShowForm(true); setEditingId(null); setForm(EMPTY_FORM); }}
            className="bg-[#C8A75E] text-[#0c0f14] hover:bg-[#b8974e]"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Source
          </Button>
        )}
      </div>

      {/* Add/Edit form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="border border-[#e8e8e3] bg-white p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#0c0f14]">
              {editingId ? 'Edit Source' : 'Add New Source'}
            </h2>
            <button type="button" onClick={resetForm} className="text-[#8b919a] hover:text-[#0c0f14]">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#8b919a] mb-1">Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                className="w-full border border-[#e8e8e3] px-3 py-2 text-sm focus:border-[#C8A75E] focus:outline-none"
                placeholder="FMCSA News & Updates"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#8b919a] mb-1">URL</label>
              <input
                type="url"
                value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
                required
                className="w-full border border-[#e8e8e3] px-3 py-2 text-sm focus:border-[#C8A75E] focus:outline-none"
                placeholder="https://example.com/rss"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#8b919a] mb-1">Type</label>
              <select
                value={form.source_type}
                onChange={(e) => setForm({ ...form, source_type: e.target.value as RegulatorySourceType })}
                className="w-full border border-[#e8e8e3] px-3 py-2 text-sm focus:border-[#C8A75E] focus:outline-none bg-white"
              >
                <option value="rss">RSS Feed</option>
                <option value="webpage">Webpage</option>
                <option value="api">API</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#8b919a] mb-1">Check Frequency (hours)</label>
              <input
                type="number"
                min={1}
                max={720}
                value={form.check_frequency_hours}
                onChange={(e) => setForm({ ...form, check_frequency_hours: parseInt(e.target.value, 10) || 24 })}
                className="w-full border border-[#e8e8e3] px-3 py-2 text-sm focus:border-[#C8A75E] focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              checked={form.is_active}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
              className="accent-[#C8A75E]"
            />
            <label htmlFor="is_active" className="text-sm text-[#3a3f49]">Active</label>
          </div>

          <div className="flex gap-2">
            <Button
              type="submit"
              disabled={saving}
              className="bg-[#C8A75E] text-[#0c0f14] hover:bg-[#b8974e]"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {editingId ? 'Update Source' : 'Add Source'}
            </Button>
            <Button type="button" variant="outline" onClick={resetForm}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      {/* Sources table */}
      {loading ? (
        <div className="flex items-center justify-center h-32 text-[#8b919a]">
          Loading sources...
        </div>
      ) : sources.length === 0 ? (
        <div className="border border-[#e8e8e3] bg-white p-8 text-center text-sm text-[#8b919a]">
          No sources configured yet.
        </div>
      ) : (
        <div className="border border-[#e8e8e3] bg-white overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#e8e8e3] bg-[#fafaf8]">
                <th className="text-left px-4 py-3 text-xs font-bold text-[#8b919a] uppercase tracking-wider">Name</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-[#8b919a] uppercase tracking-wider">Type</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-[#8b919a] uppercase tracking-wider">Frequency</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-[#8b919a] uppercase tracking-wider">Last Checked</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-[#8b919a] uppercase tracking-wider">Active</th>
                <th className="text-right px-4 py-3 text-xs font-bold text-[#8b919a] uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sources.map((source) => (
                <tr key={source.id} className="border-b border-[#e8e8e3] last:border-0 hover:bg-[#fafaf8]">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-[#0c0f14]">{source.name}</p>
                      <p className="text-xs text-[#8b919a] truncate max-w-xs">{source.url}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[#3a3f49]">
                    {SOURCE_TYPE_LABELS[source.source_type]}
                  </td>
                  <td className="px-4 py-3 text-[#3a3f49]">
                    {source.check_frequency_hours}h
                  </td>
                  <td className="px-4 py-3 text-[#8b919a] text-xs">
                    {formatDate(source.last_checked_at)}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleToggleActive(source)}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                        source.is_active ? 'bg-[#C8A75E]' : 'bg-[#e8e8e3]'
                      }`}
                    >
                      <span
                        className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${
                          source.is_active ? 'translate-x-4' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => startEdit(source)}
                        className="p-1.5 text-[#8b919a] hover:text-[#0c0f14] transition-colors"
                        title="Edit"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(source.id)}
                        disabled={deleting === source.id}
                        className="p-1.5 text-[#8b919a] hover:text-red-600 transition-colors"
                        title="Delete"
                      >
                        {deleting === source.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
