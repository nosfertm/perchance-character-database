// ACC Characters Vue.js Application
document.addEventListener('DOMContentLoaded', () => {
    // Destructure Vue 3 core functions
    const { createApp, ref, computed } = Vue;

    createApp({
        data() {
            return {
                // Flags to control NSFW content visibility
                showNsfwTags: false,
                showNsfwImages: false,
                
                // Initialize categories and characters
                categories: this.getStaticCategories(),
                characters: this.getStaticCharacters(),
                
                // Object to track selected filters for each category
                selectedFilters: {}
            };
        },
        methods: {
            // Modify filter method to handle potential undefined scenarios
            filterCharacters() {
                return this.characters.filter(character => {
                    // Safeguard against undefined character structure
                    if (!character.manifest || !character.manifest.categories) return false;
        
                    // Rest of the filtering logic remains the same
                    if (Object.keys(this.selectedFilters).length === 0) {
                        return true;
                    }
        
                    return Object.entries(this.selectedFilters).every(([category, selectedTags]) => {
                        if (!selectedTags || selectedTags.length === 0) return true;
        
                        const charCategoryValue = character.manifest.categories[category.toLowerCase()];
                        return selectedTags.includes(charCategoryValue);
                    });
                });
            }
        },
        computed: {
            filteredCharacters() {
                let filtered = this.filterCharacters();
        
                // Additional safeguard for NSFW filtering
                if (!this.showNsfwTags) {
                    filtered = filtered.filter(char => 
                        char.manifest?.categories?.rating === 'sfw'
                    );
                }
        
                return filtered;
            }
        },
        mounted() {
            // Optional: Any initialization logic when component is mounted
        }
    }).mount('#app');
});