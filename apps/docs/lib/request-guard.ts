/** Spam protection for the request form: a Turnstile check and a per-IP rate
 *  limit. Each switches on when its env vars are set (see
 *  docs/component-requests.md), so neither blocks local work before setup. */

/** A counter per IP: at most `max` hits per `windowS` seconds. */
type Bucket = { name: string; max: number; windowS: number };

/** Sent requests. */
const SEND: Bucket = { name: "request", max: 3, windowS: 10 * 60 };
/** Username lookups while typing. Each is a call on Discord's member search,
 *  which the whole site shares at about 10 per 10 seconds. */
export const LOOKUP: Bucket = { name: "lookup", max: 20, windowS: 10 * 60 };

/** Verifies the Turnstile token. No secret configured means the check is off. */
export async function verifyHuman(token: string, ip: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true;
  if (!token) return false;
  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: new URLSearchParams({ secret, response: token, remoteip: ip }),
    });
    const data = (await res.json()) as { success: boolean; action?: string };
    return data.success && (!data.action || data.action === "component-request");
  } catch (err) {
    // Cloudflare unreachable: let it through rather than lose the request.
    // The rate limit still applies.
    console.error("Turnstile verify failed:", err);
    return true;
  }
}

/** Fallback when Upstash is not configured or unreachable: per instance and
 *  wiped on cold start, which is why production uses Upstash. */
const memory = new Map<string, number[]>();
function memoryHit(key: string, windowS: number) {
  const now = Date.now();
  const recent = (memory.get(key) ?? []).filter((t) => now - t < windowS * 1000);
  memory.set(key, [...recent, now]);
  return recent.length + 1;
}

/** True when this IP has used up its hits in the bucket's window. */
export async function rateLimited(
  ip: string,
  { name, max, windowS }: Bucket = SEND,
): Promise<boolean> {
  // Vercel's Upstash integration names these KV_REST_API_*; a database made
  // on upstash.com gives UPSTASH_REDIS_REST_*. Either works.
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return memoryHit(`${name}:${ip}`, windowS) > max;

  // Fixed window: one counter per IP per window, expiring with it. Plain
  // REST, so no SDK to install.
  const key = `${name}:${ip}:${Math.floor(Date.now() / 1000 / windowS)}`;
  try {
    const res = await fetch(`${url}/pipeline`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify([
        ["INCR", key],
        ["EXPIRE", key, windowS],
      ]),
    });
    if (!res.ok) throw new Error(`Upstash ${res.status}`);
    const [count, expiry] = (await res.json()) as { result?: number; error?: string }[];
    const hits = count?.result;
    if (typeof hits !== "number" || !Number.isSafeInteger(hits) || hits < 1 || expiry?.result !== 1)
      throw new Error("Upstash pipeline failed");
    return hits > max;
  } catch (err) {
    console.error("Rate limit store unreachable, using memory:", err);
    return memoryHit(`${name}:${ip}`, windowS) > max;
  }
}
