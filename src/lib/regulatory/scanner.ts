// ---------------------------------------------------------------------------
// Regulatory scanner orchestrator
// ---------------------------------------------------------------------------

import { createAdminClient } from '@/lib/supabase/admin';
import { fetchSource } from './fetcher';
import { classifyRelevance, analyzeImpact } from './analyzer';
import { notifyCriticalAlert } from './notifier';
import crypto from 'crypto';

const MAX_SOURCES_PER_RUN = 20;
const INTER_SOURCE_DELAY_MS = 1_000;

interface ScanResult {
  sources_checked: number;
  entries_found: number;
  alerts_created: number;
  critical_alerts: number;
  errors: string[];
}

function sha256(input: string): string {
  return crypto.createHash('sha256').update(input).digest('hex');
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function runRegulatoryScanner(): Promise<ScanResult> {
  const supabase = createAdminClient();
  const result: ScanResult = {
    sources_checked: 0,
    entries_found: 0,
    alerts_created: 0,
    critical_alerts: 0,
    errors: [],
  };

  // Fetch active sources due for checking
  const { data: sources, error: srcErr } = await supabase
    .from('regulatory_sources')
    .select('*')
    .eq('is_active', true)
    .or(`last_checked_at.is.null,last_checked_at.lt.${new Date(Date.now() - 3600_000).toISOString()}`)
    .order('last_checked_at', { ascending: true, nullsFirst: true })
    .limit(MAX_SOURCES_PER_RUN);

  if (srcErr || !sources) {
    result.errors.push(`Failed to fetch sources: ${srcErr?.message}`);
    return result;
  }

  // Get existing content hashes for dedup
  const { data: existingAlerts } = await supabase
    .from('regulatory_alerts')
    .select('content_hash');

  const existingHashes = new Set(existingAlerts?.map((a) => a.content_hash) ?? []);

  for (const source of sources) {
    try {
      result.sources_checked++;

      const entries = await fetchSource(source.url, source.source_type);
      result.entries_found += entries.length;

      for (const entry of entries) {
        const hash = sha256(`${entry.title}|${entry.url}|${entry.description.slice(0, 500)}`);

        if (existingHashes.has(hash)) continue;
        existingHashes.add(hash);

        // Stage 1: classify relevance
        const classification = await classifyRelevance(entry.title, entry.description);

        let impact_assessment: string | null = null;
        let recommended_actions: string | null = null;
        let affected_areas: string[] = [];

        // Stage 2: detailed analysis for relevant items
        if (classification.relevance_score >= 5) {
          const analysis = await analyzeImpact(
            entry.title,
            entry.description,
            classification.category,
          );
          impact_assessment = analysis.impact_assessment;
          recommended_actions = analysis.recommended_actions;
          affected_areas = analysis.affected_areas;
        }

        // Store alert
        const { error: insertErr } = await supabase
          .from('regulatory_alerts')
          .insert({
            source_id: source.id,
            title: entry.title,
            url: entry.url || null,
            summary: classification.reason,
            content_hash: hash,
            relevance_score: classification.relevance_score,
            category: classification.category,
            impact_assessment,
            recommended_actions,
            affected_areas,
            status: classification.relevance_score >= 8 ? 'action_required' : 'new',
          });

        if (insertErr) {
          // Unique constraint violation = duplicate, skip silently
          if (insertErr.code === '23505') continue;
          result.errors.push(`Insert alert: ${insertErr.message}`);
          continue;
        }

        result.alerts_created++;

        // Email notification for critical alerts
        if (classification.relevance_score >= 8) {
          result.critical_alerts++;
          try {
            await notifyCriticalAlert({
              title: entry.title,
              url: entry.url,
              relevance_score: classification.relevance_score,
              category: classification.category,
              summary: classification.reason,
              impact_assessment: impact_assessment ?? '',
              recommended_actions: recommended_actions ?? '',
            });
          } catch (emailErr) {
            result.errors.push(`Email notification: ${emailErr instanceof Error ? emailErr.message : String(emailErr)}`);
          }
        }
      }

      // Update last_checked_at
      await supabase
        .from('regulatory_sources')
        .update({ last_checked_at: new Date().toISOString() })
        .eq('id', source.id);

      // Rate limit between sources
      if (result.sources_checked < sources.length) {
        await sleep(INTER_SOURCE_DELAY_MS);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      result.errors.push(`Source "${source.name}": ${msg}`);
    }
  }

  return result;
}
