import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { ActivityDetail } from '@/components/features/activities/ActivityDetail';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface ActivityPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ActivityPage({ params }: ActivityPageProps) {
  const { id } = await params;
  
  if (!id) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Suspense fallback={<LoadingSpinner />}>
        <ActivityDetail activityId={id} />
      </Suspense>
    </div>
  );
}
