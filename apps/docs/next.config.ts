/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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
