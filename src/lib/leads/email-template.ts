import type { StartupLead } from '../../types/leads';

/**
 * Generates a clean, human-sounding 4-line plain-text email template
 * pre-filled with recipient name, company, and tailored pitch hook.
 * Zero robotic AI fluff, authentic and directly actionable.
 */
export function generateOutreachEmailDraft(lead: StartupLead): string {
  const firstName = lead.contact_name
    ? lead.contact_name.trim().split(/\s+/)[0]
    : '';

  const salutation = firstName ? `Hi ${firstName},` : 'Hi there,';
  const company = lead.company_name?.trim() || 'your team';
  
  // Custom hook or sensible default based on track
  let hookLine = lead.pitch_hook?.trim();
  if (!hookLine) {
    if (lead.track === 'Web3 Growth') {
      hookLine = `Saw what ${company} is building in Web3 and wanted to reach out regarding your growth engine.`;
    } else if (lead.track === 'Salesforce') {
      hookLine = `Noticed your team at ${company} is scaling CRM operations and Salesforce workflows.`;
    } else {
      hookLine = `Saw your engineering updates at ${company} and wanted to reach out regarding full-stack architecture.`;
    }
  }

  // Value proposition tailored to Zahid's triple-threat profile
  let valueLine = '';
  if (lead.track === 'Web3 Growth') {
    valueLine = `I scaled NexGami to 500K+ registered users and a $5M raise, pairing deep Web3 growth tactics with technical execution.`;
  } else if (lead.track === 'Salesforce') {
    valueLine = `I bridge certified Salesforce development (Apex, LWC, complex integrations) with modern full-stack web engineering.`;
  } else {
    valueLine = `I'm a full-stack engineer (CS grad, TypeScript/Next.js/Node/cloud systems) with a track record of shipping fast, high-impact products.`;
  }

  const callToAction = `Open to a quick 10-minute intro chat this week to see if there's an immediate fit?`;

  return [
    salutation,
    '',
    hookLine,
    '',
    valueLine,
    '',
    callToAction,
    '',
    'Best,',
    'Zahid',
    'zahidp.com | github.com/zahidhasan-p',
  ].join('\n');
}
