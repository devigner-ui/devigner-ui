import { llmsFull, textResponse } from "@/lib/llms";

// Every component's guide in one document, for assistants that read a whole
// site in one fetch.
export const dynamic = "force-static";

export function GET() {
  return textResponse(llmsFull());
}
