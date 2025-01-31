import { ThemeManager } from './theme.js';
import { GithubUtils, Misc, ToastUtils } from './utils.js';

// ACC Characters Vue.js Application
document.addEventListener('DOMContentLoaded', () => {
    const { createApp, ref, computed } = Vue;

    createApp({
        data() {
            return {
                // Site configuration from global CONFIG
                site: window.CONFIG.site,       // Gerenal configuration
                isDarkMode: localStorage.getItem('siteTheme') === 'dark',
                currentTheme: localStorage.getItem('siteTheme'),

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
                }
            };
        },

        created() {
        },

        methods: {
            // Theme toggle method
            toggleTheme() {
                this.isDarkMode = ThemeManager.toggleTheme();
            },

            setTheme(theme) {
                this.currentTheme = theme;
                this.isDarkMode = ThemeManager.toggleTheme(theme);
            },

            showCharacterModal(character) {
                this.selectedCharacter = character;
            },

            /**
             * Load character data from repository (optimized version).
             * @param {boolean} forceRefresh - If true, forces data fetch regardless of cache expiration.
             * @returns {Promise<void>}
             */
            async loadCharacters(forceRefresh = false) {
                this.stateLoading = true;

                // Debug key for logging purposes
                const debugKey = window.CONFIG.debug?.aacCharacters?.characters ?? false;
                const debugPrefix = '[CHARACTERS] ';

                try {
                    Misc.debug(debugKey, debugPrefix + "Loading character data...");

                    const cacheConfig = window.CONFIG.cache.accCharacters.characters;
                    const cacheKey = cacheConfig.key;
                    const cacheDuration = cacheConfig.duration * 60 * 1000 || 3600; // Convert minutes to milliseconds, default 1 hour.

                    const cachedData = localStorage.getItem(cacheKey);
                    const lastFetchTime = localStorage.getItem(`${cacheKey}_timestamp`);
                    const isCacheValid = lastFetchTime && (Date.now() - lastFetchTime < cacheDuration);

                    if (!forceRefresh && cachedData && isCacheValid) {
                        const charData = JSON.parse(cachedData);
                        Misc.debug(debugKey, debugPrefix + "Using cached data for characters.\nData:", JSON.stringify(charData, 0, 4));
                        this.characters = charData;
                    } else {
                        Misc.debug(debugKey, debugPrefix + "Fetching new data for characters...\n\nReasons for not using cache:\n1. Force refresh:", forceRefresh, "\n2. Cache validity:", isCacheValid, "\n3. Cached data:", cachedData);

                        const indexData = await GithubUtils.fetchGithubData(
                            window.CONFIG.repo.owner,
                            window.CONFIG.repo.name,
                            window.CONFIG.paths.accCharacters.index,
                            window.CONFIG.repo.branch,
                            "json"
                        );

                        Misc.debug(debugKey, debugPrefix + "Fetched index.json data:", "indexData");

                        // Check if the data has the correct structure
                        if (!indexData || typeof indexData !== 'object') {
                            throw new Error('Invalid structure for characters data');
                        }

                        if (!Array.isArray(indexData)) {
                            throw new Error("Unexpected response format: Expected an array");
                        }

                        // Transform data to match the original output format
                        // const repoURL = `https://github.com/${CONFIG.repo.owner}/${CONFIG.repo.name}/blob/${CONFIG.repo.branch}`;
                        // const charData = indexData.map((item) => ({
                        //     ...item.manifest,
                        //     path: `${repoURL}/${item.path}`,
                        //     type: item.manifest.categories.rating
                        // }));
                        const charData = indexData;

                        // Store data in state and cache
                        localStorage.setItem(cacheKey, JSON.stringify(charData));
                        localStorage.setItem(`${cacheKey}_timestamp`, Date.now().toString());

                        Misc.debug(debugKey, debugPrefix + "Fetched and stored characters data successfully!\nData:", JSON.stringify(charData, 0, 4));

                        //return charData;
                        this.characters = charData;
                    }
                } catch (error) {
                    ToastUtils.showToast('Failed to load characters.', 'Error', 'error');
                    console.error("Failed to load characters:", error.message);
                } finally {
                    this.stateLoading = false;
                }
            },

            /**
             * Initialize the filter system
             * @returns {Promise<void>}
             * @param {boolean} forceRefresh - If true, forces data fetch regardless of cache expiration.
             */
            async loadCategories(forceRefresh = false) {
                this.stateLoading = true;

                // Debug key for logging purposes
                const debugKey = window.CONFIG.debug?.aacCharacters?.categories ?? false;
                const debugPrefix = '[CATEGORIES] ';

                try {
                    Misc.debug(debugKey, debugPrefix + "Loading categories data...");

                    const cacheConfig = window.CONFIG.cache.accCharacters.filters;
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
                            window.CONFIG.repo.owner,
                            window.CONFIG.repo.name,
                            window.CONFIG.paths.categories,
                            window.CONFIG.repo.branch,
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

            isTagSelected(categoryName, tag, cat) {
                // Exit early if data is loading or characters are not available
                if (this.stateLoading || !this.categories) return [];

                // Safety check for category and tag
                const categoryLower = categoryName.toLowerCase();
                return this.selectedFilters.categories[categoryLower]?.includes(tag) || false;
            },

            handleTagSelection(e, category, tag) {
                const categoryLower = category.name.toLowerCase();

                // Initialize category array if it doesn't exist
                if (!this.selectedFilters.categories[categoryLower]) {
                    this.selectedFilters.categories[categoryLower] = [];
                }

                // Handle NSFW visibility toggle
                if (categoryLower === 'rating' && tag === 'NSFW') {
                    this.showNsfwTags = e.target.checked;
                    this.showNsfwImages = e.target.checked;
                }

                // Update selected filters
                if (e.target.checked) {
                    if (!this.selectedFilters.categories[categoryLower].includes(tag)) {
                        this.selectedFilters.categories[categoryLower].push(tag);
                    }
                } else {
                    this.selectedFilters.categories[categoryLower] =
                        this.selectedFilters.categories[categoryLower].filter(t => t !== tag);

                    // If unchecking last Rating tag, re-enable SFW
                    if (categoryLower === 'rating' &&
                        this.selectedFilters.categories.rating.length === 0) {
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
                    character.manifest?.name,
                    character.manifest?.description,
                    character.manifest?.username,
                    character.manifest?.description,
                    character.manifest?.title
                ];

                return searchFields.some(field =>
                    field?.toLowerCase().includes(searchLower)
                );
            },

            // Robust filtering method
            filterCharacters() {
                // Exit early if data is loading or characters are not available
                if (this.stateLoading || !this.characters) return [];

                // Filter characters based on search text and category filters
                return this.characters.filter(character => {
                    // 1. Safety check for character categories
                    if (!character.manifest?.categories) return false;

                    // 2. Check if character matches search text
                    if (!this.searchCharacter(character, this.searchInput)) {
                        return false;
                    }

                    // 3. Special handling for NSFW content
                    const isNsfw = character.manifest.categories.rating?.toLowerCase() === 'nsfw';
                    if (isNsfw && !this.showNsfwCharacters &&
                        !this.selectedFilters.categories.rating?.includes('NSFW')) {
                        return false;
                    }

                    // 4. If no category filters, show all remaining characters
                    if (Object.keys(this.selectedFilters.categories).length === 0) {
                        return true;
                    }

                    // 5. Check all category filters
                    return Object.entries(this.selectedFilters.categories).every(([category, selectedTags]) => {
                        // Ensure selectedTags exists and is an array
                        if (!selectedTags || !Array.isArray(selectedTags) || selectedTags.length === 0) return true;

                        const charCategoryValue = character.manifest.categories[category];

                        if (category === 'rating' && this.showNsfwCharacters) return true;

                        if (Array.isArray(charCategoryValue)) {
                            return selectedTags.some(tag =>
                                charCategoryValue.map(v => v?.toLowerCase() || '')
                                    .includes(tag.toLowerCase())
                            );
                        }

                        // Ensure charCategoryValue is a string before comparison
                        const charValue = String(charCategoryValue || '').toLowerCase();
                        return selectedTags.some(tag => tag.toLowerCase() === charValue);
                    });
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
                this.showNsfwImages = true;
                bootstrap.Modal.getInstance(document.getElementById('nsfwConfirmModal')).hide();
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
            }
        },
        computed: {
            themeIcon() {
                switch (this.currentTheme) {
                    case 'dark':
                        return 'fas fa-moon';
                    case 'auto':
                        return 'fas fa-circle-half-stroke';
                    default:
                        return 'fas fa-sun';
                }
            },

            // Computed property to handle character filtering with NSFW visibility
            filteredCharacters() {
                if (this.stateLoading) return [];
                return this.filterCharacters();
            },

            // Computed property to get available categories inside characters
            // This avoids showing categories with no characters
            availableCategories() {
                if (this.stateLoading) return [];
                return this.categories;
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
                return Object.keys(this.selectedCharacter?.manifest?.categories || {}).length;
            },
            requiredCharCount() {
                return this.selectedCharacter?.manifest?.groupSettings?.requires?.length || 0;
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

                // Clear timeout if loading completed before 2s
                clearTimeout(loadingTimeout);
            } catch (error) {
                console.error('Failed to load data:', error);
                ToastUtils.showToast('Failed to load data!', 'Error', 'error');
            } finally {
                this.stateLoading = false;
            }
        }
    }).mount('#app');
});