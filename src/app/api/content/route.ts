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
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (supabaseUrl && !supabaseUrl.includes('placeholder.supabase.co')) {
      try {
        const supabase = supabaseServer();

        // 1. Try Relational Tables in Supabase
        const { data: profileRow } = await supabase.from('profiles').select('*').limit(1).maybeSingle();

        if (profileRow) {
          const [bioRes, expRes, projRes, skillRes, langRes, socRes, peepRes, setRes] = await Promise.all([
            supabase.from('bio_paragraphs').select('*').order('sort_order', { ascending: true }),
            supabase.from('experiences').select('*').order('sort_order', { ascending: true }),
            supabase.from('projects').select('*').order('sort_order', { ascending: true }),
            supabase.from('skills').select('*').order('sort_order', { ascending: true }),
            supabase.from('languages').select('*').order('sort_order', { ascending: true }),
            supabase.from('social_links').select('*').order('sort_order', { ascending: true }),
            supabase.from('suggested_people').select('*').order('sort_order', { ascending: true }),
            supabase.from('site_settings').select('*'),
          ]);

          const worksSetting = setRes.data?.find((s) => s.key === 'works_settings')?.value;
          const basedInSetting = setRes.data?.find((s) => s.key === 'based_in_settings')?.value;
          const githubSetting = setRes.data?.find((s) => s.key === 'github_settings')?.value;
          const richPeopleSetting = setRes.data?.find((s) => s.key === 'suggested_people_rich')?.value;

          const assembled: PortfolioContent = {
            profile: {
              id: profileRow.id,
              username: profileRow.username,
              full_name: profileRow.full_name,
              headline: profileRow.headline,
              bio: profileRow.bio,
              avatar_url: profileRow.avatar_url,
              location: profileRow.location,
              timezone: profileRow.timezone,
              availability: profileRow.availability,
              github_followers_count: profileRow.github_followers_count,
              roles: profileRow.roles || [],
            },
            bioParagraphs: (bioRes.data || []).map((b) => b.content),
            experience: (expRes.data && expRes.data.length > 0) ? expRes.data : defaultPortfolioContent.experience,
            projects: (projRes.data && projRes.data.length > 0) ? projRes.data : defaultPortfolioContent.projects,
            skills: (skillRes.data && skillRes.data.length > 0) ? skillRes.data : defaultPortfolioContent.skills,
            languages: (langRes.data && langRes.data.length > 0) ? langRes.data : defaultPortfolioContent.languages,
            socialLinks: (socRes.data && socRes.data.length > 0) ? socRes.data : defaultPortfolioContent.socialLinks,
            suggestedPeople: (Array.isArray(richPeopleSetting) && richPeopleSetting.length > 0)
              ? richPeopleSetting
              : (peepRes.data && peepRes.data.length > 0)
              ? peepRes.data
              : defaultPortfolioContent.suggestedPeople,
            worksSettings: worksSetting || defaultPortfolioContent.worksSettings,
            basedInSettings: basedInSetting || defaultPortfolioContent.basedInSettings,
            githubSettings: githubSetting || defaultPortfolioContent.githubSettings,
            updatedAt: profileRow.updated_at || new Date().toISOString(),
          };

          return NextResponse.json({
            success: true,
            source: 'supabase_relational',
            content: assembled,
          });
        }

        // 2. Fallback to monolithic portfolio_content table if relational schema not yet migrated
        const { data: legacyData, error: legacyErr } = await supabase
          .from('portfolio_content')
          .select('data')
          .eq('id', 'current')
          .maybeSingle();

        if (!legacyErr && legacyData?.data) {
          return NextResponse.json({
            success: true,
            source: 'supabase_legacy',
            content: legacyData.data as PortfolioContent,
          });
        }
      } catch (err) {
        console.warn('Supabase query failed, falling back to local file:', err);
      }
    }

    // 3. Try Local File
    const localContent = await readLocalContent();
    if (localContent) {
      return NextResponse.json({
        success: true,
        source: 'local_file',
        content: localContent,
      });
    }

    // 4. Fallback to Default Content
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

    const tokenToSave = body.githubSettings?.token?.trim();

    // Sanitize content: strip secret token before persisting
    const sanitizedContent: PortfolioContent = {
      ...body,
      githubSettings: {
        ...body.githubSettings,
        token: undefined,
      },
      updatedAt: new Date().toISOString(),
    };

    const destinations: string[] = [];

    // 1. Write to local file (ensures zero downtime & offline dev)
    const localSaved = await writeLocalContent(sanitizedContent);
    if (localSaved) {
      destinations.push('local_file');
    }

    // 2. Write to Supabase Relational Tables
    let supabaseStatus = 'not_configured';
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

    if (supabaseUrl && !supabaseUrl.includes('placeholder.supabase.co')) {
      try {
        const supabase = supabaseServer();
        const p = sanitizedContent.profile;

        // Upsert Profiles table
        const profilePromise = supabase.from('profiles').upsert({
          id: p.id || 'usr_zahid',
          username: p.username || '0xZahidp',
          full_name: p.full_name || '',
          headline: p.headline || '',
          bio: p.bio || '',
          avatar_url: p.avatar_url || '',
          location: p.location || '',
          timezone: p.timezone || 'Asia/Dhaka',
          availability: p.availability || '',
          github_followers_count: p.github_followers_count || 0,
          roles: p.roles || [],
          updated_at: new Date().toISOString(),
        });

        // Upsert Bio Paragraphs
        const bioRows = (sanitizedContent.bioParagraphs || []).map((content, idx) => ({
          id: `bio-${idx + 1}`,
          sort_order: idx,
          content,
          updated_at: new Date().toISOString(),
        }));
        const bioPromise = bioRows.length > 0 ? supabase.from('bio_paragraphs').upsert(bioRows) : Promise.resolve();

        // Upsert Experiences
        const expRows = (sanitizedContent.experience || []).map((exp, idx) => ({
          ...exp,
          sort_order: idx,
          updated_at: new Date().toISOString(),
        }));
        const expPromise = expRows.length > 0 ? supabase.from('experiences').upsert(expRows) : Promise.resolve();

        // Upsert Projects
        const projRows = (sanitizedContent.projects || []).map((proj, idx) => ({
          id: proj.id,
          title: proj.title,
          description: proj.description || '',
          tags: proj.tags || [],
          image_url: proj.image_url || '',
          project_url: proj.project_url || '',
          repository_url: proj.repository_url || '',
          stars: proj.stars || 0,
          highlight_badge: proj.highlightBadge || '',
          logo_type: proj.logoType || '',
          sort_order: idx,
          updated_at: new Date().toISOString(),
        }));
        const projPromise = projRows.length > 0 ? supabase.from('projects').upsert(projRows) : Promise.resolve();

        // Upsert Skills
        const skillRows = (sanitizedContent.skills || []).map((skill, idx) => ({
          id: skill.id || skill.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
          name: skill.name,
          category: skill.category || 'tech',
          color: skill.color || '',
          sort_order: idx,
          updated_at: new Date().toISOString(),
        }));
        const skillPromise = skillRows.length > 0 ? supabase.from('skills').upsert(skillRows) : Promise.resolve();

        // Upsert Languages
        const langRows = (sanitizedContent.languages || []).map((lang, idx) => ({
          id: `lang-${lang.name.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
          name: lang.name,
          proficiency: lang.proficiency,
          rating: lang.rating || 5,
          note: lang.note || '',
          has_voice: lang.hasVoice !== false,
          sort_order: idx,
          updated_at: new Date().toISOString(),
        }));
        const langPromise = langRows.length > 0 ? supabase.from('languages').upsert(langRows) : Promise.resolve();

        // Upsert Social Links
        const socRows = (sanitizedContent.socialLinks || []).map((soc, idx) => ({
          ...soc,
          sort_order: idx,
          updated_at: new Date().toISOString(),
        }));
        const socPromise = socRows.length > 0 ? supabase.from('social_links').upsert(socRows) : Promise.resolve();

        // Upsert Suggested People (safe columns for relational table)
        const peepRows = (sanitizedContent.suggestedPeople || []).map((peep, idx) => ({
          id: peep.id,
          name: peep.name,
          role: peep.role || '',
          avatar_url: peep.avatar_url || '',
          url: peep.primaryUrl || peep.url || '',
          handle: peep.primaryHandle || peep.handle || '',
          sort_order: idx,
          updated_at: new Date().toISOString(),
        }));
        const peepPromise = peepRows.length > 0 ? supabase.from('suggested_people').upsert(peepRows) : Promise.resolve();

        // Upsert Site Settings (persisting rich people data with full quotes, platforms, tags, verified status)
        const settingsRows = [
          { key: 'works_settings', value: sanitizedContent.worksSettings, updated_at: new Date().toISOString() },
          { key: 'based_in_settings', value: sanitizedContent.basedInSettings, updated_at: new Date().toISOString() },
          { key: 'github_settings', value: sanitizedContent.githubSettings, updated_at: new Date().toISOString() },
          { key: 'suggested_people_rich', value: sanitizedContent.suggestedPeople, updated_at: new Date().toISOString() },
        ];
        const setPromise = supabase.from('site_settings').upsert(settingsRows);

        // Also upsert legacy monolithic portfolio_content if table exists
        const legacyPromise = (async () => {
          try {
            await supabase.from('portfolio_content').upsert({
              id: 'current',
              data: sanitizedContent,
              updated_at: new Date().toISOString(),
            });
          } catch {
            // ignore if legacy table does not exist
          }
        })();

        // Execute all promises
        const [pRes] = await Promise.all([
          profilePromise,
          bioPromise,
          expPromise,
          projPromise,
          skillPromise,
          langPromise,
          socPromise,
          peepPromise,
          setPromise,
          legacyPromise,
        ]);

        if (!pRes.error) {
          destinations.push('supabase_relational');
          supabaseStatus = 'success';
        } else {
          supabaseStatus = `relational_error: ${pRes.error.message}`;
        }

        // Save secret GITHUB_TOKEN to app_settings if provided
        if (tokenToSave) {
          try {
            await supabase.from('app_settings').upsert({
              key: 'GITHUB_TOKEN',
              value: tokenToSave,
              is_secret: true,
              updated_at: new Date().toISOString(),
            });
            destinations.push('supabase_app_settings');
          } catch {
            // ignore
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
      message: destinations.includes('supabase_relational')
        ? 'Saved directly to Supabase section tables successfully.'
        : destinations.includes('local_file')
          ? 'Saved to local file. (Run SQL schema in Supabase to enable cloud tables)'
          : 'Content received.',
    };

    return NextResponse.json({ ...response, supabaseStatus });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to save content';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
