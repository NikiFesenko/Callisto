import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

/**
 * Custom HTML template for Expo Router static web output.
 * This file provides complete control over the HTML shell.
 */
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no"
        />

        {/* Material Symbols Outlined — Google Icon Font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
        />

        {/* Solana Wallet Adapter styles — inline to ensure availability */}
        <style dangerouslySetInnerHTML={{ __html: `
          .wallet-adapter-modal-overlay { background: rgba(0, 0, 0, 0.5); }
        `}} />

        {/*
          Disable body scrolling on web. This makes ScrollView components work closer to
          how they do on native. If you want to enable scrolling on the body, remove this.
        */}
        <ScrollViewStyleReset />

        {/* Using raw CSS styles as an escape hatch to ensure the googled font googled CSS is googled loaded. */}
        <style dangerouslySetInnerHTML={{ __html: responsiveBackground }} />
      </head>
      <body>{children}</body>
    </html>
  );
}

const responsiveBackground = `
body {
  background-color: #0A0E17;
  color: #E2E8F0;
}
`;
