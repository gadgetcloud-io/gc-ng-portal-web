/**
 * Breadcrumb Utilities
 * Helper functions for breadcrumb label generation and route segment validation
 */

/**
 * Converts a route path segment to a human-readable label
 *
 * Handles:
 * - Hyphens and underscores (converts to spaces)
 * - camelCase (adds spaces between words)
 * - Special acronyms (API, FAQ, etc.)
 * - Capitalizes first letter of each word
 *
 * @param pathSegment - The route path segment to convert
 * @returns Human-readable label
 *
 * @example
 * pathToLabel('my-gadgets') // Returns 'My Gadgets'
 * pathToLabel('api-docs') // Returns 'API Docs'
 * pathToLabel('userProfile') // Returns 'User Profile'
 */
export function pathToLabel(pathSegment: string): string {
  if (!pathSegment || pathSegment.trim() === '') {
    return '';
  }

  // Handle special acronyms that should remain uppercase
  const acronyms = ['api', 'faq', 'ui', 'ux', 'id', 'url', 'http', 'https', 'html', 'css', 'js'];

  // Step 1: Split camelCase (e.g., myGadgets -> my Gadgets)
  let label = pathSegment.replace(/([a-z])([A-Z])/g, '$1 $2');

  // Step 2: Replace hyphens and underscores with spaces
  label = label.replace(/[-_]/g, ' ');

  // Step 3: Split into words and capitalize
  const words = label.split(' ').filter(word => word.length > 0);

  const capitalizedWords = words.map(word => {
    const lowerWord = word.toLowerCase();

    // Check if word is an acronym
    if (acronyms.includes(lowerWord)) {
      return lowerWord.toUpperCase();
    }

    // Capitalize first letter
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  });

  return capitalizedWords.join(' ');
}

/**
 * Identifies if a route segment is a dynamic parameter or ID that shouldn't become a breadcrumb
 *
 * Checks for:
 * - Route parameters (starts with :)
 * - UUIDs (standard format with hyphens)
 * - Numeric IDs (all digits)
 * - Long alphanumeric strings (likely IDs)
 * - IDs with prefixes (ITM_, TKT_, DOC_, POST_)
 *
 * @param segment - The route segment to check
 * @returns true if segment is a dynamic ID that should be skipped
 *
 * @example
 * isDynamicSegment(':id') // Returns true
 * isDynamicSegment('ITM_00123') // Returns true
 * isDynamicSegment('my-gadgets') // Returns false
 */
export function isDynamicSegment(segment: string): boolean {
  if (!segment || segment.trim() === '') {
    return false;
  }

  // Route parameter (starts with :)
  if (segment.startsWith(':')) {
    return true;
  }

  // UUID format (8-4-4-4-12 characters with hyphens)
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidPattern.test(segment)) {
    return true;
  }

  // Numeric ID (all digits)
  if (/^\d+$/.test(segment)) {
    return true;
  }

  // GadgetCloud ID prefixes (ITM_, TKT_, DOC_, POST_)
  const idPrefixPattern = /^(ITM|TKT|DOC|POST)_\d+$/i;
  if (idPrefixPattern.test(segment)) {
    return true;
  }

  // Long alphanumeric string (likely an ID) - 15+ characters without spaces/hyphens
  const longAlphanumericPattern = /^[a-z0-9]{15,}$/i;
  if (longAlphanumericPattern.test(segment)) {
    return true;
  }

  // Base62 encoded user IDs (short alphanumeric like '111a', '112b')
  // Pattern: 3-5 characters, mix of letters and numbers
  const encodedIdPattern = /^[a-z0-9]{3,5}$/i;
  if (encodedIdPattern.test(segment) && /\d/.test(segment) && /[a-z]/i.test(segment)) {
    return true;
  }

  return false;
}
