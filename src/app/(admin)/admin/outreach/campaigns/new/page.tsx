'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY',
  'LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND',
  'OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY',
];

export default function NewCampaignPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedStates, setSelectedStates] = useState<string[]>([]);
  const [fleetMin, setFleetMin] = useState('');
  const [fleetMax, setFleetMax] = useState('');
  const [dailyLimit, setDailyLimit] = useState('50');
  const [sendStart, setSendStart] = useState('09:00');
  const [sendEnd, setSendEnd] = useState('17:00');
  const [fromName, setFromName] = useState('ConsentHaul');
  const [fromEmail, setFromEmail] = useState('outreach@consenthaul.com');

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);

    try {
      const res = await fetch('/api/admin/outreach/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          target_filters: {
            states: selectedStates.length > 0 ? selectedStates : undefined,
            fleet_min: fleetMin ? parseInt(fleetMin, 10) : undefined,
            fleet_max: fleetMax ? parseInt(fleetMax, 10) : undefined,
          },
          send_settings: {
            daily_limit: parseInt(dailyLimit, 10) || 50,
            send_window_start: sendStart,
            send_window_end: sendEnd,
            timezone: 'America/Chicago',
            from_name: fromName,
            from_email: fromEmail,
          },
        }),
      });

      const json = await res.json();
      if (json.data?.id) {
        router.push(`/admin/outreach/campaigns/${json.data.id}`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const toggleState = (s: string) => {
    setSelectedStates((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s],
    );
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <button
        onClick={() => router.push('/admin/outreach/campaigns')}
        className="flex items-center gap-1 text-sm text-[#8b919a] hover:text-[#0c0f14] transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Campaigns
      </button>

      <h1 className="text-xl font-semibold text-[#0c0f14]">New Campaign</h1>

      <div className="space-y-4">
        {/* Basic Info */}
        <div className="border border-[#e8e8e3] bg-white p-4 space-y-3">
          <h3 className="font-medium text-[#0c0f14]">Campaign Details</h3>
          <div>
            <label className="block text-sm font-medium text-[#0c0f14] mb-1">Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-[#e8e8e3] bg-white focus:outline-none focus:border-[#C8A75E]"
              placeholder="e.g. Texas Carriers - Q1 2026"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#0c0f14] mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 text-sm border border-[#e8e8e3] bg-white focus:outline-none focus:border-[#C8A75E] resize-none"
              placeholder="Optional description"
            />
          </div>
        </div>

        {/* Target Filters */}
        <div className="border border-[#e8e8e3] bg-white p-4 space-y-3">
          <h3 className="font-medium text-[#0c0f14]">Target Filters</h3>
          <div>
            <label className="block text-sm font-medium text-[#0c0f14] mb-1">States</label>
            <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto p-2 border border-[#e8e8e3]">
              {US_STATES.map((s) => (
                <button
                  key={s}
                  onClick={() => toggleState(s)}
                  className={`px-2 py-0.5 text-xs font-medium transition-colors ${
                    selectedStates.includes(s)
                      ? 'bg-[#C8A75E] text-white'
                      : 'bg-[#f0f0ec] text-[#5c6370] hover:bg-[#e8e8e3]'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            {selectedStates.length > 0 && (
              <p className="text-xs text-[#8b919a] mt-1">{selectedStates.length} states selected</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-[#0c0f14] mb-1">Min Fleet Size</label>
              <input
                type="number"
                value={fleetMin}
                onChange={(e) => setFleetMin(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-[#e8e8e3] bg-white focus:outline-none focus:border-[#C8A75E]"
                placeholder="1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#0c0f14] mb-1">Max Fleet Size</label>
              <input
                type="number"
                value={fleetMax}
                onChange={(e) => setFleetMax(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-[#e8e8e3] bg-white focus:outline-none focus:border-[#C8A75E]"
                placeholder="200"
              />
            </div>
          </div>
        </div>

        {/* Send Settings */}
        <div className="border border-[#e8e8e3] bg-white p-4 space-y-3">
          <h3 className="font-medium text-[#0c0f14]">Send Settings</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-[#0c0f14] mb-1">Daily Limit</label>
              <input
                type="number"
                value={dailyLimit}
                onChange={(e) => setDailyLimit(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-[#e8e8e3] bg-white focus:outline-none focus:border-[#C8A75E]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#0c0f14] mb-1">Timezone</label>
              <input
                type="text"
                value="America/Chicago"
                disabled
                className="w-full px-3 py-2 text-sm border border-[#e8e8e3] bg-[#fafaf8] text-[#8b919a]"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-[#0c0f14] mb-1">Window Start</label>
              <input
                type="time"
                value={sendStart}
                onChange={(e) => setSendStart(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-[#e8e8e3] bg-white focus:outline-none focus:border-[#C8A75E]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#0c0f14] mb-1">Window End</label>
              <input
                type="time"
                value={sendEnd}
                onChange={(e) => setSendEnd(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-[#e8e8e3] bg-white focus:outline-none focus:border-[#C8A75E]"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-[#0c0f14] mb-1">From Name</label>
              <input
                type="text"
                value={fromName}
                onChange={(e) => setFromName(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-[#e8e8e3] bg-white focus:outline-none focus:border-[#C8A75E]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#0c0f14] mb-1">From Email</label>
              <input
                type="email"
                value={fromEmail}
                onChange={(e) => setFromEmail(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-[#e8e8e3] bg-white focus:outline-none focus:border-[#C8A75E]"
              />
            </div>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving || !name.trim()}
          className="w-full py-2.5 text-sm font-medium bg-[#C8A75E] text-white hover:bg-[#b8974e] transition-colors disabled:opacity-50"
        >
          {saving ? 'Creating...' : 'Create Campaign'}
        </button>
      </div>
    </div>
  );
}
