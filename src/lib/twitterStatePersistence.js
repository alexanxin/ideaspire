// twitterStatePersistence.js
// Handles state persistence for Twitter API rate limiting across multiple sessions

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// For Node.js environments, get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class TwitterStatePersistence {
    constructor() {
        this.stateDir = path.join(__dirname, '../../data');
        this.stateFilePath = path.join(this.stateDir, 'twitter-rate-limit-state.json');
    }

    // Initialize the state directory
    async initialize() {
        try {
            await fs.mkdir(this.stateDir, { recursive: true });
        } catch (error) {
            console.warn('Could not create state directory, using memory storage only:', error.message);
        }
    }

    // Save state to file
    async saveState(state) {
        try {
            // Ensure directory exists
            await this.initialize();

            const stateToSave = {
                ...state,
                savedAt: new Date().toISOString()
            };

            await fs.writeFile(this.stateFilePath, JSON.stringify(stateToSave, null, 2));
            console.log(`State saved to ${this.stateFilePath}`);
            return true;
        } catch (error) {
            console.error('Error saving state to file:', error.message);
            return false;
        }
    }

    // Load state from file
    async loadState() {
        try {
            const data = await fs.readFile(this.stateFilePath, 'utf8');
            const state = JSON.parse(data);
            console.log(`State loaded from ${this.stateFilePath}`);
            return state;
        } catch (error) {
            if (error.code === 'ENOENT') {
                console.log('No saved state found, starting fresh');
                return null;
            } else {
                console.error('Error loading state from file:', error.message);
                return null;
            }
        }
    }

    // Clear saved state
    async clearState() {
        try {
            await fs.unlink(this.stateFilePath);
            console.log('State cleared');
            return true;
        } catch (error) {
            if (error.code === 'ENOENT') {
                console.log('No state file to clear');
                return true;
            } else {
                console.error('Error clearing state:', error.message);
                return false;
            }
        }
    }

    // Get state file path
    getStateFilePath() {
        return this.stateFilePath;
    }
}

// Alternative in-memory persistence (for serverless environments)
class InMemoryPersistence {
    constructor() {
        this.state = null;
    }

    async saveState(state) {
        this.state = {
            ...state,
            savedAt: new Date().toISOString()
        };
        console.log('State saved to memory');
        return true;
    }

    async loadState() {
        if (this.state) {
            console.log('State loaded from memory');
            return this.state;
        }
        console.log('No state found in memory');
        return null;
    }

    async clearState() {
        this.state = null;
        console.log('Memory state cleared');
        return true;
    }
}

// Factory function to create appropriate persistence instance
export async function createPersistenceAdapter(useFileStorage = true) {
    if (useFileStorage) {
        try {
            const persistence = new TwitterStatePersistence();
            await persistence.initialize();
            return persistence;
        } catch (error) {
            console.warn('File storage not available, falling back to memory storage:', error.message);
            return new InMemoryPersistence();
        }
    } else {
        return new InMemoryPersistence();
    }
}

// Convenience functions for easy use
export async function saveTwitterState(state) {
    const persistence = await createPersistenceAdapter();
    return await persistence.saveState(state);
}

export async function loadTwitterState() {
    const persistence = await createPersistenceAdapter();
    return await persistence.loadState();
}

export async function clearTwitterState() {
    const persistence = await createPersistenceAdapter();
    return await persistence.clearState();
}