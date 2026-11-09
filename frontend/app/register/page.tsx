'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/login?tab=register');
  }, [router]);

  return (
    <div className="min-h-screen bg-[#080809] flex items-center justify-center text-white text-xs">
      Loading MuscleCraft athlete registration...
    </div>
  );
}
