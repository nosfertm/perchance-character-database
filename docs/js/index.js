// Landing page specific JavaScript
document.addEventListener('DOMContentLoaded', () => {
    // Vue 3 application initialization for the landing page
    const { createApp } = Vue;

    createApp({
        data() {
            return {
                pageTitle: 'Perchance DB',
                isDarkMode: false,
                featuredSections: [
                    {
                        title: 'Characters',
                        description: 'Explore a diverse collection of AI-generated characters.',
                        link: 'characters.html'
                    },
                    {
                        title: 'Lore Books',
                        description: 'Dive into rich worldbuilding resources and lore.',
                        link: 'lorebooks.html'
                    },
                    {
                        title: 'Guidessss',
                        description: 'Learn how to create and use Perchance generators.',
                        link: 'guides.html'
                    }
                ]
            };
        },
        methods: {
            // Optional: Add any page-specific methods here
            toggleTheme() {
                this.isDarkMode = !this.isDarkMode;
                ThemeManager.toggleTheme();
            }
        },
        mounted() {
            this.isDarkMode = ThemeManager.isDarkMode();
        }
    }).mount('#app');
});