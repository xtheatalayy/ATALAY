import type { Metadata, Viewport } from 'next';
import { cookies } from 'next/headers';
import { DM_Sans, Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { LanguageProvider } from '@/components/i18n/language-provider';
import { AutoTranslator } from '@/components/i18n/auto-translator';
import { DEFAULT_LOCALE, LOCALE_COOKIE, isRtl } from '@/lib/i18n/languages';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import { ChunkLoadErrorHandler } from '@/components/chunk-load-error-handler';
import { AppProviders } from '@/components/app-providers';
import { ServiceWorkerRegister } from '@/components/service-worker-register';
import { SpeedInsights } from '@vercel/speed-insights/next';

const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-sans' });
const jakartaSans = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-display' });
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' });

const APP_NAME = 'Planned Life';
const APP_DESCRIPTION =
  'Giderlerini takip et, bütçeni yönet, günlük–haftalık–aylık sağlık rutinlerini planla, görevlerini ve notlarını tek yerde tut.';

const baseUrl = (() => {
  try {
    return new URL(process.env.NEXTAUTH_URL ?? 'http://localhost:3000');
  } catch {
    return new URL('http://localhost:3000');
  }
})();

export const metadata: Metadata = {
  metadataBase: baseUrl,
  title: {
    default: APP_NAME,
    template: `%s · ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  applicationName: APP_NAME,
  keywords: [
    'Planned Life',
    'kişisel planlama uygulaması',
    'gider takibi',
    'bütçe yönetimi',
    'sağlık rutinleri',
    'görev yönetimi',
    'notlar',
    'yapay zeka asistanı',
    'günlük planlayıcı',
    'personal planner',
  ],
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  alternates: { canonical: '/' },
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    shortcut: '/favicon.svg',
    apple: '/icon-192.png',
  },
  appleWebApp: {
    capable: true,
    title: APP_NAME,
    statusBarStyle: 'default',
  },
  openGraph: {
    type: 'website',
    locale: 'tr_TR',
    siteName: APP_NAME,
    title: `${APP_NAME} — Günlük hayatını tek yerde planla`,
    description: APP_DESCRIPTION,
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: APP_NAME }],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${APP_NAME} — Günlük hayatını tek yerde planla`,
    description: APP_DESCRIPTION,
    images: ['/og-image.png'],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F4FAF7' },
    { media: '(prefers-color-scheme: dark)', color: '#0B1512' },
  ],
};

export const dynamic = 'force-dynamic';

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const locale = cookieStore.get(LOCALE_COOKIE)?.value || DEFAULT_LOCALE;

  return (
    <html lang={locale} dir={isRtl(locale) ? 'rtl' : 'ltr'} suppressHydrationWarning>
      <body className={`${dmSans.variable} ${jakartaSans.variable} ${jetbrainsMono.variable} font-sans`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebApplication',
              name: APP_NAME,
              description: APP_DESCRIPTION,
              applicationCategory: 'ProductivityApplication',
              operatingSystem: 'Web',
              inLanguage: 'tr',
              offers: { '@type': 'Offer', price: '0', priceCurrency: 'TRY' },
            }),
          }}
        />
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <AppProviders>
            <LanguageProvider initialLocale={locale}>
              {children}
              <AutoTranslator />
              <Toaster position="top-center" richColors closeButton />
              <ServiceWorkerRegister />
              {/* IMPORTANT: Do not remove — handles chunk loading race conditions in the dev server */}
              <ChunkLoadErrorHandler />
            </LanguageProvider>
          </AppProviders>
        </ThemeProvider>
        <SpeedInsights />
      </body>
    </html>
  );
}
