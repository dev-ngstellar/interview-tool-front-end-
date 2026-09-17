'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function StudentRootPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/');
  }, [router]);

  return (
    <div className="container" style={{ textAlign: 'center', padding: '4rem 0' }}>
      <p style={{ color: 'var(--text-secondary)' }}>Directing to Candidate Registration...</p>
    </div>
  );
}
