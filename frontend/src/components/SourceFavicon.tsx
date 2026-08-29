'use client';

import React, { useState } from 'react';

interface SourceFaviconProps {
  domain: string;
  className?: string;
  size?: number;
}

export function SourceFavicon({
  domain,
  className = 'w-4 h-4 rounded-xs shrink-0',
  size = 64,
}: SourceFaviconProps) {
  const [errorCount, setErrorCount] = useState(0);

  // Clean domain string
  const cleanDomain = domain
    ? domain.replace(/^(?:https?:\/\/)?(?:www\.)?/i, '').split('/')[0].trim()
    : 'india.gov.in';

  const primaryUrl = `https://www.google.com/s2/favicons?domain=${cleanDomain}&sz=${size}`;
  const fallbackUrl = `https://icons.duckduckgo.com/ip3/${cleanDomain}.ico`;

  if (errorCount >= 2) {
    return (
      <div className={`${className} bg-muted text-foreground flex items-center justify-center font-mono font-bold text-[8px] rounded-xs border border-border uppercase`}>
        {cleanDomain.slice(0, 2)}
      </div>
    );
  }

  return (
    <img
      src={errorCount === 0 ? primaryUrl : fallbackUrl}
      alt={cleanDomain}
      className={className}
      onError={() => setErrorCount((prev) => prev + 1)}
      loading="lazy"
    />
  );
}
