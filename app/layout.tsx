import './globals.css';
import { RootProvider } from 'fumadocs-ui/provider/next';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { siteName, siteUrl, isProduction } from '@/lib/site';
import { DocsSearch } from '@/components/search';
import { Analytics } from '@/components/analytics';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl), title: { default: siteName, template: '%s | Poly Hammer' },
  description: 'Versioned documentation for Poly Hammer Blender add-ons, Unreal plugins, Portal, and CLI.',
  robots: { index: isProduction, follow: true }, icons: { icon: '/assets/favicon.ico' },
};
export default function Layout({ children }: { children: ReactNode }) {
  return <html lang="en" suppressHydrationWarning><body className="flex flex-col min-h-screen"><RootProvider theme={{ defaultTheme: 'dark', enableSystem: false }} search={{ SearchDialog: DocsSearch }}>{children}</RootProvider><Analytics /></body></html>;
}
