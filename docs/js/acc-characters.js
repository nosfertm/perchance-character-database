// ACC Characters Vue.js Application
document.addEventListener('DOMContentLoaded', () => {
    const { createApp, ref, computed } = Vue;

    createApp({
        data() {
            return {
                // Flags to control NSFW content visibility
                showNsfwTags: true,
                showNsfwImages: false,
                
                // Initialize categories and characters with fallback
                categories: this.getStaticCategories(),
                characters: this.getStaticCharacters(),
                
                // Object to track selected filters for each category
                selectedFilters: {}
            };
        },
        methods: {
            // Robust categories function with default properties
            getStaticCategories() {
                return [
                    {
                        "name": "Rating",
                        "description": "Content maturity level",
                        "tags": {
                            "general": ["SFW", "NSFW"],  
                            "nsfw": ["NSFW"]      
                        },
                        "required": true,
                        "nsfw_only": false
                    },
                    {
                        "name": "Genre",
                        "description": "Story type or style",
                        "tags": {
                            "general": ["Fantasy", "Horror", "Adventure", "RPG"],
                            "nsfw": ["Erotic", "Sexual Roleplay", "Fetish"]
                        },
                        "required": true,
                        "nsfw_only": false
                    },
                    {
                        "name": "Fetishes",
                        "description": "Adult-themed interests",
                        "tags": {
                            "general": [],
                            "nsfw": ["BDSM", "Feet", "Roleplay", "Voyeurism"]
                        },
                        "required": false,
                        "nsfw_only": true
                    }
                ];
            },

            // Static characters function
            getStaticCharacters() {
                return [
                        {
                            "path": "nsfw/Chloe 1",
                            "manifest": {
                                "name": "Chloe",
                                "description": "A friendly slime that can create copies of itself",
                                "author": "username",
                                "characterAvatar": "https://user-uploads.perchance.org/file/f97d49e4231d6b90d83a37f12ca95c52.jpeg",
                                "shareLink": "https://perchance.org/ai-character-chat-slime",
                                "downloadLink": "google.com",
                                "shapeShifter_Pulls": 0,
                                "groupSettings": {
                                "requires": [
                                    {
                                    "name": "Slime Clone",
                                    "link": "https://perchance.org/ai-character-chat-slime-clone",
                                    "reason": "Acts as a clone during split interactions"
                                    }
                                ],
                                "recommends": []
                                },
                                "features": {
                                "customCode": ["custom-codes/reaction-images/code.js"],
                                "assets": ["assets/reactions/", "assets/voices/"]
                                },
                                "categories": {
                                "rating": "nsfw",
                                "genre": ["Sexual Roleplay", "Fetish"]
                                }
                            }          
                        },
                        {
                            "path": "nsfw/Chloe 2",
                            "manifest": {
                                "name": "Ike",
                                "description": "Character C2",
                                "author": "username",
                                "characterAvatar": "https://user-uploads.perchance.org/file/1fc3053449b3899638f4328eec5817a8.jpeg",
                                "shareLink": "https://perchance.org/ai-character-chat-slime",
                                "downloadLink": "youtube.com",
                                "shapeShifter_Pulls": 0,
                                "groupSettings": {
                                "requires": [
                                    {
                                    "name": "Slime Clone",
                                    "link": "https://perchance.org/ai-character-chat-slime-clone",
                                    "reason": "Acts as a clone during split interactions"
                                    }
                                ],
                                "recommends": []
                                },
                                "features": {
                                "customCode": ["custom-codes/reaction-images/code.js"],
                                "assets": ["assets/reactions/", "assets/voices/"]
                                },
                                "categories": {
                                "rating": "nsfw",
                                "genre": ["adventure", "erotic"]
                                }
                            }          
                        },
                        {
                            "path": "sfw/Chloe 3",
                            "manifest": {
                                "name": "Game Master",
                                "description": "Character C3",
                                "author": "username",
                                "characterAvatar": "https://user-uploads.perchance.org/file/23ec877458a9c2393256de1f91bfe57b.jpeg",
                                "shareLink": "https://perchance.org/ai-character-chat-slime",
                                "downloadLink": "https://github.com/nosfertm/perchance-character-database/blob/sketch/ai-character-chat/characters/nsfw/Chloe%201/charater.zip",
                                "shapeShifter_Pulls": 0,
                                "groupSettings": {
                                "requires": [
                                    {
                                    "name": "Slime Clone",
                                    "link": "https://perchance.org/ai-character-chat-slime-clone",
                                    "reason": "Acts as a clone during split interactions"
                                    }
                                ],
                                "recommends": []
                                },
                                "features": {
                                "customCode": ["custom-codes/reaction-images/code.js"],
                                "assets": ["assets/reactions/", "assets/voices/"]
                                },
                                "categories": {
                                "rating": "sfw",
                                "genre": ["RPG"]
                                }
                            }          
                        },
                        {
                            "path": "sfw/Chloe 4",
                            "manifest": {
                                "name": "Ganyu",
                                "description": "Character C4",
                                "author": "username",
                                "characterAvatar": "https://user-uploads.perchance.org/file/ea04c7348bf83c2edad821f4aea1b56c.webp",
                                "shareLink": "https://perchance.org/ai-character-chat-slime",
                                "downloadLink": "https://github.com/nosfertm/perchance-character-database/blob/sketch/ai-character-chat/characters/nsfw/Chloe%201/charater.zip",
                                "shapeShifter_Pulls": 0,
                                "groupSettings": {
                                "requires": [
                                    {
                                    "name": "Slime Clone",
                                    "link": "https://perchance.org/ai-character-chat-slime-clone",
                                    "reason": "Acts as a clone during split interactions"
                                    }
                                ],
                                "recommends": []
                                },
                                "features": {
                                "customCode": ["custom-codes/reaction-images/code.js"],
                                "assets": ["assets/reactions/", "assets/voices/"]
                                },
                                "categories": {
                                "rating": "sfw",
                                "genre": ["fantasy", "monster"]
                                }
                            }          
                        }
                ];
            },

            // Safe method to check category visibility
            isCategoryVisible(category) {
                // Ensure category exists and handle NSFW visibility
                if (!category) return false;
                
                // If category is not NSFW-only, always show
                if (!category.nsfw_only) return true;
                
                // For NSFW-only categories, check NSFW tag visibility
                return this.showNsfwTags;
            },

            // Robust filtering method
            filterCharacters() {
                return this.characters.filter(character => {
                    // Safeguard against undefined character structure
                    if (!character.manifest || !character.manifest.categories) return false;

                    // If no filters selected, show all characters
                    if (Object.keys(this.selectedFilters).length === 0) {
                        return true;
                    }

                    // Check if character matches all selected filters
                    return Object.entries(this.selectedFilters).every(([category, selectedTags]) => {
                        // Skip if no tags selected in this category
                        if (!selectedTags || selectedTags.length === 0) return true;

                        // Safely get character's category value
                        const charCategoryValue = character.manifest.categories?.[category.toLowerCase()];
                        return selectedTags.includes(charCategoryValue);
                    });
                });
            }
        },
        computed: {
            // Computed property to handle character filtering with NSFW visibility
            filteredCharacters() {
                // Get filtered characters
                let filtered = this.filterCharacters();

                // Filter out NSFW characters if not allowed
                if (!this.showNsfwTags) {
                    filtered = filtered.filter(char => 
                        char.manifest?.categories?.rating === 'sfw'
                    );
                }

                return filtered;
            },

            // Compute visible categories
            visibleCategories() {
                // Create a new object with only visible categories
                const visible = {};
                Object.entries(this.categories).forEach(([name, category]) => {
                    if (this.isCategoryVisible(category)) {
                        visible[name] = category;
                    }
                });
                return visible;
            }
        },
        mounted() {
            // Optional: Any initialization logic
        }
    }).mount('#app');
});