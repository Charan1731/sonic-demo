This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started (Demo App)

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Sonic Widget Library

This project also contains a self-contained, embeddable Sonic widget that can be packaged as a reusable npm library.

- Entry point: `src/index.ts`
- Main React component: `SonicWidget`
- Imperative initializer for non-React hosts: `initSonicWidget`

### Building the library

The library build (ESM + CJS + type definitions) is handled by [tsup](https://github.com/egoist/tsup):

```bash
npm run build:lib
```

This will emit tree-shakeable outputs under `dist/`.

### Basic React usage

```tsx
import { SonicWidget } from '@sonic/widget';

function App() {
  return (
    <SonicWidget
      apiKey="SONIC_API_KEY"
      user={{ email: 'user@example.com' }}
      env="development"
      theme={{ mode: 'light' }}
    />
  );
}
```

### Basic non-React usage

```ts
import { initSonicWidget } from '@sonic/widget';

initSonicWidget({
  target: '#sonic-widget-button',
  apiKey: 'SONIC_API_KEY',
  user: { email: 'user@example.com' },
  env: 'development',
});
```

> Note: The package is not published; these examples illustrate the intended public API once published.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
