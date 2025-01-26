// Theme management utility
export const ThemeManager = {
    // Toggle between light and dark themes
    toggleTheme() {
        document.body.classList.toggle('dark-theme');
        localStorage.setItem('theme', this.isDarkMode() ? 'dark' : 'light');
    },

    // Check if dark mode is currently active
    isDarkMode() {
        return document.body.classList.contains('dark-theme');
    },

    // Initialize theme on page load
    initTheme() {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-theme');
        }
    }
};

// Initialize theme when script loads
document.addEventListener('DOMContentLoaded', () => {
    ThemeManager.initTheme();
});