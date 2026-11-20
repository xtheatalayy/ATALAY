import type { Metadata } from 'next';
import { AiChat } from '@/components/chat/ai-chat';

export const metadata: Metadata = {
  title: 'Yapay Zeka Asistan',
  description: 'Planlama, bütçe ve sağlık rutinleri konusunda yapay zeka desteği',
};

export const dynamic = 'force-dynamic';

export default function AssistantPage() {
  return (
    <div className="-mx-4 -mt-5 sm:-mx-6 flex flex-col" style={{ height: 'calc(100dvh - 56px - 68px)' }}>
      <AiChat />
    </div>
  );
}
