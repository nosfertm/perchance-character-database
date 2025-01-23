import CONFIG from '../config.js';
import { showToast, fetchGithubData, debug } from '../utils.js';
const debugKey = 'acc-characters.filters';

// State management for filters
const filterState = {
    categories: null,
    selectedFilters: {},
    nsfwEnabled: false
};

/**
 * Initialize the filter system
 * @returns {Promise<void>}
 */
export async function initFilters() {
    try {
        // Log 1 - Início da execução da função
        debug(debugKey, "1 - Initializing filter system...");
        
        // Usar fetchGithubData para buscar e processar categorias
        // Passando o branch como 'sketch' e outputFormat como 'json'
        const categories = await fetchGithubData(
            CONFIG.repo.owner, 
            CONFIG.repo.name, 
            CONFIG.paths.categories, 
            CONFIG.repo.branch, // Usando o branch 'sketch'
            "json"    // Queremos os dados em formato JSON
        );
        
        // Log 3 - Dados obtidos da resposta
        debug(debugKey, "4 - Categories data:", categories);

        // Verifica se os dados têm a estrutura correta
        if (!categories || typeof categories !== 'object') {
            throw new Error('Invalid structure for categories data');
        }
        
        // Atualize o estado das categorias no filterState
        filterState.categories = categories;
        
        // Inicializa o painel de filtros
        renderFilterPanel();

        // Log 4 - Inicializando painel de filtros
        debug(debugKey, "5 - Rendering filter panel");

        // Configura os eventos dos filtros
        setupFilterEvents();

        // Log 5 - Configurando eventos
        debug(debugKey, "6 - Setting up filter events");

        // Inicializa o estado do filtro
        initializeDefaultFilters();
        
        // Log 6 - Finalização da inicialização
        debug(debugKey, "7 - Filters initialized successfully");

    } catch (error) {
        console.error('Failed to initialize filters:', error);
        showToast('Failed to load filters', 'error');
    }
}


// /**
//  * Initialize the filter system
//  * @returns {Promise<void>}
//  */
// export async function initFilters() {
//     try {
//         // Log 1 - Início da execução da função
//         console.log("1 - Initializing filter system...");

//         // Load categories from config path
//         const repoURL = `https://api.github.com/repos/${CONFIG.repo.owner}/${CONFIG.repo.name}/contents`;
//         console.log("2 - Fetching categories from URL:", `${repoURL}/${CONFIG.paths.categories}`);

//         const response = await fetch(`${repoURL}/${CONFIG.paths.categories}`);

//         // Log 2 - Resposta da API
//         console.log("3 - GitHub API response:", response);

//         // Parse response
//         filterState.categories = await response.json();

//         // Log 3 - Dados obtidos da resposta
//         console.log("4 - Categories data:", filterState.categories);
        
//         // Check if the data is structured as expected
//         if (!filterState.categories || typeof filterState.categories !== 'object') {
//             throw new Error('Invalid structure for categories data');
//         }
        
//         // Initialize the filter panel
//         renderFilterPanel();

//         // Log 4 - Inicializando painel de filtros
//         console.log("5 - Rendering filter panel");

//         // Set up event listeners
//         setupFilterEvents();

//         // Log 5 - Configurando eventos
//         console.log("6 - Setting up filter events");

//         // Initialize filter state
//         initializeDefaultFilters();
        
//         // Log 6 - Finalização da inicialização
//         console.log("7 - Filters initialized successfully");

//     } catch (error) {
//         console.error('Failed to initialize filters:', error);
//         showToast('Failed to load filters', 'error');
//     }
// }

/**
 * Render the filter panel with all categories
 */
function renderFilterPanel() {
    // Log 7 - Início do processo de renderização do painel
    console.log("8 - Rendering filter panel...");

    const container = document.getElementById('categoriesContainer');
    container.innerHTML = ''; // Clear existing content
    
    Object.entries(filterState.categories).forEach(([categoryName, categoryData], index) => {
        // Log 8 - Verificando cada categoria
        console.log(`9 - Processing category ${index + 1}:`, categoryName, categoryData);

        // Check if the category has tags, nsfw_only, etc.
        if (!categoryData.tags) {
            console.warn(`Warning: No tags found for category ${categoryName}`);
        }

        // Create category section
        const categorySection = createCategorySection(categoryName, categoryData);

        // Log 9 - Categoria criada
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
    // Log 10 - Início de criação da seção de categoria
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

    // Log 11 - Verificando e processando as tags da categoria
    console.log(`12 - Processing tags for category ${categoryName}`, categoryData.tags);

    // Add tags based on current NSFW state
    const tagsToShow = filterState.nsfwEnabled ? 
        [...(categoryData.tags?.general || []), ...(categoryData.tags?.nsfw || [])] :
        (categoryData.tags?.general || []);
    
    // Log 12 - Tags a serem exibidas
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


// /**
//  * Initialize the filter system
//  * @returns {Promise<void>}
//  */
// export async function initFilters() {
//     try {
//         // Load categories from config path
//         const repoURL = `https://api.github.com/repos/${CONFIG.repo.owner}/${CONFIG.repo.name}/contents`;
//         const response = await fetch(`${repoURL}/${CONFIG.paths.categories}`);
//         filterState.categories = await response.json();
//         console.log("filterState.categories",filterState.categories);
        
//         // Initialize the filter panel
//         renderFilterPanel();
        
//         // Set up event listeners
//         setupFilterEvents();
        
//         // Initialize filter state
//         initializeDefaultFilters();
//     } catch (error) {
//         console.error('Failed to initialize filters:', error);
//         showToast('Failed to load filters', 'error');
//     }
// }

// /**
//  * Render the filter panel with all categories
//  */
// function renderFilterPanel() {
//     const container = document.getElementById('categoriesContainer');
//     container.innerHTML = ''; // Clear existing content
    
//     Object.entries(filterState.categories).forEach(([categoryName, categoryData]) => {
//         // Create category section
//         const categorySection = createCategorySection(categoryName, categoryData);
        
//         // Check if this is an NSFW-only category
//         if (categoryData.nsfw_only) {
//             categorySection.classList.add('nsfw-category');
//             categorySection.style.display = filterState.nsfwEnabled ? 'block' : 'none';
//         }
        
//         container.appendChild(categorySection);
//     });
// }

// /**
//  * Create a collapsible category section with checkboxes
//  * @param {string} categoryName - Name of the category
//  * @param {Object} categoryData - Category configuration data
//  * @returns {HTMLElement} The category section element
//  */
// function createCategorySection(categoryName, categoryData) {
//     const section = document.createElement('div');
//     section.className = 'category-section';
    
//     // Create header with toggle
//     const header = document.createElement('div');
//     header.className = 'category-header';
//     header.innerHTML = `
//         <span>${categoryName}</span>
//         <span class="toggle-icon">▼</span>
//     `;
    
//     // Create content container
//     const content = document.createElement('div');
//     content.className = 'category-content';
    
//     // Add tags based on current NSFW state
//     const tagsToShow = filterState.nsfwEnabled ? 
//         [...(categoryData.tags.general || []), ...(categoryData.tags.nsfw || [])] :
//         (categoryData.tags.general || []);
    
//     tagsToShow.forEach(tag => {
//         const tagContainer = createTagCheckbox(categoryName, tag);
//         content.appendChild(tagContainer);
//     });
    
//     // Collapse all categories except Rating by default
//     if (categoryName !== 'Rating') {
//         content.style.display = 'none';
//     }
    
//     section.appendChild(header);
//     section.appendChild(content);
    
//     // Add toggle event
//     header.addEventListener('click', () => {
//         const isCollapsed = content.style.display === 'none';
//         content.style.display = isCollapsed ? 'block' : 'none';
//         header.querySelector('.toggle-icon').textContent = isCollapsed ? '▼' : '▲';
//     });
    
//     return section;
// }

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
 * Handle changes to Rating checkboxes
 * @param {Event} event - Change event
 */
function handleRatingChange(event) {
    const checkbox = event.target;
    const tag = checkbox.dataset.tag;
    
    if (tag === 'NSFW') {
        filterState.nsfwEnabled = checkbox.checked;
        toggleNsfwCategories(checkbox.checked);
        
        // If NSFW is enabled and SFW is unchecked, hide SFW content
        const sfwCheckbox = document.querySelector('input[data-tag="SFW"]');
        if (checkbox.checked && !sfwCheckbox.checked) {
            toggleSfwContent(false);
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

// Export necessary functions and state
export const getFilterState = () => filterState;