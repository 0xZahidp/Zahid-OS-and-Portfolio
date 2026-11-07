import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/admin-auth';
import {
  getHealthCollection,
  getHealthCollectionWithVersion,
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
      const { data, version } = await getHealthCollectionWithVersion(collection);
      return NextResponse.json({ success: true, data, version });
    }

    const fullData = await getHealthData();
    return NextResponse.json({ success: true, data: fullData, versions: fullData.versions });
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
    const { collection, item, expectedVersion } = body as {
      collection: HealthCollectionKey;
      item: Record<string, unknown>;
      expectedVersion?: number;
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
      const res = await saveHealthCollection('profile', updatedProfile, expectedVersion);
      return NextResponse.json({ success: true, item: updatedProfile, version: res.version });
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
    let saveResult: { success: boolean; version: number };

    // Specialized typing dispatch
    switch (collection) {
      case 'medications':
        saveResult = await saveHealthCollection('medications', nextList as Medication[], expectedVersion);
        break;
      case 'documents':
        saveResult = await saveHealthCollection('documents', nextList as HealthDocument[], expectedVersion);
        break;
      case 'visits':
        saveResult = await saveHealthCollection('visits', nextList as Visit[], expectedVersion);
        break;
      case 'vitals':
        saveResult = await saveHealthCollection('vitals', nextList as Vital[], expectedVersion);
        break;
      case 'vaccinations':
        saveResult = await saveHealthCollection('vaccinations', nextList as Vaccination[], expectedVersion);
        break;
      case 'reminders':
        saveResult = await saveHealthCollection('reminders', nextList as Reminder[], expectedVersion);
        break;
    }

    return NextResponse.json({ success: true, item: newItem, version: saveResult.version });
  } catch (err: unknown) {
    const isConflict =
      (err as { status?: number })?.status === 409 ||
      (err instanceof Error && err.message.includes('changed elsewhere'));
    if (isConflict) {
      return NextResponse.json(
        { success: false, error: 'This data changed elsewhere, reload before saving' },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: 'Failed to create health record' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  try {
    const body = await req.json();
    const { collection, item, expectedVersion } = body as {
      collection: HealthCollectionKey;
      item: Record<string, unknown> & { id?: string };
      expectedVersion?: number;
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
      const res = await saveHealthCollection('profile', merged, expectedVersion);
      return NextResponse.json({ success: true, item: merged, version: res.version });
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
    let saveResult: { success: boolean; version: number };

    switch (collection) {
      case 'medications':
        saveResult = await saveHealthCollection('medications', nextList as Medication[], expectedVersion);
        break;
      case 'documents':
        saveResult = await saveHealthCollection('documents', nextList as HealthDocument[], expectedVersion);
        break;
      case 'visits':
        saveResult = await saveHealthCollection('visits', nextList as Visit[], expectedVersion);
        break;
      case 'vitals':
        saveResult = await saveHealthCollection('vitals', nextList as Vital[], expectedVersion);
        break;
      case 'vaccinations':
        saveResult = await saveHealthCollection('vaccinations', nextList as Vaccination[], expectedVersion);
        break;
      case 'reminders':
        saveResult = await saveHealthCollection('reminders', nextList as Reminder[], expectedVersion);
        break;
    }

    return NextResponse.json({ success: true, item: updatedItem, version: saveResult.version });
  } catch (err: unknown) {
    const isConflict =
      (err as { status?: number })?.status === 409 ||
      (err instanceof Error && err.message.includes('changed elsewhere'));
    if (isConflict) {
      return NextResponse.json(
        { success: false, error: 'This data changed elsewhere, reload before saving' },
        { status: 409 }
      );
    }
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
    const expectedVersion = searchParams.get('expectedVersion')
      ? Number(searchParams.get('expectedVersion'))
      : undefined;

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
    let saveResult: { success: boolean; version: number };

    switch (collection) {
      case 'medications':
        saveResult = await saveHealthCollection('medications', nextList as Medication[], expectedVersion);
        break;
      case 'documents':
        saveResult = await saveHealthCollection('documents', nextList as HealthDocument[], expectedVersion);
        break;
      case 'visits':
        saveResult = await saveHealthCollection('visits', nextList as Visit[], expectedVersion);
        break;
      case 'vitals':
        saveResult = await saveHealthCollection('vitals', nextList as Vital[], expectedVersion);
        break;
      case 'vaccinations':
        saveResult = await saveHealthCollection('vaccinations', nextList as Vaccination[], expectedVersion);
        break;
      case 'reminders':
        saveResult = await saveHealthCollection('reminders', nextList as Reminder[], expectedVersion);
        break;
    }

    return NextResponse.json({ success: true, deletedId: id, version: saveResult.version });
  } catch (err: unknown) {
    const isConflict =
      (err as { status?: number })?.status === 409 ||
      (err instanceof Error && err.message.includes('changed elsewhere'));
    if (isConflict) {
      return NextResponse.json(
        { success: false, error: 'This data changed elsewhere, reload before saving' },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: 'Failed to delete health record' }, { status: 500 });
  }
}

