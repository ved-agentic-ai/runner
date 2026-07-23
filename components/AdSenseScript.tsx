'use client';

import React from 'react';
import Script from 'next/script';
import { useAdminStore } from '@/lib/admin-store';

export const AdSenseScript: React.FC = () => {
  const { monetizationEnabled, adSenseClientId } = useAdminStore();

  if (!monetizationEnabled || !adSenseClientId || !adSenseClientId.trim()) {
    return null;
  }

  const cleanClientId = adSenseClientId.trim();

  return (
    <Script
      id="google-adsense"
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsense.js?client=${cleanClientId}`}
      crossOrigin="anonymous"
      strategy="afterInteractive"
    />
  );
};

export const AdSenseBanner: React.FC<{ slotId?: string; format?: 'auto' | 'fluid' | 'rectangle' }> = ({
  slotId,
  format = 'auto'
}) => {
  const { monetizationEnabled, adSenseClientId } = useAdminStore();

  if (!monetizationEnabled || !adSenseClientId || !adSenseClientId.trim()) {
    return null;
  }

  return (
    <div className="w-full my-4 overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/60 p-4 text-center">
      <span className="block text-[10px] uppercase font-bold text-slate-500 mb-2 tracking-wider">
        Advertisement
      </span>
      <ins
        className="adsbygoogle block"
        data-ad-client={adSenseClientId.trim()}
        data-ad-slot={slotId || '1234567890'}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
};
