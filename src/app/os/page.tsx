import { Metadata } from 'next';
import { getCachedOsSettings, getCachedPublicLinks } from '@/lib/os/server-os';
import { ZahidOsClient } from '@/components/os/ZahidOsClient';
import { ZahidOsPrivateGate } from '@/components/os/ZahidOsPrivateGate';

export const metadata: Metadata = {
  title: 'Zahid OS · Personal Cloud Environment & Micro-Apps',
  description:
    'A dark emerald, iPadOS-inspired personal cloud environment with micro-apps, travel logs, temporary mail, developer utilities, and short links.',
};

export const revalidate = 3600;

export default async function ZahidOsPage() {
  const [settings, links] = await Promise.all([
    getCachedOsSettings(),
    getCachedPublicLinks(),
  ]);

  if (settings && !settings.is_public_enabled) {
    return <ZahidOsPrivateGate />;
  }

  return (
    <ZahidOsClient
      initialSettings={settings}
      initialLinks={links}
    />
  );
}
