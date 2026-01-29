/**
 * Client-side Session Management
 * Handles anonymous UUID generation and persistence in LocalStorage
 */

import { v4 as uuidv4 } from 'uuid';

const SESSION_KEY = 'content_coach_session_id';
const GUEST_ID_KEY = 'content_coach_guest_id';

/**
 * Get or create a session ID for the current user
 * This runs only on the client side
 */
export function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') {
    throw new Error('getOrCreateSessionId can only be called on the client');
  }

  let sessionId = localStorage.getItem(SESSION_KEY);

  if (!sessionId) {
    sessionId = uuidv4();
    localStorage.setItem(SESSION_KEY, sessionId);
  }

  return sessionId;
}

/**
 * Get or create a guest ID for chat privacy
 * This is separate from sessionId and is used to isolate chat history per bot
 */
export function getOrCreateGuestId(): string {
  if (typeof window === 'undefined') {
    throw new Error('getOrCreateGuestId can only be called on the client');
  }

  let guestId = localStorage.getItem(GUEST_ID_KEY);

  if (!guestId) {
    guestId = uuidv4();
    localStorage.setItem(GUEST_ID_KEY, guestId);
  }

  return guestId;
}

/**
 * Clear the current session (useful for testing or "reset")
 */
export function clearSession(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(SESSION_KEY);
  }
}

/**
 * Clear the guest ID (useful for testing or "reset")
 */
export function clearGuestId(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(GUEST_ID_KEY);
  }
}



