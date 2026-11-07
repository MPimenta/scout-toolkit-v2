import type { Metadata } from 'next';
import { OfflineView } from '@/components/pwa/OfflineView';

export const metadata: Metadata = {
  title: 'Sem ligação - Kit de Atividades',
  robots: { index: false },
};

export default function OfflinePage() {
  return <OfflineView />;
}
