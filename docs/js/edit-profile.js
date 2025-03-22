// Import necessary modules
import { ThemeManager } from './theme.js';
import { ToastUtils } from './utils.js';
import LoginModalComponent from '../components/modal-login.js';
import { DatabaseService } from './supabase.js';

document.addEventListener('DOMContentLoaded', async () => {
    // Vue 3 application initialization
    const { createApp } = Vue;

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
        // Data and functions to inject to the page
        provide() {
            return {
                site: this.site,
                themeIcon: this.themeIcon,
                isDarkMode: this.isDarkMode,
                setTheme: this.setTheme,
            };
        },
        data() {
            return {
                // Site configuration from global CONFIG
                site: window.CONFIG.site,       // General configuration
                isDarkMode: localStorage.getItem('siteTheme') === 'dark',
                currentTheme: localStorage.getItem('siteTheme') === 'dark',

                // User and profile data
                user: null,
                profile: {
                    nickname: '',
                    email: '',
                    bio: '',
                    avatar_url: '',
                    public_profile: true,
                    show_nsfw: false,
                    blur_nsfw: true
                },

                // UI states
                loading: false,
                avatarFile: null,
                saveSuccess: false,
                saveError: null,
                deleteModalVisible: false
            };
        },
        methods: {
            // Theme related methods
            toggleTheme() {
                this.isDarkMode = !this.isDarkMode;
                ThemeManager.toggleTheme();
            },
            setTheme(theme) {
                this.currentTheme = theme;
                this.isDarkMode = ThemeManager.toggleTheme(theme);
            },

            // Profile methods
            async loadUserProfile() {
                this.loading = true;
                try {
                    // Get the data
                    const { user, data, error } = await DatabaseService.getUserProfile();
            
                    if (error) {
                        console.error('Error loading user profile:', error);
                        return;
                    }
            
                    if (data) {
                        // Update the profile data
                        this.user = user || '';
                        this.profile.nickname = data.nickname || '';
                        this.profile.email = user.email || '';
                        this.profile.bio = data.bio || '';
                        
                        // Set the avatar URL from the data initially
                        this.profile.avatar_url = data.avatar_url || '';
                        
                        // Try to load the avatar from cache
                        if (data.avatar_url) {
                            const cachedAvatarKey = `avatar_image_${user.id}`;
                            
                            try {
                                // Try to get the cached image data
                                const cachedImageData = localStorage.getItem(cachedAvatarKey);
                                
                                if (cachedImageData) {
                                    // Parse the cached data
                                    const { dataUrl, timestamp, url } = JSON.parse(cachedImageData);
                                    
                                    // Check if cache is still valid (24 hours) and URL matches
                                    const cacheAge = Date.now() - timestamp;
                                    const cacheValid = cacheAge < 24 * 60 * 60 * 1000; // 24 hours
                                    
                                    if (cacheValid && url === data.avatar_url) {
                                        // Use the cached image data directly
                                        this.profile.avatar_url = dataUrl;
                                        console.log('Using cached avatar image');
                                    } else {
                                        // Cache is invalid or URL changed, fetch and cache the new image
                                        this.fetchAndCacheAvatar(data.avatar_url, user.id);
                                    }
                                } else {
                                    // No cache exists, fetch and cache the image
                                    this.fetchAndCacheAvatar(data.avatar_url, user.id);
                                }
                            } catch (cacheError) {
                                console.error('Error accessing avatar cache:', cacheError);
                                // If there's an error with the cache, just use the URL directly
                            }
                        }
                        
                        this.profile.public_profile = data.public_profile;
                        this.profile.show_nsfw = data.show_nsfw;
                        this.profile.blur_nsfw = data.blur_nsfw;
            
                        // Set form values
                        this.setFormValues();
                    }
                } catch (error) {
                    console.error('Error loading profile:', error);
                } finally {
                    this.loading = false;
                }
            },
            
            // Helper method to fetch and cache the avatar image
            async fetchAndCacheAvatar(url, userId) {
                if (!url) return;
                
                try {
                    // Fetch the image
                    const response = await fetch(url);
                    const blob = await response.blob();
                    
                    // Convert the image to a data URL
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        const dataUrl = reader.result;
                        
                        // Cache the image data
                        const cachedAvatarKey = `avatar_image_${userId}`;
                        localStorage.setItem(cachedAvatarKey, JSON.stringify({
                            dataUrl,
                            url,
                            timestamp: Date.now()
                        }));
                        
                        // Update the avatar URL to use the cached data URL
                        this.profile.avatar_url = dataUrl;
                    };
                    reader.readAsDataURL(blob);
                } catch (error) {
                    console.error('Error caching avatar:', error);
                }
            },

            // Set form values from profile data
            setFormValues() {
                // Set input values
                document.querySelector('input[placeholder="Steve"]').value = this.profile.nickname;
                document.querySelector('input[placeholder="steve_@email.com"]').value = this.profile.email;
                document.querySelector('textarea[placeholder="Tell us about yourself..."]').value = this.profile.bio;

                // Set radio buttons
                document.querySelector(`input[name="public_profile"][value="${this.profile.public_profile ? 'true' : 'false'}"]`).checked = true;
                document.querySelector(`input[name="showNSFW"][value="${this.profile.show_nsfw ? 'true' : 'false'}"]`).checked = true;
                document.querySelector(`input[name="blurNSFW"][value="${this.profile.blur_nsfw ? 'true' : 'false'}"]`).checked = true;

                // Set avatar if available
                if (this.profile.avatar_url) {
                    document.querySelector('.avatar').src = this.profile.avatar_url;
                }
            },

            // Get form values and update profile data
            getFormValues() {
                this.profile.nickname = document.querySelector('input[placeholder="Steve"]').value;
                this.profile.email = document.querySelector('input[placeholder="steve_@email.com"]').value;
                this.profile.bio = document.querySelector('textarea[placeholder="Tell us about yourself..."]').value;
                this.profile.public_profile = document.querySelector('input[name="public_profile"]:checked').value === 'true';
                this.profile.show_nsfw = document.querySelector('input[name="showNSFW"]:checked').value === 'true';
                this.profile.blur_nsfw = document.querySelector('input[name="blurNSFW"]:checked').value === 'true';
            },

            // This method is called when the user clicks the button to upload an avatar.
            // Handle avatar file selection and upload
            handleAvatarSelect() {
                // Create a hidden file input element
                const fileInput = document.createElement('input');

                // Set its properties
                fileInput.type = 'file';           // Set input type to file
                fileInput.accept = 'image/png';    // Accept only PNG images
                fileInput.style.display = 'none';  // Hide the input from view

                // Add the file input to the document body
                document.body.appendChild(fileInput);

                // Define what happens when a file is selected
                fileInput.addEventListener('change', (event) => {
                    // Get the selected file
                    if (fileInput.files && fileInput.files[0]) {
                        const file = fileInput.files[0];

                        // Check if the file is an image
                        if (!file.type.startsWith('image/')) {
                            alert('Please select a valid image');
                            return;
                        }

                        // Check if the file size is under 100KB (102400 bytes)
                        if (file.size > 102400) {
                            alert('File size must be less than 100KB');
                            return;
                        }

                        // Store the selected file
                        this.avatarFile = file;

                        // Create a preview of the selected image
                        const reader = new FileReader();

                        // When the file is loaded, set the avatar image source
                        reader.onload = (e) => {
                            document.querySelector('.avatar').src = e.target.result;
                        };

                        // Start reading the file as a data URL
                        reader.readAsDataURL(file);
                    }

                    // Remove the file input from the document once we're done
                    document.body.removeChild(fileInput);
                });

                // Trigger the file selection dialog
                fileInput.click();
            },

            // Upload avatar
            async uploadAvatar() {
                if (!this.avatarFile) {
                    return null;
                }

                this.loading = true;
                try {
                    const { data, error } = await DatabaseService.uploadAvatar(this.avatarFile);

                    if (error) {
                        console.error('Error uploading avatar:', error);
                        return null;
                    }

                    // Return the avatar URL
                    return data;
                } catch (error) {
                    console.error('Error in uploadAvatar:', error);
                    return null;
                } finally {
                    this.loading = false;
                }
            },

            // Save profile changes
            async saveChanges() {
                this.loading = true;
                this.saveSuccess = false;
                this.saveError = null;

                try {
                    // Get latest form values
                    this.getFormValues();

                    // Upload avatar if selected
                    if (this.avatarFile) {
                        const avatarUrl = await this.uploadAvatar();
                        if (avatarUrl) {
                            this.profile.avatar_url = avatarUrl;
                        }
                    }

                    // Check if email changed
                    // const currentEmail = document.querySelector('input[placeholder="steve_@email.com"]').value;
                    // if (this.user && this.user.email !== currentEmail) {
                    //     // Update email in auth system
                    //     const { error: emailError } = await DatabaseService.updateEmail(currentEmail);
                    //     if (emailError) {
                    //         this.saveError = 'Failed to update email. ' + emailError.message;
                    //         return;
                    //     }
                    // }

                    // Update profile
                    const { error } = await DatabaseService.update(
                        'user_profiles',
                        {
                            nickname: this.profile.nickname,
                            bio: this.profile.bio,
                            public_profile: this.profile.public_profile,
                            show_nsfw: this.profile.show_nsfw,
                            blur_nsfw: this.profile.blur_nsfw
                        }
                    );

                    if (error) {
                        this.saveError = 'Failed to update profile. ' + error.message;
                        return;
                    }

                    this.saveSuccess = true;

                    // Show success message
                    ToastUtils.showToast('The profile data was successfully updated!', 'Profile updated!', 'sucess')
                } catch (error) {
                    console.error('Error saving profile:', error);
                    this.saveError = 'An unexpected error occurred.';
                } finally {
                    this.loading = false;
                }
            },

            // Show delete account confirmation
            showDeleteConfirmation() {
                if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
                    this.deleteAccount();
                }
            },

            // Delete account
            async deleteAccount() {
                this.loading = true;

                try {
                    const { error } = await DatabaseService.deleteAccount();

                    if (error) {
                        alert('Failed to delete account: ' + error.message);
                        return;
                    }

                    // Redirect to homepage after successful deletion
                    alert('Your account has been deleted.');
                    window.location.href = '/';
                } catch (error) {
                    console.error('Error deleting account:', error);
                    alert('An unexpected error occurred while deleting your account.');
                } finally {
                    this.loading = false;
                }
            }
        },
        computed: {
            themeIcon() {
                switch (this.currentTheme) {
                    case 'dark':
                        return 'fas fa-moon';
                    case 'auto':
                        return 'fas fa-circle-half-stroke';
                    default:
                        return 'fas fa-sun';
                }
            },
        },
        async mounted() {
            this.isDarkMode = ThemeManager.isDarkMode();

            // Load user profile when the page is mounted
            await this.loadUserProfile();

            //Setup event listeners for UI elements

            // // Avatar upload button
            // const uploadButton = document.querySelector('button.btn-secondary');
            // if (uploadButton) {
            //     // Create a hidden file input
            //     const fileInput = document.createElement('input');
            //     fileInput.type = 'file';
            //     fileInput.accept = 'image/png';
            //     fileInput.style.display = 'none';
            //     document.body.appendChild(fileInput);

            //     // Connect the button to the file input
            //     uploadButton.addEventListener('click', () => {
            //         fileInput.click();
            //     });

            //     // Handle file selection
            //     fileInput.addEventListener('change', this.handleAvatarSelect);
            // }

            // // Save changes button
            // const saveButton = document.querySelector('button.btn-primary');
            // if (saveButton) {
            //     saveButton.addEventListener('click', this.saveChanges);
            // }

            // // Delete account button
            // const deleteButton = document.querySelector('button.btn-danger');
            // if (deleteButton) {
            //     deleteButton.addEventListener('click', this.showDeleteConfirmation);
            // }
        }
    });

    /* --------------------------- Register components -------------------------- */

    // Register the navbar component
    app.component('navbar-component', {
        template: navbarTemplate,
        inject: ['site', 'themeIcon', 'setTheme'],
        props: ['user', 'isDarkMode', 'loading', 'profile'],
        methods: {
            signOut: LoginModalComponent.methods.signOut
        }
        // Spread all properties from the imported component
        // ...LoginModalComponent
    });

    // Register the footer component
    app.component('footer-component', {
        template: footerTemplate
    });

    // Register the login modal component
    app.component('login-modal-component', {
        // Use the HTML template
        template: modalLoginTemplate,
        props: ['isDarkMode', 'profile'],
        emits: ['login-changed'],
        // Spread all properties from the imported component
        ...LoginModalComponent
    });

    /* -------------------------------- Mount APP ------------------------------- */

    // Mount app at #app
    app.mount('#app');
});