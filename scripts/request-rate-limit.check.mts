import assert from "node:assert/strict";
import { test } from "node:test";
import { rateLimited } from "../apps/docs/lib/request-guard.ts";

test("Upstash enforces the limit and command errors use the memory fallback", async (t) => {
  const originalFetch = globalThis.fetch;
  const originalUrl = process.env.KV_REST_API_URL;
  const originalToken = process.env.KV_REST_API_TOKEN;
  process.env.KV_REST_API_URL = "https://example.invalid";
  process.env.KV_REST_API_TOKEN = "test-token";
  t.mock.method(console, "error", () => {});

  try {
    let hits = 0;
    globalThis.fetch = async () => Response.json([{ result: ++hits }, { result: 1 }]);
    for (let i = 0; i < 3; i++) assert.equal(await rateLimited("upstash-test"), false);
    assert.equal(await rateLimited("upstash-test"), true);

    globalThis.fetch = async () => Response.json([{ error: "ERR command failed" }, { result: 1 }]);
    for (let i = 0; i < 3; i++) assert.equal(await rateLimited("fallback-test"), false);
    assert.equal(await rateLimited("fallback-test"), true);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalUrl === undefined) delete process.env.KV_REST_API_URL;
    else process.env.KV_REST_API_URL = originalUrl;
    if (originalToken === undefined) delete process.env.KV_REST_API_TOKEN;
    else process.env.KV_REST_API_TOKEN = originalToken;
  }
});
