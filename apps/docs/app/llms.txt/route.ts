import { llmsIndex, textResponse } from "@/lib/llms";

// llms.txt (llmstxt.org): a plain-markdown map of the site for AI assistants
// and answer engines. Built once per deploy from the same catalog as the pages.
export const dynamic = "force-static";

export function GET() {
  return textResponse(llmsIndex());
}
