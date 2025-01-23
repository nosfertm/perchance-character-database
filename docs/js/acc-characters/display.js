import CONFIG from '../config.js';
import { showToast, fetchGithubData } from '../utils.js';
const debugKey = 'acc-characters.display';

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
        
        // Render the gallery
        renderGallery();
    } catch (error) {
        console.error('Failed to initialize gallery:', error);
        showToast('Failed to load characters', 'error');
    }
}


// /**
//  * Fetch data from GitHub repository with optional content processing.
//  * 
//  * @param {string} owner - Repository owner.
//  * @param {string} repo - Repository name.
//  * @param {string} path - File path within the repository.
//  * @param {string} branch - Branch name (default: "main").
//  * @param {string} outputFormat - Desired output format: "json" (default) or "base64".
//  * @returns {Promise<any>} - Decoded file content.
//  */
// async function fetchGithubData(owner, repo, path, branch = "main", outputFormat = "json") {
//     try {
//         debug(debugKey, `Fetching file from GitHub: ${owner}/${repo}/${path} (branch: ${branch})`);
        
//         const octokit = new Octokit();
//         const response = await octokit.request("GET /repos/{owner}/{repo}/contents/{path}", {
//             owner,
//             repo,
//             path,
//             ref: branch,
//             headers: {
//                 "x-github-api-version": "2022-11-28",
//             },
//         });

//         debug(debugKey, "GitHub API response received.");

//         if (!response.data || !response.data.content) {
//             throw new Error("File content is empty or undefined.");
//         }

//         debug(debugKey, `Content encoding: ${response.data.encoding}`);

//         if (outputFormat === "base64") {
//             debug(debugKey, "Returning raw Base64 content.");
//             return response.data.content;  // Return as Base64
//         } else if (outputFormat === "json") {
//             const decodedContent = atob(response.data.content);
//             debug(debugKey, `Decoded content length: ${decodedContent.length} characters`);

//             const jsonData = JSON.parse(decodedContent);
//             debug(debugKey, "JSON content parsed successfully.");
//             return jsonData;
//         } else {
//             throw new Error(`Invalid outputFormat: ${outputFormat}`);
//         }
//     } catch (error) {
//         console.error("Error fetching or processing GitHub data:", error.message);
//         throw error;
//     }
// }

/**
 * Load character data from repository (optimized version).
 * @param {boolean} forceRefresh - If true, forces data fetch regardless of cache expiration.
 * @returns {Promise<void>}
 */
async function loadCharacters(forceRefresh = false) {
    galleryState.loading = true;

    try {
        debug(debugKey, "Loading character data...");

        const cacheConfig = CONFIG.cache.accCharacters;
        const cacheKey = cacheConfig.key;
        const cacheDuration = cacheConfig.duration * 60 * 1000 || 3600; // Convert minutes to milliseconds, default 1 hour.

        const cachedData = localStorage.getItem(cacheKey);
        const lastFetchTime = localStorage.getItem(`${cacheKey}_timestamp`);
        const isCacheValid = lastFetchTime && (Date.now() - lastFetchTime < cacheDuration);

        if (!forceRefresh && cachedData && isCacheValid) {
            galleryState.characters = JSON.parse(cachedData);
            debug(debugKey, "Using cached data for characters:", galleryState.characters);
        } else {
            debug(debugKey, "Fetching new data for characters...\n\nReasons for not using cache:\n1. Force refresh:", forceRefresh, "\n2. Cache validity:", isCacheValid, "\n3. Cached data:", cachedData);

            const indexData = await fetchGithubData(
                CONFIG.repo.owner,
                CONFIG.repo.name,
                CONFIG.paths.accCharacters.index,
                CONFIG.repo.branch,
                "json"
            );

            debug(debugKey, "Fetched index.json data:", indexData);

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

            debug(debugKey, "Fetched and stored characters data successfully:", characters);
        }
    } catch (error) {
        console.error("Failed to load characters:", error.message);
        showToast("Error loading characters", "error");
    } finally {
        galleryState.loading = false;
    }
}

// /**
//  * Load character data from repository (optimized version)
//  * @param {boolean} forceRefresh - If true, forces data fetch regardless of cache expiration
//  * @returns {Promise<void>}
//  */
// async function loadCharacters(forceRefresh = false) {
//     galleryState.loading = true;

//     try {
//         const repoURL = `https://api.github.com/repos/${CONFIG.repo.owner}/${CONFIG.repo.name}/contents`;
//         const indexPath = `${repoURL}/${CONFIG.paths.accCharacters.index}`;
//         debug(debugKey, "Building index path for fetching:",indexPath);
        
//         // Retrieve cache settings from config
//         const cacheConfig = CONFIG.cache.accCharacters;
//         const cacheKey = cacheConfig.key;
//         const cacheDuration = cacheConfig.duration * 60 * 1000 || 3600; // Convert minutes to milliseconds. If not set, default to 1 hour

//         const cachedData = localStorage.getItem(cacheKey);
//         const lastFetchTime = localStorage.getItem(`${cacheKey}_timestamp`);

//         const isCacheValid = lastFetchTime && (Date.now() - lastFetchTime < cacheDuration);

//         if (!forceRefresh && cachedData && isCacheValid) {
//             galleryState.characters = JSON.parse(cachedData);
//             debug(debugKey, "Using cached data for characters:",galleryState.characters);
//         } else {
//             // Fetch new data from GitHub
//             debug(debugKey, "Fetching new data for characters...\n\nReasons for not using cache:\n1. Force refresh:",forceRefresh,"\n2. Cache validity:",isCacheValid,"\n3. Cached data:",cachedData);
//             const response = await fetch(indexPath);

//             if (!response.ok) {
//                 throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
//             }
            
//             const indexData = await response.json();

//             debug(debugKey, "Fetched index.json data:", indexData);

//             if (!Array.isArray(indexData)) {
//                 throw new Error("Unexpected response format: Expected an array");
//             }
            

//             // Transform data to match the original output format
//             const characters = indexData.map((item) => ({
//                 ...item.manifest,
//                 path: `${repoURL}/${item.path}`,
//                 type: item.manifest.categories.rating
//             }));

//             // Store data in state and cache
//             galleryState.characters = characters;
//             localStorage.setItem(cacheKey, JSON.stringify(characters));
//             localStorage.setItem(`${cacheKey}_timestamp`, Date.now().toString());
//             debug(debugKey, "Fetched and stored characters data successfully:",characters);
//         }
//     } catch (error) {
//         console.error('Failed to load characters:', error);
//         showToast('Error loading characters', 'error');
//     } finally {
//         galleryState.loading = false;
//     }
// }




// /**
//  * Load character data from repository
//  * @returns {Promise<void>}
//  */
// async function loadCharacters() {
//     galleryState.loading = true;
    
//     try {
//         // Get SFW characters
//         const repoURL = `https://api.github.com/repos/${CONFIG.repo.owner}/${CONFIG.repo.name}/contents`;
//         const sfwPath = `${repoURL}/${CONFIG.paths.charactersBase}/${CONFIG.paths.characterTypes.sfw}`;
//         const sfwCharacters = await loadCharactersFromPath(sfwPath, 'sfw');
        
//         // Get NSFW characters
//         const nsfwPath = `${repoURL}/${CONFIG.paths.charactersBase}/${CONFIG.paths.characterTypes.nsfw}`;
//         const nsfwCharacters = await loadCharactersFromPath(nsfwPath, 'nsfw');
        
//         galleryState.characters = [...sfwCharacters, ...nsfwCharacters];
        
//     } catch (error) {
//         console.error('Failed to load characters:', error);
//         showToast('Error loading characters', 'error');
//     } finally {
//         galleryState.loading = false;
//     }
// }

// /**
//  * Load characters from a specific path
//  * @param {string} path - Path to character directory
//  * @param {string} type - Type of characters (sfw/nsfw)
//  * @returns {Promise<Array>} Array of character data
//  */
// async function loadCharactersFromPath(path, type) {
//     // This would need to be adapted based on your repository structure
//     // and how you're accessing the files (e.g., API, direct access, etc.)
//     try {
//         const response = await fetch(`${path}/index.json`);
//         const directories = await response.json();
        
//         const characters = await Promise.all(
//             directories.map(async (dir) => {
//                 const manifestResponse = await fetch(`${path}/${dir}/manifest.json`);
//                 const manifest = await manifestResponse.json();
//                 return {
//                     ...manifest,
//                     path: `${path}/${dir}`,
//                     type: type
//                 };
//             })
//         );
        
//         return characters;
//     } catch (error) {
//         console.error(`Failed to load ${type} characters:`, error);
//         return [];
//     }
// }

// /**
//  * Load character data from repository
//  * @returns {Promise<void>}
//  */
// async function loadCharacters() {
//     galleryState.loading = true;
    
//     try {
//         // Get SFW characters
//         const repoURL = `https://api.github.com/repos/${CONFIG.repo.owner}/${CONFIG.repo.name}/contents`;
//         const sfwPath = `${repoURL}/${CONFIG.paths.charactersBase}/${CONFIG.paths.characterTypes.sfw}`;
//         const sfwCharacters = await loadCharactersFromGitHub(sfwPath, 'sfw');
//         debug(debugKey, "sfwCharacters",sfwCharacters);

//         // Get NSFW characters
//         const nsfwPath = `${repoURL}/${CONFIG.paths.charactersBase}/${CONFIG.paths.characterTypes.nsfw}`;
//         const nsfwCharacters = await loadCharactersFromGitHub(nsfwPath, 'nsfw');
//         debug(debugKey, "nsfwCharacters",nsfwCharacters);
        
//         galleryState.characters = [...sfwCharacters, ...nsfwCharacters];
        
//     } catch (error) {
//         console.error('Failed to load characters:', error);
//         showToast('Error loading characters', 'error');
//     } finally {
//         galleryState.loading = false;
//     }
// }

// /**
//  * Load characters from a GitHub repository
//  * @param {string} repoURL - GitHub API repository URL
//  * @param {string} type - Type of characters (sfw/nsfw)
//  * @returns {Promise<Array>} Array of character data
//  */
// async function loadCharactersFromGitHub(repoURL, type) {
//     try {
//         // Fetch character directories from the repository via GitHub API
//         const response = await fetch(repoURL);
//         if (!response.ok) throw new Error(`Failed to fetch data: ${response.status}`);
        
//         const items = await response.json();
        
//         // Filter only directories (ignore files)
//         const directories = items.filter(item => item.type === "dir");

//         const characters = await Promise.all(
//             directories.map(async (dir) => {
//                 const manifestResponse = await fetch(`${dir.url}/manifest.json`);
//                 const manifest = manifestResponse.ok ? await manifestResponse.json() : {};

//                 // Fetch preview image (jpg, jpeg, png)
//                 const imageFormats = ['jpg', 'jpeg', 'png'];
//                 let previewImage = null;

//                 for (const format of imageFormats) {
//                     const imageResponse = await fetch(`${dir.url}/preview.${format}`);
//                     if (imageResponse.ok) {
//                         previewImage = `${dir.download_url}/preview.${format}`;
//                         break;
//                     }
//                 }

//                 return {
//                     ...manifest,
//                     path: dir.path,
//                     preview: previewImage || 'default-preview.png', // Default image if not found
//                     type: type
//                 };
//             })
//         );

//         return characters;
//     } catch (error) {
//         console.error(`Failed to load ${type} characters:`, error);
//         return [];
//     }
// }


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