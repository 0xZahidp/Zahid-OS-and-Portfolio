import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/admin-auth';

export const revalidate = 3600; // Cache for 1 hour

const USERNAME = '0xZahidp';

const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: '#3178c6',
  JavaScript: '#f1e05a',
  Python: '#3572A5',
  Dart: '#00B4AB',
  C: '#555555',
  'C++': '#f34b7d',
  HTML: '#e34c26',
  CSS: '#563d7c',
  PHP: '#4F5D95',
};

export interface PinnedRepo {
  id: string;
  name: string;
  title: string;
  description: string;
  language: string;
  languageColor: string;
  stars: number;
  forks: number;
  url: string;
}

interface GraphQLDay {
  date: string;
  contributionCount: number;
  contributionLevel: string;
}

interface GraphQLWeek {
  contributionDays: GraphQLDay[];
}

interface GraphQLRepoNode {
  name: string;
  nameWithOwner: string;
  description: string | null;
  url: string;
  stargazerCount: number;
  forkCount: number;
  primaryLanguage?: {
    name: string;
    color: string;
  } | null;
}

interface RestRepoItem {
  name: string;
  full_name: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  html_url: string;
}

interface PublicDayItem {
  date: string;
  count: number;
  level: number;
}

// Fallback pinned repositories matching 0xZahidp's real projects
const DEFAULT_REPOS: PinnedRepo[] = [
  {
    id: 'MyTapCard',
    name: '0xZahidp/MyTapCard',
    title: 'MyTapCard',
    description:
      'MyTapCard is an NFC-powered digital business card and profile-sharing platform. It allows users to create a personalized profile with links, contact details, and social media.',
    language: 'TypeScript',
    languageColor: '#3178c6',
    stars: 0,
    forks: 0,
    url: 'https://github.com/0xZahidp/MyTapCard',
  },
  {
    id: 'Orbit',
    name: '0xZahidp/Orbit',
    title: 'Orbit',
    description:
      'Shared plans, clearly managed - Manage memberships, recurring dues, payment approvals, reminders, and group history in one place.',
    language: 'TypeScript',
    languageColor: '#3178c6',
    stars: 0,
    forks: 0,
    url: 'https://github.com/0xZahidp/Orbit',
  },
  {
    id: 'GhuraFira',
    name: '0xZahidp/GhuraFira_Mobile_APP_Flutter',
    title: 'GhuraFira_Mobile_APP_Flutter',
    description:
      'Online travel agency app to simplify travel booking. Book flights and hotels, explore tour packages, and get visa assistance built with Flutter.',
    language: 'Dart',
    languageColor: '#00B4AB',
    stars: 3,
    forks: 0,
    url: 'https://github.com/0xZahidp/GhuraFira_Mobile_APP_Flutter',
  },
  {
    id: 'CompilerX',
    name: '0xZahidp/CompilerX',
    title: 'CompilerX',
    description:
      'C-based compiler for a custom language, demonstrating lexical analysis, syntax parsing, semantic analysis, code generation, and optimization with Flex and Bison.',
    language: 'C',
    languageColor: '#555555',
    stars: 0,
    forks: 0,
    url: 'https://github.com/0xZahidp/CompilerX',
  },
];

import { getAppSecret } from '@/lib/env-vault';

async function getGitHubToken(): Promise<string | null> {
  const token = await getAppSecret('GITHUB_TOKEN');
  return token || null;
}

export async function GET(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  try {
    const token = await getGitHubToken();

    // If token exists, use GitHub GraphQL API (supports private contributions & fast single query)
    if (token) {
      try {
        const query = JSON.stringify({
          query: `query {
            user(login: "${USERNAME}") {
              followers { totalCount }
              repositories(first: 20, privacy: PUBLIC, orderBy: { field: PUSHED_AT, direction: DESC }) {
                totalCount
                nodes {
                  name
                  nameWithOwner
                  description
                  url
                  stargazerCount
                  forkCount
                  primaryLanguage {
                    name
                    color
                  }
                }
              }
              contributionsCollection {
                contributionCalendar {
                  totalContributions
                  weeks {
                    contributionDays {
                      date
                      contributionCount
                      contributionLevel
                    }
                  }
                }
              }
            }
          }`,
        });

        const res = await fetch('https://api.github.com/graphql', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            'User-Agent': 'FolioFrame-App',
          },
          body: query,
          next: { revalidate: 3600 },
        });

        if (res.ok) {
          const d = await res.json();
          const u = d?.data?.user;

          if (u) {
            const calendar = u.contributionsCollection?.contributionCalendar;
            const levelMap: Record<string, number> = {
              NONE: 0,
              FIRST_QUARTILE: 1,
              SECOND_QUARTILE: 2,
              THIRD_QUARTILE: 3,
              FOURTH_QUARTILE: 4,
            };

            const weeks = ((calendar?.weeks as GraphQLWeek[]) || []).map((w) =>
              (w.contributionDays || []).map((d) => ({
                date: d.date,
                count: d.contributionCount,
                level: levelMap[d.contributionLevel] ?? 0,
              }))
            );

            // Select 4 best repos (matching preferred list or recent with descriptions)
            const preferredNames = [
              'MyTapCard',
              'Orbit',
              'GhuraFira_Mobile_APP_Flutter',
              'CompilerX',
              'telegram-order-payment-bot',
              'Telegram_invite_link_tracker_bot',
            ];
            const allNodes: GraphQLRepoNode[] = u.repositories?.nodes || [];
            const selectedNodes = [
              ...allNodes.filter((n) => preferredNames.includes(n.name)),
              ...allNodes.filter((n) => !preferredNames.includes(n.name) && n.description),
            ].slice(0, 4);

            const repositories: PinnedRepo[] =
              selectedNodes.length > 0
                ? selectedNodes.map((r) => ({
                    id: r.name,
                    name: r.nameWithOwner,
                    title: r.name,
                    description: r.description || '',
                    language: r.primaryLanguage?.name || '',
                    languageColor:
                      r.primaryLanguage?.color ||
                      LANGUAGE_COLORS[r.primaryLanguage?.name || ''] ||
                      '#8b949e',
                    stars: r.stargazerCount || 0,
                    forks: r.forkCount || 0,
                    url: r.url,
                  }))
                : DEFAULT_REPOS;

            return NextResponse.json({
              success: true,
              source: 'graphql',
              user: {
                username: USERNAME,
                followers: u.followers?.totalCount ?? 6,
                public_repos: u.repositories?.totalCount ?? 26,
              },
              contributions: {
                total: calendar?.totalContributions ?? 102,
                weeks,
              },
              repositories,
            });
          }
        }
      } catch (err) {
        console.error('GitHub GraphQL fetch failed, trying public API:', err);
      }
    }

    // Fallback: Public GitHub REST API + Public Contributions API (no token required)
    const [userRes, reposRes, contribRes] = await Promise.allSettled([
      fetch(`https://api.github.com/users/${USERNAME}`, {
        headers: { 'User-Agent': 'FolioFrame-App' },
        next: { revalidate: 3600 },
      }).then((r) => (r.ok ? r.json() : null)),
      fetch(`https://api.github.com/users/${USERNAME}/repos?sort=pushed&per_page=12`, {
        headers: { 'User-Agent': 'FolioFrame-App' },
        next: { revalidate: 3600 },
      }).then((r) => (r.ok ? r.json() : null)),
      fetch(`https://github-contributions-api.jogruber.de/v4/${USERNAME}?y=last`, {
        next: { revalidate: 3600 },
      }).then((r) => (r.ok ? r.json() : null)),
    ]);

    const userData = userRes.status === 'fulfilled' ? userRes.value : null;
    const reposData: RestRepoItem[] | null =
      reposRes.status === 'fulfilled' ? (reposRes.value as RestRepoItem[]) : null;
    const contribData = contribRes.status === 'fulfilled' ? contribRes.value : null;

    // Process contribution weeks
    const weeks: { date: string; count: number; level: number }[][] = [];
    let totalContributions = 102;

    if (contribData?.contributions && Array.isArray(contribData.contributions)) {
      const publicDays = contribData.contributions as PublicDayItem[];
      totalContributions =
        contribData.total?.lastYear ??
        publicDays.reduce((acc, c) => acc + (c.count || 0), 0);

      for (let i = 0; i < publicDays.length; i += 7) {
        weeks.push(
          publicDays.slice(i, i + 7).map((d) => ({
            date: d.date,
            count: d.count || 0,
            level: d.level ?? 0,
          }))
        );
      }
    }

    // Process repositories
    let repositories = DEFAULT_REPOS;
    if (Array.isArray(reposData) && reposData.length > 0) {
      const preferredNames = [
        'MyTapCard',
        'Orbit',
        'GhuraFira_Mobile_APP_Flutter',
        'CompilerX',
        'telegram-order-payment-bot',
      ];
      const filtered = [
        ...reposData.filter((r) => preferredNames.includes(r.name)),
        ...reposData.filter((r) => !preferredNames.includes(r.name) && r.description),
      ].slice(0, 4);

      if (filtered.length > 0) {
        repositories = filtered.map((r) => ({
          id: r.name,
          name: r.full_name,
          title: r.name,
          description: r.description || '',
          language: r.language || '',
          languageColor: LANGUAGE_COLORS[r.language || ''] || '#8b949e',
          stars: r.stargazers_count || 0,
          forks: r.forks_count || 0,
          url: r.html_url,
        }));
      }
    }

    return NextResponse.json({
      success: true,
      source: 'public-rest',
      user: {
        username: USERNAME,
        followers: userData?.followers ?? 6,
        public_repos: userData?.public_repos ?? 26,
      },
      contributions: {
        total: totalContributions,
        weeks: weeks.length > 0 ? weeks : undefined,
      },
      repositories,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch GitHub data';
    return NextResponse.json(
      {
        success: false,
        error: message,
        repositories: DEFAULT_REPOS,
      },
      { status: 500 }
    );
  }
}
