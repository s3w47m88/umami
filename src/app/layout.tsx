import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { headers } from 'next/headers';
import { Suspense } from 'react';
import { getBaseUrl } from '@/lib/get-base-url';
import { Providers } from './Providers';
import '@umami/react-zen/styles.full.css';
import './global.css';
import './tpc-tokens.css';
import './tpc-theme.css';

// TPC UI prepaint: resolve tpc_theme (or legacy politogy_theme) before first paint and hand it
// to react-zen via its `theme` localStorage key. "system"/unset defers to the OS scheme.
const TPC_THEME_PREPAINT = `(function(){try{var m=document.cookie.match(/(?:^|; )(?:tpc_theme|politogy_theme)=(light|dark|system)/);var p=m?m[1]:localStorage.getItem('theme')||'system';if(m){if(p==='system')localStorage.removeItem('theme');else localStorage.setItem('theme',p)}var d=p==='dark'||(p!=='light'&&matchMedia('(prefers-color-scheme: dark)').matches);var r=document.documentElement;r.classList.toggle('dark',d);r.classList.toggle('light',!d);r.setAttribute('data-theme',d?'dark':'light');r.style.colorScheme=d?'dark':'light'}catch(e){}})()`;

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export default function ({ children }) {
  if (process.env.DISABLE_UI) {
    return (
      <html>
        <body></body>
      </html>
    );
  }

  return (
    <html lang="en" className={`${inter.className} ${inter.variable}`} suppressHydrationWarning>
      <head>
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: static constant prepaint script, no user input */}
        <script data-theme-prepaint dangerouslySetInnerHTML={{ __html: TPC_THEME_PREPAINT }} />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" />
        {/* tpc-ui-ignore-next-line hardcoded-color -- browser chrome meta cannot read CSS vars; value mirrors tokens.css */}
        <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#10b981" />
        {/* tpc-ui-ignore-next-line hardcoded-color -- browser chrome meta cannot read CSS vars; value mirrors tokens.css */}
        <meta name="msapplication-TileColor" content="#10b981" />
        {/* tpc-ui-ignore-next-line hardcoded-color -- browser chrome meta cannot read CSS vars; value mirrors tokens.css */}
        <meta name="theme-color" content="#eef2f6" media="(prefers-color-scheme: light)" />
        {/* tpc-ui-ignore-next-line hardcoded-color -- browser chrome meta cannot read CSS vars; value mirrors tokens.css */}
        <meta name="theme-color" content="#0c0d10" media="(prefers-color-scheme: dark)" />
        <meta name="robots" content="noindex,nofollow" />
      </head>
      <body>
        <Suspense>
          <Providers>{children}</Providers>
        </Suspense>
      </body>
    </html>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  const headerStore = await headers();

  return {
    metadataBase: getBaseUrl(headerStore),
    title: {
      template: '%s | Umami',
      default: 'Umami',
    },
  };
}
