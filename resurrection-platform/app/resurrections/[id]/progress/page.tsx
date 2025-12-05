'use client';

import { useParams, useRouter } from 'next/navigation';
import { ResurrectionProgress } from '@/components/ResurrectionProgress';

export default function ResurrectionProgressPage() {
  const params = useParams();
  const router = useRouter();
  const resurrectionId = params?.id as string;

  const handleComplete = () => {
    // Redirect to results page when complete
    router.push(`/resurrections/${resurrectionId}`);
  };

  const handleError = (error: string) => {
    console.error('Resurrection error:', error);
    // Could show error toast or redirect to error page
  };

  return (
    <ResurrectionProgress
      resurrectionId={resurrectionId}
      onComplete={handleComplete}
      onError={handleError}
    />
  );
}
