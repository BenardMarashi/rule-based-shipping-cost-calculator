import { vitePlugin as remix } from "@remix-run/dev";
import { installGlobals } from "@remix-run/node";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

installGlobals({ nativeFetch: true });

if (
  process.env.HOST &&
  (!process.env.SHOPIFY_APP_URL ||
    process.env.SHOPIFY_APP_URL === process.env.HOST)
) {
  process.env.SHOPIFY_APP_URL = process.env.HOST;
  delete process.env.HOST;
}

// Simplified HMR config that only uses localhost
const hmrConfig = {
  protocol: "ws",
  host: "localhost",
  port: 64999,
  clientPort: 64999,
};

export default defineConfig({
  server: {
    host: "localhost", // Bind to localhost only
    port: 3000,
    strictPort: true,
    hmr: hmrConfig,
    fs: {
      allow: ["app", "node_modules"],
    },
    // Add this section to allow your Cloudflare tunnel domain
    allowedHosts: [
      // Allow all .trycloudflare.com domains
      '.trycloudflare.com',
      // Explicitly add your current tunnel domain
      'encyclopedia-obesity-bradford-bhutan.trycloudflare.com'
    ]
  },
  plugins: [
    remix({
      ignoredRouteFiles: ["**/.*"],
      future: {
        v3_fetcherPersist: true,
        v3_relativeSplatPath: true,
        v3_throwAbortReason: true,
        v3_lazyRouteDiscovery: true,
        v3_singleFetch: false,
        v3_routeConfig: true,
      },
    }),
    tsconfigPaths(),
  ],
  build: {
    assetsInlineLimit: 0,
  },
  optimizeDeps: {
    include: ["@shopify/app-bridge-react", "@shopify/polaris"],
  },
});