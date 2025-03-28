import { piniaUser, piniaTheme, piniaSiteConfig } from './store.js';
import { GithubUtils, Misc, ToastUtils } from './utils.js';
import LoginModalComponent from '../components/modal-login.js';

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
        data() {
            return {
                // // Site configuration from global CONFIG
                // site: piniaSiteConfig().site,       // Gerenal configuration
                // isDarkMode: localStorage.getItem('siteTheme') === 'dark',
                // currentTheme: localStorage.getItem('siteTheme'),

                // User variables
                user: '',

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
                    // 1. Safety check: Ensure character has valid categories object
                    // This prevents errors from malformed character data
                    if (!character.manifest?.categories) return false;

                    // 2. Search text filtering
                    // Checks if character matches the current search input across multiple fields
                    if (!this.searchCharacter(character, this.searchInput)) {
                        return false;
                    }

                    // 3. NSFW content handling
                    // Filters out NSFW content based on user preferences and selected filters
                    if (this.isNsfwCharacter(character.manifest.categories.rating) &&
                        !this.showNsfwCharacters &&
                        !this.selectedFilters.categories.rating?.includes('nsfw')) {
                        return false;
                    }

                    // 3.5 SFW content handling
                    // Filter out SFW content if SFW is not selected in rating filters
                    const ratingFilters = this.selectedFilters.categories.rating || [];
                    const cleanRatingFilters = ratingFilters.map(tag => tag.replace(/\s*\(\d+\)$/, '').toLowerCase());
                    if (!this.isNsfwCharacter(character.manifest.categories.rating) &&
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
                        const charCategoryValue = character.manifest.categories[category];

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
                try {
                    return decodeURIComponent(escape(text));
                } catch {
                    return text;
                }
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
            }

        },
        computed: {

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

                    // Special handling for rating category to always show SFW/NSFW options
                    if (categoryName === 'rating') {
                        // First count from filtered characters
                        const totalCounts = new Map();
                        filteredChars.forEach(char => {
                            const rating = char.manifest?.categories?.rating;
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
                                    if (!character.manifest?.categories) return false;

                                    // Apply all other active filters except rating
                                    const otherFiltersPass = Object.entries(this.selectedFilters.categories)
                                        .filter(([cat]) => cat !== 'rating')
                                        .every(([category, selectedTags]) => {
                                            if (!selectedTags || selectedTags.length === 0) return true;
                                            const charCategoryValue = character.manifest.categories[category];
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
                                    const rating = character.manifest.categories.rating;
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