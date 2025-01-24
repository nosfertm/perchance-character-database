import CONFIG from '../config.js';
import { showToast, fetchGithubData, debug } from '../utils.js';

// Debug key for logging purposes
const debugKey = CONFIG.debug?.aacCharacters?.display ?? false;
const debugPrefix = '[DISPLAY] ';

// State management for gallery
const galleryState = {
    characters: [],
    filteredCharacters: [],
    loading: false
};

/**
 * Initialize the gallery display
 * @returns {Promise<void>}
 */
async function initGallery() {
    try {
        // Set up event listeners
        setupGalleryEvents();
        
        // Load initial character data
        await loadCharacters();
        
        // Initial filtering with default SFW setting
        filterCharacters(
            { Rating: ['SFW'] },  // Default to showing only SFW characters
            false  // NSFW disabled by default
        );
        
        // Render the gallery
        renderGallery();
    } catch (error) {
        console.error('Failed to initialize gallery:', error);
        showToast('Failed to load characters', 'error');
    }
}

/**
 * Set up gallery event listeners
 */
function setupGalleryEvents() {
    // Listen for filter updates
    document.addEventListener('filtersUpdated', (event) => {
        const { filters, nsfwEnabled } = event.detail;
        filterCharacters(filters, nsfwEnabled);
        renderGallery();
    });
    
    // Refresh button
    document.getElementById('refreshGallery').addEventListener('click', async () => {
        await loadCharacters();
        renderGallery();
    });
}

/**
 * Load character data from repository (optimized version).
 * @param {boolean} forceRefresh - If true, forces data fetch regardless of cache expiration.
 * @returns {Promise<void>}
 */
async function loadCharacters(forceRefresh = false) {
    galleryState.loading = true;

    try {
        debug(debugKey, debugPrefix+"Loading character data...");

        const cacheConfig = CONFIG.cache.accCharacters;
        const cacheKey = cacheConfig.key;
        const cacheDuration = cacheConfig.duration * 60 * 1000 || 3600; // Convert minutes to milliseconds, default 1 hour.

        const cachedData = localStorage.getItem(cacheKey);
        const lastFetchTime = localStorage.getItem(`${cacheKey}_timestamp`);
        const isCacheValid = lastFetchTime && (Date.now() - lastFetchTime < cacheDuration);

        if (!forceRefresh && cachedData && isCacheValid) {
            galleryState.characters = JSON.parse(cachedData);
            debug(debugKey, debugPrefix+"Using cached data for characters:", galleryState.characters);
        } else {
            debug(debugKey, debugPrefix+"Fetching new data for characters...\n\nReasons for not using cache:\n1. Force refresh:", forceRefresh, "\n2. Cache validity:", isCacheValid, "\n3. Cached data:", cachedData);

            const indexData = await fetchGithubData(
                CONFIG.repo.owner,
                CONFIG.repo.name,
                CONFIG.paths.accCharacters.index,
                CONFIG.repo.branch,
                "json"
            );

            debug(debugKey, debugPrefix+"Fetched index.json data:", indexData);

            if (!Array.isArray(indexData)) {
                throw new Error("Unexpected response format: Expected an array");
            }

            // Transform data to match the original output format
            const repoURL = `https://github.com/${CONFIG.repo.owner}/${CONFIG.repo.name}/blob/${CONFIG.repo.branch}`;
            const characters = indexData.map((item) => ({
                ...item.manifest,
                path: `${repoURL}/${item.path}`,
                type: item.manifest.categories.rating
            }));

            // Store data in state and cache
            galleryState.characters = characters;
            localStorage.setItem(cacheKey, JSON.stringify(characters));
            localStorage.setItem(`${cacheKey}_timestamp`, Date.now().toString());

            debug(debugKey, debugPrefix+"Fetched and stored characters data successfully:", characters);
        }
    } catch (error) {
        console.error("Failed to load characters:", error.message);
        showToast("Error loading characters", "error");
    } finally {
        galleryState.loading = false;
    }
}

/**
 * Filter characters based on selected filters
 * @param {Object} filters - Selected filters
 * @param {boolean} nsfwEnabled - Whether NSFW content is enabled
 */
function filterCharacters(filters, nsfwEnabled) {
    galleryState.filteredCharacters = galleryState.characters.filter(character => {
        // Check rating first
        const showSfw = filters.Rating?.includes('SFW');
        const showNsfw = filters.Rating?.includes('NSFW');
        
        if (character.type === 'nsfw' && (!nsfwEnabled || !showNsfw)) {
            return false;
        }
        
        if (character.type === 'sfw' && !showSfw) {
            return false;
        }
        
        // Check other filters
        return Object.entries(filters).every(([category, selectedTags]) => {
            if (category === 'Rating' || selectedTags.length === 0) {
                return true;
            }
            
            const characterTags = character.categories[category.toLowerCase()] || [];
            return selectedTags.some(tag => 
                characterTags.includes(tag.toLowerCase())
            );
        });
    });
}

/**
 * Render the gallery grid
 */
function renderGallery() {
    const grid = document.getElementById('galleryGrid');
    grid.innerHTML = '';
    
    galleryState.filteredCharacters.forEach(character => {
        const card = createCharacterCard(character);
        grid.appendChild(card);
    });
}

/**
 * Create a character card element
 * @param {Object} character - Character data
 * @returns {HTMLElement} The character card element
 */
export function createCharacterCard(character) {
    const card = document.createElement('div');
    card.classList.add('character-card');
    
    // Determine color based on rating
    const ratingColor = character.type === 'sfw' ? 'rgba(0, 0, 255, 0.5)' : 'rgba(255, 0, 0, 0.5)';
    
    // Truncate character name
    const truncatedName = character.name.length > 15 
        ? character.name.substring(0, 15) + '...' 
        : character.name;
    
    card.innerHTML = `
        <div class="card-image-container">
            <img src="${character.characterAvatar}" alt="${character.name}" class="card-image${character.type === 'nsfw' ? ' nsfw' : ''}">
            ${character.type === 'nsfw' ? '<div class="nsfw-icon" onclick="revealNsfwCard()">🔥</div>' : ''}
        </div>
        <div class="card-footer ${character.type}">
            <span style="padding: 5px;">${truncatedName} - ${character.type}</span>
            <div class="button-container">
                ${character.downloadLink ? `
                    <button class="download-btn" data-download-link="${character.downloadLink}">
                        💾
                    </button>
                ` : ''}
                ${character.shareLink ? `
                    <button class="link-btn" data-share-link="${character.shareLink}">
                        🔗
                    </button>
                ` : ''}
            </div>          
        </div>
    `;
    
    // Add event listeners for download and link buttons
    const downloadBtn = card.querySelector('.download-btn');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', () => downloadCharacter(character));
    }
    
    const linkBtn = card.querySelector('.link-btn');
    if (linkBtn) {
        linkBtn.addEventListener('click', () => {
            window.open(linkBtn.dataset.shareLink, '_blank');
        });
    }    
    
    // Add click event to open character details
    card.addEventListener('click', () => {
        const event = new CustomEvent('showCharacter', { 
            detail: { character } 
        });
        document.dispatchEvent(event);
    });
    
    return card;
}

/**
 * Download character files
 * @param {Object} character - Character data
 */
export async function downloadCharacter(character) {
    try {
        if (!character.downloadLink) {
            showToast('No download link available', 'warning');
            return;
        }
        
        const response = await fetch(character.downloadLink);
        const blob = await response.blob();
        
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${character.manifest.name}.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        showToast('Character downloaded successfully');
    } catch (error) {
        console.error('Failed to download character:', error);
        showToast('Failed to download character', 'error');
    }
}

/**
 * Helper function to truncate strings with ellipsis
 * @param {string} str - String to truncate
 * @param {number} length - Maximum length before truncation
 * @returns {string} Truncated string
 */
function truncateString(str, length) {
    if (str.length <= length) return str;
    return str.substring(0, length) + '...';
}

/**
 * Load and parse categories from JSON file
 * @returns {Promise<Object>} Categories data
 */
async function loadCategories() {
    try {
        const response = await fetch(CONFIG.paths.categories);
        const categories = await response.json();
        return categories;
    } catch (error) {
        console.error('Failed to load categories:', error);
        showToast('Error loading filters', 'error');
        return {};
    }
}

/**
 * Update filter panel visibility based on NSFW state
 * @param {boolean} nsfwEnabled - Whether NSFW content is enabled
 * @param {Object} categories - Categories data
 */
function updateFilterPanel(nsfwEnabled, categories) {
    const categoriesContainer = document.getElementById('categoriesContainer');
    
    Object.entries(categories).forEach(([categoryName, categoryData]) => {
        const categoryElement = document.querySelector(`.category[data-category="${categoryName}"]`);
        
        // Skip if category element doesn't exist
        if (!categoryElement) return;
        
        // Handle NSFW-only categories
        if (categoryData.nsfw_only) {
            categoryElement.classList.toggle('nsfw-category', !nsfwEnabled);
            if (nsfwEnabled) {
                categoryElement.classList.add('nsfw-filter');
            }
        }
        
        // Update available tags based on NSFW state
        const tagContainer = categoryElement.querySelector('.category-content');
        const tags = nsfwEnabled 
            ? [...(categoryData.tags.general || []), ...(categoryData.tags.nsfw || [])]
            : categoryData.tags.general || [];
            
        renderTags(tagContainer, tags, categoryName);
    });
}

/**
 * Render tags for a category
 * @param {HTMLElement} container - Container element for tags
 * @param {Array} tags - Array of tag names
 * @param {string} categoryName - Name of the category
 */
function renderTags(container, tags, categoryName) {
    container.innerHTML = tags.map(tag => `
        <label class="tag-checkbox">
            <input type="checkbox" 
                   data-category="${categoryName}" 
                   data-tag="${tag}"
                   ${categoryName === 'Rating' && tag === 'SFW' ? 'checked' : ''}>
            ${tag}
        </label>
    `).join('');
}

/**
 * Handle SFW/NSFW filter changes
 * @param {Event} event - Change event from checkbox
 */
function handleRatingChange(event) {
    const { checked, dataset } = event.target;
    const { tag } = dataset;
    
    if (tag === 'NSFW') {
        const categories = document.querySelectorAll('.category');
        categories.forEach(category => {
            if (category.classList.contains('nsfw-category')) {
                category.style.display = checked ? 'block' : 'none';
            }
        });
        
        // If NSFW is enabled and SFW is unchecked, hide SFW content
        const sfwCheckbox = document.querySelector('input[data-tag="SFW"]');
        if (checked && !sfwCheckbox.checked) {
            filterCharacters({ Rating: ['NSFW'] }, true);
            renderGallery();
        }
    }
    
    if (tag === 'SFW' && !checked) {
        const nsfwCheckbox = document.querySelector('input[data-tag="NSFW"]');
        if (nsfwCheckbox.checked) {
            filterCharacters({ Rating: ['NSFW'] }, true);
            renderGallery();
        }
    }
}

// Export necessary functions
export {
    initGallery,
    loadCategories,
    updateFilterPanel,
    handleRatingChange
};