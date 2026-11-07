import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/admin-auth';
import {
  getHealthCollection,
  saveHealthCollection,
  getHealthData,
} from '@/lib/health/health-store';
import {
  HealthCollectionKey,
  HealthProfile,
  Medication,
  HealthDocument,
  Visit,
  Vital,
  Vaccination,
  Reminder,
} from '@/types/health';

const VALID_COLLECTIONS: HealthCollectionKey[] = [
  'profile',
  'medications',
  'documents',
  'visits',
  'vitals',
  'vaccinations',
  'reminders',
];

export async function GET(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(req.url);
    const collection = searchParams.get('collection') as HealthCollectionKey | null;

    if (collection) {
      if (!VALID_COLLECTIONS.includes(collection)) {
        return NextResponse.json({ error: 'Invalid collection' }, { status: 400 });
      }
      const data = await getHealthCollection(collection);
      return NextResponse.json({ success: true, data });
    }

    const fullData = await getHealthData();
    return NextResponse.json({ success: true, data: fullData });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Database service unavailable' },
      {
        status: 503,
        headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0' },
      }
    );
  }
}

export async function POST(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  try {
    const body = await req.json();
    const { collection, item } = body as {
      collection: HealthCollectionKey;
      item: Record<string, unknown>;
    };

    if (!collection || !VALID_COLLECTIONS.includes(collection)) {
      return NextResponse.json({ error: 'Invalid collection' }, { status: 400 });
    }

    const now = new Date().toISOString();

    if (collection === 'profile') {
      const updatedProfile: HealthProfile = {
        ...(item as unknown as HealthProfile),
        updatedAt: now,
      };
      await saveHealthCollection('profile', updatedProfile);
      return NextResponse.json({ success: true, item: updatedProfile });
    }

    const currentList = (await getHealthCollection(collection)) as Array<{
      id: string;
      createdAt?: string;
      updatedAt?: string;
    }>;

    const newItem = {
      ...item,
      id: (item.id as string) || crypto.randomUUID(),
      createdAt: (item.createdAt as string) || now,
      updatedAt: now,
    };

    const nextList = [newItem, ...currentList];

    // Specialized typing dispatch
    switch (collection) {
      case 'medications':
        await saveHealthCollection('medications', nextList as Medication[]);
        break;
      case 'documents':
        await saveHealthCollection('documents', nextList as HealthDocument[]);
        break;
      case 'visits':
        await saveHealthCollection('visits', nextList as Visit[]);
        break;
      case 'vitals':
        await saveHealthCollection('vitals', nextList as Vital[]);
        break;
      case 'vaccinations':
        await saveHealthCollection('vaccinations', nextList as Vaccination[]);
        break;
      case 'reminders':
        await saveHealthCollection('reminders', nextList as Reminder[]);
        break;
    }

    return NextResponse.json({ success: true, item: newItem });
  } catch {
    return NextResponse.json({ error: 'Failed to create health record' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  try {
    const body = await req.json();
    const { collection, item } = body as {
      collection: HealthCollectionKey;
      item: Record<string, unknown> & { id?: string };
    };

    if (!collection || !VALID_COLLECTIONS.includes(collection)) {
      return NextResponse.json({ error: 'Invalid collection' }, { status: 400 });
    }

    const now = new Date().toISOString();

    if (collection === 'profile') {
      const existing = await getHealthCollection('profile');
      const merged: HealthProfile = {
        ...existing,
        ...(item as unknown as Partial<HealthProfile>),
        updatedAt: now,
      };
      await saveHealthCollection('profile', merged);
      return NextResponse.json({ success: true, item: merged });
    }

    if (!item.id) {
      return NextResponse.json({ error: 'Item id is required for updates' }, { status: 400 });
    }

    const currentList = (await getHealthCollection(collection)) as Array<{
      id: string;
      createdAt?: string;
      updatedAt?: string;
    }>;

    const index = currentList.findIndex((i) => i.id === item.id);
    if (index === -1) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    const updatedItem = {
      ...currentList[index],
      ...item,
      updatedAt: now,
    };

    const nextList = [...currentList];
    nextList[index] = updatedItem;

    switch (collection) {
      case 'medications':
        await saveHealthCollection('medications', nextList as Medication[]);
        break;
      case 'documents':
        await saveHealthCollection('documents', nextList as HealthDocument[]);
        break;
      case 'visits':
        await saveHealthCollection('visits', nextList as Visit[]);
        break;
      case 'vitals':
        await saveHealthCollection('vitals', nextList as Vital[]);
        break;
      case 'vaccinations':
        await saveHealthCollection('vaccinations', nextList as Vaccination[]);
        break;
      case 'reminders':
        await saveHealthCollection('reminders', nextList as Reminder[]);
        break;
    }

    return NextResponse.json({ success: true, item: updatedItem });
  } catch {
    return NextResponse.json({ error: 'Failed to update health record' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(req.url);
    const collection = searchParams.get('collection') as HealthCollectionKey | null;
    const id = searchParams.get('id');

    if (!collection || !VALID_COLLECTIONS.includes(collection)) {
      return NextResponse.json({ error: 'Invalid collection' }, { status: 400 });
    }

    if (collection === 'profile') {
      return NextResponse.json({ error: 'Profile cannot be deleted' }, { status: 400 });
    }

    if (!id) {
      return NextResponse.json({ error: 'Item id is required for deletion' }, { status: 400 });
    }

    const currentList = (await getHealthCollection(collection)) as Array<{ id: string }>;
    const nextList = currentList.filter((item) => item.id !== id);

    switch (collection) {
      case 'medications':
        await saveHealthCollection('medications', nextList as Medication[]);
        break;
      case 'documents':
        await saveHealthCollection('documents', nextList as HealthDocument[]);
        break;
      case 'visits':
        await saveHealthCollection('visits', nextList as Visit[]);
        break;
      case 'vitals':
        await saveHealthCollection('vitals', nextList as Vital[]);
        break;
      case 'vaccinations':
        await saveHealthCollection('vaccinations', nextList as Vaccination[]);
        break;
      case 'reminders':
        await saveHealthCollection('reminders', nextList as Reminder[]);
        break;
    }

    return NextResponse.json({ success: true, deletedId: id });
  } catch {
    return NextResponse.json({ error: 'Failed to delete health record' }, { status: 500 });
  }
}

