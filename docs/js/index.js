import { ThemeManager } from './theme.js';
// Landing page specific JavaScript
document.addEventListener('DOMContentLoaded', () => {
    // Vue 3 application initialization for the landing page
    const { createApp } = Vue;

    createApp({
        data() {
            return {
                // Site configuration from global CONFIG
                site: window.CONFIG.site,       // Gerenal configuration
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
    }).mount('#app');
});