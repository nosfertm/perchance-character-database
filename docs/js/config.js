// Configuration settings for the Perchance Character Database
window.CONFIG = {
    // GitHub repository information
    repo: {
        owner: 'nosfertm',
        name: 'perchance-character-database',
        branch: 'develop'
    },
    
    // File paths for different content types
    paths: {
        accCharacters: {
            index: 'ai-character-chat/characters/index.json'
        },
        lorebooks: {
            index: 'ai-character-chat/lorebooks/index.json'
        },
        guides: 'guides/index.json',
        categories: 'categories.json'
    },

    // Cache configuration for different resources
    cache: {
        accCharacters: {
            characters: {
                duration: 60,  // Cache duration in minutes
                key: 'accCharacters_cache'
            },
            filters: {
                duration: 60,  // Time to maintain cache in minutes (1 hour)
                key: 'acc_filters_cache'
            },
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

    // Debug settings for logging
    debug: {
        aacCharacters: { 
            "categories": false,
            "characters": false  
        },
        lorebooks: false
    },

    // Site metadata
    site: {
        title: 'Perchance Character Database',
        description: 'Community-driven platform for Perchance.org characters and resources',
        version: '1.0.0',
        pageTitle: 'Perchance DBA',
        //isDarkMode: true,
        featuredSections: [
            {
                title: 'Characters',
                description: 'Explore a diverse collection of AI-generated characters.',
                link: 'acc-characters.html'
            },
            {
                title: 'Lore Books',
                description: 'Dive into rich worldbuilding resources and lore.',
                link: ''
            },
            {
                title: 'Guides',
                description: 'Learn how to create and use Perchance generators.',
                link: ''
            }
        ]
    },

    // GitHub API configuration
    github: {
        baseUrl: 'https://api.github.com/repos',
        contentType: 'application/vnd.github.v3+json'
    }
};