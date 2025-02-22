// src/app/page.tsx
import { TennisTracker } from '@/components/tennis-tracker';
import { StorageBanner } from '@/components/storage-banner';

export default function Home() {
  return (
    <main>
      <TennisTracker />
      <StorageBanner />
    </main>
  );
}
