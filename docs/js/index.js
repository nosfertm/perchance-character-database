// Landing page specific JavaScript
import { ThemeManager } from './theme.js';

document.addEventListener('DOMContentLoaded', async () => {

    // Vue 3 application initialization for the landing page
    const { createApp } = Vue;

     // Function to load external templates
     async function loadTemplate(url) {
        const response = await fetch(url);
        return await response.text();
    }

    // Load templates before starting VUE
    const navbarTemplate = await loadTemplate('components/navbar.html');
    const footerTemplate = await loadTemplate('components/footer.html');

    const app = createApp({
        // Data and functions to inject to the page
        provide() {
            return {
                site: this.site,
                themeIcon: this.themeIcon,
                isDarkMode: this.isDarkMode,
                setTheme: this.setTheme
            };
        },
        data() {
            return {
                // Site configuration from global CONFIG
                site: window.CONFIG.site,       // General configuration
                isDarkMode: localStorage.getItem('siteTheme') === 'dark',
                currentTheme: localStorage.getItem('siteTheme') === 'dark',
            };
        },
        methods: {
            // Optional: Add any page-specific methods here
            toggleTheme() {
                this.isDarkMode = !this.isDarkMode;
                ThemeManager.toggleTheme();
            },
            setTheme(theme) {
                this.currentTheme = theme;                
                this.isDarkMode = ThemeManager.toggleTheme(theme);
            }
        },
        computed: {
            themeIcon() {
                switch(this.currentTheme) {
                    case 'dark':
                        return 'fas fa-moon';
                    case 'auto':
                        return 'fas fa-circle-half-stroke';
                    default:
                        return 'fas fa-sun';
                }
            },
        },
        mounted() {
            this.isDarkMode = ThemeManager.isDarkMode();
        }
    });

    /* --------------------------- Register components -------------------------- */

    // Register the navbar component
    app.component('navbar-component', {
        template: navbarTemplate,
        inject: ['site', 'themeIcon', 'isDarkMode', 'setTheme']
    });

    // Register the footer component
    app.component('footer-component', {
        template: footerTemplate
    });

    /* -------------------------------- Mount APP ------------------------------- */

    // Mount app at #app
    app.mount('#app');
});