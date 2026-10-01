/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            // Next's statically rendered App Router payload contains inline
            // scripts, so a nonce-based policy would require dynamic rendering.
            // This preserves static delivery while limiting every source list.
            value:
              "default-src 'self'; base-uri 'self'; object-src 'none'; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://challenges.cloudflare.com; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data: https://cdn.discordapp.com https://media.discordapp.net https://www.google-analytics.com; font-src 'self'; connect-src 'self' https://www.google-analytics.com https://region1.google-analytics.com https://challenges.cloudflare.com; frame-src https://challenges.cloudflare.com; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests",
          },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), geolocation=(), microphone=(), payment=()",
          },
        ],
      },
    ];
  },
  // devignerui resolves through a pnpm symlink into node_modules, which the
  // dev server does not watch: tsup rewrites dist/ and Next keeps serving the
  // module graph it bundled at boot. Transpiling it makes Next treat the
  // package as app source, so edits in packages/ui show up without a restart.
  transpilePackages: ["devignerui"],
  // The icons package defines all ~6,400 icons inline in its index, so a
  // barrel import ships every one of them (6 MB of client JS). Rewrite each
  // `import { IconX } from "@devigner-ui/icons"` to its own module...
  modularizeImports: {
    "@devigner-ui/icons": {
      transform: "@devigner-ui/icons/{{ member }}",
      skipDefaultConversion: true,
    },
  },
  // ...and since the files drop the prefix (IconCopy lives in dist/icons/Copy.js,
  // exported as "@devigner-ui/icons/Copy"), strip it on the way in.
  turbopack: {
    resolveAlias: {
      "@devigner-ui/icons/Icon*": "@devigner-ui/icons/*",
    },
  },
};

export default nextConfig;
