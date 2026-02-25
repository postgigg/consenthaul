import type { Database } from '@/types/database';

type Lead = Database['public']['Tables']['outreach_leads']['Row'];

const VARIABLE_MAP: Record<string, (lead: Lead) => string> = {
  company_name: (l) => l.company_name,
  contact_name: (l) => l.contact_name ?? 'there',
  dot_number: (l) => l.dot_number ?? '',
  mc_number: (l) => l.mc_number ?? '',
  fleet_size: (l) => String(l.fleet_size ?? ''),
  driver_count: (l) => String(l.driver_count ?? l.fleet_size ?? ''),
  state: (l) => l.state ?? '',
  city: (l) => l.city ?? '',
  email: (l) => l.email ?? '',
  phone: (l) => l.phone ?? '',
};

export function renderTemplate(template: string, lead: Lead): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key: string) => {
    const getter = VARIABLE_MAP[key];
    if (getter) return getter(lead);
    return match;
  });
}
