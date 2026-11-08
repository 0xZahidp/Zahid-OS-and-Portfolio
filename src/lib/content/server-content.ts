import { unstable_cache } from 'next/cache';
import { supabaseServer } from '@/lib/supabase/server';
import { defaultPortfolioContent } from '@/data/default-content';
import { PortfolioContent } from '@/types/cms';

/**
 * Fetch portfolio content directly from Supabase tables in parallel.
 * Selects only needed columns and eliminates serial waterfalls.
 */
export async function fetchPortfolioContentServer(): Promise<PortfolioContent> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (supabaseUrl && !supabaseUrl.includes('placeholder.supabase.co')) {
    try {
      const supabase = supabaseServer();

      // Query all relational tables & public settings in a single parallel batch
      const [
        profileRes,
        bioRes,
        expRes,
        projRes,
        skillRes,
        langRes,
        socRes,
        peepRes,
        setRes,
      ] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, username, full_name, headline, bio, avatar_url, location, timezone, availability, github_followers_count, roles, updated_at')
          .limit(1)
          .maybeSingle(),
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

      const profileRow = profileRes.data;

      if (profileRow) {
        const worksSetting = setRes.data?.find((s) => s.key === 'works_settings')?.value;
        const basedInSetting = setRes.data?.find((s) => s.key === 'based_in_settings')?.value;
        const rawGithubSetting = setRes.data?.find((s) => s.key === 'github_settings')?.value as Record<string, unknown> | undefined;
        const richPeopleSetting = setRes.data?.find((s) => s.key === 'suggested_people_rich')?.value;
        const librarySetting = setRes.data?.find((s) => s.key === 'library_data')?.value;
        const rawVersion = setRes.data?.find((s) => s.key === 'content_version')?.value;
        const contentVersion = typeof rawVersion === 'number' ? rawVersion : 0;

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

        return {
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
      }

      // Fallback to legacy monolithic table if relational schema not present
      const { data: legacyData } = await supabase
        .from('portfolio_content')
        .select('data')
        .eq('id', 'current')
        .maybeSingle();

      if (legacyData?.data) {
        const legacyObj = legacyData.data as PortfolioContent;
        return {
          ...legacyObj,
          version: typeof legacyObj.version === 'number' ? legacyObj.version : 0,
          githubSettings: legacyObj.githubSettings
            ? { ...legacyObj.githubSettings, token: undefined }
            : defaultPortfolioContent.githubSettings,
        };
      }
    } catch (err) {
      console.warn('Supabase server fetch error, using default portfolio content:', err);
    }
  }

  return { ...defaultPortfolioContent, version: 0 };
}

/**
 * Next.js ISR cached content getter.
 * Caches content for 300 seconds and instantly invalidates on tag 'portfolio_content'.
 */
export const getCachedPortfolioContent = unstable_cache(
  async () => fetchPortfolioContentServer(),
  ['portfolio_content'],
  {
    revalidate: 300,
    tags: ['portfolio_content'],
  }
);

