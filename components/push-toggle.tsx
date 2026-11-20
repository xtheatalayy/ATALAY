'use client';

import { useEffect, useState } from 'react';
import { BellRing, BellOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { subscribeToPush, unsubscribeFromPush, isPushSubscribed } from '@/lib/push-utils';
import { toast } from 'sonner';

export function PushToggle() {
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined' || !('PushManager' in window)) {
      setSupported(false);
      return;
    }
    isPushSubscribed().then(setSubscribed).catch(() => {});
  }, []);

  if (!supported) return null;

  const toggle = async () => {
    setLoading(true);
    try {
      if (subscribed) {
        await unsubscribeFromPush();
        setSubscribed(false);
        toast.success('Bildirimler kapatıldı');
      } else {
        const ok = await subscribeToPush();
        if (ok) {
          setSubscribed(true);
          toast.success('Bildirimler açıldı!');
        } else {
          toast.error('Bildirim izni verilemedi');
        }
      }
    } catch {
      toast.error('Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      disabled={loading}
      aria-label={subscribed ? 'Bildirimleri kapat' : 'Bildirimleri aç'}
      className="relative h-9 w-9 rounded-full text-muted-foreground hover:bg-accent hover:text-accent-foreground"
    >
      {subscribed ? <BellRing className="h-[18px] w-[18px] text-primary" /> : <BellOff className="h-[18px] w-[18px]" />}
    </Button>
  );
}
