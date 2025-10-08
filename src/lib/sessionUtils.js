// Utility functions for session management
import { v4 as uuidv4 } from 'uuid';

/**
 * Generate a session ID for anonymous users
 * @returns {string} A unique session ID
 */
export const generateSessionId = () => {
    // Check if we already have a session ID in localStorage
    let sessionId = localStorage.getItem('ideaspireSessionId');

    // If not, generate a new one and store it
    if (!sessionId) {
        sessionId = uuidv4();
        localStorage.setItem('ideaspireSessionId', sessionId);
    }

    return sessionId;
};

/**
 * Get the current session ID, generating one if it doesn't exist
 * @returns {string} The current session ID
 */
export const getSessionId = () => {
    return generateSessionId();
};
