import crypto from 'node:crypto';
import { supabaseServer } from '@/lib/supabase/server';
import {
  encryptVaultValue,
  decryptVaultValue,
  maskSecretValue,
} from '@/lib/crypto/vault';
import type {
  ClientProject,
  ClientResource,
  ClientProjectStatus,
  ResourceCategory,
  ResourceSecretItem,
} from './types';

interface RawClientRow {
  id: string;
  created_at: string;
  updated_at: string;
  client_name: string;
  project_name: string;
  summary: string;
  primary_domain: string;
  status: ClientProjectStatus;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  contact_handle: string;
  tech_stack: string[];
  notes: string;
}

interface RawResourceRow {
  id: string;
  client_id: string;
  created_at: string;
  updated_at: string;
  category: ResourceCategory;
  provider: string;
  resource_name: string;
  account_email: string;
  account_username: string;
  connected_git_repo: string;
  dashboard_url: string;
  renewal_date: string | null;
  billing_notes: string;
  metadata: Record<string, string>;
  encrypted_secrets: string;
  notes: string;
}

function parseEncryptedSecrets(encryptedBlob: string): ResourceSecretItem[] {
  if (!encryptedBlob) return [];
  try {
    const jsonStr = decryptVaultValue(encryptedBlob);
    const parsed = JSON.parse(jsonStr);
    if (Array.isArray(parsed)) {
      return parsed.map((item) => ({
        id: String(item.id || crypto.randomUUID()),
        label: String(item.label || 'Secret'),
        value: String(item.value || ''),
        isSecret: item.isSecret !== false,
      }));
    }
    return [];
  } catch {
    return [];
  }
}

function encryptSecretsArray(items: ResourceSecretItem[]): string {
  const clean = items
    .filter((i) => i.label.trim() || i.value.trim())
    .map((i) => ({
      id: i.id || crypto.randomUUID(),
      label: i.label.trim(),
      value: i.value,
      isSecret: i.isSecret !== false,
    }));
  if (clean.length === 0) return '';
  return encryptVaultValue(JSON.stringify(clean));
}

function mapResourceRow(row: RawResourceRow, revealSecrets: boolean): ClientResource {
  const rawSecrets = parseEncryptedSecrets(row.encrypted_secrets);
  const secrets: ResourceSecretItem[] = rawSecrets.map((item) => ({
    ...item,
    value: revealSecrets ? item.value : maskSecretValue(item.value, item.isSecret),
  }));

  return {
    id: row.id,
    client_id: row.client_id,
    created_at: row.created_at,
    updated_at: row.updated_at,
    category: row.category,
    provider: row.provider,
    resource_name: row.resource_name,
    account_email: row.account_email || '',
    account_username: row.account_username || '',
    connected_git_repo: row.connected_git_repo || '',
    dashboard_url: row.dashboard_url || '',
    renewal_date: row.renewal_date || null,
    billing_notes: row.billing_notes || '',
    metadata: row.metadata || {},
    secrets,
    has_secrets: rawSecrets.some((s) => Boolean(s.value)),
    notes: row.notes || '',
  };
}

export async function listClientProjects(): Promise<{
  clients: ClientProject[];
  tableMissing?: boolean;
}> {
  const supabase = supabaseServer();
  const { data: projectRows, error: projErr } = await supabase
    .from('client_projects')
    .select('*')
    .order('updated_at', { ascending: false });

  if (projErr) {
    if (
      projErr.code === '42P01' ||
      projErr.message?.includes('does not exist') ||
      projErr.message?.includes('Could not find the table')
    ) {
      return { clients: [], tableMissing: true };
    }
    throw new Error(projErr.message);
  }

  const { data: resourceRows, error: resErr } = await supabase
    .from('client_resources')
    .select('*')
    .order('created_at', { ascending: true });

  if (resErr && resErr.code !== '42P01') {
    throw new Error(resErr.message);
  }

  const resourcesByClient = new Map<string, ClientResource[]>();
  for (const r of (resourceRows || []) as RawResourceRow[]) {
    const mapped = mapResourceRow(r, false); // Always masked in list view
    const list = resourcesByClient.get(r.client_id) || [];
    list.push(mapped);
    resourcesByClient.set(r.client_id, list);
  }

  const clients: ClientProject[] = ((projectRows || []) as RawClientRow[]).map((p) => ({
    ...p,
    tech_stack: Array.isArray(p.tech_stack) ? p.tech_stack : [],
    resources: resourcesByClient.get(p.id) || [],
  }));

  return { clients };
}

export async function getClientProjectById(
  id: string,
  revealSecrets = false
): Promise<ClientProject | null> {
  const supabase = supabaseServer();
  const { data: proj, error: projErr } = await supabase
    .from('client_projects')
    .select('*')
    .eq('id', id)
    .single();

  if (projErr || !proj) return null;

  const { data: resourceRows } = await supabase
    .from('client_resources')
    .select('*')
    .eq('client_id', id)
    .order('created_at', { ascending: true });

  const resources = ((resourceRows || []) as RawResourceRow[]).map((r) =>
    mapResourceRow(r, revealSecrets)
  );

  return {
    ...(proj as RawClientRow),
    tech_stack: Array.isArray(proj.tech_stack) ? proj.tech_stack : [],
    resources,
  };
}

export async function createClientProject(input: {
  client_name: string;
  project_name: string;
  summary?: string;
  primary_domain?: string;
  status?: ClientProjectStatus;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  contact_handle?: string;
  tech_stack?: string[];
  notes?: string;
}): Promise<ClientProject> {
  const supabase = supabaseServer();
  const { data, error } = await supabase
    .from('client_projects')
    .insert({
      client_name: input.client_name.trim(),
      project_name: input.project_name.trim(),
      summary: (input.summary || '').trim(),
      primary_domain: (input.primary_domain || '').trim(),
      status: input.status || 'active',
      contact_name: (input.contact_name || '').trim(),
      contact_email: (input.contact_email || '').trim(),
      contact_phone: (input.contact_phone || '').trim(),
      contact_handle: (input.contact_handle || '').trim(),
      tech_stack: Array.isArray(input.tech_stack) ? input.tech_stack : [],
      notes: (input.notes || '').trim(),
    })
    .select('*')
    .single();

  if (error || !data) {
    throw new Error(error?.message || 'Failed to create client project');
  }

  return {
    ...(data as RawClientRow),
    tech_stack: Array.isArray(data.tech_stack) ? data.tech_stack : [],
    resources: [],
  };
}

export async function updateClientProject(
  id: string,
  updates: Partial<{
    client_name: string;
    project_name: string;
    summary: string;
    primary_domain: string;
    status: ClientProjectStatus;
    contact_name: string;
    contact_email: string;
    contact_phone: string;
    contact_handle: string;
    tech_stack: string[];
    notes: string;
  }>
): Promise<ClientProject | null> {
  const supabase = supabaseServer();
  const payload: Record<string, unknown> = {};
  if (updates.client_name !== undefined) payload.client_name = updates.client_name.trim();
  if (updates.project_name !== undefined) payload.project_name = updates.project_name.trim();
  if (updates.summary !== undefined) payload.summary = updates.summary.trim();
  if (updates.primary_domain !== undefined) payload.primary_domain = updates.primary_domain.trim();
  if (updates.status !== undefined) payload.status = updates.status;
  if (updates.contact_name !== undefined) payload.contact_name = updates.contact_name.trim();
  if (updates.contact_email !== undefined) payload.contact_email = updates.contact_email.trim();
  if (updates.contact_phone !== undefined) payload.contact_phone = updates.contact_phone.trim();
  if (updates.contact_handle !== undefined) payload.contact_handle = updates.contact_handle.trim();
  if (updates.tech_stack !== undefined) payload.tech_stack = updates.tech_stack;
  if (updates.notes !== undefined) payload.notes = updates.notes.trim();

  const { error } = await supabase.from('client_projects').update(payload).eq('id', id);
  if (error) throw new Error(error.message);
  return getClientProjectById(id, false);
}

export async function deleteClientProject(id: string): Promise<void> {
  const supabase = supabaseServer();
  const { error } = await supabase.from('client_projects').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function upsertClientResource(
  clientId: string,
  input: {
    id?: string;
    category: ResourceCategory;
    provider: string;
    resource_name: string;
    account_email?: string;
    account_username?: string;
    connected_git_repo?: string;
    dashboard_url?: string;
    renewal_date?: string | null;
    billing_notes?: string;
    metadata?: Record<string, string>;
    secrets?: ResourceSecretItem[];
    notes?: string;
  }
): Promise<ClientResource> {
  const supabase = supabaseServer();

  // If updating an existing resource, preserve unchanged masked secrets!
  let finalSecrets: ResourceSecretItem[] = input.secrets || [];
  if (input.id) {
    const { data: existing } = await supabase
      .from('client_resources')
      .select('encrypted_secrets')
      .eq('id', input.id)
      .eq('client_id', clientId)
      .single();

    if (existing?.encrypted_secrets) {
      const existingDecoded = parseEncryptedSecrets(existing.encrypted_secrets);
      const existingMap = new Map(existingDecoded.map((s) => [s.id, s]));
      finalSecrets = finalSecrets.map((item) => {
        // If user did not change a masked value (still starts with ••••••••), keep original encrypted secret
        if (item.value.startsWith('••••••••') && existingMap.has(item.id)) {
          return { ...item, value: existingMap.get(item.id)!.value };
        }
        return item;
      });
    }
  }

  const encryptedSecrets = encryptSecretsArray(finalSecrets);

  const rowPayload = {
    client_id: clientId,
    category: input.category,
    provider: input.provider.trim(),
    resource_name: input.resource_name.trim(),
    account_email: (input.account_email || '').trim(),
    account_username: (input.account_username || '').trim(),
    connected_git_repo: (input.connected_git_repo || '').trim(),
    dashboard_url: (input.dashboard_url || '').trim(),
    renewal_date: input.renewal_date ? input.renewal_date : null,
    billing_notes: (input.billing_notes || '').trim(),
    metadata: input.metadata || {},
    encrypted_secrets: encryptedSecrets,
    notes: (input.notes || '').trim(),
  };

  if (input.id) {
    const { data, error } = await supabase
      .from('client_resources')
      .update(rowPayload)
      .eq('id', input.id)
      .eq('client_id', clientId)
      .select('*')
      .single();
    if (error || !data) throw new Error(error?.message || 'Failed to update resource');
    return mapResourceRow(data as RawResourceRow, false);
  } else {
    const { data, error } = await supabase
      .from('client_resources')
      .insert(rowPayload)
      .select('*')
      .single();
    if (error || !data) throw new Error(error?.message || 'Failed to add resource');
    return mapResourceRow(data as RawResourceRow, false);
  }
}

export async function deleteClientResource(clientId: string, resourceId: string): Promise<void> {
  const supabase = supabaseServer();
  const { error } = await supabase
    .from('client_resources')
    .delete()
    .eq('id', resourceId)
    .eq('client_id', clientId);
  if (error) throw new Error(error.message);
}
