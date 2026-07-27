import React from 'react';
import { Head } from 'vike-react/Head';

interface AnalyticsScriptsProps {
  settings?: {
    analyticsGaId?: string;
    analyticsGtmId?: string;
    metaPixelId?: string;
    searchConsoleVerification?: string;
    customHeadScripts?: string;
    customFooterScripts?: string;
  };
}

function sanitizeScripts(html: string): string {
  return html.replace(/\s+on\w+\s*=\s*["'][^"']*["']/gi, '');
}

export default function AnalyticsScripts({ settings }: AnalyticsScriptsProps) {
  if (!settings) return null;

  const gaId = settings.analyticsGaId || '';
  const gtmId = settings.analyticsGtmId || '';
  const pixelId = settings.metaPixelId || '';
  const searchConsole = settings.searchConsoleVerification || '';
  const headScripts = settings.customHeadScripts || '';
  const footerScripts = settings.customFooterScripts || '';

  return (
    <>
      <Head>
        {searchConsole && (
          <meta name="google-site-verification" content={searchConsole} />
        )}

        {gaId && (
          <>
            <script async src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} />
            <script>{`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${gaId}', { page_path: window.location.pathname });
            `}</script>
          </>
        )}

        {gtmId && (
          <script>{`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtmId}');`}</script>
        )}

        {pixelId && (
          <script>{`
            !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${pixelId}');fbq('track','PageView');
          `}</script>
        )}

        {headScripts && (
          <script>{sanitizeScripts(headScripts)}</script>
        )}
      </Head>

      {gtmId && (
        <noscript>
          <iframe src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`} height="0" width="0" style={{ display: 'none', visibility: 'hidden' }} />
        </noscript>
      )}

      {footerScripts && (
        <script dangerouslySetInnerHTML={{ __html: footerScripts }} />
      )}
    </>
  );
}
