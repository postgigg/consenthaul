'use client';

import { useEffect, useState, useCallback } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ConfigField } from '@/components/admin/ConfigField';
import { Badge } from '@/components/ui/badge';

interface ConfigItem {
  key: string;
  label: string;
  description: string;
  maskedValue: string | null;
  source: 'db' | 'env' | 'none';
  updatedAt: string | null;
}

interface ConfigData {
  config: Record<string, ConfigItem[]>;
  categories: string[];
}

const categoryLabels: Record<string, string> = {
  stripe: 'Stripe',
  twilio: 'Twilio',
  resend: 'Resend',
  supabase: 'Supabase',
  app: 'App',
};

export default function AdminConfigPage() {
  const [data, setData] = useState<ConfigData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchConfig = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/config');
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  async function handleSave(key: string, value: string) {
    const res = await fetch('/api/admin/config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value }),
    });
    if (!res.ok) throw new Error('Failed to save');
    // Refresh config
    await fetchConfig();
  }

  async function handleReveal(key: string): Promise<string> {
    const res = await fetch(`/api/admin/config/${encodeURIComponent(key)}/reveal`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to reveal');
    const json = await res.json();
    return json.value;
  }

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-64 text-[#8b919a]">
        Loading configuration...
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <p className="text-sm text-[#8b919a]">
          Manage platform API keys and secrets. Values are encrypted at rest using AES-256-GCM.
        </p>
      </div>

      <Tabs defaultValue={data.categories[0]}>
        <TabsList>
          {data.categories.map((cat) => (
            <TabsTrigger key={cat} value={cat}>
              {categoryLabels[cat] ?? cat}
            </TabsTrigger>
          ))}
        </TabsList>

        {data.categories.map((cat) => (
          <TabsContent key={cat} value={cat}>
            <div className="space-y-3">
              {data.config[cat]?.map((item) => (
                <div key={item.key}>
                  <div className="flex items-center gap-2 mb-1">
                    {item.source === 'db' && (
                      <Badge variant="success" className="text-[0.6rem]">Database</Badge>
                    )}
                    {item.source === 'env' && (
                      <Badge variant="gold" className="text-[0.6rem]">Env Var</Badge>
                    )}
                    {item.source === 'none' && (
                      <Badge variant="secondary" className="text-[0.6rem]">Not Set</Badge>
                    )}
                  </div>
                  <ConfigField
                    configKey={item.key}
                    label={item.label}
                    description={item.description}
                    maskedValue={item.maskedValue ?? undefined}
                    onSave={handleSave}
                    onReveal={handleReveal}
                  />
                </div>
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
