/**
 * Removes all '/', '\', and spaces from the beginning and end of the path
 * Replaces all '/', '\', and spaces between sections of the path
 * Adds prefix and suffix if supplied
 */
export function normalizePath(
  path: string,
  withPrefix?: string,
  withSuffix?: string,
  skipPrefixAndSuffixIfEmpty: boolean = true
) {
  if ((!path || path === '/') && skipPrefixAndSuffixIfEmpty) {
    return '';
  }
  if (!path || typeof path !== 'string') {
    path = '' + path;
  }
  // normalize beginning and end of the path
  let normalized = path.replace(/^[/\\\s]+|[/\\\s]+$/g, '');
  normalized = withPrefix ? withPrefix + normalized : normalized;
  normalized = withSuffix ? normalized + withSuffix : normalized;
  // normalize / signs amount in all path
  normalized = normalized.replace(/[/\\\s]+/g, '/');
  return normalized;
}
