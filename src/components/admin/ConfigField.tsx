'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, Save, Loader2 } from 'lucide-react';

interface ConfigFieldProps {
  configKey: string;
  label: string;
  description?: string;
  maskedValue?: string;
  onSave: (key: string, value: string) => Promise<void>;
  onReveal: (key: string) => Promise<string>;
}

export function ConfigField({
  configKey,
  label,
  description,
  maskedValue,
  onSave,
  onReveal,
}: ConfigFieldProps) {
  const [value, setValue] = useState('');
  const [revealed, setRevealed] = useState(false);
  const [revealedValue, setRevealedValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [revealing, setRevealing] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleReveal() {
    if (revealed) {
      setRevealed(false);
      setRevealedValue('');
      return;
    }
    setRevealing(true);
    try {
      const val = await onReveal(configKey);
      setRevealedValue(val);
      setRevealed(true);
    } catch {
      // Failed to reveal
    } finally {
      setRevealing(false);
    }
  }

  async function handleSave() {
    if (!value.trim()) return;
    setSaving(true);
    try {
      await onSave(configKey, value);
      setSaved(true);
      setEditing(false);
      setValue('');
      setRevealed(false);
      setRevealedValue('');
      setTimeout(() => setSaved(false), 2000);
    } catch {
      // Failed to save
    } finally {
      setSaving(false);
    }
  }

  const displayValue = revealed ? revealedValue : maskedValue || '(not set)';

  return (
    <div className="border border-[#e8e8e3] bg-white p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[#0c0f14]">{label}</p>
          {description && (
            <p className="text-xs text-[#8b919a] mt-0.5">{description}</p>
          )}
          <p className="text-xs text-[#5c6370] mt-0.5 font-mono">{configKey}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {maskedValue && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReveal}
              disabled={revealing}
            >
              {revealing ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : revealed ? (
                <EyeOff className="h-3.5 w-3.5" />
              ) : (
                <Eye className="h-3.5 w-3.5" />
              )}
            </Button>
          )}
          {!editing && (
            <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
              Edit
            </Button>
          )}
        </div>
      </div>

      {!editing && (
        <div className="mt-2 font-mono text-xs text-[#3a3f49] bg-[#fafaf8] border border-[#e8e8e3] px-3 py-2 break-all">
          {displayValue}
          {saved && <span className="ml-2 text-emerald-600 font-sans">Saved!</span>}
        </div>
      )}

      {editing && (
        <div className="mt-3 flex items-center gap-2">
          <Input
            type="password"
            placeholder={`Enter new ${label.toLowerCase()}`}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="font-mono text-xs flex-1"
          />
          <Button
            variant="default"
            size="sm"
            onClick={handleSave}
            disabled={saving || !value.trim()}
          >
            {saving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setEditing(false);
              setValue('');
            }}
          >
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
}
