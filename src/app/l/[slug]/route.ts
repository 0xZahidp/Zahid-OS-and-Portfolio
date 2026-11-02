import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{
    slug: string;
  }>;
}

export async function GET(req: NextRequest, context: RouteContext) {
  const { slug } = await context.params;
  const destination = new URL(`/s/${encodeURIComponent(slug)}`, req.url);
  return NextResponse.redirect(destination, 307);
}
