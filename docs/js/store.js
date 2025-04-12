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
                    duration: 99999,  // Cache duration in minutes
                    key: 'accCharacters_cache'
                },
                filters: {
                    duration: 60,  // Time to maintain cache in minutes (1 hour)
                    key: 'acc_filters_cache'
                },
                characterDetail: {
                    duration: 60,  // Time to maintain cache in minutes (1 hour)
                    key: 'accCharacters_detail_cache'
                },
                authorCharacters: {
                    duration: 60,  // Time to maintain cache in minutes (1 hour)
                    key: 'accCharacters_detail_cache'
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
                "characters": true,
                "detail": true,
                "author": true
            },
            lorebooks: false
        },

        // Site metadata
        site: {
            title: 'Perchance Character Database',
            description: 'Community-driven platform for Perchance.org characters and resources',
            version: '1.0.0',
            pageTitle: 'Perchance DBA',
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
            ],
            loading: {
                loadingMessages: [
                    "Summoning characters from the digital realm...",
                    "Brewing a potion of amazing characters...",
                    "Consulting the character oracle...",
                    "Rolling for character initiative...",
                    "Dusting off the character archives...",
                    "Convincing characters to make an appearance...",
                    "Sending ravens to collect characters...",
                    "Preparing the character runway...",
                    "Tuning the character radio frequency...",
                    "Charging the character portal...",
                    "Decoding character transmissions...",
                    "Powering up the character generator...",
                    "Warming up the character spotlight...",
                    "Aligning the character stars...",
                    "Polishing character personalities to a shine..."
                ],
                loadingMessageInterval: null,
                currentMessageIndex: 0,
                randomSeed: 0,
                loadingProgress: 0,
                progressInterval: null,
                showProgress: false
            }
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
        // Start the loading animation with optional fake progress
        getMessage() {
            // Initialize with a random message
            this.site.loading.randomSeed = Math.floor(Math.random() * this.site.loading.loadingMessages.length);
            this.site.loading.currentMessageIndex = this.site.loading.randomSeed;
            const message = this.site.loading.loadingMessages[this.site.loading.currentMessageIndex];
            return message;
        },
        // Start the loading animation with optional fake progress
        startLoading(withProgress = false) {
            // Initialize with a random message
            this.site.loading.randomSeed = Math.floor(Math.random() * this.site.loading.loadingMessages.length);
            this.site.loading.currentMessageIndex = this.site.loading.randomSeed;
            
            // Set up message rotation every 3 seconds
            this.site.loading.loadingMessageInterval = setInterval(() => {
                this.site.loading.currentMessageIndex = (this.site.loading.currentMessageIndex + 1) % this.site.loading.loadingMessages.length;
            }, 3000);
            
            // Optional progress simulation
            this.site.loading.showProgress = withProgress;
            if (withProgress) {
                this.site.loading.loadingProgress = 0;
                this.site.loading.progressInterval = setInterval(() => {
                    // Progress more quickly at first, then slow down
                    const increment = this.site.loading.loadingProgress < 70 
                        ? Math.random() * 10 
                        : Math.random() * 3;
                        
                    this.site.loading.loadingProgress = Math.min(
                        99, // Never reach 100% automatically
                        this.site.loading.loadingProgress + increment
                    );
                    this.site.loading.loadingProgress = Math.round(this.site.loading.loadingProgress);
                }, 800);
            }
        },
        // Clean up and complete loading
        stopLoading() {
            clearInterval(this.site.loading.loadingMessageInterval);
            
            if (this.site.loading.showProgress) {
                clearInterval(this.site.loading.progressInterval);
                this.site.loading.loadingProgress = 100; // Complete the progress bar
            }
            
            // You could emit an event here to signal loading completion
            this.site.loading.$emit('loading-complete');
        }
    },

    // Clean up any intervals if component is destroyed
    beforeDestroy() {
        clearInterval(this.site.loading.loadingMessageInterval);
        clearInterval(this.site.loading.progressInterval);
    },

    getters: {
        getCurrentPage: (state) => state.currentPath,

        hideLoginButton() {
            return this.currentPath.includes('user-settings');
        },

        randomLoadingMessage() {
            // Get a message based on the current index
            return this.site.loading.loadingMessages[this.site.loading.currentMessageIndex];
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
        },

        // Getter to check if user wants to show nsfw
        showNsfw() {
            return this.userData.show_nsfw || false;
        },
    }

});

// IndexedDB store for caching data
export const piniaIndexedDb = Pinia.defineStore('indexedDbManager', {
    state: () => ({
        dataStore: null,
        dbName: 'CharactersDatabase',
        dbVersion: 1,
        
        // Array of all object store names we expect to use
        requiredStores: ['characters', 'simpleCharacters', 'authorCharacters', 'authorData'],
    }),

    actions: {

        // Check if all required stores exist in the database
        checkStores(db) {
            const existingStores = Array.from(db.objectStoreNames);
            return this.requiredStores.every(store => existingStores.includes(store));
        },

        // Create missing stores during an upgrade event
        createStores(db) {
            // Create stores if they don't exist
            if (!db.objectStoreNames.contains('characters')) {
                const store = db.createObjectStore("characters", { keyPath: "id" });
                store.createIndex('page', 'page', { unique: false }); // Create index for page
            }

            if (!db.objectStoreNames.contains('authorCharacters')) {
                db.createObjectStore('authorCharacters', { keyPath: 'id' });
            }

            if (!db.objectStoreNames.contains('simpleCharacters')) {
                db.createObjectStore('simpleCharacters', { keyPath: 'id' });
            }
        },

        async getDataStore() {
            // If dataStore is already initialized, return it
            if (this.dataStore) {
                return this.dataStore;
            }

            // First, try to open the database to check if stores exist
            return new Promise((resolve, reject) => {
                const openRequest = indexedDB.open(this.dbName);

                openRequest.onerror = (event) => {
                    reject(new Error('Failed to open IndexedDB: ' + event.target.error));
                };

                openRequest.onsuccess = (event) => {
                    const db = event.target.result;
                    const currentVersion = db.version;

                    // Close the connection before reopening with a new version
                    db.close();

                    // Check if all required stores exist
                    const storesExist = this.checkStores(db);

                    if (storesExist) {
                        // All stores exist, proceed with normal opening
                        this.openAndSetupDatabase(currentVersion, resolve, reject);
                    } else {
                        // Increment version to trigger onupgradeneeded
                        this.openAndSetupDatabase(currentVersion + 1, resolve, reject);
                    }
                };
            });
        },

        openAndSetupDatabase(version, resolve, reject) {
            const request = indexedDB.open(this.dbName, version);

            // Handle database creation/upgrade
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                this.createStores(db);
            };

            // Handle success
            request.onsuccess = (event) => {
                const db = event.target.result;

                // Create a simple wrapper for IndexedDB operations
                this.dataStore = {
                    get: (storeName, id) => {
                        return new Promise((resolve, reject) => {
                            const transaction = db.transaction(storeName, 'readonly');
                            const store = transaction.objectStore(storeName);
                            const request = store.get(id);

                            request.onsuccess = () => resolve(request.result);
                            request.onerror = () => reject(request.error);
                        });
                    },

                    getByPage: (storeName, page) => {
                        return new Promise((resolve, reject) => {
                            const transaction = db.transaction(storeName, "readonly");
                            const store = transaction.objectStore(storeName);
                            const index = store.index("page"); // Use the index created in the store
                            const request = index.getAll(page); // Fetch all records for the given page
                
                            request.onsuccess = () => resolve(request.result);
                            request.onerror = () => reject(request.error);
                        });
                    },

                    getAll: (storeName) => {
                        return new Promise((resolve, reject) => {
                            const transaction = db.transaction(storeName, 'readonly');
                            const store = transaction.objectStore(storeName);
                            const request = store.getAll();
                
                            request.onsuccess = () => resolve(request.result);
                            request.onerror = () => reject(request.error);
                        });
                    },
                
                    put: (storeName, object) => {
                        return new Promise((resolve, reject) => {
                            try {
                                // Create a clean version of the object by serializing and deserializing
                                // This removes non-cloneable elements like functions, DOM nodes, etc.
                                const cleanObject = JSON.parse(JSON.stringify(object));

                                const transaction = db.transaction(storeName, 'readwrite');
                                const store = transaction.objectStore(storeName);
                                const request = store.put(cleanObject);

                                request.onsuccess = () => resolve(request.result);
                                request.onerror = (event) => {
                                    console.error('IndexedDB put error:', event.target.error);
                                    reject(event.target.error);
                                };
                            } catch (err) {
                                console.error('Data serialization error:', err);
                                reject(new Error('Failed to serialize object for IndexedDB: ' + err.message));
                            }
                        });
                    },
                    delete: (storeName, id) => {
                        return new Promise((resolve, reject) => {
                            const transaction = db.transaction(storeName, 'readwrite');
                            const store = transaction.objectStore(storeName);
                            const request = store.delete(id);

                            request.onsuccess = () => resolve();
                            request.onerror = () => reject(request.error);
                        });
                    },
                    clearStore: (storeName) => {
                        return new Promise((resolve, reject) => {
                            const transaction = db.transaction(storeName, 'readwrite');
                            const store = transaction.objectStore(storeName);
                            const request = store.clear();

                            request.onsuccess = () => resolve();
                            request.onerror = () => reject(request.error);
                        });
                    }
                };

                resolve(this.dataStore);
            };

            // Handle error
            request.onerror = (event) => {
                reject(new Error('Failed to open IndexedDB: ' + event.target.error));
            };
        },


        // Helper method to check if a cached item is valid based on TTL
        isCacheValid(item) {
            if (Array.isArray(item) && item.length > 0) {
                return item.every(entry => entry && entry.ttl && Date.now() < entry.ttl);
            } else if (Array.isArray(item) && item.length === 0) {
                return false;  // Empty array is not valid
            }

            return item && item.ttl && Date.now() < item.ttl;
        },
        

        // Create a new TTL based on minutes
        createTTL(minutes) {
            if (typeof minutes !== 'number' || minutes <= 0) {
                minutes = 60;  // Default to 60 minutes if invalid
            }
            return Date.now() + (minutes * 60 * 1000);
        }
    },

    getters: {
        isDbInitialized: (state) => state.dataStore !== null
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