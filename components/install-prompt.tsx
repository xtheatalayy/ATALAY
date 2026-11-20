'use client';

import { useEffect, useState } from 'react';
import { Download, Share, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice?: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [iosHint, setIosHint] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const standalone =
      window.matchMedia?.('(display-mode: standalone)')?.matches === true ||
      (window.navigator as unknown as { standalone?: boolean })?.standalone === true;
    setInstalled(standalone);

    const ua = window.navigator?.userAgent ?? '';
    const iosDevice = /iPad|iPhone|iPod/.test(ua) && !/CriOS|FxiOS/.test(ua);
    setIsIos(iosDevice);

    const onPrompt = (event: Event) => {
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
    };

    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  if (installed) return null;

  const handleClick = async () => {
    if (deferred) {
      try {
        await deferred.prompt();
        await deferred.userChoice;
      } catch {
        // the browser may reject a repeated prompt
      }
      setDeferred(null);
      return;
    }
    setIosHint(true);
  };

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={handleClick}
        className="hidden h-9 gap-1.5 rounded-full px-3 text-xs font-medium text-muted-foreground hover:text-foreground sm:inline-flex"
      >
        <Download className="h-4 w-4" />
        Yükle
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Uygulamayı yükle"
        onClick={handleClick}
        className="h-9 w-9 rounded-full text-muted-foreground sm:hidden"
      >
        <Download className="h-[18px] w-[18px]" />
      </Button>

      <Dialog open={iosHint} onOpenChange={setIosHint}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Smartphone className="h-4 w-4 text-primary" /> Ana ekrana ekle
            </DialogTitle>
            <DialogDescription>
              Planned Life&apos;i bir uygulama gibi kullanmak için tarayıcı menüsünden ana ekrana ekleyin.
            </DialogDescription>
          </DialogHeader>
          <ol className="space-y-3 text-sm text-muted-foreground">
            <li className="flex gap-3">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">1</span>
              <span>
                {isIos ? 'Safari' : 'Chrome'} alt menüsündeki <Share className="mx-1 inline h-3.5 w-3.5" />{' '}
                <strong className="text-foreground">Paylaş</strong> düğmesine dokunun.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">2</span>
              <span>
                Listeden <strong className="text-foreground">Ana Ekrana Ekle</strong> seçeneğini seçin.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">3</span>
              <span>Onaylayın; uygulama simgesi ana ekranınızda görünecek.</span>
            </li>
          </ol>
        </DialogContent>
      </Dialog>
    </>
  );
}
