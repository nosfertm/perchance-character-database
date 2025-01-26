// acc-characters specific JavaScript
document.addEventListener('DOMContentLoaded', () => {
    // Vue 3 application initialization
    const { createApp, ref } = Vue;

    createApp({
        data() {
            return {
                showNsfwTags: false,
                showNsfwImages: false,
                categories: this.getStaticCategories(),
                characters: this.getStaticCharacters(),
                selectedFilters: {}
            };
        },
        methods: {
             // Static categories function (to be replaced later)
             getStaticCategories() {
                return {
                    "Rating": {
                    "description": "Content maturity level",
                    "tags": {
                        "general": ["SFW","NSFW"],  
                        "nsfw": ["NSFW"]      
                    },
                    "required": true
                    },
                    "Genre": {
                    "description": "Story type or style",
                    "tags": {
                        "general": ["Fantasy", "Horror", "Adventure", "RPG"],
                        "nsfw": ["Erotic", "Sexual Roleplay", "Fetish"]
                    },
                    "required": true
                    },
                    "Fetishes": {
                    "description": "Adult-themed interests",
                    "tags": {
                        "general": [],
                        "nsfw": ["BDSM", "Feet", "Roleplay", "Voyeurism"]
                    },
                    "required": false,
                    "nsfw_only": true
                    }
                };
            },

            // Static characters function (to be replaced later)
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
            }
        },
        mounted() {}
    }).mount('#app');
});
           