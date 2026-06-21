import type { Metadata, Viewport } from 'next';
import './globals.css';
import Toast from '@/components/layout/Toast';
import { ThemeProvider } from '@/components/layout/ThemeProvider';
import { DirProvider } from '@/components/layout/DirProvider';

export const metadata: Metadata = {
  title: 'WARDANY TRIP',
  description: 'Enterprise travel management — Royal Black Luxury',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Wardany',
  },
  icons: {
    icon: '/icons/icon-512.png',
    apple: '/icons/icon-192.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#0A0A0A',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <head>
        {/* CSP fallback for static hosting (full headers also set via host config). */}
        <meta
          httpEquiv="Content-Security-Policy"
          content="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://script.google.com https://script.googleusercontent.com https://*.googleusercontent.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'"
        />
        <meta name="referrer" content="strict-origin-when-cross-origin" />
      </head>
      <body className="font-sans antialiased bg-background text-foreground">
        <ThemeProvider>
          <DirProvider />
          <Toast />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
