// Configuration settings for the Perchance Character Database
const CONFIG = {
    // GitHub repository information
    repo: {
        owner: 'nosfertm',
        name: 'perchance-character-database',
        branch: 'main'
    },
    
    // File paths for different content types
    paths: {
        characters: {
            index: 'ai-character-chat/characters/index.json'
        },
        lorebooks: {
            index: 'ai-character-chat/lorebooks/index.json'
        },
        guides: 'guides/index.json'
    },

    // Cache configuration for different resources
    cache: {
        characters: {
            duration: 60,  // Cache duration in minutes
            key: 'characters_cache'
        },
        lorebooks: {
            duration: 120,  // Cache duration in minutes
            key: 'lorebooks_cache'
        },
        guides: {
            duration: 180,  // Cache duration in minutes
            key: 'guides_cache'
        }
    },

    // Site metadata
    site: {
        title: 'Perchance Character Database',
        description: 'Community-driven platform for Perchance.org characters and resources',
        version: '1.0.0'
    },

    // GitHub API configuration
    github: {
        baseUrl: 'https://api.github.com/repos',
        contentType: 'application/vnd.github.v3+json'
    }
};

// Export configuration for use in other modules
//export default CONFIG;