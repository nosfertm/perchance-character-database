// Import the pinia store
import { piniaUser, piniaTheme, piniaSiteConfig } from './store.js';

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