// Import the pinia store
import { piniaUser, piniaTheme, piniaSiteConfig } from './store.js';

// Import supabase helper
import { DatabaseService, supabase } from './supabase.js';

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

            //Get the author id and load the details
            await this.getParamsFromUrl()

        },
        data() {
            return {
                author_id: null,
                author_data: null,
                characters: null,
                maxLength: 250, // Set max characters before truncation
                showFullBio: false,
            };
        },
        methods: {
            // Main function that gets URL parameters and calls other functions in parallel
            async getParamsFromUrl() {
                // Get ID from URL parameters
                const params = new URLSearchParams(window.location.search);
                this.author_id = params.get('id'); // Capture URL ID
            
                const authorID = this.author_id;
            
                if (!authorID) return;
            
                // Validate if authorID is a UUID (basic check)
                const isUUID = /^[0-9a-fA-F-]{36}$/.test(authorID);
            
                try {
                    // Always fetch author characters
                    const promises = [this.getAuthorCharacters(authorID)];
            
                    // Fetch author data only if the ID is a valid UUID
                    if (isUUID) {
                        promises.push(this.getAuthorData(authorID));
                    }
            
                    // Execute all requests in parallel
                    const [authorCharacters, authorData] = await Promise.all(promises);
            
                    // Assign character data
                    this.characters = authorCharacters;
            
                    // Assign author data only if the UUID check passed
                    if (isUUID) {
                        this.author_data = authorData;
                    }
                } catch (error) {
                    console.error('Error fetching data:', error);
                }
            },

            // Function to get author data from the database
            async getAuthorData(authorID) {
                // Get the user's profile from the profiles table
                const { data, error } = await supabase
                    .from('user_profiles')
                    .select('*')
                    .eq('id', authorID)
                    .single();

                if (error) {
                    console.error('Error fetching profile:', error);
                    throw error;
                }
                return data;
            },

            // Function to get author's characters
            async getAuthorCharacters(authorID) {
                // Load user characters
                const args = {
                    page_number: 1,
                    page_size: 99, // Adjust as needed for your application
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
                return result.data;
            },

            // Add a method to decode special characters and emojis
            decodeText(text) {
                try {
                    return decodeURIComponent(escape(text));
                } catch {
                    return text;
                }
            },



            handleCharacterClick(character) {
                if (character?.is_nsfw && character?.blur_nsfw) {
                    this.toggleNsfw();
                } else {
                    this.openCharacterPage(character);
                }
            },

            /**
             * Opens the character's page when clicking on the card
             * This function handles the main card click without interfering with other click events
             * @param {Object} character - The character object to open
             */
            openCharacterPage(character) {
                //Construct the URL
                const url = `character-details.html?uuid=${character.id}`;

                // Navigate to the character page
                window.location.href = url;
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
                        ToastUtils.showToast(result.data.message, 'Success', 'success');
                    } else if (result.data.action === 'removed') {
                        ToastUtils.showToast(result.data.message, 'Success', 'success');
                    }

                    // Update local state if needed
                    const character = this.characters.find(item => item.id === characterId);

                    if (character) {
                        character.is_favorited = !character.is_favorited;
                        character.favorites_count += character.is_favorited ? 1 : -1;

                        // Update this.character with the modified item
                        this.character = { ...character };

                    }

                } catch (error) {
                    console.error('Error in toggleFavorite:', error);
                    ToastUtils.showToast('An unexpected error occurred.', 'Error', 'error');
                }
            },
        },
        computed: {
            truncatedBio() {
                return this.author_data?.bio.length > this.maxLength 
                    ? this.author_data?.bio.substring(0, this.maxLength) + "..." 
                    : this.author_data?.bio;
            },

            needsTruncation () {
                return this.author_data?.bio.length > this.maxLength 
            },

            isProfileOwner() {
                console.log('isProfileOwner', this.author_data?.id, piniaUser().userData.id);
                return !!this.author_data?.id && this.author_data?.id === piniaUser().userData.id;
            }
            
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