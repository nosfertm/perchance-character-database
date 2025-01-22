import CONFIG from '../config.js';
import { showToast } from '../utils.js';

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
        // Load categories from config path
        const response = await fetch(CONFIG.paths.categories);
        filterState.categories = await response.json();
        
        // Initialize the filter panel
        renderFilterPanel();
        
        // Set up event listeners
        setupFilterEvents();
        
        // Initialize filter state
        initializeDefaultFilters();
    } catch (error) {
        console.error('Failed to initialize filters:', error);
        showToast('Failed to load filters', 'error');
    }
}

/**
 * Render the filter panel with all categories
 */
function renderFilterPanel() {
    const container = document.getElementById('categoriesContainer');
    container.innerHTML = ''; // Clear existing content
    
    Object.entries(filterState.categories).forEach(([categoryName, categoryData]) => {
        // Create category section
        const categorySection = createCategorySection(categoryName, categoryData);
        
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
    
    // Add tags based on current NSFW state
    const tagsToShow = filterState.nsfwEnabled ? 
        [...(categoryData.tags.general || []), ...(categoryData.tags.nsfw || [])] :
        (categoryData.tags.general || []);
    
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