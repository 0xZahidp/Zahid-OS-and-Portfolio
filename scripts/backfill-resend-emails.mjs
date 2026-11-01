#!/usr/bin/env node
/**
 * Backfill existing received emails from Resend Receiving into Supabase & Local Store.
 * Usage: node scripts/backfill-resend-emails.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';

// 1. Read environment variables from .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
if (!fs.existsSync(envPath)) {
  console.error('Error: .env.local not found in current directory.');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
for (const line of envContent.split('\n')) {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const idx = trimmed.indexOf('=');
    if (idx !== -1) {
      env[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim();
    }
  }
}

const apiKey = env.RESEND_API_KEY;
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!apiKey) {
  console.error('Error: RESEND_API_KEY is not defined in .env.local');
  process.exit(1);
}

console.log('--- Resend Inbound Email Backfill ---');
console.log('Resend Key:', apiKey.substring(0, 8) + '...');
console.log('Supabase URL:', supabaseUrl || 'None');

const resend = new Resend(apiKey);
const supabase = supabaseUrl && serviceKey ? createClient(supabaseUrl, serviceKey) : null;

async function runBackfill() {
  try {
    // 1. List all received emails from Resend Receiving
    console.log('Fetching received emails from Resend API...');
    const listRes = await resend.emails.receiving.list();

    if (listRes.error || !listRes.data) {
      console.error('Failed to list emails from Resend:', listRes.error);
      process.exit(1);
    }

    const emailSummaries = listRes.data.data || [];
    console.log(`Found ${emailSummaries.length} received emails in Resend.`);

    if (emailSummaries.length === 0) {
      console.log('No received emails found in Resend.');
      return;
    }

    // 2. Fetch full email for each and save
    let successCount = 0;

    for (const item of emailSummaries) {
      console.log(`\nFetching details for email [${item.id}] Subject: "${item.subject}"...`);
      const fullRes = await resend.emails.receiving.get(item.id);
      if (fullRes.error || !fullRes.data) {
        console.error(`  Failed to get details for ${item.id}:`, fullRes.error);
        continue;
      }

      const email = fullRes.data;
      const textBody = email.text || (email.html ? email.html.replace(/<[^>]+>/g, ' ') : '');
      const toStr = Array.isArray(email.to) ? email.to.join(', ') : (email.to || 'hello@zahidp.com');
      const receivedAt = email.created_at || new Date().toISOString();

      let fromName = '';
      let fromEmail = email.from || '';
      const headerFrom = email.headers?.from;
      if (typeof headerFrom === 'string') {
        const match = headerFrom.match(/^(?:"?([^"]*)"?\s)?<?([^>]+)>?$/);
        if (match) {
          fromName = match[1] ? match[1].trim() : '';
          fromEmail = match[2] ? match[2].trim() : email.from;
        }
      }
      if (!fromName) {
        fromName = fromEmail.split('@')[0] || 'Sender';
      }

      const row = {
        id: `msg_resend_${email.id}`,
        resend_id: email.id,
        from_name: fromName,
        from_email: fromEmail,
        to_email: toStr,
        subject: email.subject || '(No Subject)',
        text_body: textBody,
        html_body: email.html || '',
        received_at: receivedAt,
        is_read: false,
        is_starred: false,
        is_trashed: false,
        label: 'inbox',
        direction: 'inbound',
        in_reply_to: email.headers?.['in-reply-to'] || '',
        references_header: email.headers?.references || '',
        raw_headers: email.headers || {},
        attachments: email.attachments || [],
        // Base compatibility fields
        name: fromName,
        email: fromEmail,
        recipient: toStr,
        body: textBody || email.html || '',
        status: 'unread',
        is_sent: false,
        created_at: receivedAt,
      };

      if (supabase) {
        const { error } = await supabase.from('inbox_messages').upsert(row, { onConflict: 'resend_id' });
        if (error) {
          if (error.message?.includes('column')) {
            // fallback to base columns
            await supabase.from('inbox_messages').upsert({
              id: row.id,
              name: row.name,
              email: row.email,
              recipient: row.recipient,
              subject: row.subject,
              body: row.body,
              status: row.status,
              is_sent: false,
              created_at: row.created_at,
            });
            console.log(`  Saved ${email.id} to Supabase (base columns)`);
          } else {
            console.warn(`  Supabase upsert notice for ${email.id}:`, error.message);
          }
        } else {
          console.log(`  Saved ${email.id} to Supabase (rich columns)`);
        }
      }

      successCount++;
    }

    // 3. Also purge mock messages from local store if needed
    const storePath = path.resolve(process.cwd(), 'src/data/inbox-store.json');
    if (fs.existsSync(storePath)) {
      try {
        const raw = fs.readFileSync(storePath, 'utf-8');
        const parsed = JSON.parse(raw);
        const list = Array.isArray(parsed) ? parsed : (parsed.messages || []);
        const filtered = list.filter((m) => !['msg_inbox_1', 'msg_inbox_2', 'msg_inbox_3', 'msg_sent_1'].includes(m.id));
        fs.writeFileSync(storePath, JSON.stringify({ updatedAt: new Date().toISOString(), messages: filtered }, null, 2), 'utf-8');
      } catch {}
    }

    console.log(`\nSuccessfully backfilled ${successCount} emails from Resend!`);
  } catch (err) {
    console.error('Backfill failed with error:', err);
    process.exit(1);
  }
}

runBackfill();

