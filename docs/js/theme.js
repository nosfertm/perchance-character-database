// Theme management utility
const ThemeManager = {
    // Toggle between light and dark themes
        toggleTheme(theme) {
        const currentTheme = localStorage.getItem('siteTheme') || 'light';
        
        let newTheme;
        if (theme) {
            // Explicit theme setting
            newTheme = theme;
            if (currentTheme !== theme) {
                document.body.classList.toggle('dark-theme');
            }
        } else {
            // Toggle logic
            newTheme = currentTheme === 'light' ? 'dark' : 'light';
            document.body.classList.toggle('dark-theme');
        }
        
        localStorage.setItem('siteTheme', newTheme);
        return newTheme === 'dark';
    },

    // Check if dark mode is currently active 
    isDarkMode() {
        return document.body.classList.contains('dark-theme');
    },

    // Initialize theme on page load
    initTheme() {
        const savedTheme = localStorage.getItem('siteTheme');
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-theme');
        }
        return savedTheme === 'dark';
    }
};

// Initialize theme when script loads
document.addEventListener('DOMContentLoaded', () => {
    ThemeManager.initTheme();
});

// Export ThemeManager
export { ThemeManager };