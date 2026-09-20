import { createMDX } from "fumadocs-mdx/next";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // @devignerui/ui resolves through a pnpm symlink into node_modules, which the
  // dev server does not watch: tsup rewrites dist/ and Next keeps serving the
  // module graph it bundled at boot. Transpiling it makes Next treat the
  // package as app source, so edits in packages/ui show up without a restart.
  transpilePackages: ["@devignerui/ui"],
};

const withMDX = createMDX();

export default withMDX(nextConfig);
