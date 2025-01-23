// Configuration settings for the web application
const CONFIG = {
    // Repository information
    repo: {
        owner: 'nosfertm',
        name: 'perchance-character-database',
        branch: 'sketch'
    },
    
    // File paths
    paths: {
        // Categories configuration file path in the repository
        categories: '/categories.json',
        
        // Base path for character folders
        charactersBase: '/ai-character-chat/characters',
        
        // Character type folders
        characterTypes: {
            sfw: 'sfw',
            nsfw: 'nsfw'
        }
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