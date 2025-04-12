// Import the pinia store
import { piniaUser, piniaTheme, piniaSiteConfig, piniaIndexedDb } from './store.js';

// Import supabase helper
import { DatabaseService } from './supabase.js';

// Import toast utility
import { ToastUtils, Misc } from './utils.js';

// Landing page specific JavaScript
import LoginModalComponent from '../components/modal-login.js';

document.addEventListener('DOMContentLoaded', async () => {

    // Vue 3 application initialization for the landing page
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

            // Call the function to fetch char data and load the page
            await this.getUUIDFromURL();

            // Call the function to fetch more of the authors chars
            await this.getCharacters();

        },
        data() {
            return {
                loadingPage: true,
                characterID: null,
                characterData: null,
                otherCharacters: null,
                charConfig: null,
                loadingConfig: false,
                activeTab: 'features',
                isModalOpen: false,
                show_nsfw: piniaUser().showNsfw || false,
            };
        },
        methods: {
            /**
             * Retrieves a character's details based on the UUID in the URL
             * First checks if data exists in IndexedDB and is valid before fetching from database
             */
            async getUUIDFromURL() {
                // Debugging configuration
                const debugKey = piniaSiteConfig().debug?.aacCharacters?.detail ?? false;
                const debugPrefix = '[GetUUID] ';

                // Extract UUID from URL parameters
                const params = new URLSearchParams(window.location.search);
                const uuid = params.get('uuid');

                // Validate if UUID exists in URL
                if (!uuid) {
                    alert('Character not found!');
                    window.location.href = 'acc-characters.html';
                    return;
                }

                // Check if UUID is different from the current one
                if (this.characterID && this.characterID !== uuid) {
                    Misc.debug(debugKey, debugPrefix + 'UUID changed, updating it to: ' + uuid);
                } else if (this.characterID === uuid) {
                    Misc.debug(debugKey, debugPrefix + "Using the same UUID");
                    return;
                } else {
                    // First time getting UUID
                    Misc.debug(debugKey, debugPrefix + "First time getting UUID: " + uuid);
                }

                // Set the character ID
                this.characterID = uuid;
                let fetching, timer = true

                try {

                    // Create a timer to check if time has elapsed
                    setTimeout(() => {
                        // If we're not fetching after 1 second, hide the loading spinner
                        if (!fetching) {
                            this.loadingPage = false;
                            timer = false;
                        }
                    }, 1000);

                    // Check if character exists in dataStore with a valid TTL
                    const dataStore = await piniaIndexedDb().getDataStore();
                    const characterData = await dataStore.get('characters', uuid);

                    // Determine if cache is valid
                    const isCacheValid = characterData &&
                        characterData.ttl &&
                        Date.now() < characterData.ttl;

                    if (isCacheValid) {
                        // Check if character has description
                        if (characterData.data.description) {
                            // Use cached character data from IndexedDB
                            Misc.debug(debugKey, debugPrefix + "Using cached data from IndexedDB for character details");
                            this.characterData = characterData.data;
                        } else {
                            // Use cached character data from IndexedDB
                            Misc.debug(debugKey, debugPrefix + "Fetching and complementing cached data from IndexedDB with description from database for character details");

                            // Call the database service function to get character description
                            const result = await DatabaseService.advancedSelect('characters', { id: uuid }, 'description', 'Fetching description');

                            // Handle error if any
                            if (result.error) {
                                throw new Error(`Failed to fetch character description: ${result.error}`);
                            }

                            // Add the description to the character data
                            this.characterData = characterData.data;
                            this.characterData.description = result.data.description;

                            // Update the character data in IndexedDB
                            await dataStore.put('characters', {
                                id: uuid,
                                page: characterData.page,
                                data: this.characterData,
                                ttl: characterData.ttl,
                                updatedAt: Date.now()
                            });
                        }
                    } else {
                        // Cache not valid or doesn't exist, fetch from database
                        Misc.debug(debugKey, debugPrefix + "Fetching character details from database");

                        // Call the database service function to get character details
                        await this.fetchCharacterDirectly(uuid);
                    };
                } catch (error) {
                    Misc.debug(debugKey, debugPrefix + "Error accessing IndexedDB: " + error.message);
                    console.error("IndexedDB error:", error);

                    // Fallback to direct database call if IndexedDB fails
                    await this.fetchCharacterDirectly(uuid);
                } finally {
                    // Fetch is complete, set fetching to false
                    fetching = false;

                    // Always set loadingPage to false when done
                    if (!timer) {
                        this.loadingPage = false;
                    }
                }
            },

            /**
             * Fallback method to fetch character directly from database if IndexedDB fails
             * @param {string} uuid - The character's UUID
             */
            async fetchCharacterDirectly(uuid) {
                // Debugging configuration
                const debugKey = piniaSiteConfig().debug?.aacCharacters?.detail ?? false;
                const debugPrefix = '[fetchCharacterDirectly] ';

                try {
                    // Get cache configuration from pinia store
                    const cacheConfig = piniaSiteConfig().cache.accCharacters.characters;
                    const cacheDuration = cacheConfig.duration * 60 * 1000 || 3600000;  // Convert minutes to milliseconds, default 1 hour

                    // Check if character exists in dataStore with a valid TTL
                    const dataStore = await piniaIndexedDb().getDataStore();

                    Misc.debug(debugKey, debugPrefix + "Using direct fetch");

                    // Setup parameters for the database function call
                    const args = {
                        character_uuid: this.characterID,
                        current_user_id: piniaUser().userData.id
                    };

                    // Call the database service function
                    const result = await DatabaseService.callFunction('get_character_by_uuid', args);

                    // Handle error if any
                    if (result.error) {
                        throw new Error(`Failed to fetch character details: ${result.error}`);
                    }

                    // Extract character data from the result
                    this.characterData = result.data[0];

                    // Calculate TTL for cache
                    const ttl = Date.now() + cacheDuration;

                    // Save to IndexedDB with TTL
                    await dataStore.put('characters', {
                        id: uuid,
                        page: 0,
                        data: this.characterData,
                        ttl: ttl,
                        updatedAt: Date.now()
                    });

                    Misc.debug(debugKey, debugPrefix + "Character details cached successfully in IndexedDB");
                } catch (error) {
                    console.error("Error fetching character details:", error.message);
                    ToastUtils.showToast('Failed to fetch character details.', 'Error', 'error');
                }
            },

            /**
             * Retrieves additional characters by the same author
             * First checks if author data exists in IndexedDB before fetching from database
             */
            async getCharacters() {
                // Debugging configuration
                const debugKey = piniaSiteConfig().debug?.aacCharacters?.detail ?? false;
                const debugPrefix = '[getCharacters] ';

                // Get author ID from current character data
                const authorID = this.characterData?.author_id;

                // Exit early if no author ID is available
                if (!authorID) {
                    Misc.debug(debugKey, debugPrefix + "No author ID available, skipping fetch");
                    return;
                }

                try {
                    // Access data store
                    const dataStore = await piniaIndexedDb().getDataStore();

                    // Check if author's characters info exists in dataStore with a valid TTL
                    const authorCharactersInfo = await dataStore.get('authorCharacters', authorID);

                    // Determine if cache is valid
                    const isCacheValid = authorCharactersInfo &&
                        authorCharactersInfo.ttl &&
                        Date.now() < authorCharactersInfo.ttl;

                    if (isCacheValid) {
                        // Use cached author characters information from IndexedDB
                        Misc.debug(debugKey, debugPrefix + "Found valid author characters info in IndexedDB");

                        // Retrieve all character IDs for this author (excluding current character)
                        const characterIDs = authorCharactersInfo.characterIDs.filter(id => id !== this.characterID);

                        // Get all characters from IndexedDB
                        this.otherCharacters = [];
                        for (const charID of characterIDs) {
                            const charData = await dataStore.get('characters', charID);
                            const simpleCharData = await dataStore.get('simpleCharacters', charID);
                            if (charData && charData.data) {
                                this.otherCharacters.push(charData.data);
                            }
                            if (simpleCharData && simpleCharData.data &&
                                // Avoid duplicates
                                !this.otherCharacters.some(character => character.id === simpleCharData.data.id)) {
                                this.otherCharacters.push(simpleCharData.data);
                            }
                        }

                        Misc.debug(debugKey, debugPrefix + `Retrieved ${this.otherCharacters.length} characters from IndexedDB`);
                    } else {
                        // Cache not valid or doesn't exist, fetch from database
                        Misc.debug(debugKey, debugPrefix + "Fetching author's characters from database");

                        // Call the database service function to get author's characters
                        await this.fetchAuthorCharactersDirectly(authorID);
                    }
                } catch (error) {
                    Misc.debug(debugKey, debugPrefix + "Error accessing IndexedDB: " + error.message);
                    console.error("IndexedDB error:", error);

                    // Fallback to direct database call if IndexedDB fails
                    await this.fetchAuthorCharactersDirectly(authorID);
                }
            },

            /**
             * Fallback method to fetch author's characters directly from database if IndexedDB fails
             * @param {string} authorID - The author's ID
             */
            async fetchAuthorCharactersDirectly(authorID) {
                // Debugging configuration
                const debugKey = piniaSiteConfig().debug?.aacCharacters?.detail ?? false;
                const debugPrefix = '[fetchAuthorCharactersDirectly] ';

                try {
                    // Get cache configuration from pinia store
                    const cacheConfig = piniaSiteConfig().cache.accCharacters.authorCharacters;
                    const cacheDuration = piniaIndexedDb().createTTL(cacheConfig.duration);

                    // Access data store
                    const dataStore = await piniaIndexedDb().getDataStore();

                    Misc.debug(debugKey, debugPrefix + "Using fallback direct fetch");

                    // Setup parameters for the database function call
                    const args = {
                        page_number: 1,
                        page_size: 3,  // Small number of characters for recommendation section
                        sort_by: 'trending',
                        current_user_id: piniaUser().userData.id,
                        authorid: authorID
                    };

                    // Call the database service function
                    const result = await DatabaseService.callFunction('get_simple_characters', args);

                    // Handle error if any
                    if (result.error) {
                        throw new Error(`Failed to fetch author's characters: ${result.error}`);
                    }

                    // Extract characters from the result
                    const authorCharacters = result.data;

                    // Filter out the current character
                    this.otherCharacters = authorCharacters.filter(item => item.id !== this.characterID);

                    // Calculate TTL for cache
                    const ttl = Date.now() + cacheDuration;

                    // Extract character IDs to store in authorCharacters
                    const characterIDs = authorCharacters.map(char => char.id);

                    // Save authorCharacters info to IndexedDB with TTL
                    await dataStore.put('authorCharacters', {
                        id: authorID,
                        characterIDs: characterIDs,
                        ttl: ttl,
                        updatedAt: Date.now()
                    });

                    // Save each character to IndexedDB
                    for (const char of authorCharacters) {
                        await dataStore.put('simpleCharacters', {
                            id: char.id,
                            data: char,
                            ttl: ttl,
                            updatedAt: Date.now()
                        });
                    }

                    Misc.debug(debugKey, debugPrefix + "Author's characters cached successfully in IndexedDB");
                } catch (error) {
                    console.error("Error fetching author's characters:", error.message);
                    ToastUtils.showToast('Failed to fetch author\'s characters.', 'Error', 'error');
                }
            },

            /* -------------------------------------------------------------------------- */
            /*                         CHARACTER CARD INTERACTION                         */
            /* -------------------------------------------------------------------------- */

            toggleNsfw() {
                console.log('toggleNsfw')
            },

            openImageModal() {
                if (this.characterData?.blur_nsfw && !this.show_nsfw) {
                    this.toggleNsfw();
                } else {
                    this.isModalOpen = true;
                }
            },

            openChat(link) {
                // Check if the current window is inside an iframe
                const isInIframe = window.self !== window.top;

                if (isInIframe) {
                    try {
                        // Try to access parent window origin - this may fail due to cross-origin restrictions
                        const parentOrigin = window.parent.location.origin;
                        const specificOrigin = "https://perchance.org/tps-ai-character-chat-groupchat"; // Replace with your specific iframe parent URL
                        console.log("Parent origin:", parentOrigin);

                        if (parentOrigin === specificOrigin) {
                            // If inside the specific iframe, send message to parent
                            console.log("Inside specific iframe, sending message to parent");
                            window.parent.postMessage({ link: link }, "*");
                            return; // Exit function early
                        }
                    } catch (e) {
                        // Cannot access parent origin due to cross-origin restrictions
                        // We'll use a more generic approach below
                        console.log("Cannot access parent origin:", e);

                        // Alternative: You can still send the message and let the parent decide
                        // if it wants to handle it based on its own logic
                        window.parent.postMessage({ link: link }, "*");
                        return; // Exit function early
                    }
                }

                // If not in an iframe or not in the specific iframe, open URL in new tab
                console.log("Opening link in new tab");
                window.open(link, '_blank');
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
            },

            /**
             * Toggle a character as favorite for the current user
             * @param {string} id - The character ID to toggle as favorite
             * @returns {Promise<void>}
             */
            async toggleFavorite(id) {
                try {
                    const userId = piniaUser().userData.id;
                    const characterId = id;

                    // Check if user is logged in
                    if (!userId) {
                        ToastUtils.showToast('To favorite a character, you must be logged in.', 'Please sign in!', 'info');
                        return;
                    }

                    // Call the toggle_favorite function
                    const result = await DatabaseService.callFunction('toggle_favorite', {
                        user_id: userId,
                        character_id: characterId
                    });

                    // Handle the response
                    if (result.error || result.data.error) {
                        console.error('Error toggling favorite:', result.error || result.data.error);
                        ToastUtils.showToast('Failed to update favorites.', 'Error', 'error');
                        return;
                    }

                    // Show success message based on the action performed
                    if (result.data.action === 'added') {
                        ToastUtils.showToast(result.data.message, 'Success', 'success');
                    } else if (result.data.action === 'removed') {
                        ToastUtils.showToast(result.data.message, 'Success', 'success');
                    }

                    // Toggle favorite status directly on this.characterData
                    if (this.characterData) {
                        this.characterData.is_favorited = !this.characterData.is_favorited;
                        this.characterData.favorites_count += this.characterData.is_favorited ? 1 : -1;

                        // Update IndexedDB
                        const dataStore = await piniaIndexedDb().getDataStore();
                        let characterData = await dataStore.get('characters', this.characterData.id);

                        if (characterData?.data) {
                            characterData.data.is_favorited = this.characterData.is_favorited;
                            characterData.data.favorites_count = this.characterData.favorites_count;

                            await dataStore.put('characters', {
                                id: characterData.id,
                                page: characterData.page,
                                data: characterData.data,
                                ttl: characterData.ttl,
                                updatedAt: Date.now()
                            });
                        }
                    }
                } catch (error) {
                    console.error('Error in toggleFavorite:', error);
                    ToastUtils.showToast('An unexpected error occurred.', 'Error', 'error');
                }
            },

            /* -------------------------------------------------------------------------- */
            /*                                   DETAILS                                  */
            /* -------------------------------------------------------------------------- */

            /**
            * Fetches character data for the selected tab
            * 
            * @param {string} tab - The tab key to fetch data for
            * @returns {Promise<void>}
            */
            async getCharData(tab = null) {

                // Find the current tab's information
                const tabInfo = this.featureTabs.find(t => t.key === tab);

                // If the tab does not require fetching or is not found, return early
                if (!tabInfo || !tabInfo.fetch) {
                    this.activeTab = tab;
                    return;
                }

                // Ensure `download_path` is defined
                const path = this.characterData?.download_path;
                if (!path) {
                    console.error("Error: download_path is not defined.");
                    return;
                }

                // Construct the full file path
                const dir = path.substring(0, path.lastIndexOf("/"));
                const fileDir = `${dir}/${tabInfo.file}`;

                // Construct jsDelivr CDN URL
                const contentUrl = `https://cdn.jsdelivr.net/gh/${piniaSiteConfig().repo.owner}/${piniaSiteConfig().repo.name}@${piniaSiteConfig().repo.branch}/${fileDir}`;

                // Control fetch status
                let fetching

                try {
                    // Set fetching state to true
                    fetching = true;

                    // Create a timer to check if 200ms has elapsed
                    setTimeout(() => {
                        // If we're still fetching after 200ms, show the loading spinner
                        if (fetching) {
                            this.loadingConfig = true;
                        }
                    }, 200);

                    // Fetch file content from jsDelivr
                    const response = await fetch(contentUrl);

                    if (!response.ok) {
                        throw new Error(`Failed to fetch file: ${response.statusText}`);
                    }

                    // Process response based on output format
                    let data;
                    if (tabInfo.outputFormat === "decodeBase64") {
                        const text = await response.text();
                        data = atob(text); // Decode Base64 content
                    } else {
                        data = await response.text(); // Fetch as plain text
                    }

                    // Update charConfig with fetched data
                    this.charConfig = data;

                } catch (error) {
                    console.error("Error fetching file:", error);
                    // Clear data in case of error
                    this.charConfig = `Error fetching file: ${fileDir}.\n\nPlease, open a issue reporting this on our github repository.`;
                } finally {
                    // Fetch is complete, set fetching to false
                    fetching = false;

                    // Always set loadingConfig to false when done
                    this.loadingConfig = false;

                    // Update the active tab
                    this.activeTab = tab;

                }

            },

            /**
             * Formats message content to preserve line breaks and special formatting
             * 
             * @param {string} content - The raw message content
             * @returns {string} - Formatted HTML content
             */
            formatMessageContent(content) {
                if (!content) return '';

                // Preserva o HTML existente, mas também garante que quebras de linha funcionem
                // e que caracteres especiais sejam exibidos corretamente
                const formattedContent = content
                    // Preserva quebras de linha que não estão dentro de tags HTML
                    .replace(/(?<=>|^)([^<]+)(?=<|$)/g, (match) => {
                        return match.replace(/\n/g, '<br>');
                    });

                return formattedContent;
            },

            /**
             * Determines if the content is valid JSON
             * 
             * @param {any} content - Content to check
             * @returns {boolean} - True if content is valid JSON
             */
            isValidJson(content) {
                if (!content) return false;
                try {
                    if (typeof content === 'object') return true;
                    JSON.parse(content);
                    return true;
                } catch (e) {
                    return false;
                }
            },

            /* -------------------------------------------------------------------------- */
            /*                                 APPEARANCE                                 */
            /* -------------------------------------------------------------------------- */
            getMessageBadgeClass(value) {
                switch (value) {
                    case 'tiny':
                        return 'custom-bar-tiny';
                    case 'small':
                        return 'custom-bar-small';
                    case 'medium':
                        return 'custom-bar-medium';
                    case 'large':
                        return 'custom-bar-large';
                    case 'huge':
                        return 'custom-bar-huge';
                    default:
                        return 'custom-bar-default';
                }
            },
            getMessageProgressBarClass(value) {
                if (Array.isArray(value) && value.length > 0) {
                    value = value[0]; // Get the first element if it's an array
                }
                switch (value) {
                    case 'tiny':
                        return 'custom-bar-tiny';
                    case 'small':
                        return 'custom-bar-small';
                    case 'medium':
                        return 'custom-bar-medium';
                    case 'large':
                        return 'custom-bar-large';
                    case 'huge':
                        return 'custom-bar-huge';
                    default:
                        return 'custom-bar-default';
                }
            },
            getMessageProgressBarWidth(value) {
                if (Array.isArray(value) && value.length > 0) {
                    value = value[0]; // Get the first element if it's an array
                }
                switch (value) {
                    case 'tiny':
                        return '20%';
                    case 'small':
                        return '40%';
                    case 'medium':
                        return '60%';
                    case 'large':
                        return '80%';
                    case 'huge':
                        return '100%';
                    default:
                        return '0%';
                }
            },
            extractFromArray(value) {
                if (Array.isArray(value) && value.length > 0) {
                    return value[0]; // Get the first element if it's an array
                }
                return value; // Return as is if not an array or empty
            },
            // openImageModal(imageUrl) {
            //     // Set the image source in the modal
            //     document.getElementById('modalImage').src = imageUrl;

            //     // Use Bootstrap's modal API to show the modal
            //     const imageModal = new bootstrap.Modal(document.getElementById('imageModal'));
            //     imageModal.show();
            // }
        },
        computed: {
            /**
            * Checks if current content is in JSON format
            * 
            * @returns {boolean} - True if content is JSON
            */
            isJsonContent() {
                return this.isValidJson(this.charConfig);
            },

            /**
             * Formats JSON content for prettier display
             * 
             * @returns {string} - Pretty-printed JSON string
             */
            prettyJson() {
                if (!this.isJsonContent) return '';
                return JSON.stringify(this.charConfig, null, 2);
            },

            /**
             * Parses JSON content for display in chat format
             * 
             * @returns {Array} - Array of message objects
             */
            parsedJsonContent() {
                if (!this.isJsonContent) return [];

                // Se for uma string, tenta converter para objeto
                if (typeof this.charConfig === 'string') {
                    try {
                        return JSON.parse(this.charConfig);
                    } catch (e) {
                        return [];
                    }
                }

                // Se já for um objeto (provavelmente array)
                return this.charConfig;
            },

            /**
             * Gets configuration for the active tab
             * 
             * @returns {Object} - Active tab configuration
             */
            activeTabConfig() {
                return this.featureTabs.find(tab => tab.key === this.activeTab) || {};
            },

            /**
             * Gets available tabs based on the current character data
             * 
             * @returns {Object} - Available tabs configuration
             */
            availableTabs() {
                return this.featureTabs.filter(tab => tab.show) || [];
            },

            /**
             * Filters out unwanted categories from character data
             * 
             * @returns {Object} - Filtered categories 
             */
            filteredCategories() {
                if (!this.characterData?.categories) return {};

                // Filter out categories that start with "features_"
                return Object.fromEntries(
                    Object.entries(this.characterData.categories)
                        .filter(([key]) => !key.startsWith("features_"))
                );
            },

            /**
             * Computes the available feature tabs based on character data.
             * Tabs are dynamically shown/hidden depending on whether the corresponding
             * feature exists in characterData.
             * 
             * @returns {Array} List of feature tabs with visibility and data sources.
             */
            featureTabs() {
                if (!this.characterData?.categories) return [];

                // Normalize keys to lowercase
                const normalizedCategories = Object.keys(this.characterData.categories).reduce((acc, key) => {
                    acc[key.toLowerCase()] = this.characterData.categories[key];
                    return acc;
                }, {});

                return [
                    { key: 'features', label: 'Features', fetch: false, show: true },
                    { key: 'categories', label: 'Categories', fetch: false, show: !!this.characterData?.categories },
                    { key: 'prompt', label: 'Prompt', fetch: true, show: !!normalizedCategories['features_roleinstruction'], file: "src/roleInstruction.txt", outputFormat: "plaintext" },
                    { key: 'reminder', label: 'Reminder', fetch: true, show: !!normalizedCategories['features_remindermessage'], file: "src/reminderMessage.txt", outputFormat: "plaintext" },
                    { key: 'initialMessages', label: 'Initial Messages', fetch: true, show: !!normalizedCategories['features_initialmessages'], file: "src/initialMessages.json", outputFormat: "json" },
                    { key: 'loreBookUrls', label: 'Lorebooks', fetch: true, show: !!normalizedCategories['features_lorebooks'], file: "src/loreBookUrls.json", outputFormat: "json" },
                    { key: 'scene', label: 'Scene', fetch: true, show: !!normalizedCategories['features_scene'], file: "src/scene.json", outputFormat: "json" },
                    {
                        key: 'systemCharacter', label: 'System Character', fetch: true, show: !!(
                            normalizedCategories['features_systemharacter'] &&
                            (
                                normalizedCategories['features_systemharacter'].avatar?.url ||
                                normalizedCategories['features_systemharacter'].roleInstruction ||
                                normalizedCategories['features_systemharacter'].name
                            )
                        ), file: "src/systemCharacter.json", outputFormat: "json"
                    },
                    {
                        key: 'userCharacter', label: 'User Character', fetch: true, show: !!(
                            normalizedCategories['features_usercharacter'] &&
                            (
                                normalizedCategories['features_usercharacter'].avatar?.url ||
                                normalizedCategories['features_usercharacter'].roleInstruction ||
                                normalizedCategories['features_usercharacter'].name
                            )
                        ), file: "src/userCharacter.json", outputFormat: "json"
                    },
                ].filter(tab => tab.show);
            }





        },
        async mounted() {
            const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]')
            const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl))
        },
        beforeUnmount() {
            const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]')
            tooltipTriggerList.forEach(el => {
                const tooltip = bootstrap.Tooltip.getInstance(el)
                if (tooltip) {
                    tooltip.dispose()
                }
            })
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