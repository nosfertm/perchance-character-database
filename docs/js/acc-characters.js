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
                    const cacheDuration = cacheConfig.duration * 60 * 1000 || 3600;

                    const cachedData = localStorage.getItem(cacheKey);
                    const lastFetchTime = localStorage.getItem(`${cacheKey}_timestamp`);
                    const isCacheValid = lastFetchTime && (Date.now() - lastFetchTime < cacheDuration);

                    let charData;

                    if (!forceRefresh && cachedData && isCacheValid) {
                        charData = JSON.parse(cachedData);
                        Misc.debug(debugKey, debugPrefix + "Using cached data for characters");
                    } else {
                        const indexData = await GithubUtils.fetchGithubData(
                            window.CONFIG.repo.owner,
                            window.CONFIG.repo.name,
                            window.CONFIG.paths.accCharacters.index,
                            window.CONFIG.repo.branch,
                            "json"
                        );

                        // Check data structure
                        if (!indexData || typeof indexData !== 'object' || !Array.isArray(indexData)) {
                            throw new Error('Invalid structure for characters data');
                        }

                        // Process the data to convert categories to lowercase
                        charData = indexData.map(char => {
                            if (char.manifest?.categories) {
                                const lowerCaseCategories = {};
                                Object.entries(char.manifest.categories).forEach(([key, value]) => {
                                    const lowerKey = key.toLowerCase();
                                    const lowerValue = Array.isArray(value)
                                        ? value.map(v => typeof v === 'string' ? v.toLowerCase() : v)
                                        : typeof value === 'string' ? value.toLowerCase() : value;
                                    lowerCaseCategories[lowerKey] = lowerValue;
                                });
                                char.manifest.categories = lowerCaseCategories;
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

                // Clean the tag (remove count)
                const cleanTag = tag.replace(/\s*\(\d+\)$/, '');

                // Initialize category array if it doesn't exist
                if (!this.selectedFilters.categories[categoryLower]) {
                    this.selectedFilters.categories[categoryLower] = [];
                }

                // Handle NSFW visibility toggle
                if (categoryLower === 'rating' && cleanTag.toLowerCase() === 'nsfw') {
                    this.showNsfwTags = e.target.checked;
                    this.showNsfwImages = e.target.checked;
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
                    if (this.isNsfwCharacter(character.manifest.categories.rating) &&
                        !this.showNsfwCharacters &&
                        !this.selectedFilters.categories.rating?.includes('nsfw')) {
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

                        // Convert character tags to array and clean them
                        const charTags = Array.isArray(charCategoryValue)
                            ? charCategoryValue.map(v => v?.toLowerCase() || '')
                            : [String(charCategoryValue || '').toLowerCase()];

                        // Clean selected tags and check if ALL selected tags are present
                        return selectedTags.every(tag => {
                            const cleanTag = tag.replace(/\s*\(\d+\)$/, '').toLowerCase();
                            return charTags.includes(cleanTag);
                        });
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
            },

            // Check if the selected character is NSFW
            isNsfwCharacter(rating) {
                if (!rating) return false;

                return Array.isArray(rating)
                    ? rating.includes('nsfw')  // If array, checks if contaisn 'nsfw'
                    : typeof rating === 'string' && rating.toLowerCase() === 'nsfw';  // If string, compares directly
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
                return decodeURIComponent(escape(text));
            },

            /**
             * Constructs and opens a GitHub raw content URL for downloading character files
             * @param {string} filePath - Path to the character file within the repository
             * @returns {void} Opens the download URL in a new tab
             */
            downloadCharacterFile(filePath) {
                // Get repository config
                const repo = {
                    owner: window.CONFIG.repo.owner,
                    name: window.CONFIG.repo.name,
                    branch: window.CONFIG.repo.branch
                };

                // Construct the raw GitHub content URL
                const downloadUrl = `https://raw.githubusercontent.com/${repo.owner}/${repo.name}/${repo.branch}/${filePath}`;

                // Open URL in new tab
                window.open(downloadUrl, '_blank');
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

                // Get filtered characters first
                const filteredChars = this.filteredCharacters;
                if (!filteredChars.length) return this.categories;

                // Process each category from the original categories array
                return this.categories.map(category => {
                    // Skip invalid categories
                    if (!category?.name) return null;

                    const categoryName = category.name.toLowerCase();
                    const tagCounts = new Map();

                    // Count occurrences of each tag in filtered characters
                    filteredChars.forEach(char => {
                        const charCategory = char.manifest?.categories?.[categoryName];
                        if (!charCategory) return;

                        const tags = Array.isArray(charCategory) ? charCategory : [charCategory];
                        tags.forEach(tag => {
                            const normalizedTag = tag.toLowerCase();
                            tagCounts.set(normalizedTag, (tagCounts.get(normalizedTag) || 0) + 1);
                        });
                    });

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

                // Handle offcanvas events
                const filterPanel = document.getElementById('filterPanel');
                filterPanel.addEventListener('show.bs.offcanvas', () => {
                    document.body.classList.add('offcanvas-open');
                });
                filterPanel.addEventListener('hide.bs.offcanvas', () => {
                    document.body.classList.remove('offcanvas-open');
                });
            }
        }
    }).mount('#app');
});