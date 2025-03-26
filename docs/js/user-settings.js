// Import necessary modules
import { piniaUser, piniaTheme, piniaSiteConfig } from './store.js';
import { ToastUtils } from './utils.js';
import LoginModalComponent from '../components/modal-login.js';
import { DatabaseService } from './supabase.js';

document.addEventListener('DOMContentLoaded', async () => {
    // Vue 3 application initialization
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
        },
        data() {
            return {
                // UI states
                loading: false,
                avatarFile: null,
                saveSuccess: false,
                saveError: null,
                deleteModalVisible: false
            };
        },
        methods: {

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
                        piniaUser().userData.avatar_url = dataUrl;
                    };
                    reader.readAsDataURL(blob);
                } catch (error) {
                    console.error('Error caching avatar:', error);
                }
            },

            // Get form values and update profile data
            getFormValues() {
                piniaUser().userData.nickname = document.querySelector('input[name="nickname"]').value || piniaUser().userData.nickname;
                piniaUser().userData.email = document.querySelector('input[name="email"]').value || piniaUser().userData.email;
                piniaUser().userData.bio = document.querySelector('textarea[name="bio"]').value || piniaUser().userData.bio;
                piniaUser().userData.public_profile = document.querySelector('input[name="public_profile"]:checked').value === 'true';
                piniaUser().userData.show_nsfw = document.querySelector('input[name="showNSFW"]:checked').value === 'true';
                piniaUser().userData.blur_nsfw = document.querySelector('input[name="blurNSFW"]:checked').value === 'true';
            },

            // This method is called when the user clicks the button to upload an avatar.
            // Handle avatar file selection and upload
            handleAvatarSelect() {
                // Create a hidden file input element
                const fileInput = document.createElement('input');

                // Set its properties
                fileInput.type = 'file';           // Set input type to file
                fileInput.accept = 'image/*';    // Accept only images
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
                            piniaUser().userData.avatar_url = avatarUrl;
                        }
                    }

                    // Check if email changed
                    // const currentEmail = document.querySelector('input[name="email"]').value;
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
                            nickname: piniaUser().userData.nickname,
                            bio: piniaUser().userData.bio,
                            public_profile: piniaUser().userData.public_profile,
                            show_nsfw: piniaUser().userData.show_nsfw,
                            blur_nsfw: piniaUser().userData.blur_nsfw
                        }
                    );

                    if (error) {
                        this.saveError = 'Failed to update profile. ' + error.message;
                        return;
                    }

                    // Updates user_info on the local storage
                    const cachedUserData = JSON.parse(localStorage.getItem('user_basic_info')) || {};
                    const updatedUserData = {
                        ...cachedUserData,
                        ...(piniaUser().userData.nickname ? { nickname: piniaUser().userData.nickname } : {}),
                        ...(piniaUser().userData.bio ? { bio: piniaUser().userData.bio } : {}),
                        ...(piniaUser().userData.public_profile !== undefined ? { public_profile: piniaUser().userData.public_profile } : {}),
                        ...(piniaUser().userData.show_nsfw !== undefined ? { show_nsfw: piniaUser().userData.show_nsfw } : {}),
                        ...(piniaUser().userData.blur_nsfw !== undefined ? { blur_nsfw: piniaUser().userData.blur_nsfw } : {})
                    };

                    localStorage.setItem('user_basic_info', JSON.stringify(updatedUserData));

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