import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/providers/ThemeProvider';
import { AuthProvider } from '@/providers/AuthProvider';
import { ToastProvider } from '@/providers/ToastProvider';
import { SettingProvider } from '@/providers/SettingProvider';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export async function generateMetadata(): Promise<Metadata> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  try {
    const res = await fetch(`${apiUrl}/api/v1/public/settings`, {
      next: { revalidate: 60 },
    });

    if (res.ok) {
      const data = await res.json();
      const settings = data?.data || {};
      const siteName = settings.site_name || 'Laravel + Next.js Starter';
      const favicon = settings.site_favicon;

      return {
        title: {
          default: siteName,
          template: `%s | ${siteName}`,
        },
        description: settings.site_description || 'Production-ready full-stack architecture.',
        icons: favicon
          ? {
              icon: favicon,
              shortcut: favicon,
              apple: favicon,
            }
          : {
              icon: '/favicon.ico',
            },
      };
    }
  } catch {
    // Fallback if backend server is starting
  }

  return {
    title: {
      default: 'Laravel + Next.js Starter',
      template: '%s | Laravel + Next.js Starter',
    },
    description: 'Production-ready full-stack starter template.',
    icons: {
      icon: '/favicon.ico',
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <body suppressHydrationWarning className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 font-sans antialiased transition-colors duration-200">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <AuthProvider>
            <SettingProvider>
              <ToastProvider>{children}</ToastProvider>
            </SettingProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
