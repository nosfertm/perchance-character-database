// Import the pinia store
import { piniaUser, piniaTheme, piniaSiteConfig } from './store.js';

// Import supabase helper
import { DatabaseService } from './supabase.js';

// Import toast utility
import { ToastUtils } from './utils.js';

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
                characterID: null,
                characterData: null,
                otherCharacters: null,
                charConfig: null,
                loadingConfig: false,
                activeTab: 'features',

                // Definição dinâmica dos tabs disponíveis
                featureTabs: []
            };
        },
        methods: {
            async getUUIDFromURL() {
                const params = new URLSearchParams(window.location.search);
                const uuid = params.get('uuid'); // Capture URL ID

                if (!uuid) {
                    alert('Character not found!');
                    window.location.href = 'acc-characters.html';
                    return;
                }

                this.characterID = uuid; // Capture URL ID

                // Setup parameters for the get_characters function
                const args = {
                    character_uuid: this.characterID,
                    current_user_id: piniaUser().userData.id
                };

                // Call the get_characters function
                const result = await DatabaseService.callFunction('get_character_by_uuid', args);

                if (result.error) {
                    throw new Error(`Failed to fetch characters: ${result.error}`);
                }

                // Extract characters from the result
                this.characterData = result.data[0]

                this.featureTabs = [
                    { key: 'features', label: 'Features', fetch: false, show: true  },
                    { key: 'categories', label: 'Categories', fetch: false, show: !!this.characterData?.categories },
                    { key: 'prompt', label: 'Prompt', fetch: true, show: !!this.characterData?.features_roleinstruction, file: "src/roleInstruction.txt", outputFormat: "plaintext" },
                    { key: 'reminder', label: 'Reminder', fetch: true, show: !!this.characterData?.features_remindermessage, file: "src/reminderMessage.txt", outputFormat: "plaintext" },
                    { key: 'initialMessages', label: 'Initial Messages', fetch: true, show: !!this.characterData?.features_initialmessages, file: "src/initialMessages.json", outputFormat: "json" },
                    { key: 'systemCharacter', label: 'System Character', fetch: true, show: !!this.characterData?.features_systemcharacter, file: "src/systemCharacter.json", outputFormat: "json" },
                    { key: 'userCharacter', label: 'User Character', fetch: true, show: !!this.characterData?.features_usercharacter, file: "src/userCharacter.json", outputFormat: "json" },
                    { key: 'loreBookUrls', label: 'Lorebooks', fetch: true, show: !!this.characterData?.features_lorebooks, file: "src/loreBookUrls.json", outputFormat: "json" },
                    { key: 'scene', label: 'Scene', fetch: true, show: !!this.characterData?.features_scene, file: "src/scene.json", outputFormat: "json" },
                ]
            },
            async getCharacters() {
                const authorID = this.characterData.author_id;

                if (!authorID) { return }

                const args = {
                    page_number: 1,
                    page_size: 3, // Adjust as needed for your application
                    sort_by: 'trending',
                    current_user_id: piniaUser().userData.id,
                    authorid: authorID
                };

                // Call the get_characters function
                const result = await DatabaseService.callFunction('get_characters', args);

                if (result.error) {
                    throw new Error(`Failed to fetch author's characters: ${result.error}`);
                }

                // Extract characters from the result
                this.otherCharacters = result.data.characters.filter(item => item.id !== this.characterID);
            },

            
            toggleNsfw() {
                console.log('toggleNsfw')
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
                        this.characterData.is_favorited = true;
                        this.characterData.global_favorites_count += 1;
                        ToastUtils.showToast(result.data.message, 'Success', 'success');
                    } else if (result.data.action === 'removed') {
                        this.characterData.is_favorited = false;
                        this.characterData.global_favorites_count -= 1;
                        ToastUtils.showToast(result.data.message, 'Success', 'success');
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
                // Update the active tab if provided
                if (tab) {
                    this.activeTab = tab;
                    this.charConfig = null;
                }

                // Find the current tab's information
                const tabInfo = this.featureTabs.find(t => t.key === this.activeTab);

                // If the tab does not require fetching or is not found, return early
                if (!tabInfo || !tabInfo.fetch) {
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

            filteredCategories() {
                return Object.fromEntries(
                    Object.entries(this.characterData.categories)
                        .filter(([key]) => !key.startsWith("features_"))
                );
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