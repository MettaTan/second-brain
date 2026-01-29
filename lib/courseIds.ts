/**
 * Deterministic Course ID Generation
 * 
 * Generates stable, deterministic IDs for course items based on their
 * hierarchical path (section title + item title).
 * 
 * This ensures IDs are identical on client and server, preventing
 * mismatches in progress tracking.
 */

/**
 * Slugify a string to create a URL-safe identifier
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces/underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Generate a deterministic module/item ID from path parts
 * 
 * @param pathParts - Array of path segments (e.g., ["Phase 1", "The Funnel Doctor"])
 * @returns A deterministic ID like "phase-1/the-funnel-doctor"
 * 
 * @example
 * makeModuleId(["Phase 1", "The Funnel Doctor"]) 
 * // Returns: "phase-1/the-funnel-doctor"
 */
export function makeModuleId(pathParts: string[]): string {
  if (pathParts.length === 0) {
    throw new Error('makeModuleId requires at least one path part');
  }
  
  // Slugify each part and join with forward slash
  const slugParts = pathParts.map(part => slugify(String(part)));
  return slugParts.join('/');
}

/**
 * Generate an ID for a course item within a section
 * 
 * @param sectionTitle - The title of the section/phase
 * @param itemTitle - The title of the item/module
 * @returns A deterministic ID
 */
export function makeItemId(sectionTitle: string, itemTitle: string): string {
  return makeModuleId([sectionTitle, itemTitle]);
}

/**
 * Generate an ID for a section/phase
 * 
 * @param sectionTitle - The title of the section/phase
 * @returns A deterministic ID
 */
export function makeSectionId(sectionTitle: string): string {
  return slugify(sectionTitle);
}

