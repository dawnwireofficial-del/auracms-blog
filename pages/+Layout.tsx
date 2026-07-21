import React from 'react';
import { Head } from 'vike-react/Head';

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>
    <Head>
      <meta name="google-site-verification" content="WOjYqiIfsOAz-zW1tzhD7_trio6ygVvRsHXan1wiy_g" />
    </Head>
    {children}
  </>;
}
