/**
 * semver.js — Minimal semantic version comparison.
 * No dependencies. Only handles X.Y.Z format.
 */

/**
 * Compare two semver strings.
 * Returns:
 *   -1 if a < b
 *    0 if a === b
 *    1 if a > b
 */
export function compareSemver(a, b) {
  const parse  = v => String(v || '0.0.0').split('.').map(n => parseInt(n, 10) || 0);
  const [aMaj, aMin, aPat] = parse(a);
  const [bMaj, bMin, bPat] = parse(b);

  if (aMaj !== bMaj) return aMaj > bMaj ? 1 : -1;
  if (aMin !== bMin) return aMin > bMin ? 1 : -1;
  if (aPat !== bPat) return aPat > bPat ? 1 : -1;
  return 0;
}

/** Returns true if installed < minimum (force update required) */
export function needsForceUpdate(installedVersion, minimumVersion) {
  return compareSemver(installedVersion, minimumVersion) < 0;
}

/** Returns true if installed < latest (optional update available) */
export function hasOptionalUpdate(installedVersion, latestVersion) {
  return compareSemver(installedVersion, latestVersion) < 0;
}

/** Returns true if installed === latest */
export function isUpToDate(installedVersion, latestVersion) {
  return compareSemver(installedVersion, latestVersion) >= 0;
}
