'use client';

import React, { useState } from 'react';
import { getSchemeImage } from '../services/api';

interface SchemeImageProps {
  schemeId: string;
  category?: string | null;
  alt: string;
  className?: string;
}

export function SchemeImage({
  schemeId,
  category,
  alt,
  className = 'w-full h-full object-cover',
}: SchemeImageProps) {
  const [hasError, setHasError] = useState(false);
  const imageUrl = getSchemeImage(schemeId, category);

  // Gradient themes matching category if image fails to load
  const getFallbackGradient = () => {
    const cat = (category || '').toLowerCase();
    if (cat.includes('agri') || cat.includes('farm')) {
      return 'from-emerald-800 to-teal-950';
    }
    if (cat.includes('hous') || cat.includes('rural')) {
      return 'from-cyan-800 to-slate-900';
    }
    if (cat.includes('health') || cat.includes('social')) {
      return 'from-teal-800 to-emerald-950';
    }
    if (cat.includes('women') || cat.includes('child')) {
      return 'from-teal-700 to-cyan-950';
    }
    return 'from-[#1e8c78] to-[#091f1a]';
  };

  if (hasError) {
    return (
      <div className={`w-full h-full bg-gradient-to-tr ${getFallbackGradient()} flex items-center justify-center p-4 text-center`}>
        <div className="space-y-1">
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#c5fcee]/80">
            {category || 'Government Scheme'}
          </span>
          <p className="text-xs font-bold text-white line-clamp-1">{alt}</p>
        </div>
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={alt}
      loading="lazy"
      decoding="async"
      onError={() => setHasError(true)}
      className={className}
    />
  );
}
