import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { revalidatePath, revalidateTag } from 'next/cache';
import { supabaseServer } from '@/lib/supabase/server';
import { defaultPortfolioContent } from '@/data/default-content';
import { PortfolioContent, CmsSaveResponse } from '@/types/cms';
import { requireAdmin, isAdminRequest } from '@/lib/auth/admin-auth';

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
  if (process.env.VERCEL) {
    return true;
  }
  try {
    await fs.writeFile(CONTENT_FILE_PATH, JSON.stringify(content, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.warn('Failed to write local content file:', err);
    return false;
  }
}

export async function GET(req: NextRequest) {
  const isAdmin = await isAdminRequest(req);
  const responseHeaders = new Headers();
  if (isAdmin) {
    responseHeaders.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    responseHeaders.set('Pragma', 'no-cache');
  } else {
    responseHeaders.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
  }

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (supabaseUrl && !supabaseUrl.includes('placeholder.supabase.co')) {
      try {
        const supabase = supabaseServer();

        // 1. Try Relational Tables in Supabase (Explicit whitelisted columns & public site_settings keys only)
        const { data: profileRow } = await supabase
          .from('profiles')
          .select('id, username, full_name, headline, bio, avatar_url, location, timezone, availability, github_followers_count, roles, updated_at')
          .limit(1)
          .maybeSingle();

        if (profileRow) {
          const [bioRes, expRes, projRes, skillRes, langRes, socRes, peepRes, setRes] = await Promise.all([
            supabase
              .from('bio_paragraphs')
              .select('id, sort_order, content')
              .order('sort_order', { ascending: true }),
            supabase
              .from('experiences')
              .select('id, company, company_url, company_logo, position, period, type, workplace_type, description, highlights, bullet_points, tags, is_current, sort_order')
              .order('sort_order', { ascending: true }),
            supabase
              .from('projects')
              .select('id, title, description, tags, image_url, project_url, repository_url, stars, highlight_badge, logo_type, sort_order')
              .order('sort_order', { ascending: true }),
            supabase
              .from('skills')
              .select('id, name, category, color, sort_order')
              .order('sort_order', { ascending: true }),
            supabase
              .from('languages')
              .select('id, name, proficiency, rating, note, has_voice, sort_order')
              .order('sort_order', { ascending: true }),
            supabase
              .from('social_links')
              .select('id, platform, url, handle, label, sort_order')
              .order('sort_order', { ascending: true }),
            supabase
              .from('suggested_people')
              .select('id, name, role, avatar_url, url, handle, sort_order')
              .order('sort_order', { ascending: true }),
            supabase
              .from('site_settings')
              .select('key, value')
              .in('key', [
                'works_settings',
                'based_in_settings',
                'github_settings',
                'suggested_people_rich',
                'library_data',
                'content_version',
              ]),
          ]);

          const worksSetting = setRes.data?.find((s) => s.key === 'works_settings')?.value;
          const basedInSetting = setRes.data?.find((s) => s.key === 'based_in_settings')?.value;
          const rawGithubSetting = setRes.data?.find((s) => s.key === 'github_settings')?.value as Record<string, unknown> | undefined;
          const richPeopleSetting = setRes.data?.find((s) => s.key === 'suggested_people_rich')?.value;
          const librarySetting = setRes.data?.find((s) => s.key === 'library_data')?.value;
          const rawVersion = setRes.data?.find((s) => s.key === 'content_version')?.value;
          const contentVersion = typeof rawVersion === 'number' ? rawVersion : 0;

          // Never expose tokens or private fields
          const githubSetting = rawGithubSetting
            ? { ...rawGithubSetting, token: undefined }
            : defaultPortfolioContent.githubSettings;

          const loadedIds = {
            languages: (langRes.data || []).map((l) => l.id),
            skills: (skillRes.data || []).map((s) => s.id),
            projects: (projRes.data || []).map((p) => p.id),
            experience: (expRes.data || []).map((e) => e.id),
            socialLinks: (socRes.data || []).map((s) => s.id),
            suggestedPeople: (peepRes.data || []).map((p) => p.id),
            bioParagraphs: (bioRes.data || []).map((b) => b.id),
          };

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
            experience: expRes.data || [],
            projects: projRes.data || [],
            skills: skillRes.data || [],
            languages: (langRes.data || []).map((l) => ({
              id: l.id,
              name: l.name,
              proficiency: l.proficiency,
              rating: l.rating ?? 5,
              note: l.note || '',
              has_voice: l.has_voice !== false,
              hasVoice: l.has_voice !== false,
              sort_order: l.sort_order ?? 0,
            })),
            socialLinks: socRes.data || [],
            suggestedPeople: Array.isArray(richPeopleSetting)
              ? richPeopleSetting
              : (peepRes.data || []),
            worksSettings: worksSetting || defaultPortfolioContent.worksSettings,
            basedInSettings: basedInSetting || defaultPortfolioContent.basedInSettings,
            githubSettings: githubSetting as unknown as typeof defaultPortfolioContent.githubSettings,
            libraryData: librarySetting || defaultPortfolioContent.libraryData,
            updatedAt: profileRow.updated_at || new Date().toISOString(),
            version: contentVersion,
            loadedIds,
          };

          return NextResponse.json(
            {
              success: true,
              source: 'supabase_relational',
              content: assembled,
              version: contentVersion,
              loadedIds,
            },
            { headers: responseHeaders }
          );
        }

        // 2. Fallback to monolithic portfolio_content table if relational schema not yet migrated
        const { data: legacyData, error: legacyErr } = await supabase
          .from('portfolio_content')
          .select('data')
          .eq('id', 'current')
          .maybeSingle();

        if (!legacyErr && legacyData?.data) {
          const legacyObj = legacyData.data as PortfolioContent;
          const legacyVersion = typeof legacyObj.version === 'number' ? legacyObj.version : 0;
          const sanitizedLegacy: PortfolioContent = {
            ...legacyObj,
            version: legacyVersion,
            githubSettings: legacyObj.githubSettings
              ? { ...legacyObj.githubSettings, token: undefined }
              : defaultPortfolioContent.githubSettings,
          };
          return NextResponse.json(
            {
              success: true,
              source: 'supabase_legacy',
              content: sanitizedLegacy,
              version: legacyVersion,
            },
            { headers: responseHeaders }
          );
        }
      } catch (err) {
        console.warn('Supabase query failed, falling back to local file:', err);
      }
    }

    // 3. Try Local File
    const localContent = await readLocalContent();
    if (localContent) {
      const localVersion = typeof localContent.version === 'number' ? localContent.version : 0;
      const sanitizedLocal: PortfolioContent = {
        ...localContent,
        version: localVersion,
        githubSettings: localContent.githubSettings
          ? { ...localContent.githubSettings, token: undefined }
          : defaultPortfolioContent.githubSettings,
      };
      return NextResponse.json(
        {
          success: true,
          source: 'local_file',
          content: sanitizedLocal,
          version: localVersion,
        },
        { headers: responseHeaders }
      );
    }

    // 4. Fallback to Default Content
    return NextResponse.json(
      {
        success: true,
        source: 'default',
        content: { ...defaultPortfolioContent, version: 0 },
        version: 0,
      },
      { headers: responseHeaders }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        success: false,
        source: 'error_fallback',
        error: message,
        content: defaultPortfolioContent,
      },
      { status: 500, headers: responseHeaders }
    );
  }
}

export async function POST(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

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

    const isClientLoaded = body.clientLoaded === true;
    const isConfirmDelete = body.confirmDelete === true;

    const destinations: string[] = [];

    // SINGLE SOURCE OF TRUTH STRATEGY:
    // Relational tables in Supabase (profiles, languages, skills, projects, etc.) are the primary source of truth.
    // The legacy monolithic portfolio_content table (id='current') and local JSON file are kept strictly in sync
    // with the relational data as zero-downtime backwards-compatible mirrors. Reads strictly prefer relational tables.

    // 2. Write to Supabase Relational Tables
    let supabaseStatus = 'not_configured';
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

    const expectedVersion =
      typeof body.expectedVersion === 'number'
        ? body.expectedVersion
        : typeof body.version === 'number'
        ? body.version
        : undefined;

    if (supabaseUrl && !supabaseUrl.includes('placeholder.supabase.co')) {
      try {
        const supabase = supabaseServer();
        const p = sanitizedContent.profile;

        // Fetch existing IDs for all list tables and current content_version
        const [
          existingBioRes,
          existingExpRes,
          existingProjRes,
          existingSkillRes,
          existingLangRes,
          existingSocRes,
          existingPeepRes,
          versionRes,
        ] = await Promise.all([
          supabase.from('bio_paragraphs').select('id, sort_order'),
          supabase.from('experiences').select('id'),
          supabase.from('projects').select('id'),
          supabase.from('skills').select('id'),
          supabase.from('languages').select('id, name'),
          supabase.from('social_links').select('id'),
          supabase.from('suggested_people').select('id'),
          supabase.from('site_settings').select('value').eq('key', 'content_version').maybeSingle(),
        ]);

        let currentVersion = 0;
        const vRow = versionRes?.data;
        if (vRow?.value !== undefined && typeof vRow.value === 'number') {
          currentVersion = vRow.value;
        } else if (vRow?.value && typeof (vRow.value as { version?: unknown })?.version === 'number') {
          currentVersion = (vRow.value as { version: number }).version;
        }

        if (expectedVersion !== undefined && expectedVersion !== currentVersion) {
          return NextResponse.json(
            {
              success: false,
              error: 'This data changed elsewhere, reload before saving',
              conflict: true,
              currentVersion,
            },
            { status: 409 }
          );
        }

        const nextVersion = currentVersion + 1;
        sanitizedContent.version = nextVersion;

        const existingBioRows = existingBioRes.data || [];
        const existingBioIds = existingBioRows.map((b) => b.id);
        const existingExpIds = (existingExpRes.data || []).map((r) => r.id);
        const existingProjIds = (existingProjRes.data || []).map((r) => r.id);
        const existingSkillIds = (existingSkillRes.data || []).map((r) => r.id);
        const existingLangRows = existingLangRes.data || [];
        const existingLangIds = existingLangRows.map((r) => r.id);
        const existingSocIds = (existingSocRes.data || []).map((r) => r.id);
        const existingPeepIds = (existingPeepRes.data || []).map((r) => r.id);

        const clientLoadedIds = body.loadedIds;

        // Map incoming rows with IDs and sort_order
        const bioRows = (sanitizedContent.bioParagraphs || []).map((content, idx) => {
          const existing = existingBioRows.find((b) => b.sort_order === idx);
          return {
            id: existing ? existing.id : `bio-${idx + 1}`,
            sort_order: idx,
            content,
            updated_at: new Date().toISOString(),
          };
        });
        const incomingBioIds = bioRows.map((r) => r.id);
        const candidateBioIds = clientLoadedIds?.bioParagraphs
          ? existingBioIds.filter((id) => clientLoadedIds.bioParagraphs!.includes(id))
          : existingBioIds;
        const deletedBioIds = candidateBioIds.filter((id) => !incomingBioIds.includes(id));

        const expRows = (sanitizedContent.experience || []).map((exp, idx) => ({
          ...exp,
          id: exp.id || `exp_${Date.now()}_${idx}`,
          sort_order: idx,
          updated_at: new Date().toISOString(),
        }));
        const incomingExpIds = expRows.map((r) => r.id);
        const candidateExpIds = clientLoadedIds?.experience
          ? existingExpIds.filter((id) => clientLoadedIds.experience!.includes(id))
          : existingExpIds;
        const deletedExpIds = candidateExpIds.filter((id) => !incomingExpIds.includes(id));

        const projRows = (sanitizedContent.projects || []).map((proj, idx) => ({
          id: proj.id || `proj_${Date.now()}_${idx}`,
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
        const incomingProjIds = projRows.map((r) => r.id);
        const candidateProjIds = clientLoadedIds?.projects
          ? existingProjIds.filter((id) => clientLoadedIds.projects!.includes(id))
          : existingProjIds;
        const deletedProjIds = candidateProjIds.filter((id) => !incomingProjIds.includes(id));

        const skillRows = (sanitizedContent.skills || []).map((skill, idx) => ({
          id: skill.id || skill.name.toLowerCase().replace(/[^a-z0-9]/g, '-') || `skill_${Date.now()}_${idx}`,
          name: skill.name,
          category: skill.category || 'tech',
          color: skill.color || '',
          sort_order: idx,
          updated_at: new Date().toISOString(),
        }));
        const incomingSkillIds = skillRows.map((r) => r.id);
        const candidateSkillIds = clientLoadedIds?.skills
          ? existingSkillIds.filter((id) => clientLoadedIds.skills!.includes(id))
          : existingSkillIds;
        const deletedSkillIds = candidateSkillIds.filter((id) => !incomingSkillIds.includes(id));

        const langRows = (sanitizedContent.languages || []).map((lang, idx) => {
          let langId = lang.id;
          if (!langId) {
            const existingByName = existingLangRows.find((r) => r.name.toLowerCase() === lang.name.toLowerCase());
            langId = existingByName ? existingByName.id : `lang_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
          }
          return {
            id: langId,
            name: lang.name,
            proficiency: lang.proficiency,
            rating: lang.rating || 5,
            note: lang.note || '',
            has_voice: lang.hasVoice !== false && lang.has_voice !== false,
            sort_order: idx,
            updated_at: new Date().toISOString(),
          };
        });
        const incomingLangIds = langRows.map((r) => r.id);
        // Snapshot-based delete: only delete IDs that client received when loading
        const candidateLangIds = clientLoadedIds?.languages
          ? existingLangIds.filter((id) => clientLoadedIds.languages!.includes(id))
          : existingLangIds;
        const deletedLangIds = candidateLangIds.filter((id) => !incomingLangIds.includes(id));

        const socRows = (sanitizedContent.socialLinks || []).map((soc, idx) => ({
          ...soc,
          id: soc.id || `soc_${Date.now()}_${idx}`,
          sort_order: idx,
          updated_at: new Date().toISOString(),
        }));
        const incomingSocIds = socRows.map((r) => r.id);
        const candidateSocIds = clientLoadedIds?.socialLinks
          ? existingSocIds.filter((id) => clientLoadedIds.socialLinks!.includes(id))
          : existingSocIds;
        const deletedSocIds = candidateSocIds.filter((id) => !incomingSocIds.includes(id));

        const peepRows = (sanitizedContent.suggestedPeople || []).map((peep, idx) => ({
          id: peep.id || `peep_${Date.now()}_${idx}`,
          name: peep.name,
          role: peep.role || '',
          avatar_url: peep.avatar_url || '',
          url: peep.primaryUrl || peep.url || '',
          handle: peep.primaryHandle || peep.handle || '',
          sort_order: idx,
          updated_at: new Date().toISOString(),
        }));
        const incomingPeepIds = peepRows.map((r) => r.id);
        const candidatePeepIds = clientLoadedIds?.suggestedPeople
          ? existingPeepIds.filter((id) => clientLoadedIds.suggestedPeople!.includes(id))
          : existingPeepIds;
        const deletedPeepIds = candidatePeepIds.filter((id) => !incomingPeepIds.includes(id));

        // Mass Deletion Guard:
        // Applied only to collections with > 8 items when deleting > 3 items.
        // If deleting > 50% without confirmDelete flag, block with 400.
        const collectionsToCheck = [
          { name: 'bio_paragraphs', existing: existingBioIds, deleted: deletedBioIds },
          { name: 'experiences', existing: existingExpIds, deleted: deletedExpIds },
          { name: 'projects', existing: existingProjIds, deleted: deletedProjIds },
          { name: 'skills', existing: existingSkillIds, deleted: deletedSkillIds },
          { name: 'languages', existing: existingLangIds, deleted: deletedLangIds },
          { name: 'social_links', existing: existingSocIds, deleted: deletedSocIds },
          { name: 'suggested_people', existing: existingPeepIds, deleted: deletedPeepIds },
        ];

        if (isClientLoaded) {
          for (const col of collectionsToCheck) {
            if (col.existing.length > 8 && col.deleted.length > 3) {
              const deleteRatio = col.deleted.length / col.existing.length;
              if (deleteRatio > 0.5 && !isConfirmDelete) {
                return NextResponse.json(
                  {
                    success: false,
                    error: `Mass deletion guard: deleting ${col.deleted.length} of ${col.existing.length} items (>50%) in ${col.name} requires explicit confirmation.`,
                    requiresConfirmation: true,
                    collection: col.name,
                    deletedCount: col.deleted.length,
                    totalCount: col.existing.length,
                  },
                  { status: 400 }
                );
              }
            }
          }
        }

        // Synchronize sanitizedContent with generated IDs and sort order
        sanitizedContent.languages = langRows.map((r) => ({
          id: r.id,
          name: r.name,
          proficiency: r.proficiency,
          rating: r.rating,
          note: r.note,
          has_voice: r.has_voice,
          hasVoice: r.has_voice,
          sort_order: r.sort_order,
        }));
        sanitizedContent.experience = expRows;
        sanitizedContent.projects = projRows;
        sanitizedContent.skills = skillRows;
        sanitizedContent.socialLinks = socRows;
        sanitizedContent.suggestedPeople = peepRows;
        sanitizedContent.bioParagraphs = bioRows.map((r) => r.content);

        const currentLoadedIds = {
          languages: langRows.map((r) => r.id as string),
          skills: skillRows.map((r) => r.id as string),
          projects: projRows.map((r) => r.id as string),
          experience: expRows.map((r) => r.id as string),
          socialLinks: socRows.map((r) => r.id as string),
          suggestedPeople: peepRows.map((r) => r.id as string),
          bioParagraphs: bioRows.map((r) => r.id as string),
        };
        sanitizedContent.loadedIds = currentLoadedIds;

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

        // Upsert Site Settings (persisting rich people data with full quotes, platforms, tags, verified status)
        const settingsRows = [
          { key: 'works_settings', value: sanitizedContent.worksSettings, updated_at: new Date().toISOString() },
          { key: 'based_in_settings', value: sanitizedContent.basedInSettings, updated_at: new Date().toISOString() },
          { key: 'github_settings', value: sanitizedContent.githubSettings, updated_at: new Date().toISOString() },
          { key: 'suggested_people_rich', value: sanitizedContent.suggestedPeople, updated_at: new Date().toISOString() },
          { key: 'library_data', value: sanitizedContent.libraryData, updated_at: new Date().toISOString() },
          { key: 'content_version', value: sanitizedContent.version, updated_at: new Date().toISOString() },
        ];
        const setPromise = supabase.from('site_settings').upsert(settingsRows);

        // Also upsert legacy monolithic portfolio_content with identical sanitized data to maintain single source of truth
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

        // 1. Upsert incoming rows first
        const [profileRes] = await Promise.all([
          profilePromise,
          bioRows.length > 0 ? supabase.from('bio_paragraphs').upsert(bioRows) : Promise.resolve(),
          expRows.length > 0 ? supabase.from('experiences').upsert(expRows) : Promise.resolve(),
          projRows.length > 0 ? supabase.from('projects').upsert(projRows) : Promise.resolve(),
          skillRows.length > 0 ? supabase.from('skills').upsert(skillRows) : Promise.resolve(),
          langRows.length > 0 ? supabase.from('languages').upsert(langRows) : Promise.resolve(),
          socRows.length > 0 ? supabase.from('social_links').upsert(socRows) : Promise.resolve(),
          peepRows.length > 0 ? supabase.from('suggested_people').upsert(peepRows) : Promise.resolve(),
          setPromise,
          legacyPromise,
        ]);

        // 2. Delete rows absent from payload (ONLY if client successfully loaded data)
        if (isClientLoaded) {
          const deletePromises: PromiseLike<unknown>[] = [];
          if (deletedBioIds.length > 0) deletePromises.push(supabase.from('bio_paragraphs').delete().in('id', deletedBioIds));
          if (deletedExpIds.length > 0) deletePromises.push(supabase.from('experiences').delete().in('id', deletedExpIds));
          if (deletedProjIds.length > 0) deletePromises.push(supabase.from('projects').delete().in('id', deletedProjIds));
          if (deletedSkillIds.length > 0) deletePromises.push(supabase.from('skills').delete().in('id', deletedSkillIds));
          if (deletedLangIds.length > 0) deletePromises.push(supabase.from('languages').delete().in('id', deletedLangIds));
          if (deletedSocIds.length > 0) deletePromises.push(supabase.from('social_links').delete().in('id', deletedSocIds));
          if (deletedPeepIds.length > 0) deletePromises.push(supabase.from('suggested_people').delete().in('id', deletedPeepIds));

          if (deletePromises.length > 0) {
            await Promise.all(deletePromises);
          }
        }

        if (!profileRes.error) {
          destinations.push('supabase_relational');
          supabaseStatus = 'success';
        } else {
          supabaseStatus = `relational_error: ${profileRes.error.message}`;
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
    } else {
      const local = await readLocalContent();
      const currentVersion = typeof local?.version === 'number' ? local.version : 0;
      if (expectedVersion !== undefined && expectedVersion !== currentVersion) {
        return NextResponse.json(
          {
            success: false,
            error: 'This data changed elsewhere, reload before saving',
            conflict: true,
            currentVersion,
          },
          { status: 409 }
        );
      }
      sanitizedContent.version = currentVersion + 1;
    }

    // Write to local file (ensures zero downtime & offline dev fallback)
    const localSaved = await writeLocalContent(sanitizedContent);
    if (localSaved) {
      destinations.push('local_file');
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
      version: sanitizedContent.version,
    };

    // Revalidate public pages and cache tags
    try {
      revalidatePath('/');
      revalidatePath('/admin');
      revalidatePath('/focus');
      revalidateTag('portfolio_content');
    } catch (revalErr) {
      console.warn('Next.js cache revalidation failed:', revalErr);
    }

    return NextResponse.json({
      ...response,
      supabaseStatus,
      content: sanitizedContent,
      loadedIds: sanitizedContent.loadedIds,
      version: sanitizedContent.version,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to save content';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
