import type { StartupLead, StartupLeadMetrics } from '../../types/leads';

export function normalizeCompany(name: string): string {
  return (name || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

export function calculateLeadMetrics(leads: Array<Partial<StartupLead>>): StartupLeadMetrics {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  let newToday = 0;
  let readyToEmail = 0;
  let emailed = 0;
  let replied = 0;
  let promoted = 0;
  let total = 0;

  for (const lead of leads) {
    if (lead.status === 'archived') continue;
    total++;
    if (lead.created_at && lead.created_at >= oneDayAgo) newToday++;
    if (lead.status === 'new' && lead.contact_email && lead.contact_email.trim().length > 0) {
      readyToEmail++;
    }
    if (lead.status === 'emailed') emailed++;
    if (lead.status === 'replied') replied++;
    if (lead.status === 'promoted') promoted++;
  }

  return { newToday, readyToEmail, emailed, replied, promoted, total };
}

