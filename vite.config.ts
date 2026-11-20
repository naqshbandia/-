import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, Plugin } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(() => {
  const repoName = process.env.GITHUB_REPOSITORY?.split('/')[1];
  const isGitHubSubpath =
    process.env.GITHUB_ACTIONS === 'true' &&
    !!repoName &&
    !repoName.endsWith('.github.io');
  const base = isGitHubSubpath ? `/${repoName}/` : '/';

  const pwaManifest = {
    id: base,
    name: 'Khanqah Darul Falah',
    short_name: 'دارالفلاح',
    description:
      'خانقاہ دارالفلاح - حضرت مولانا پیر محمد جمشید نقشبندی مجددی (دامت برکاتہم العالیہ)',
    theme_color: '#064326',
    background_color: '#053b2d',
    display: 'standalone' as const,
    orientation: 'portrait-primary' as const,
    start_url: base,
    scope: base,
    icons: [
      {
        src: `${base}kdf-icon-192-v4.png`,
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any' as const,
      },
      {
        src: `${base}kdf-icon-512-v4.png`,
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any' as const,
      },
      {
        src: `${base}kdf-icon-maskable-v4.png`,
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable' as const,
      },
    ],
  };

  const devManifestPlugin: Plugin = {
    name: 'kdf-dev-manifest',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url?.split('?')[0] === `${base}manifest.webmanifest`) {
          res.setHeader('Content-Type', 'application/manifest+json; charset=utf-8');
          res.setHeader('Cache-Control', 'no-store');
          res.end(JSON.stringify(pwaManifest, null, 2));
          return;
        }
        next();
      });
    },
    transformIndexHtml(html) {
      if (html.includes('rel="manifest"')) return html;
      return html.replace(
        '</head>',
        `  <link rel="manifest" href="${base}manifest.webmanifest" />\n  </head>`
      );
    },
  };

  return {
    base,
    plugins: [
      react(),
      tailwindcss(),
      devManifestPlugin,
      VitePWA({
        registerType: 'autoUpdate',
        useCredentials: true,
        includeAssets: [
          'favicon.ico',
          'favicon.png',
          'kdf-favicon-v4.png',
          'kdf-apple-touch-v4.png',
          'kdf-icon-192-v4.png',
          'kdf-icon-512-v4.png',
          'kdf-icon-maskable-v4.png',
          'kdf-logo-v4.webp',
          'apple-touch-icon.png',
          'app-icon-192.png',
          'app-icon-512.png',
          'app-icon-maskable.png',
          'app-logo.webp',
          'sheikh-glass-banner.png',
        ],
        manifest: pwaManifest,
        workbox: {
          cleanupOutdatedCaches: true,
          clientsClaim: true,
          skipWaiting: true,
          globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff,woff2}'],
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        },
        devOptions: {
          enabled: process.env.DISABLE_HMR !== 'true',
          type: 'module',
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve('.'),
      },
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      allowedHosts: true as const,
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    preview: {
      port: 3000,
      host: '0.0.0.0',
      allowedHosts: true as const,
    },
  };
});

