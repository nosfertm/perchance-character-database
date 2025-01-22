import CONFIG from '../config.js';
import { showToast } from '../utils.js';

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
export async function initGallery() {
    try {
        // Set up event listeners
        setupGalleryEvents();
        
        // Load initial character data
        await loadCharacters();
        
        // Render the gallery
        renderGallery();
    } catch (error) {
        console.error('Failed to initialize gallery:', error);
        showToast('Failed to load characters', 'error');
    }
}

/**
 * Load character data from repository
 * @returns {Promise<void>}
 */
async function loadCharacters() {
    galleryState.loading = true;
    
    try {
        // Get SFW characters
        const sfwPath = `${CONFIG.paths.charactersBase}/${CONFIG.paths.characterTypes.sfw}`;
        const sfwCharacters = await loadCharactersFromPath(sfwPath, 'sfw');
        
        // Get NSFW characters
        const nsfwPath = `${CONFIG.paths.charactersBase}/${CONFIG.paths.characterTypes.nsfw}`;
        const nsfwCharacters = await loadCharactersFromPath(nsfwPath, 'nsfw');
        
        galleryState.characters = [...sfwCharacters, ...nsfwCharacters];
        
    } catch (error) {
        console.error('Failed to load characters:', error);
        showToast('Error loading characters', 'error');
    } finally {
        galleryState.loading = false;
    }
}

/**
 * Load characters from a specific path
 * @param {string} path - Path to character directory
 * @param {string} type - Type of characters (sfw/nsfw)
 * @returns {Promise<Array>} Array of character data
 */
async function loadCharactersFromPath(path, type) {
    // This would need to be adapted based on your repository structure
    // and how you're accessing the files (e.g., API, direct access, etc.)
    try {
        const response = await fetch(`${path}/index.json`);
        const directories = await response.json();
        
        const characters = await Promise.all(
            directories.map(async (dir) => {
                const manifestResponse = await fetch(`${path}/${dir}/manifest.json`);
                const manifest = await manifestResponse.json();
                return {
                    ...manifest,
                    path: `${path}/${dir}`,
                    type: type
                };
            })
        );
        
        return characters;
    } catch (error) {
        console.error(`Failed to load ${type} characters:`, error);
        return [];
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
function createCharacterCard(character) {
    const card = document.createElement('div');
    card.className = `character-card ${character.type}`;
    
    const name = truncateString(character.name, 20);
    
    card.innerHTML = `
        <div class="card-image-container">
            <img src="${character.path}/preview.jpg" alt="${character.name}" loading="lazy">
            <div class="card-overlay ${character.type}">
                <span class="character-name">${name}</span>
                <div class="card-actions">
                    <button class="card-button download-button" title="Download Character">⭳</button>
                    <button class="card-button link-button" title="Open Character Link">🔗</button>
                </div>
            </div>
        </div>
    `;
    
    // Add event listeners
    card.querySelector('.download-button').addEventListener('click', (e) => {
        e.stopPropagation();
        downloadCharacter(character);
    });
    
    card.querySelector('.link-button').addEventListener('click', (e) => {
        e.stopPropagation();
        window.open(character.link, '_blank');
    });
    
    card.addEventListener('click', () => {
        // Dispatch event for carousel/modal
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
async function downloadCharacter(character) {
    try {
        const response = await fetch(`${character.path}/character.zip`);
        const blob = await response.blob();
        
        // Create download link
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${character.name}.zip`;
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