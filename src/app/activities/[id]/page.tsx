import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { ActivityDetail } from '@/components/features/activities/ActivityDetail';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface ActivityPageProps {
  params: {
    id: string;
  };
}

export default function ActivityPage({ params }: ActivityPageProps) {
  if (!params.id) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Suspense fallback={<LoadingSpinner />}>
        <ActivityDetail activityId={params.id} />
      </Suspense>
    </div>
  );
}
