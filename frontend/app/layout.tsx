import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans, Instrument_Sans } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/providers/ThemeProvider';
import { AuthProvider } from '@/providers/AuthProvider';
import { ToastProvider } from '@/providers/ToastProvider';
import { SettingProvider } from '@/providers/SettingProvider';
import { LocaleProvider } from '@/providers/LocaleProvider';
import { BreadcrumbProvider } from '@/providers/BreadcrumbProvider';
import { buildPageMetadata } from '@/lib/seo';

const sans = Instrument_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const display = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f8fafc' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0c12' },
  ],
};

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata({ root: true });
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${sans.variable} ${display.variable}`}>
      <body
        suppressHydrationWarning
        className="min-h-screen bg-background font-sans text-foreground antialiased transition-colors duration-200"
      >
        <ThemeProvider>
          <LocaleProvider>
            <AuthProvider>
              <SettingProvider>
                <BreadcrumbProvider>
                  <ToastProvider>{children}</ToastProvider>
                </BreadcrumbProvider>
              </SettingProvider>
            </AuthProvider>
          </LocaleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
