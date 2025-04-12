import { piniaUser, piniaTheme, piniaSiteConfig, piniaIndexedDb } from './store.js';
import { GithubUtils, Misc, ToastUtils } from './utils.js';
import LoginModalComponent from '../components/modal-login.js';
import { DatabaseService } from './supabase.js';



// Global event listener to store scroll position before leaving
window.addEventListener('beforeunload', () => {
    sessionStorage.setItem('scrollY', window.scrollY);
});


// ACC Characters Vue.js Application
document.addEventListener('DOMContentLoaded', async () => {
    const { createApp } = Vue;

    // Pinia initialization
    const pinia = Pinia.createPinia();

    // Function to load external templates
    async function loadTemplate(url) {
        const response = await fetch(url);
        return await response.text();
    }

    // Load templates before starting VUE
    const navbarTemplate = await loadTemplate('components/navbar.html');
    const footerTemplate = await loadTemplate('components/footer.html');
    const modalLoginTemplate = await loadTemplate('components/modal-login.html');

    const app = createApp({
        setup() {
            return {
                stTheme: piniaTheme(),
                stSite: piniaSiteConfig(),
                stUser: piniaUser()
            }
        },
        async beforeMount() {
            // Initiate the theme
            piniaTheme().initTheme();

            // Define piniaUser and call the getter
            const piniaUSer = piniaUser();
            piniaUSer.getUserData;

            // We get the user again
            await piniaUSer.getUser();

        },
        created() {
            this.debouncedCheckCardSizes = this.debounce(this.checkCardSizes, 200);
            this.ensurePageParam();
        },
        data() {
            return {
                //user: '',

                // Variables for user interaction
                isFilterPanelOpen: false,       // Flag to control filter panel visibility and page responsiveness
                selectedCharacter: null,        // Object to store selected character details to show on modal

                // Flags to control NSFW content visibility
                showNsfwTags: false,        // Flag to show NSFW tags in filters
                showNsfwImages: false,      // Flag to show NSFW characters images
                showNsfwCharacters: true,   // Flag to show NSFW characters in gallery
                lastClickedImage: null,    // Object to store last clicked image for modal

                // Initialize categories and characters with fallback
                stateLoading: false,    // Flag to control loading state for characters and filters
                categories: [],         // Left empty to avoid errors while loading data
                characters: [],         // Left empty to avoid errors while loading data

                // Object to track selected filters for each category
                searchInput: '',                // Search input text for characters
                selectedFilters: {
                    categories: {
                        rating: ['SFW'], // Initialize with SFW selected by default
                    }
                },

                // Appearance variables to control card sizes
                minCardWidth: null,
                maxCardWidth: null,
                debouncedCheckCardSizes: null,
                lastLayoutChange: undefined,

                // Pagination variables
                isNavigatingBack: false, // Flag to check if navigating back from other page
                onlyFavorites: false, // Flag to show only favorites
                currentPage: 1,
                charactersPerPage: 24,
                totalPages: 1,
            };
        },
        methods: {

            /* -------------------------------------------------------------------------- */
            /*                                 NAVIGATION                                 */
            /* -------------------------------------------------------------------------- */

            /* ----------------------------- Scroll position ---------------------------- */
            saveScrollPosition() {
                sessionStorage.setItem('scrollY', window.scrollY);
            },
            restoreScrollPosition() {
                if (this.isNavigatingBack) {
                    const scrollY = sessionStorage.getItem('scrollY');
                    if (scrollY !== null) {
                        setTimeout(() => {
                            window.scrollTo(0, parseInt(scrollY));
                        }, 100); // Small delay to ensure the page is fully loaded
                    }
                }
            },
            detectBackNavigation() {
                const entries = performance.getEntriesByType("navigation");
                if (entries.length > 0) {
                    const navType = entries[0].type;
                    this.isNavigatingBack = (navType === "back_forward");
                    // console.log("Navigation Type:", navType);
                    this.restoreScrollPosition();
                }
            },

            /* ------------------------------- PAGINATION ------------------------------- */

            // Check if the page param is set and set it to default if not
            // This is called when the page loads to ensure the page param is set correctly
            ensurePageParam() {
                this.currentPage = this.getPageParam('page', 1);
                this.onlyFavorites = this.getPageParam('favorites', false);
                this.setPageParam(this.currentPage);
            },
            getPageParam(param, alt) {
                const params = new URLSearchParams(window.location.search);
                let value = params.get(param);

                if (value === null) return alt; // Return default if param is missing

                // Handle boolean values
                if (value.toLowerCase() === 'true') return true;
                if (value.toLowerCase() === 'false') return false;

                // Handle integers
                if (!isNaN(value) && Number.isInteger(+value)) return parseInt(value, 10);

                return value; // Return as string if nothing else matches
            },
            setPageParam(page) {
                const params = new URLSearchParams(window.location.search);
                params.set('page', page);
                window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`);
            },
            async goToPage(page) {
                if (page < 1 || page > this.totalPages) return;

                // Store current page for fallback
                const previousPage = this.currentPage;
                this.currentPage = page;
                this.setPageParam(page);

                // Try to load characters, if it fails, show an error message
                try {
                    await this.loadCharacters(true); // Load characters for the new page

                    // Updates the current page in localStorage
                    const cacheConfig = piniaSiteConfig().cache.accCharacters.characters;
                    const cacheKey = `${cacheConfig.key}_pagination`;

                    // Retrieve existing pagination data or initialize an empty object
                    const pagination = JSON.parse(localStorage.getItem(cacheKey)) || {};

                    // Update the current page
                    pagination.currentPage = this.currentPage;

                    // Save the updated pagination state back to localStorage
                    localStorage.setItem(cacheKey, JSON.stringify(pagination));


                } catch (error) {
                    // If loading fails, revert to the previous page and show an error message
                    this.currentPage = previousPage;
                    this.setPageParam(previousPage);
                    console.error("Failed to load characters:", error.message);
                    ToastUtils.showToast('Failed to load characters.', 'Error', 'error');
                }
            },
            goToPreviousPage() {
                // Check if the previous page is within bounds
                if (this.currentPage <= 1) return;

                this.goToPage(this.currentPage - 1);
            },
            goToNextPage() {
                // Check if the next page is within bounds
                if (this.currentPage >= this.totalPages) return;

                this.goToPage(this.currentPage + 1);
            },

            /* -------------------------------------------------------------------------- */
            /*                               LOAD CHARACTERS                              */
            /* -------------------------------------------------------------------------- */

            async loadCharacters(forceRefresh = false) {
                await this.loadCharacters(forceRefresh)
                // this.totalPages = Math.ceil(this.characters.length / this.charactersPerPage);
            },

            /**
             * Load character data from repository (optimized version).
             * @param {boolean} forceRefresh - If true, forces data fetch regardless of cache expiration.
             * @returns {Promise<void>}
             */
            async loadCharactersFromGitHub(forceRefresh = false) {
                this.stateLoading = true;

                // Debug key for logging purposes
                const debugKey = piniaSiteConfig().debug?.aacCharacters?.characters ?? false;
                const debugPrefix = '[CHARACTERS] ';

                try {
                    Misc.debug(debugKey, debugPrefix + "Loading character data...");

                    const cacheConfig = piniaSiteConfig().cache.accCharacters.characters;
                    const cacheKey = cacheConfig.key;
                    const cacheDuration = cacheConfig.duration * 60 * 1000 || 3600;

                    const cachedData = localStorage.getItem(cacheKey);
                    const lastFetchTime = localStorage.getItem(`${cacheKey}_timestamp`);
                    const isCacheValid = lastFetchTime && (Date.now() - lastFetchTime < cacheDuration);

                    let charData;

                    if (!forceRefresh && cachedData && isCacheValid) {
                        charData = JSON.parse(cachedData);
                        Misc.debug(debugKey, debugPrefix + "Using cached data for characters");
                    } else {
                        Misc.debug(debugKey, debugPrefix + "Loading characters file:", piniaSiteConfig().paths.accCharacters.index);
                        const indexData = await GithubUtils.fetchGithubData(
                            piniaSiteConfig().repo.owner,
                            piniaSiteConfig().repo.name,
                            piniaSiteConfig().paths.accCharacters.index,
                            piniaSiteConfig().repo.branch,
                            "json"
                        );

                        // Check data structure
                        if (!indexData || typeof indexData !== 'object' || !Array.isArray(indexData)) {
                            throw new Error('Invalid structure for characters data');
                        }

                        // Process the data to convert categories to lowercase
                        charData = indexData.map(char => {
                            if (char.categories) {
                                const lowerCaseCategories = {};
                                Object.entries(char.categories).forEach(([key, value]) => {
                                    const lowerKey = key.toLowerCase();
                                    const lowerValue = Array.isArray(value)
                                        ? value.map(v => typeof v === 'string' ? v.toLowerCase() : v)
                                        : typeof value === 'string' ? value.toLowerCase() : value;
                                    lowerCaseCategories[lowerKey] = lowerValue;
                                });
                                char.categories = lowerCaseCategories;
                            }
                            return char;
                        });

                        // Store processed data in cache
                        localStorage.setItem(cacheKey, JSON.stringify(charData));
                        localStorage.setItem(`${cacheKey}_timestamp`, Date.now().toString());

                        Misc.debug(debugKey, debugPrefix + "Fetched and stored characters data successfully");
                    }

                    this.characters = charData;
                } catch (error) {
                    ToastUtils.showToast('Failed to load characters.', 'Error', 'error');
                    console.error("Failed to load characters:", error.message);
                } finally {
                    this.stateLoading = false;
                }
            },

            /**
             * Loads character data from the Supabase database using the get_characters function
             * @param {boolean} forceRefresh - Whether to force a refresh from the database instead of using cache
             */
            async loadCharacters(forceRefresh = false) {
                this.stateLoading = true;

                // Debug key for logging purposes
                const debugKey = piniaSiteConfig().debug?.aacCharacters?.characters ?? false;
                const debugPrefix = '[loadCharacters] ';

                try {
                    Misc.debug(debugKey, debugPrefix + "Loading character data...");

                    // Access data store
                    const dataStore = await piniaIndexedDb().getDataStore();

                    // Load character data from IndexedDB
                    const cachedData = await dataStore.getByPage('characters', this.currentPage);

                    // Load pagination data from localStorage
                    const cacheConfig = piniaSiteConfig().cache.accCharacters.characters;
                    const cacheKey = cacheConfig.key;
                    const cachedPagination = localStorage.getItem(cacheKey + '_pagination');

                    // Determine if cache is valid
                    const isCacheValid = piniaIndexedDb().isCacheValid(cachedData) && !!cachedPagination && !forceRefresh;
                    Misc.debug(debugKey, debugPrefix + "Cache valid:", isCacheValid);

                    if (isCacheValid) {
                        // Use cached character data from IndexedDB
                        Misc.debug(debugKey, debugPrefix + "Using cached data from IndexedDB for characters");
                        this.characters = cachedData.map(item => item.data);
                        this.totalPages = JSON.parse(cachedPagination).total_pages || 1; // Set total pages from pagination data
                    } else {
                        await this.fetchDirecltlyFromSupabase();
                    }

                } catch (error) {
                    ToastUtils.showToast('Failed to load characters.', 'Error', 'error');
                    console.error("Failed to load characters:", error.message);
                    // await this.fetchDirecltlyFromSupabase();
                } finally {
                    this.stateLoading = false;
                }
            },

            async fetchDirecltlyFromSupabase() {

                // Debug key for logging purposes
                const debugKey = piniaSiteConfig().debug?.aacCharacters?.characters ?? false;
                const debugPrefix = '[fetchDirecltlyFromSupabase] ';

                // Cache not valid or doesn't exist, fetch from database
                Misc.debug(debugKey, debugPrefix + "Fetching character from database");

                try {
                    // Access data store
                    const dataStore = await piniaIndexedDb().getDataStore();

                    const cacheConfig = piniaSiteConfig().cache.accCharacters.characters;
                    const cacheDuration = piniaIndexedDb().createTTL(cacheConfig.duration);
                    const cacheKey = cacheConfig.key;

                    // Setup parameters for the get_characters function
                    const args = {
                        page_number: this.currentPage,
                        page_size: 24, // Adjust as needed for your application
                        sort_by: 'alphabetical',
                        search_term: '', // Empty string to get all characters
                        current_user_id: piniaUser().userData.id
                    };

                    // Call the get_characters function
                    const result = await DatabaseService.callFunction('get_characters', args);

                    if (result.error) {
                        throw new Error(`Failed to fetch characters: ${result.error}`);
                    }

                    // Extract characters and pagination data from the result
                    let charData;
                    let pagination = result.data.pagination;

                    // Add the current page to the pagination object
                    pagination.currentPage = this.currentPage;

                    // Extract characters from the result
                    // const indexData = charData.map(item => ({
                    //     path: item.id,
                    //     manifest: { ...item }
                    // }));

                    // Process the data to convert categories to lowercase
                    charData = result.data.characters.map(char => {
                        if (char.categories) {
                            const lowerCaseCategories = {};
                            Object.entries(char.categories).forEach(([key, value]) => {
                                const lowerKey = key.toLowerCase();
                                const lowerValue = Array.isArray(value)
                                    ? value.map(v => typeof v === 'string' ? v.toLowerCase() : v)
                                    : typeof value === 'string' ? value.toLowerCase() : value;
                                lowerCaseCategories[lowerKey] = lowerValue;
                            });
                            char.categories = lowerCaseCategories;
                        }
                        return char;
                    });

                    // Store processed data
                    this.characters = charData;
                    this.totalPages = pagination.total_pages || 1; // Set total pages from pagination data

                    // Calculate TTL for cache
                    const ttl = Date.now() + cacheDuration;

                    // Save each character individually to IndexedDB
                    for (const character of this.characters) {
                        await dataStore.put('characters', {
                            id: character.id,
                            page: this.currentPage,
                            data: character,
                            ttl: ttl,
                            updatedAt: Date.now()
                        });
                    }

                    // Store processed data in cache
                    localStorage.setItem(cacheKey + '_pagination', JSON.stringify(pagination));
                    localStorage.setItem(`${cacheKey}_timestamp`, Date.now().toString());

                    Misc.debug(debugKey, debugPrefix + "Fetched and stored characters data successfully");


                    this.characters = charData;
                    this.totalPages = pagination.total_pages || 1; // Set total pages from pagination data
                } catch (error) {
                    ToastUtils.showToast('Failed to load characters.', 'Error', 'error');
                    console.error("Failed to load characters:", error.message);
                } finally {
                    this.stateLoading = false;
                }
            },

            // async loadCharacters(forceRefresh = false) {
            //     this.stateLoading = true;

            //     // Debug key for logging purposes
            //     const debugKey = piniaSiteConfig().debug?.aacCharacters?.characters ?? false;
            //     const debugPrefix = '[CHARACTERS] ';

            //     try {
            //         Misc.debug(debugKey, debugPrefix + "Loading character data...");

            //         const cacheConfig = piniaSiteConfig().cache.accCharacters.characters;
            //         const cacheKey = cacheConfig.key;
            //         const cacheDuration = cacheConfig.duration * 60 * 1000 || 3600;

            //         const cachedData = localStorage.getItem(cacheKey);
            //         const cachedPagination = localStorage.getItem(cacheKey + '_pagination');
            //         const lastFetchTime = localStorage.getItem(`${cacheKey}_timestamp`);
            //         const isCacheValid = lastFetchTime && (Date.now() - lastFetchTime < cacheDuration) && (cachedPagination.currentPage === this.currentPage);

            //         let charData;
            //         let pagination;

            //         if (!forceRefresh && cachedData && isCacheValid) {
            //             //Retrieve character cached data
            //             charData = JSON.parse(cachedData);
            //             //Retrieve pagination data
            //             pagination = JSON.parse(cachedPagination);
            //             Misc.debug(debugKey, debugPrefix + "Using cached data for characters");
            //         } else {
            //             Misc.debug(debugKey, debugPrefix + "Fetching characters from database");

            //             // Setup parameters for the get_characters function
            //             const args = {
            //                 page_number: this.currentPage,
            //                 page_size: 24, // Adjust as needed for your application
            //                 sort_by: 'alphabetical',
            //                 search_term: '', // Empty string to get all characters
            //                 current_user_id: piniaUser().userData.id
            //             };

            //             // Call the get_characters function
            //             const result = await DatabaseService.callFunction('get_characters', args);

            //             if (result.error) {
            //                 throw new Error(`Failed to fetch characters: ${result.error}`);
            //             }

            //             // Extract characters and pagination data from the result
            //             charData = result.data.characters;
            //             pagination = result.data.pagination;

            //             // Add the current page to the pagination object
            //             pagination.currentPage = this.currentPage;

            //             // Extract characters from the result
            //             const indexData = charData.map(item => ({
            //                 path: item.id,
            //                 manifest: { ...item }
            //             }));

            //             // Process the data to convert categories to lowercase (if still needed)
            //             // Process the data to convert categories to lowercase
            //             charData = indexData.map(char => {
            //                 if (char.categories) {
            //                     const lowerCaseCategories = {};
            //                     Object.entries(char.categories).forEach(([key, value]) => {
            //                         const lowerKey = key.toLowerCase();
            //                         const lowerValue = Array.isArray(value)
            //                             ? value.map(v => typeof v === 'string' ? v.toLowerCase() : v)
            //                             : typeof value === 'string' ? value.toLowerCase() : value;
            //                         lowerCaseCategories[lowerKey] = lowerValue;
            //                     });
            //                     char.categories = lowerCaseCategories;
            //                 }
            //                 return char;
            //             });

            //             // Store processed data in cache
            //             localStorage.setItem(cacheKey, JSON.stringify(charData));
            //             localStorage.setItem(cacheKey + '_pagination', JSON.stringify(pagination));
            //             localStorage.setItem(`${cacheKey}_timestamp`, Date.now().toString());

            //             Misc.debug(debugKey, debugPrefix + "Fetched and stored characters data successfully");
            //         }

            //         this.characters = charData;
            //         this.totalPages = pagination.total_pages || 1; // Set total pages from pagination data
            //     } catch (error) {
            //         ToastUtils.showToast('Failed to load characters.', 'Error', 'error');
            //         console.error("Failed to load characters:", error.message);
            //     } finally {
            //         this.stateLoading = false;
            //     }
            // },

            /* -------------------------------------------------------------------------- */
            /*                               LOAD CATEGORIES                              */
            /* -------------------------------------------------------------------------- */

            async loadCategories(forceRefresh = false) {
                await this.loadCategoriesFromGitHub(forceRefresh);
            },

            /**
             * Initialize the filter system
             * @returns {Promise<void>}
             * @param {boolean} forceRefresh - If true, forces data fetch regardless of cache expiration.
             */
            async loadCategoriesFromGitHub(forceRefresh = false) {
                this.stateLoading = true;

                // Debug key for logging purposes
                const debugKey = piniaSiteConfig().debug?.aacCharacters?.categories ?? false;
                const debugPrefix = '[CATEGORIES] ';

                try {
                    Misc.debug(debugKey, debugPrefix + "Loading categories data...");

                    const cacheConfig = piniaSiteConfig().cache.accCharacters.filters;
                    const cacheKey = cacheConfig.key;
                    const cacheDuration = cacheConfig.duration * 60 * 1000 || 3600; // Convert minutes to milliseconds, default 1 hour.

                    const cachedData = localStorage.getItem(cacheKey);
                    const lastFetchTime = localStorage.getItem(`${cacheKey}_timestamp`);
                    const isCacheValid = lastFetchTime && (Date.now() - lastFetchTime < cacheDuration);

                    if (!forceRefresh && cachedData && isCacheValid) {
                        const catData = JSON.parse(cachedData);
                        Misc.debug(debugKey, debugPrefix + "Using cached data for categories:", catData);
                        this.categories = catData;
                    } else {
                        Misc.debug(debugKey, debugPrefix + "Fetching new data for categories...\n\nReasons for not using cache:\n1. Force refresh:", forceRefresh, "\n2. Cache validity:", isCacheValid, "\n3. Cached data:", cachedData);

                        const categories = await GithubUtils.fetchGithubData(
                            piniaSiteConfig().repo.owner,
                            piniaSiteConfig().repo.name,
                            piniaSiteConfig().paths.categories,
                            piniaSiteConfig().repo.branch,
                            "json"    // The output format is JSON
                        );

                        Misc.debug(debugKey, debugPrefix + "4 - Categories data:", categories);

                        // Check if the data has the correct structure
                        if (!categories || typeof categories !== 'object') {
                            throw new Error('Invalid structure for categories data');
                        }

                        if (!Array.isArray(categories)) {
                            throw new Error("Unexpected response format: Expected an array");
                        }

                        // Store data in state and cache
                        localStorage.setItem(cacheKey, JSON.stringify(categories));
                        localStorage.setItem(`${cacheKey}_timestamp`, Date.now().toString());

                        Misc.debug(debugKey, debugPrefix + "Fetched and stored categories data successfully:", categories);

                        // Return the categories data
                        this.categories = categories;
                    }
                } catch (error) {
                    console.error('Failed to initialize filters:', error);
                    ToastUtils.showToast('Failed to initialize filters', 'Error', 'error');
                } finally {
                    this.stateLoading = false;
                }
            },

            /**
             * Sorts the tags within a category alphabetically.
             * 
             * @param {Object} category - The category object containing tags.
             * @returns {Object} - A new category object with sorted tags.
             */
            sortCategoryTags(categories) {
                // Iterate over each category in the categories array
                return categories.forEach(category => {
                    // Check if the category has a 'tags' object
                    if (category.tags) {
                        // If the 'general' tags array exists, sort it alphabetically
                        if (category.tags.general) {
                            category.tags.general.sort();
                        }
                        // If the 'nsfw' tags array exists, sort it alphabetically
                        if (category.tags.nsfw) {
                            category.tags.nsfw.sort();
                        }
                    }
                });
            },

            isTagSelected(categoryName, tag, cat) {
                // Exit early if data is loading or characters are not available
                if (this.stateLoading || !this.categories) return false;

                // Safety check for category and tag
                const categoryLower = categoryName.toLowerCase();

                // Clean the current tag and get selected tags
                const cleanTag = tag.replace(/\s*\(\d+\)$/, '');
                const selectedTags = this.selectedFilters.categories[categoryLower];

                if (!selectedTags) return false;

                // Compare cleaned versions of tags
                return selectedTags.some(selectedTag =>
                    selectedTag.replace(/\s*\(\d+\)$/, '').toLowerCase() === cleanTag.toLowerCase()
                );
            },

            handleTagSelection(e, category, tag) {
                const categoryLower = category.name.toLowerCase();
                const cleanTag = tag.replace(/\s*\(\d+\)$/, '');

                // Initialize category array if it doesn't exist
                if (!this.selectedFilters.categories[categoryLower]) {
                    this.selectedFilters.categories[categoryLower] = [];
                }

                // Handle NSFW visibility toggle
                if (categoryLower === 'rating' && cleanTag.toLowerCase() === 'nsfw') {
                    this.showNsfwTags = e.target.checked;
                    // this.showNsfwImages = e.target.checked;
                }

                // Update selected filters
                if (e.target.checked) {
                    if (!this.selectedFilters.categories[categoryLower].includes(cleanTag)) {
                        this.selectedFilters.categories[categoryLower].push(cleanTag);
                    }
                } else {
                    this.selectedFilters.categories[categoryLower] =
                        this.selectedFilters.categories[categoryLower].filter(t =>
                            t.replace(/\s*\(\d+\)$/, '') !== cleanTag
                        );

                    // Only re-enable SFW if there are no rating tags selected AND it's not SFW being unchecked
                    if (categoryLower === 'rating' &&
                        this.selectedFilters.categories.rating.length === 0 &&
                        cleanTag.toLowerCase() !== 'sfw') {
                        this.selectedFilters.categories.rating = ['SFW'];
                        // Find and check the SFW checkbox
                        const sfwCheckbox = document.querySelector('#tag-Rating-SFW');
                        if (sfwCheckbox) sfwCheckbox.checked = true;
                    }
                }
            },

            // Method to search for characters based on search text
            searchCharacter(character, searchText) {
                if (!searchText) return true;

                const searchLower = searchText.toLowerCase();
                const searchFields = [
                    character.name,
                    character.description,
                    character.username,
                    character.description,
                    character.title,

                    // new fields from supabase
                    character.author,
                    character.author_id,
                ];

                return searchFields.some(field =>
                    field?.toLowerCase().includes(searchLower)
                );
            },

            /* -------------------------------------------------------------------------- */
            /*                                  FILTERING                                 */
            /* -------------------------------------------------------------------------- */
            // Robust filtering method
            filterCharacters() {
                // Exit early if data is loading or characters are not available
                if (this.stateLoading || !this.characters) return [];

                // Filter characters based on search text and category filters
                return this.characters.filter(character => {
                    // 1. Safety check: Ensure character has valid categories object
                    // This prevents errors from malformed character data
                    // if (!character.categories) return false;

                    // 2. Search text filtering
                    // Checks if character matches the current search input across multiple fields
                    if (!this.searchCharacter(character, this.searchInput)) {
                        return false;
                    }

                    // 3. NSFW content handling
                    // Filters out NSFW content based on user preferences and selected filters
                    if (this.isNsfwCharacter(character.categories?.rating, character.is_nsfw) &&
                        !this.showNsfwCharacters &&
                        (!this.selectedFilters.categories.rating?.includes('nsfw') || !this.selectedFilters.is_nsfw)) {
                        return false;
                    }

                    // 3.5 SFW content handling
                    // Filter out SFW content if SFW is not selected in rating filters
                    const ratingFilters = this.selectedFilters.categories.rating || [];
                    const cleanRatingFilters = ratingFilters.map(tag => tag.replace(/\s*\(\d+\)$/, '').toLowerCase());
                    if (!this.isNsfwCharacter(character.categories?.rating, character.is_nsfw) &&
                        !cleanRatingFilters.includes('sfw')) {
                        return false;
                    }

                    // 4. No filters check
                    // If no category filters are selected, show all remaining characters
                    if (Object.keys(this.selectedFilters.categories).length === 0) {
                        return true;
                    }

                    // 5. Category filters processing
                    // Check if character matches ALL selected category filters
                    return Object.entries(this.selectedFilters.categories).every(([category, selectedTags]) => {
                        // Skip empty filter arrays or invalid selections
                        if (!selectedTags || !Array.isArray(selectedTags) || selectedTags.length === 0) return true;

                        // Get character's value for current category
                        const charCategoryValue = character.categories?.[category] || [];

                        // Special case: Skip rating check if NSFW is globally enabled
                        if (category === 'rating' && this.showNsfwCharacters) return true;

                        // Convert character tags to normalized array for comparison
                        // Handles both array and single string values
                        const charTags = Array.isArray(charCategoryValue)
                            ? charCategoryValue.map(v => v?.toLowerCase() || '')
                            : [String(charCategoryValue || '').toLowerCase()];

                        // Verify ALL selected tags are present in character's tags
                        // Remove count suffixes (e.g., "(3)") before comparison
                        return selectedTags.every(tag => {
                            const cleanTag = tag.replace(/\s*\(\d+\)$/, '').toLowerCase();
                            return charTags.includes(cleanTag);
                        });
                    });

                    //return true; // Alternative code to force all characters to be shown. Take a look back on this when implementing filtering
                });
            },

            clearFilters() {
                this.selectedFilters = {
                    searchText: '',
                    categories: {
                        rating: ['SFW']
                    }
                };
                this.showNsfwTags = false;
                this.showNsfwImages = false;
            },

            // Method to handle NSFW image click
            handleNsfwImageClick(event) {
                // Check if the clicked element is an NSFW image
                if (!event.target.classList.contains('nsfw-blur')) {
                    // Exit early if the image is not blurred
                    return;
                }
                // Store the clicked image for later use
                this.lastClickedImage = event.target;
                // Show the NSFW confirmation modal
                new bootstrap.Modal(document.getElementById('nsfwConfirmModal')).show();
            },

            showSingleNsfw() {
                if (this.lastClickedImage && this.selectedCharacter) {
                    // Store the image source to identify it uniquely
                    const clickedSrc = this.lastClickedImage.src;

                    // Get the modal element for the current character
                    const characterModal = document.getElementById('characterModal');

                    // Find the image wrapper containing both the image and overlay
                    const imageWrapper = this.lastClickedImage.closest('.character-image-wrapper');

                    // Remove the NSFW overlay if it exists
                    imageWrapper?.querySelector('.nsfw-overlay')?.remove();

                    // Remove blur from the specific image
                    characterModal
                        .querySelector(`.character-modal-image[src="${clickedSrc}"].nsfw-blur`)
                        ?.classList.remove('nsfw-blur');
                }
                bootstrap.Modal.getInstance(document.getElementById('nsfwConfirmModal')).hide();
            },

            showAllNsfw() {
                console.log('showAllNsfw')
                // this.showNsfwImages = true;
                // bootstrap.Modal.getInstance(document.getElementById('nsfwConfirmModal')).hide();
            },

            handleModalClose() {
                if (!this.showNsfwImages && this.lastClickedImage) {
                    const clickedSrc = this.lastClickedImage.src;
                    // Get the modal element for the current character
                    const characterModal = document.getElementById('characterModal');

                    // Only remove blur from the specific image within this modal
                    characterModal
                        .querySelector(`.character-modal-image[src="${clickedSrc}"].nsfw-blur`)
                        ?.classList.add('nsfw-blur');
                }
                this.selectedCharacter = null;
            },

            // Check if the selected character is NSFW
            isNsfwCharacter(...ratings) {
                if (!ratings.length) return false;

                return ratings.some(rating =>
                    rating === true ||
                    (Array.isArray(rating) ? rating.includes('nsfw') :
                        typeof rating === 'string' && rating.toLowerCase() === 'nsfw')
                );
            },

            // Method to capitalize words in a string
            capitalizeWords(str) {
                if (!str) return '';
                return str
                    .split(' ') // Split the words
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1)) // Capitalize each word
                    .join(' '); // Merge words
            },

            // Add a method to decode special characters and emojis
            decodeText(text) {
                try {
                    return decodeURIComponent(escape(text));
                } catch {
                    return text;
                }
            },

            // Add this helper method to the methods section
            convertToLowerCase(data) {
                if (Array.isArray(data)) {
                    return data.map(item => this.convertToLowerCase(item));
                } else if (typeof data === 'object' && data !== null) {
                    const newObj = {};
                    for (const [key, value] of Object.entries(data)) {
                        newObj[key.toLowerCase()] = this.convertToLowerCase(value);
                    }
                    return newObj;
                } else if (typeof data === 'string') {
                    return data.toLowerCase();
                }
                return data;
            },

            debounce(func, wait) {
                let timeout;
                return function (...args) {
                    clearTimeout(timeout);
                    timeout = setTimeout(() => func.apply(this, args), wait);
                };
            },

            showCharacterModal(character) {
                this.selectedCharacter = character;
                console.log('selectedCharacter', this.selectedCharacter)
            },


            /* -------------------------------------------------------------------------- */
            /*                               CARD FUNCTIONS                               */
            /* -------------------------------------------------------------------------- */
            openChat(link) {
                // Check if the current window is inside an iframe
                const isInIframe = window.self !== window.top;

                if (isInIframe) {
                    try {
                        // Try to access parent window origin - this may fail due to cross-origin restrictions
                        const parentOrigin = window.parent.location.origin;
                        const specificOrigin = "https://perchance.org/tps-ai-character-chat-groupchat"; // Replace with your specific iframe parent URL
                        console.log("Parent origin:", parentOrigin);

                        if (parentOrigin === specificOrigin) {
                            // If inside the specific iframe, send message to parent
                            console.log("Inside specific iframe, sending message to parent");
                            window.parent.postMessage({ link: link }, "*");
                            return; // Exit function early
                        }
                    } catch (e) {
                        // Cannot access parent origin due to cross-origin restrictions
                        // We'll use a more generic approach below
                        console.log("Cannot access parent origin:", e);

                        // Alternative: You can still send the message and let the parent decide
                        // if it wants to handle it based on its own logic
                        window.parent.postMessage({ link: link }, "*");
                        return; // Exit function early
                    }
                }

                // If not in an iframe or not in the specific iframe, open URL in new tab
                console.log("Opening link in new tab");
                window.open(link, '_blank');
            },

            /**
             * Constructs and opens a GitHub raw content URL for downloading character files
             * @param {string} filePath - Path to the character file within the repository
             * @returns {void} Opens the download URL in a new tab
             */
            downloadCharacterFile(filePath) {
                // Get repository config
                const repo = {
                    owner: piniaSiteConfig().repo.owner,
                    name: piniaSiteConfig().repo.name,
                    branch: piniaSiteConfig().repo.branch
                };

                // Construct the raw GitHub content URL
                const downloadUrl = `https://raw.githubusercontent.com/${repo.owner}/${repo.name}/${repo.branch}/${filePath}`;

                // Open URL in new tab
                window.open(downloadUrl, '_blank');
            },

            /**
             * Toggle a character as favorite for the current user
             * @param {string} id - The character ID to toggle as favorite
             * @returns {Promise<void>}
             */
            async toggleFavorite(id) {
                try {
                    const userId = piniaUser().userData.id;
                    const characterId = id;

                    // Check if user is logged in
                    if (!userId) {
                        ToastUtils.showToast('To favorite a character, you must be logged in.', 'Please sign in!', 'info');
                        return;
                    }

                    // Call the toggle_favorite function
                    const result = await DatabaseService.callFunction('toggle_favorite', {
                        user_id: userId,
                        character_id: characterId
                    });

                    // Handle the response
                    if (result.error || result.data.error) {
                        console.error('Error toggling favorite:', result.error || result.data.error);
                        ToastUtils.showToast('Failed to update favorites.', 'Error', 'error');
                        return;
                    }

                    // Show success message based on the action performed
                    if (result.data.action === 'added') {
                        ToastUtils.showToast(result.data.message, 'Success', 'success');
                    } else if (result.data.action === 'removed') {
                        ToastUtils.showToast(result.data.message, 'Success', 'success');
                    }

                    // Update local state if needed
                    const character = this.characters.find(item => item.id === characterId);

                    if (character) {
                        character.is_favorited = !character.is_favorited;
                        character.favorites_count += character.is_favorited ? 1 : -1;

                        // Update this.character with the modified item
                        this.character = { ...character };

                        
                        // Check if character exists in dataStore with a valid TTL
                        const dataStore = await piniaIndexedDb().getDataStore();
                        let characterData = await dataStore.get('characters', characterId);
                        
                        // Update the favorite status in the character data
                        characterData.data.is_favorited = character.is_favorited;
                        characterData.data.favorites_count = character.favorites_count;
                        
                        // Update the indexedDb
                        await dataStore.put('characters', {
                            id: characterData.id,
                            page: characterData.page,
                            data: characterData.data,
                            ttl: characterData.ttl,
                            updatedAt: Date.now()
                        });

                    }

                } catch (error) {
                    console.error('Error in toggleFavorite:', error);
                    ToastUtils.showToast('An unexpected error occurred.', 'Error', 'error');
                }
            },
            handleCharacterClick(character) {
                if (this.isNsfwCharacter(character.categories?.rating, character.is_nsfw) && !this.showNsfwImages) {
                    this.toggleNsfw();
                } else {
                    this.openCharacterPage(character);
                }
            },

            /**
             * Opens the character's page when clicking on the card
             * This function handles the main card click without interfering with other click events
             * @param {Object} character - The character object to open
             */
            openCharacterPage(character) {
                //Construct the URL
                const url = `character-details.html?uuid=${character.id}`;

                // Navigate to the character page
                window.location.href = url;
            },

            toggleNsfw() {
                alert('To see the image, disable the nsfw blur on your account settings.');
            },

            /* -------------------------------------------------------------------------- */
            /*                         APPEARANCE AND RESPONSIVITY                        */
            /* -------------------------------------------------------------------------- */

            /**
             * Checks the size of all cards on the page and applies appropriate styling classes
             * based on their dimensions to create a consistent and responsive layout.
             */
            checkCardSizes() {
                // Obter todos os elementos de cards e containers de imagens
                const cards = document.querySelectorAll(".card");
                const img_containers = document.querySelectorAll(".card-img-container");
                const buttons = document.querySelectorAll(".character-actions .btn");
                const buttonTexts = document.querySelectorAll(".button-text");

                // Retornar se não houver cards
                if (cards.length === 0) return;

                // Obter a largura do container pai
                const containerWidth = document.querySelector(".character-gallery")?.offsetWidth || 0;

                // Verificar layout atual
                const currentLayout = this.getCurrentLayout();
                const idealColumnCount = this.getIdealColumnCount(containerWidth);

                // Somente ajustar o layout se for realmente necessário e houver uma mudança significativa
                // Isso evita o ciclo de ajustes constantes
                if (currentLayout !== idealColumnCount &&
                    (this.lastLayoutChange === undefined ||
                        Date.now() - this.lastLayoutChange > 1000)) {

                    this.adjustColumnCount(idealColumnCount);
                    this.lastLayoutChange = Date.now();

                    // Permite que o DOM seja atualizado antes de medir novamente
                    setTimeout(() => {
                        this.processCardStyles();
                    }, 100);
                } else {
                    this.processCardStyles();
                }
            },

            /**
             * Determina o layout atual com base nas classes das colunas
             * @returns {number} Número atual de colunas
             */
            getCurrentLayout() {
                const firstColumn = document.querySelector(".character-gallery .row > [class*='col-']");
                if (!firstColumn) return 2; // Valor padrão

                if (firstColumn.classList.contains("col-xl-3")) return 4;
                if (firstColumn.classList.contains("col-lg-4")) return 3;
                return 2;
            },

            /**
             * Determina o número ideal de colunas com base na largura do container
             * @param {number} containerWidth - Largura do container em pixels
             * @returns {number} Número ideal de colunas
             */
            getIdealColumnCount(containerWidth) {
                // Usar breakpoints fixos para maior estabilidade
                if (containerWidth >= 1200) return 4;      // Extra large
                if (containerWidth >= 992) return 3;       // Large
                if (containerWidth >= 768) return 2;       // Medium
                return 1;                                  // Small
            },

            /**
             * Processa os estilos dos cards sem alterar o layout
             */
            processCardStyles() {
                const cards = document.querySelectorAll(".card");
                const img_containers = document.querySelectorAll(".card-img-container");
                const card_content = document.querySelectorAll(".card-content");
                const buttons = document.querySelectorAll(".character-actions .btn");
                const buttonTexts = document.querySelectorAll(".button-text");

                // Calcular larguras de cards depois que o DOM foi atualizado
                const widths = Array.from(cards).map(card => card.offsetWidth);
                this.minCardWidth = Math.min(...widths);
                this.maxCardWidth = Math.max(...widths);

                // Processar cada card individualmente
                cards.forEach((card, index) => {
                    const width = card.offsetWidth;
                    const img_container = img_containers[index];
                    const content = card_content[index];

                    // Limpar classes de estado anteriores
                    //card.classList.remove("border-danger", "border-warning", "border-primary", "border-dashed", "border-solid");
                    img_container?.classList.remove("collapsed");
                    content?.classList.remove("wrap");

                    // Gerenciar container de imagem com base na largura do card
                    if (width < 430) {
                        // Card estreito: Layout empilhado (imagem no topo)
                        img_container?.classList.add("collapsed");
                        content?.classList.add("wrap");

                        // Adicionar margem inferior quando empilhado
                        // if (img_container) {
                        //     img_container.style.marginRight = "0";
                        //     img_container.style.marginBottom = "1.5rem";
                        // }
                    } else {
                        // Card largo: Layout lado a lado
                        // if (img_container) {
                        //     img_container.style.marginRight = "1.5rem";
                        //     img_container.style.marginBottom = "0";
                        // }
                    }

                    // Aplicar classes de borda com base na largura
                    // if (width < 300) {
                    //     card.classList.add("border-danger", "border-solid"); // Muito pequeno
                    // } else if (width >= 300 && width < 500) {
                    //     card.classList.add("border-warning", "border-solid"); // Médio
                    // } else {
                    //     card.classList.add("border-primary", "border-solid"); // Grande
                    // }
                });

                // Verificar o tamanho de cada botão para determinar se devemos ocultar o texto
                buttons.forEach((button, index) => {
                    // Obter a altura atual do botão
                    const height = button.offsetHeight;
                    const standardHeight = 38; // Altura típica de botão Bootstrap - ajuste se necessário

                    // Ocultar texto se o botão estiver sendo comprimido e ficando mais alto
                    if (height > standardHeight + 5) { // Adicionando 5px de buffer para pequenas variações
                        buttonTexts[index]?.classList.add("d-none");
                    } else {
                        buttonTexts[index]?.classList.remove("d-none");
                    }
                });
            },

            /**
             * Ajusta o número de colunas na grade de cards
             * @param {number} columnCount - O número desejado de colunas
             */
            adjustColumnCount(columnCount) {
                // Obter o elemento de linha que contém as colunas de cards
                const rowElement = document.querySelector(".character-gallery .row");
                if (!rowElement) return;

                // Obter todos os elementos de coluna
                const columns = rowElement.querySelectorAll("[class*='col-']");
                if (columns.length === 0) return;

                // Remover classes de coluna existentes
                columns.forEach(column => {
                    const classes = Array.from(column.classList);
                    classes.forEach(cls => {
                        if (cls.startsWith("col-")) {
                            column.classList.remove(cls);
                        }
                    });

                    // Aplicar novas classes de coluna com base no número desejado
                    switch (columnCount) {
                        case 1:
                            column.classList.add("col-12");
                            break;
                        case 2:
                            column.classList.add("col-12", "col-md-6");
                            break;
                        case 3:
                            column.classList.add("col-12", "col-md-6", "col-lg-4");
                            break;
                        case 4:
                            column.classList.add("col-12", "col-md-6", "col-lg-4", "col-xl-3");
                            break;
                        default:
                            column.classList.add("col-12", "col-md-6", "col-lg-4", "col-xl-3");
                    }
                });
            }


        },
        computed: {
            displayedPages() {
                // Se houver menos de 8 páginas, mostra todas
                if (this.totalPages <= 7) {
                    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
                }

                // Para muitas páginas, mostra um intervalo de páginas ao redor da página atual
                let startPage = Math.max(2, this.currentPage - 2);
                let endPage = Math.min(this.totalPages - 1, this.currentPage + 2);

                if (startPage <= 2) {
                    endPage = Math.min(6, this.totalPages - 1);
                }

                if (endPage >= this.totalPages - 1) {
                    startPage = Math.max(2, this.totalPages - 5);
                }

                return Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);
            },
            showFirstPageButton() {
                return this.totalPages > 7;
            },
            showLastPageButton() {
                return this.totalPages > 7;
            },
            showLeftEllipsis() {
                return this.totalPages > 7 && this.displayedPages[0] > 2;
            },
            showRightEllipsis() {
                return this.totalPages > 7 && this.displayedPages[this.displayedPages.length - 1] < this.totalPages - 1;
            },
            showPagination() {
                return this.totalPages > 1 && !this.onlyFavorites;
            },


            // Computed property to handle character filtering with paginagation and favorites
            // This will be used to show the characters in the current page
            filteredCharacters() {
                if (this.stateLoading) return [];
                return this.filterCharacters()
            },

            charactersToDisplay() {
                if (this.stateLoading) return [];

                const characters = this.filteredCharacters || [];

                // Check if characters are available
                if (!characters.length) return [];

                // Calculate the total number of pages based on the filtered characters
                // this.totalPages = Math.ceil(characters.length / this.charactersPerPage);

                // Ensure the current page is within valid range
                if (this.currentPage < 1) this.currentPage = 1;
                if (this.currentPage > this.totalPages) this.currentPage = this.totalPages;
                // Return the characters for the current page
                return characters
                .filter(character => 
                    (!this.onlyFavorites || character.is_favorited) // Show only favorites
                    //&& (this.showNsfwCharacters || !character.is_nsfw) // Remove NSFW if showNsfwCharacters is false
                )
                // .slice(
                //     this.currentPage * this.charactersPerPage - this.charactersPerPage, // First index to show
                //     this.currentPage * this.charactersPerPage  // Last index to show
                // );
            },

            removedNsfwCount() {
                if (this.stateLoading) return 0;

                // If NSFW content is allowed, nothing is removed
                if (this.showNsfwCharacters) return 0;

                // Count NSFW characters that would be displayed after applying all other filters except NSFW
                return this.filterCharacters()
                    .filter(character => !this.onlyFavorites || character.is_favorited)
                    .filter(character => character.is_nsfw).length;
            },

            // Computed property to get available categories inside characters
            // This avoids showing categories with no characters
            availableCategories() {
                if (this.stateLoading) return [];

                // Get filtered characters first
                const filteredChars = this.filteredCharacters;
                if (!filteredChars.length) return this.sortCategoryTags(this.categories);

                // Process each category from the original categories array
                return this.categories.map(category => {
                    // Skip invalid categories
                    if (!category?.name) return null;

                    const categoryName = category.name.toLowerCase();
                    const tagCounts = new Map();

                    // Count occurrences of each tag in filtered characters
                    filteredChars.forEach(char => {
                        const charCategory = char.categories?.[categoryName];
                        if (!charCategory) return;

                        const tags = Array.isArray(charCategory) ? charCategory : [charCategory];
                        tags.forEach(tag => {
                            const normalizedTag = tag.toLowerCase();
                            tagCounts.set(normalizedTag, (tagCounts.get(normalizedTag) || 0) + 1);
                        });
                    });

                    // Special handling for rating category to always show SFW/NSFW options
                    if (categoryName === 'rating') {
                        // First count from filtered characters
                        const totalCounts = new Map();
                        filteredChars.forEach(char => {
                            const rating = char.categories?.rating;
                            if (Array.isArray(rating)) {
                                rating.forEach(r => {
                                    const normalizedRating = r.toLowerCase();
                                    totalCounts.set(normalizedRating, (totalCounts.get(normalizedRating) || 0) + 1);
                                });
                            } else if (rating) {
                                const normalizedRating = rating.toLowerCase();
                                totalCounts.set(normalizedRating, (totalCounts.get(normalizedRating) || 0) + 1);
                            }
                        });

                        // For each rating with 0 count, simulate count with that rating selected
                        ['sfw', 'nsfw'].forEach(ratingType => {
                            if (!totalCounts.get(ratingType)) {
                                // Create a temporary version of selected filters
                                const tempFilters = JSON.parse(JSON.stringify(this.selectedFilters));
                                if (!tempFilters.categories.rating) {
                                    tempFilters.categories.rating = [];
                                }
                                if (!tempFilters.categories.rating.includes(ratingType)) {
                                    tempFilters.categories.rating.push(ratingType);
                                }

                                // Filter characters with the temporary filters
                                const simulatedCount = this.characters.filter(character => {
                                    if (!character.categories) return false;

                                    // Apply all other active filters except rating
                                    const otherFiltersPass = Object.entries(this.selectedFilters.categories)
                                        .filter(([cat]) => cat !== 'rating')
                                        .every(([category, selectedTags]) => {
                                            if (!selectedTags || selectedTags.length === 0) return true;
                                            const charCategoryValue = character.categories[category];
                                            const charTags = Array.isArray(charCategoryValue)
                                                ? charCategoryValue.map(v => v?.toLowerCase() || '')
                                                : [String(charCategoryValue || '').toLowerCase()];
                                            return selectedTags.every(tag => {
                                                const cleanTag = tag.replace(/\s*\(\d+\)$/, '').toLowerCase();
                                                return charTags.includes(cleanTag);
                                            });
                                        });

                                    if (!otherFiltersPass) return false;

                                    // Check if character matches the rating we're simulating
                                    const rating = character.categories.rating;
                                    const isMatchingRating = Array.isArray(rating)
                                        ? rating.some(r => r.toLowerCase() === ratingType)
                                        : rating?.toLowerCase() === ratingType;

                                    return isMatchingRating;
                                }).length;

                                totalCounts.set(ratingType, simulatedCount);
                            }
                        });

                        // Set the counts in tagCounts
                        tagCounts.set('sfw', totalCounts.get('sfw') || 0);
                        tagCounts.set('nsfw', totalCounts.get('nsfw') || 0);
                    }

                    // Create new category object with same structure but filtered tags
                    const filteredCategory = {
                        ...category,
                        tags: {
                            general: category.tags?.general
                                ?.filter(tag => tagCounts.has(tag.toLowerCase()))
                                ?.map(tag => `${tag} (${tagCounts.get(tag.toLowerCase())})`),
                            nsfw: this.showNsfwTags ? category.tags?.nsfw
                                ?.filter(tag => tagCounts.has(tag.toLowerCase()))
                                ?.map(tag => `${tag} (${tagCounts.get(tag.toLowerCase())})`) : []
                        }
                    };

                    // Only return categories that have matching tags
                    return (filteredCategory.tags.general?.length > 0 || filteredCategory.tags.nsfw?.length > 0)
                        ? filteredCategory
                        : null;
                }).filter(Boolean); // Remove null entries
            },

            // Computed property to check if any filters are active
            hasActiveFilters() {
                // Check if search text exists
                if (this.searchInput) return true;

                // Check if any rating besides SFW is selected
                const ratings = this.selectedFilters.categories.rating;
                if (ratings.length > 1 || (ratings.length === 1 && ratings[0] !== 'SFW')) return true;

                // Check other category filters if they exist
                for (const category in this.selectedFilters.categories) {
                    if (category !== 'rating' && this.selectedFilters.categories[category].length > 0) {
                        return true;
                    }
                }

                return false;
            },

            // Computed property to get total character count
            totalCharacters() {
                return this.characters ? this.characters.length : 0;
            },

            // Computed property to get filtered character count
            filteredCharactersCount() {
                return this.filteredCharacters ? this.filteredCharacters.length : 0;
            },

            // MODAL FUNCTIONS
            categoryCount() {
                return Object.keys(this.selectedCharacter?.categories || {}).length;
            },
            requiredCharCount() {
                return this.selectedCharacter?.groupSettings?.requires?.length || 0;
            },
            hasCategoryItems() {
                return this.categoryCount > 0;
            },
            hasRequiredCharacters() {
                return this.requiredCharCount > 0;
            }
        },
        async mounted() {
            // Load async data
            try {
                this.stateLoading = true;

                // Create timeout to show loading message after 2s
                const loadingTimeout = setTimeout(() => {
                    ToastUtils.showToast('Loading data, please wait...', 'Info', 'info');
                }, 2000);

                // Load data
                await this.loadCategories();
                await this.loadCharacters();

                // Responsive adjustment
                this.checkCardSizes();
                window.addEventListener('resize', this.debouncedCheckCardSizes);

                // Clear timeout if loading completed before 2s
                clearTimeout(loadingTimeout);

                // Check if user is logged in and set NSFW visibility
                this.showNsfwImages = piniaUser().userData.blur_nsfw === false || false;
            } catch (error) {
                console.error('Failed to load data:', error);
                ToastUtils.showToast('Failed to load data!', 'Error', 'error');
            } finally {
                this.stateLoading = false;

                // Handle offcanvas events
                const filterPanel = document.getElementById('filterPanel');
                filterPanel.addEventListener('show.bs.offcanvas', () => {
                    document.body.classList.add('offcanvas-open');
                });
                filterPanel.addEventListener('hide.bs.offcanvas', () => {
                    document.body.classList.remove('offcanvas-open');
                });

                // Restore scroll position if available
                // Detect when user presses "Back" and restore scroll position
                this.detectBackNavigation();
            }
        },
        beforeUnmount() {
            window.removeEventListener('resize', this.debouncedCheckCardSizes);
            window.removeEventListener('popstate', this.restoreScrollPosition);
        },

    });

    /* --------------------------- Register components -------------------------- */

    // Register the navbar component
    app.component('navbar-component', {
        template: navbarTemplate,
        setup() {
            return {
                stTheme: piniaTheme(),
                stSite: piniaSiteConfig(),
                stUser: piniaUser()
            }
        }
    });

    // Register the footer component
    app.component('footer-component', {
        template: footerTemplate
    });

    // Register the login modal component
    app.component('login-modal-component', {
        // Use the HTML template
        template: modalLoginTemplate,
        setup() {
            return {
                stTheme: piniaTheme(),
                stSite: piniaSiteConfig(),
                stUser: piniaUser()
            }
        },
        // Spread all properties from the imported component
        ...LoginModalComponent
    });

    /* -------------------------------- Mount APP ------------------------------- */
    app.use(pinia);

    // Mount app at #app
    app.mount('#app');
});