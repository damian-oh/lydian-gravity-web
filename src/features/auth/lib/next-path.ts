/**
 * Resolve where to send someone after they gain a session.
 *
 * The `next` query parameter comes from whoever linked to the auth page, so
 * anything that is not a plain in-app path falls back to the library rather
 * than becoming an open redirect.
 */
export function getSafeNextPath(nextPath: string | undefined) {
  if (!nextPath || !nextPath.startsWith("/") || nextPath.startsWith("//")) {
    return "/library";
  }

  return nextPath;
}
