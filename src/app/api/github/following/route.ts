import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import portfolioContent from '@/data/portfolio-content.json';
import { FollowerRecommendation } from '@/types/profile';

export const revalidate = 3600; // 1 hour cache

const DEFAULT_USERNAME = portfolioContent.githubSettings?.username || '0xZahidp';

// Curated authentic following list for 0xZahidp
const FALLBACK_FOLLOWING: FollowerRecommendation[] = [
  {
    id: 'person-hasin',
    name: 'Hasin Hayder',
    role: 'Product Architect & Founder of TyroLabs',
    avatar_url: 'https://avatars.githubusercontent.com/u/490779?v=4',
    url: 'https://github.com/hasinhayder',
    handle: 'hasinhayder',
  },
  {
    id: 'person-zahin',
    name: 'Zahin Mohammad',
    role: 'Web Developer (React, Next.js, Go)',
    avatar_url: 'https://avatars.githubusercontent.com/u/105446082?v=4',
    url: 'https://github.com/IsHereZahin',
    handle: 'IsHereZahin',
  },
  {
    id: 'person-rezaur',
    name: 'Rezaur Rahman',
    role: 'Senior Software Engineer (Distributed Systems)',
    avatar_url: 'https://avatars.githubusercontent.com/u/68007353?v=4',
    url: 'https://github.com/RezaurOfficial',
    handle: 'RezaurOfficial',
  },
  {
    id: 'person-aniruddha',
    name: 'Aniruddha Adhikary (Ani)',
    role: 'Software Engineer @GovTechSG (Singapore)',
    avatar_url: 'https://avatars.githubusercontent.com/u/932949?v=4',
    url: 'https://github.com/aniruddha-adhikary',
    handle: 'aniruddha-adhikary',
  },
  {
    id: 'person-tahsin',
    name: 'Md. Tahsinul Hoque Siddiki',
    role: 'DevOps & Cloud Automation Engineer',
    avatar_url: 'https://avatars.githubusercontent.com/u/107357207?v=4',
    url: 'https://github.com/tahsinulhoque',
    handle: 'tahsinulhoque',
  },
  {
    id: 'person-emran',
    name: 'Emran Haque',
    role: 'Web3 & Community Relations Specialist',
    avatar_url: 'https://avatars.githubusercontent.com/u/55331321?v=4',
    url: 'https://github.com/Emranrx02',
    handle: 'Emranrx02',
  },
  {
    id: 'person-sani',
    name: 'Sanaullah Sani',
    role: 'Full Stack Web Developer',
    avatar_url: 'https://avatars.githubusercontent.com/u/66258879?v=4',
    url: 'https://github.com/ssani7',
    handle: 'ssani7',
  },
  {
    id: 'person-benaiah',
    name: 'Benaiah',
    role: 'Full Stack Builder & Software Engineer',
    avatar_url: 'https://avatars.githubusercontent.com/u/65370456?v=4',
    url: 'https://github.com/Benrobo',
    handle: 'Benrobo',
  },
  {
    id: 'person-roman',
    name: 'Roman Mendaliev',
    role: 'Software Developer',
    avatar_url: 'https://avatars.githubusercontent.com/u/21079607?v=4',
    url: 'https://github.com/reacheight',
    handle: 'reacheight',
  },
  {
    id: 'person-prottoy',
    name: 'ABM Prottoy',
    role: 'Software Developer (Dhaka)',
    avatar_url: 'https://avatars.githubusercontent.com/u/115341293?v=4',
    url: 'https://github.com/abmprottoy',
    handle: 'abmprottoy',
  },
  {
    id: 'person-shakib',
    name: 'Shakibul Islam',
    role: 'Web Developer (Dhaka)',
    avatar_url: 'https://avatars.githubusercontent.com/u/206897066?v=4',
    url: 'https://github.com/shakib5551',
    handle: 'shakib5551',
  },
  {
    id: 'person-syed',
    name: 'Syed Eftasum Alam',
    role: 'Computer Science & Engineering Graduate',
    avatar_url: 'https://avatars.githubusercontent.com/u/62606974?v=4',
    url: 'https://github.com/Syed-Eftasum-Alam',
    handle: 'Syed-Eftasum-Alam',
  },
];

async function getGitHubToken(): Promise<string | null> {
  if (process.env.GITHUB_TOKEN) return process.env.GITHUB_TOKEN;
  try {
    const supabase = supabaseServer();
    const { data: setting } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'GITHUB_TOKEN')
      .single();
    if (setting?.value) return setting.value as string;
  } catch {
    // Supabase query failed or not configured
  }
  return null;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username') || DEFAULT_USERNAME;
    const token = await getGitHubToken();

    const headers: Record<string, string> = {
      'User-Agent': 'FolioFrame-App',
      Accept: 'application/vnd.github+json',
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const res = await fetch(`https://api.github.com/users/${username}/following?per_page=30`, {
      headers,
      next: { revalidate: 3600 },
    });

    if (res.ok) {
      const users = await res.json();
      if (Array.isArray(users) && users.length > 0) {
        // Fetch up to 12 user details in parallel (names, bios, companies)
        const detailed = await Promise.allSettled(
          users.slice(0, 12).map(async (u: { login: string; avatar_url: string; html_url: string }) => {
            try {
              const uRes = await fetch(`https://api.github.com/users/${u.login}`, {
                headers,
                next: { revalidate: 86400 },
              });
              if (uRes.ok) {
                const info = await uRes.json();
                return {
                  id: `person-${u.login.toLowerCase()}`,
                  name: info.name || u.login,
                  role: info.bio || info.company || 'Software Developer',
                  avatar_url: info.avatar_url || u.avatar_url,
                  url: info.html_url || u.html_url,
                  handle: u.login,
                };
              }
            } catch {
              // Fall through to basic
            }
            return {
              id: `person-${u.login.toLowerCase()}`,
              name: u.login,
              role: 'Software Developer',
              avatar_url: u.avatar_url,
              url: u.html_url,
              handle: u.login,
            };
          })
        );

        const peopleList: FollowerRecommendation[] = detailed
          .filter((p): p is PromiseFulfilledResult<FollowerRecommendation> => p.status === 'fulfilled')
          .map((p) => p.value);

        return NextResponse.json({
          success: true,
          source: 'github-api',
          username,
          total: peopleList.length,
          people: peopleList,
        });
      }
    }

    // Fallback: authentic curated list for 0xZahidp
    return NextResponse.json({
      success: true,
      source: 'curated-cache',
      username,
      total: FALLBACK_FOLLOWING.length,
      people: FALLBACK_FOLLOWING,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch GitHub following';
    return NextResponse.json({
      success: true,
      source: 'fallback',
      error: message,
      total: FALLBACK_FOLLOWING.length,
      people: FALLBACK_FOLLOWING,
    });
  }
}

