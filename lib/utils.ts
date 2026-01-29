/**
 * Utility Functions
 * Helper functions for text processing and formatting
 */

/**
 * Clean OpenAI citation markers from text
 * Removes patterns like 【4:0†source】, [4:0†source.pdf], etc.
 * 
 * @param text - The text containing citation markers
 * @returns Cleaned text without citation markers
 */
export function cleanText(text: string): string {
  if (!text) return '';

  // Remove OpenAI citation markers in various formats
  let cleaned = text
    // Remove 【digit:digit†source】 format (Chinese brackets)
    .replace(/【\d+:\d+†[^】]*】/g, '')
    // Remove [digit:digit†source] format (square brackets)
    .replace(/\[\d+:\d+†[^\]]*\]/g, '')
    // Remove standalone 【digit†source】 format
    .replace(/【\d+†[^】]*】/g, '')
    // Remove standalone [digit†source] format
    .replace(/\[\d+†[^\]]*\]/g, '')
    // Clean up multiple spaces
    .replace(/\s{2,}/g, ' ')
    // Clean up space before punctuation
    .replace(/\s+([.,!?;:])/g, '$1')
    // Trim whitespace
    .trim();

  return cleaned;
}

/**
 * Format a date relative to now (e.g., "2 hours ago", "Yesterday")
 * 
 * @param dateString - ISO date string
 * @returns Formatted relative date string
 */
export function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'Just now';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} ${diffInMinutes === 1 ? 'minute' : 'minutes'} ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) {
    return 'Yesterday';
  }

  if (diffInDays < 7) {
    return `${diffInDays} days ago`;
  }

  // Format as date for older messages
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

/**
 * Truncate text to a maximum length with ellipsis
 * 
 * @param text - Text to truncate
 * @param maxLength - Maximum length before truncation
 * @returns Truncated text with ellipsis if needed
 */
export function truncate(text: string, maxLength: number = 50): string {
  if (!text || text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
}




