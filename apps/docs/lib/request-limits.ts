/** Limits shared by the request form and its API route. Kept apart from
 *  lib/requests.ts, which is server only and pulls in the whole registry. */

/** Reference screenshots. Discord caps a webhook upload at 10 MB in total on
 *  an unboosted server, so three images at 3 MB leave headroom. Vercel caps
 *  a function's request body at 4.5 MB, so the form keeps the images under
 *  `total` together, re-encoding only when the originals don't fit. */
export const IMAGES = {
  max: 3,
  bytes: 3 * 1024 * 1024,
  total: 4 * 1024 * 1024,
  types: ["image/png", "image/jpeg", "image/webp", "image/gif"],
} as const;

export const MAX_LINKS = 3;

/** The request forum's Slowmode, in seconds (Discord: channel settings >
 *  Slowmode > Posts). Keep in sync: after a send, the form holds Send for
 *  this long so the next post isn't refused. */
export const SLOWMODE_S = 15;

/** Discord's username rules: 2 to 32 of lowercase letters, numbers, _ and .,
 *  never two dots in a row. A leading @ is dropped and case is ignored, the
 *  way Discord itself treats a typed username. */
const DISCORD_USERNAME = /^(?!.*\.\.)[a-z0-9_.]{2,32}$/;
export function discordUsername(raw: string): string | null {
  const v = raw.trim().replace(/^@/, "").toLowerCase();
  return DISCORD_USERNAME.test(v) ? v : null;
}
