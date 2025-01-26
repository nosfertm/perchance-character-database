class PerchanceApp {
    // Initialize the application
    constructor() {
        this.config = window.CONFIG;
        this.initializeApp();
    }

    // Set up initial application configurations
    initializeApp() {
        // Configure global error handling
        window.addEventListener('error', this.handleGlobalError);

        // Initialize cache management
        this.setupCacheManagement();
    }

    // Global error handler
    handleGlobalError(event) {
        console.error('Unhandled error:', event.error);
        // Optionally, display user-friendly error message
    }

    // Set up browser cache management
    setupCacheManagement() {
        // Basic cache management utility
        this.cache = {
            // Store item in cache with expiration
            set(key, value, duration = 60) {
                const item = {
                    value: value,
                    expiry: Date.now() + (duration * 60 * 1000)
                };
                localStorage.setItem(key, JSON.stringify(item));
            },

            // Retrieve item from cache
            get(key) {
                const itemStr = localStorage.getItem(key);
                if (!itemStr) return null;

                const item = JSON.parse(itemStr);
                if (Date.now() > item.expiry) {
                    localStorage.removeItem(key);
                    return null;
                }
                return item.value;
            }
        };
    }

    // Fetch data from GitHub with optional caching
    async fetchGitHubData(path, useCache = true) {
        const cacheKey = `github_${path.replace(/\//g, '_')}`;

        // Check cache first if enabled
        if (useCache) {
            const cachedData = this.cache.get(cacheKey);
            if (cachedData) return cachedData;
        }

        try {
            const url = `${this.config.github.baseUrl}/${this.config.repo.owner}/${this.config.repo.name}/contents/${path}`;
            const response = await fetch(url, {
                headers: {
                    'Accept': this.config.github.contentType
                }
            });

            if (!response.ok) {
                throw new Error(`GitHub API error: ${response.status}`);
            }

            const data = await response.json();
            
            // Cache the result if caching is enabled
            if (useCache) {
                this.cache.set(
                    cacheKey, 
                    data, 
                    this.config.cache[path.split('/')[0]]?.duration || 60
                );
            }

            return data;
        } catch (error) {
            console.error('Failed to fetch data:', error);
            return null;
        }
    }
}

// Initialize the application when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    window.PerchanceApp = new PerchanceApp();
});