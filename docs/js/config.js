// Configuration settings for the web application
const CONFIG = {
    // Repository information
    repo: {
        owner: 'nosfertm',
        name: 'perchance-character-database',
        branch: 'sketch'
    },
    
    // File paths organized by feature/page
    paths: {
        accCharacters: {
            index: 'ai-character-chat/characters/index.json'
        },
        lorebooks: {
            index: 'ai-character-chat/lorebooks/index.json'
        },
        categories: 'categories.json',
        types: {
            sfw: 'sfw',
            nsfw: 'nsfw'
        }
    },

    // Cache settings organized by feature/page
    cache: {
        accCharacters: {
            duration: 60,  // Time to maintain cache in minutes (1 hour)
            key: 'acc_characters_cache'
        },
        lorebooks: {
            duration: 120,  // Cache duration for lorebooks in minutes (2 hours)
            key: 'lorebooks_cache'
        }
    },

    // Debug settings for logging
    debug: {
        aacCharacters: { 
            "filters": true,    // Enable log for 'filters'
            "display": true,    // Enable log for 'display'
            "gallery": true     // Enable log for 'gallery'
        },
        lorebooks: false
    },
    
    // UI Configuration
    ui: {
        galleryMode: 'portrait', // Configuration for gallery display mode
        truncateNameLength: 15  // Maximum character name length in gallery
    },

    // Site navigation
    navigation: {
        home: '/index.html',
        gallery: '/acc-characters.html',
        lorebooks: '/lorebooks.html'
    },
    
    // Site information
    site: {
        title: 'Perchance Character Database',
        description: 'Community-driven platform for Perchance.org characters and resources'
    }
};

export default CONFIG;
