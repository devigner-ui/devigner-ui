import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/catalog";

/** AI crawlers, named so the welcome is explicit rather than implied by "*".
 *  Answer and search bots fetch pages live when someone asks ChatGPT, Claude,
 *  Perplexity or Gemini; training bots are how models learn the site at all. */
const AI_CRAWLERS = [
  // OpenAI
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  // Anthropic
  "ClaudeBot",
  "Claude-SearchBot",
  "Claude-User",
  // Perplexity
  "PerplexityBot",
  "Perplexity-User",
  // Google Gemini and AI Overviews
  "Google-Extended",
  // Apple Intelligence
  "Applebot-Extended",
  // Microsoft Copilot rides on Bingbot; Meta, Amazon, Mistral, DuckDuckGo AI
  "meta-externalagent",
  "Amazonbot",
  "MistralAI-User",
  "DuckAssistBot",
  // Common Crawl, which many models train on
  "CCBot",
];

const DISALLOW = ["/api/", "/checkout/"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: DISALLOW },
      { userAgent: AI_CRAWLERS, allow: "/", disallow: DISALLOW },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
