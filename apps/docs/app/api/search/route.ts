import { source } from "@/lib/source";
import { createSearchAPI } from "fumadocs-core/search/server";
import type { DocMethods } from "fumadocs-mdx/runtime/types";

export const { GET } = createSearchAPI("simple", {
  indexes: async () =>
    Promise.all(
      source.getPages().map(async (page) => {
        // `getPage()`'s generic inference doesn't carry DocMethods (getText)
        // through fumadocs-mdx 14.x's collection types — exists at runtime,
        // just not surfaced on the inferred PageData type (see [[...slug]]/page.tsx).
        const data = page.data as typeof page.data & DocMethods;
        return {
          title: page.data.title ?? page.url,
          description: page.data.description,
          url: page.url,
          content: await data.getText("raw"),
        };
      }),
    ),
});
