class PerchanceApp {
    // Initialize the application
    constructor() {
        this.config = window.CONFIG;
        this.initializeApp();
    }

    // Set up initial application configurations
    initializeApp() {
        // Configure global error handling
        window.addEventListener('error', this.handleGlobalError);

        // Initialize cache management
        this.setupCacheManagement();
    }

    // Global error handler
    handleGlobalError(event) {
        console.error('Unhandled error:', event.error);
        // Optionally, display user-friendly error message
    }
    
}

// Initialize the application when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    window.PerchanceApp = new PerchanceApp();
});