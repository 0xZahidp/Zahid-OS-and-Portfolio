import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { supabaseServer } from '@/lib/supabase/server';
import { defaultPortfolioContent } from '@/data/default-content';
import { PortfolioContent, CmsSaveResponse } from '@/types/cms';

export const dynamic = 'force-dynamic';

const CONTENT_FILE_PATH = path.join(process.cwd(), 'src', 'data', 'portfolio-content.json');

async function readLocalContent(): Promise<PortfolioContent | null> {
  try {
    const data = await fs.readFile(CONTENT_FILE_PATH, 'utf-8');
    return JSON.parse(data) as PortfolioContent;
  } catch {
    return null;
  }
}

async function writeLocalContent(content: PortfolioContent): Promise<boolean> {
  try {
    await fs.writeFile(CONTENT_FILE_PATH, JSON.stringify(content, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Failed to write local content file:', err);
    return false;
  }
}

export async function GET() {
  try {
    // 1. Try Supabase if configured with non-placeholder URL
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (supabaseUrl && !supabaseUrl.includes('placeholder.supabase.co')) {
      try {
        const supabase = supabaseServer();
        // Query by id = 'current'
        const { data, error } = await supabase
          .from('portfolio_content')
          .select('data')
          .eq('id', 'current')
          .single();

        if (!error && data?.data) {
          return NextResponse.json({
            success: true,
            source: 'supabase',
            content: data.data as PortfolioContent,
          });
        }
      } catch (err) {
        console.warn('Supabase query failed, falling back to local file:', err);
      }
    }

    // 2. Try Local File
    const localContent = await readLocalContent();
    if (localContent) {
      return NextResponse.json({
        success: true,
        source: 'local_file',
        content: localContent,
      });
    }

    // 3. Fallback to Default Template Content
    return NextResponse.json({
      success: true,
      source: 'default',
      content: defaultPortfolioContent,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        success: false,
        source: 'error_fallback',
        error: message,
        content: defaultPortfolioContent,
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as PortfolioContent;

    if (!body || !body.profile) {
      return NextResponse.json(
        { success: false, error: 'Invalid content payload' },
        { status: 400 }
      );
    }

    // Extract any secret token to isolate it
    const tokenToSave = body.githubSettings?.token?.trim();

    // Sanitize content: NEVER write secrets to public disk JSON or public portfolio_content JSONB
    const sanitizedContent: PortfolioContent = {
      ...body,
      githubSettings: {
        ...body.githubSettings,
        token: undefined, // Secret stripped for disk and public storage
      },
      updatedAt: new Date().toISOString(),
    };

    const destinations: string[] = [];

    // 1. Write sanitized content to local file (zero-config persistence & offline dev)
    const localSaved = await writeLocalContent(sanitizedContent);
    if (localSaved) {
      destinations.push('local_file');
    }

    // 2. Write to Supabase if configured
    let supabaseStatus = 'not_configured';
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (supabaseUrl && !supabaseUrl.includes('placeholder.supabase.co')) {
      try {
        const supabase = supabaseServer();

        // Upsert portfolio content into data column (id = 'current')
        const { error: contentError } = await supabase.from('portfolio_content').upsert({
          id: 'current',
          data: sanitizedContent,
          updated_at: new Date().toISOString(),
        });

        if (!contentError) {
          destinations.push('supabase');
          supabaseStatus = 'success';
        } else {
          supabaseStatus = `table_error: ${contentError.message}`;
        }

        // If a GitHub token was supplied, securely save directly into app_settings table
        if (tokenToSave) {
          try {
            const { error: tokenError } = await supabase.from('app_settings').upsert({
              key: 'GITHUB_TOKEN',
              value: tokenToSave,
              is_secret: true,
              updated_at: new Date().toISOString(),
            });

            if (!tokenError) {
              destinations.push('supabase_app_settings');
            }
          } catch (tokenErr) {
            console.error('Failed to securely save GITHUB_TOKEN to app_settings:', tokenErr);
          }
        }
      } catch (err: unknown) {
        const errMessage = err instanceof Error ? err.message : 'Supabase sync failed';
        supabaseStatus = `error: ${errMessage}`;
      }
    }

    const response: CmsSaveResponse = {
      success: true,
      savedAt: sanitizedContent.updatedAt || new Date().toISOString(),
      destination: destinations,
      message: destinations.includes('supabase')
        ? 'Saved to Supabase and local cache successfully.'
        : 'Saved to local file. (Supabase not configured or table missing)',
    };

    return NextResponse.json({ ...response, supabaseStatus });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to save content';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
