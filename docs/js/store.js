import { DatabaseService } from './supabase.js';

// General Site configuration
export const piniaSiteConfig = Pinia.defineStore('configManager', {

    state: () => ({
        // GitHub repository information
        repo: {
            owner: 'nosfertm',
            name: 'perchance-character-database',
            branch: 'main'
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
        },

        // For navigation
        currentPath: window.location.pathname
    }),

    actions: {

    },

    getters: {
        getCurrentPage: (state) => state.currentPath,

        hideLoginButton() {
            return this.currentPath.includes('user-settings');
        }
    }

});

// General Theme configuration and methods
export const piniaTheme = Pinia.defineStore('themeManager', {

    state: () => ({
        isDarkMode: localStorage.getItem('siteTheme') === 'dark',
        currentTheme: localStorage.getItem('siteTheme') || 'dark'
    }),

    actions: {
        // Toggle between light and dark themes
        toggleTheme(theme) {
            console.log('Toggling theme:', theme);
            const currentTheme = localStorage.getItem('siteTheme') || this.currentTheme;

            // Toggle logic
            if (currentTheme !== theme) {
                theme = currentTheme === 'light' ? 'dark' : 'light';
                document.body.classList.toggle('dark-theme');
            }

            // Update theme
            localStorage.setItem('siteTheme', theme);
            this.isDarkMode = theme === 'dark';
            this.currentTheme = theme;
        },


        // Initialize theme on page load
        initTheme() {
            const savedTheme = localStorage.getItem('siteTheme') || 'dark';
            if (savedTheme === 'dark') {
                document.body.classList.add('dark-theme');
            }
            this.isDarkMode = savedTheme === 'dark';
            this.currentTheme = savedTheme;
            
            // Save the theme to the local storage
            localStorage.setItem('siteTheme', savedTheme);
        }
    },

    getters: {
        themeIcon: (state) => {
            switch (state.currentTheme) {
                case 'dark':
                    return 'fas fa-moon';
                case 'auto':
                    return 'fas fa-circle-half-stroke';
                default:
                    return 'fas fa-sun';
            }
        }
    }

});

// User data store and methods
export const piniaUser = Pinia.defineStore('userManager', {

    state: () => ({
        userData: JSON.parse(localStorage.getItem('user_basic_info')) || {},
        isLoggedIn: localStorage.getItem('user_logged_in') || false,
        loading: false
    }),

    actions: {
        async getUser() {
            try {
                // Get the data
                const { user, data, error } = await DatabaseService.getUserProfile();

                if (error) {
                    this.signOut();
                    if (error != 'Not authenticated') console.error('Error loading user profile:', error);
                    return;
                }

                const email = user.email
                const id = user.id

                if (data) {
                    // Update data
                    this.userData = {
                        id,
                        email,
                        ...data
                    };
                    this.isLoggedIn = true;

                    // Save to local storage
                    localStorage.setItem('user_logged_in', 'true');
                    localStorage.setItem('user_basic_info', JSON.stringify({
                        id,
                        email,
                        ...data
                    }));

                    // Try to load the avatar from cache
                    if (data.avatar_url) {
                        const cachedAvatarKey = `avatar_image_${user.id}`;

                        try {
                            // Try to get the cached image data
                            const cachedImageData = localStorage.getItem(cachedAvatarKey);

                            if (cachedImageData) {
                                // Parse the cached data
                                const { dataUrl, timestamp, url } = JSON.parse(cachedImageData);

                                // Check if cache is still valid (24 hours) and URL matches
                                const cacheAge = Date.now() - timestamp;
                                const cacheValid = cacheAge < 1 * 60 * 60 * 1000; // 1 hour

                                if (cacheValid && url === data.avatar_url) {
                                    // Use the cached image data directly
                                    this.userData.avatar_url = dataUrl;
                                    //console.log('Using cached avatar image1');
                                } else {
                                    // Cache is invalid or URL changed, fetch and cache the new image
                                    this.fetchAndCacheAvatar(data.avatar_url, user.id);
                                }
                            } else {
                                // No cache exists, fetch and cache the image
                                this.fetchAndCacheAvatar(data.avatar_url, user.id);
                            }
                        } catch (cacheError) {
                            console.error('Error accessing avatar cache:', cacheError);
                            // If there's an error with the cache, just use the URL directly
                        }
                    }

                } else {
                    this.isLoggedIn = false;
                    localStorage.setItem('user_logged_in', 'false');
                    localStorage.removeItem('user_basic_info');
                }
            } catch (error) {
                console.error('Error fetching user data:', error);
                this.isLoggedIn = false;
                localStorage.setItem('user_logged_in', 'false');
            }
        },

        // Helper method to fetch and cache the avatar image
        async fetchAndCacheAvatar(url, userId) {
        
            // Validate URL
            if (!url) {
                console.warn('No URL provided for avatar');
                return;
            }
        
            // Determine user ID
            if (!userId && this.userData.id) {
                userId = this.userData.id;
            } else if (!userId && !this.userData.id) {
                console.warn('No user ID found');
                return;
            }
        
            try {
                // Create a new URL object to add cache-busting query parameter
                const fetchUrl = new URL(url);
                
                // Add a timestamp to force a new request
                fetchUrl.searchParams.set('t', Date.now());
        
                // Fetch the image with cache-busting
                const response = await fetch(fetchUrl.toString(), {
                    // Explicitly disable browser cache
                    cache: 'no-store'
                });
                
                // Ensure the response is successful
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                // Convert response to blob
                const blob = await response.blob();
        
                // Return a promise that resolves with the data URL
                return new Promise((resolve, reject) => {
                    const reader = new FileReader();
        
                    // Handle successful file reading
                    reader.onloadend = () => {
                        const dataUrl = reader.result;
        
                        // Cache the new image data
                        const cachedAvatarKey = `avatar_image_${userId}`;
                        localStorage.setItem(cachedAvatarKey, JSON.stringify({
                            dataUrl,
                            url,  // Store the original URL
                            timestamp: Date.now()
                        }));
        
                        // Update the avatar URL
                        this.userData.avatar_url = dataUrl;
                        
                        resolve(dataUrl);
                    };
        
                    // Handle reading errors
                    reader.onerror = (error) => {
                        console.error('Error reading image:', error);
                        reject(error);
                    };
        
                    // Start reading the blob as a data URL
                    reader.readAsDataURL(blob);
                });
        
            } catch (error) {
                console.error('Error caching avatar:', error);
                throw error;  // Re-throw to allow caller to handle
            }
        },

        async cacheUserData() {

        },

        async signOut() {
            this.loading = true;

            try {
                const result = await DatabaseService.signOut();

                if (result === true) {
                    // Successful logout: Clear user-related data
                    this.userData = {};
                    this.isLoggedIn = false;
                    localStorage.setItem('user_logged_in', 'false');
                    localStorage.removeItem('user_basic_info');
                } else if (result?.error) {
                    // Handle logout failure
                    console.error('Sign out failed:', result.error);
                }
            } catch (error) {
                console.error('Unexpected error during logout:', error);
            } finally {
                this.loading = false;
            }
        }
    },

    getters: {

        // Check if user is logged in
        userIsLoggedIn() {
            return this.isLoggedIn;
        },

        // Getter to obtain user data with prioritized sources
        getUserData() {
            // Step 1: Try to get data from localStorage first
            try {
                const storedUserData = localStorage.getItem('user_basic_info');
                if (storedUserData) {
                    const parsedData = JSON.parse(storedUserData);
                    // If localStorage has data, update state and return the data
                    this.userData = parsedData;
                    return parsedData;
                }
            } catch (e) {
                console.error('Error retrieving user data from localStorage:', e);
            }

            // Step 2: If localStorage doesn't have data, check if state has data
            if (this.userData && Object.keys(this.userData).length > 0) {
                return this.userData;
            }

            // Step 3: If both localStorage and state are empty, trigger data fetch
            // Schedule the data fetch asynchronously to avoid blocking the UI
            setTimeout(() => {
                this.getUser();
            }, 0);

            // Return empty object while data is being fetched
            return {};
        }
    }

});

export const piniaBlank = Pinia.defineStore('userManager', {

    state: () => ({

    }),

    actions: {

    },

    getters: {

    }

})