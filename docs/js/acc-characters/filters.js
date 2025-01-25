import CONFIG from '../config.js';
import { showToast, fetchGithubData, debug } from '../utils.js';

// Debug key for logging purposes
const debugKey = CONFIG.debug?.aacCharacters?.filters ?? false;
const debugPrefix = '[FILTERS] ';

// State management for filters
const filterState = {
    categories: null,
    selectedFilters: {},
    nsfwEnabled: false
};

/**
 * Initialize the filter system
 * @returns {Promise<void>}
 * @param {boolean} forceRefresh - If true, forces data fetch regardless of cache expiration.
 */
export async function initFilters(forceRefresh = false) {
    try {
        debug(debugKey, debugPrefix+"1 - Initializing filter system...");

        const cacheConfig = CONFIG.cache.accCharacters.filters;
        const cacheKey = cacheConfig.key;
        const cacheDuration = cacheConfig.duration * 60 * 1000 || 3600; // Convert minutes to milliseconds, default 1 hour.

        const cachedData = localStorage.getItem(cacheKey);
        const lastFetchTime = localStorage.getItem(`${cacheKey}_timestamp`);
        const isCacheValid = lastFetchTime && (Date.now() - lastFetchTime < cacheDuration);

        if (!forceRefresh && cachedData && isCacheValid) {
            galleryState.characters = JSON.parse(cachedData);
            debug(debugKey, debugPrefix+"Using cached data for categories:", galleryState.characters);
        } else {

            debug(debugKey, debugPrefix+"Fetching new data for categories...\n\nReasons for not using cache:\n1. Force refresh:", forceRefresh, "\n2. Cache validity:", isCacheValid, "\n3. Cached data:", cachedData);
            const categories = await fetchGithubData(
                CONFIG.repo.owner, 
                CONFIG.repo.name, 
                CONFIG.paths.categories, 
                CONFIG.repo.branch, 
                "json"    // The output format is JSON
            );
            
            debug(debugKey, debugPrefix+"4 - Categories data:", categories);

            // Check if the data has the correct structure
            if (!categories || typeof categories !== 'object') {
                throw new Error('Invalid structure for categories data');
            }
            
            // Store data in state and cache
            filterState.categories = categories;
            localStorage.setItem(cacheKey, JSON.stringify(categories));
            localStorage.setItem(`${cacheKey}_timestamp`, Date.now().toString());

            debug(debugKey, debugPrefix+"Fetched and stored categories data successfully:", categories);
        }
        
        // Initialize filters
        renderFilterPanel();
        debug(debugKey, debugPrefix+"5 - Rendering filter panel");

        setupFilterEvents();
        debug(debugKey, debugPrefix+"6 - Setting up filter events");

        initializeDefaultFilters();
        debug(debugKey, debugPrefix+"7 - Filters initialized successfully");

    } catch (error) {
        console.error('Failed to initialize filters:', error);
        showToast('Failed to load filters', 'error');
    }
}

/**
 * Render the filter panel with all categories
 */
function renderFilterPanel() {
    console.log("8 - Rendering filter panel...");

    const container = document.getElementById('categoriesContainer');
    container.innerHTML = ''; // Clear existing content
    
    Object.entries(filterState.categories).forEach(([categoryName, categoryData], index) => {
        // Check each category
        console.log(`9 - Processing category ${index + 1} [name | data]:`, categoryName, categoryData);

        // Check if the category has tags, nsfw_only, etc.
        if (!categoryData.tags) {
            console.warn(`Warning: No tags found for category ${categoryName}`);
        }

        // Create category section
        const categorySection = createCategorySection(categoryName, categoryData);
        console.log(`10 - Category section created for ${categoryName}:`, categorySection);

        // Check if this is an NSFW-only category
        if (categoryData.nsfw_only) {
            categorySection.classList.add('nsfw-category');
            categorySection.style.display = filterState.nsfwEnabled ? 'block' : 'none';
        }
        
        container.appendChild(categorySection);
    });
}

/**
 * Create a collapsible category section with checkboxes
 * @param {string} categoryName - Name of the category
 * @param {Object} categoryData - Category configuration data
 * @returns {HTMLElement} The category section element
 */
function createCategorySection(categoryName, categoryData) {
    console.log("11 - Creating category section for", categoryName);

    const section = document.createElement('div');
    section.className = 'category-section';
    
    // Create header with toggle
    const header = document.createElement('div');
    header.className = 'category-header';
    header.innerHTML = `
        <span>${categoryName}</span>
        <span class="toggle-icon">▼</span>
    `;
    
    // Create content container
    const content = document.createElement('div');
    content.className = 'category-content';

    console.log(`12 - Processing tags for category ${categoryName}`, categoryData.tags);

    // Add tags based on current NSFW state
    const tagsToShow = filterState.nsfwEnabled 
        ? [...(categoryData.tags?.general || []), ...(categoryData.tags?.nsfw || [])] 
        : categoryData.tags?.general || [];
    
    console.log(`13 - Tags to show for ${categoryName}:`, tagsToShow);

    tagsToShow.forEach(tag => {
        const tagContainer = createTagCheckbox(categoryName, tag);
        content.appendChild(tagContainer);
    });
    
    // Collapse all categories except Rating by default
    if (categoryName !== 'Rating') {
        content.style.display = 'none';
    }

    section.appendChild(header);
    section.appendChild(content);
    
    // Add toggle event
    header.addEventListener('click', () => {
        const isCollapsed = content.style.display === 'none';
        content.style.display = isCollapsed ? 'block' : 'none';
        header.querySelector('.toggle-icon').textContent = isCollapsed ? '▼' : '▲';
    });
    
    return section;
}

/**
 * Create a checkbox for a tag
 * @param {string} category - Category name
 * @param {string} tag - Tag name
 * @returns {HTMLElement} The tag checkbox element
 */
function createTagCheckbox(category, tag) {
    const container = document.createElement('label');
    container.className = 'tag-checkbox';
    
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.dataset.category = category;
    checkbox.dataset.tag = tag;
    
    // Special handling for SFW/NSFW in Rating category
    if (category === 'Rating') {
        if (tag === 'SFW') {
            checkbox.checked = true; // SFW checked by default
        }
        checkbox.addEventListener('change', handleRatingChange);
    }
    
    container.appendChild(checkbox);
    container.appendChild(document.createTextNode(tag));
    
    return container;
}

/**
 * Toggle visibility of SFW content
 * @param {boolean} show - Whether to show SFW content
 */
function toggleSfwContent(show) {
    document.querySelectorAll('.character-card.sfw').forEach(card => {
        card.style.display = show ? 'block' : 'none';
    });
}

/**
 * Handle changes to Rating checkboxes
 * @param {Event} event - Change event
 */
function handleRatingChange(event) {
    const checkbox = event.target;
    const tag = checkbox.dataset.tag;

    console.log(`Rating checkbox changed: ${tag}`);
    console.log("Filter state:", filterState);
    
    if (tag === 'NSFW') {
        filterState.nsfwEnabled = checkbox.checked;
        toggleNsfwCategories(checkbox.checked);
        
        // If NSFW is enabled and SFW is unchecked, hide SFW content
        const sfwCheckbox = document.querySelector('input[data-tag="SFW"]');
        if (checkbox.checked && !sfwCheckbox.checked) {
            toggleSfwContent(false);
        } else {
            toggleSfwContent(true);
        }
    }
    
    updateFilters();
}

/**
 * Toggle visibility of NSFW categories
 * @param {boolean} show - Whether to show NSFW categories
 */
function toggleNsfwCategories(show) {
    const nsfwCategories = document.querySelectorAll('.nsfw-category');
    nsfwCategories.forEach(category => {
        category.style.display = show ? 'block' : 'none';
    });
}

/**
 * Initialize default filter state
 */
function initializeDefaultFilters() {
    filterState.selectedFilters = {
        Rating: ['SFW'] // Default to SFW content
    };
    
    // Set default checkboxes
    const sfwCheckbox = document.querySelector('input[data-tag="SFW"]');
    if (sfwCheckbox) {
        sfwCheckbox.checked = true;
    }
    
    updateFilters();
}

/**
 * Set up event listeners for filter panel
 */
function setupFilterEvents() {
    // Clear filters button
    const clearButton = document.getElementById('clearFilters');
    clearButton.addEventListener('click', clearAllFilters);
    
    // Toggle sidebar
    const toggleButton = document.getElementById('toggleSidebar');
    toggleButton.addEventListener('click', () => {
        document.getElementById('sidebar').classList.toggle('active');
    });

    // Add event listeners to all category checkboxes
    document.querySelectorAll('.filter-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', handleFilterChange);
    });
}

/**
 * Clear all selected filters
 */
function clearAllFilters() {
    // Reset all checkboxes except Rating
    document.querySelectorAll('.tag-checkbox input').forEach(checkbox => {
        if (checkbox.dataset.category !== 'Rating') {
            checkbox.checked = false;
        }
    });
    
    // Reset filter state but maintain Rating
    const ratingFilters = filterState.selectedFilters.Rating || [];
    filterState.selectedFilters = {
        Rating: ratingFilters
    };
    
    updateFilters();
}

/**
 * Update filter state and trigger gallery refresh
 */
function updateFilters() {
    // Update selected filters state
    document.querySelectorAll('.tag-checkbox input:checked').forEach(checkbox => {
        const category = checkbox.dataset.category;
        const tag = checkbox.dataset.tag;
        
        if (!filterState.selectedFilters[category]) {
            filterState.selectedFilters[category] = [];
        }
        
        if (!filterState.selectedFilters[category].includes(tag)) {
            filterState.selectedFilters[category].push(tag);
        }
    });
    
    // Update clear filters button visibility
    const hasFilters = Object.entries(filterState.selectedFilters)
        .some(([category, tags]) => category !== 'Rating' && tags.length > 0);
    document.getElementById('clearFilters').style.display = hasFilters ? 'block' : 'none';
    
    // Dispatch event for gallery update
    const event = new CustomEvent('filtersUpdated', {
        detail: {
            filters: filterState.selectedFilters,
            nsfwEnabled: filterState.nsfwEnabled
        }
    });
    document.dispatchEvent(event);
}

//new
function handleFilterChange(event) {
    const checkbox = event.target;
    const category = checkbox.closest('.category-section').dataset.category;
    const tag = checkbox.dataset.tag;

    // Update selected filters
    updateSelectedFilters(category, tag, checkbox.checked);
    updateFilters();
}

function updateSelectedFilters(category, tag, isChecked) {
    // Add or remove tags from selected filters
    const currentFilters = filterState.selectedFilters[category] || [];
    
    if (isChecked && !currentFilters.includes(tag)) {
        filterState.selectedFilters[category].push(tag);
    } else if (!isChecked) {
        filterState.selectedFilters[category] = currentFilters.filter(t => t !== tag);
    }
}

// Export necessary functions and state
export const getFilterState = () => filterState;