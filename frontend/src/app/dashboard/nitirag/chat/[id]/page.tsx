'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { NitiragChatView } from '@/components/NitiragChatView';

export default function NitiragChatSessionPage() {
  const params = useParams();
  const convId = params.id as string;

  return <NitiragChatView conversationId={convId} />;
}
