import Script from 'next/script';
import { isProduction } from '@/lib/site';

/** Reuse the existing GA4 property; enable only for the production documentation. */
export function Analytics() {
  const id = process.env.NEXT_PUBLIC_GA_ID;
  if (!isProduction || !id || !/^G-[A-Z0-9]+$/.test(id)) return null;
  return <><Script src={`https://www.googletagmanager.com/gtag/js?id=${id}`} strategy="afterInteractive" /><Script id="polyhammer-analytics" strategy="afterInteractive">{`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config',${JSON.stringify(id)});`}</Script></>;
}
