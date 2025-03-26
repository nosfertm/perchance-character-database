import { supabase } from '../js/supabase.js'

export default {    
        // Data properties for the application
        data() {
            return {
                // User authentication state
                user: null,
                email: "",
                password: "",
                rememberMe: false,
    
                // UI states
                showSignUp: false,
                showForgotPassword: false,
                showMagicLinkForm: false,
                showMagicLinkSent: false,
    
                // UI state variables
                loading: false,
                message: "",
                error: "",
    
                // Magic link
                magicLinkEmail: ''
            };
        },
    
        // Methods for interacting with Supabase Auth
        methods: {
            // Method to toggle signup form visibility
            toggleSignUp() {
                // Reset all form states first
                this.showForgotPassword = false;
                this.showMagicLinkForm = false;
                this.showMagicLinkSent = false;
    
                // Toggle signup form visibility
                this.showSignUp = !this.showSignUp;
    
                // Clear any previous messages
                this.message = "";
                this.error = "";
            },
    
            // Method to toggle forgot password form visibility
            toggleForgotPassword() {
                // Reset all form states first
                this.showSignUp = false;
                this.showMagicLinkForm = false;
                this.showMagicLinkSent = false;
    
                // Toggle forgot password form visibility
                this.showForgotPassword = !this.showForgotPassword;
    
                // Clear any previous messages
                this.message = "";
                this.error = "";
            },
    
            // New method to toggle Magic Link form visibility
            toggleMagicLink() {
                // Reset all form states first
                this.showSignUp = false;
                this.showForgotPassword = false;
                this.showMagicLinkSent = false;
    
                // Toggle Magic Link form visibility
                this.showMagicLinkForm = !this.showMagicLinkForm;
    
                // Clear any previous messages
                this.message = "";
                this.error = "";
            },
    
            // Handle regular email/password sign in
            async signIn() {
                if (!this.email || !this.password) {
                    this.error = "Please enter both email and password";
                    return;
                }
    
                this.loading = true;
                this.error = '';
                try {
    
                    // Call Supabase auth API to sign in with email and password
                    const { data, error } = await supabase.auth.signInWithPassword({
                        email: this.email,
                        password: this.password
                    });
    
                    if (error) {
                        this.error = error.message;
                        return;
                    }
    
                    // Store user data after successful login
                    this.user = data.user;
                    this.message = 'Logged in successfully!';
    
                    // Implement redirect or show user content here
                } catch (err) {
                    this.error = 'An unexpected error occurred during login.';
                    console.error(err);
                } finally {
                    this.loading = false;
                }
            },
    
            // Handle user registration
            async signUp() {
                if (!this.email || !this.password) {
                    this.error = "Please enter both email and password";
                    return;
                }
    
                this.loading = true;
                this.error = '';
                try {
    
                    // Call Supabase auth API to create new account
                    const { data, error } = await supabase.auth.signUp({
                        email: this.email,
                        password: this.password
                    });
    
                    if (error) {
                        this.error = error.message;
                        return;
                    }
    
                    // Show confirmation message after successful signup
                    this.message = 'Registration successful! Please check your email for confirmation.';
                    this.showSignUp = false;
                } catch (err) {
                    this.error = 'An unexpected error occurred during registration.';
                    console.error(err);
                } finally {
                    this.loading = false;
                }
            },
    
            // Send magic link for passwordless login
            async sendMagicLink() {
                try {
                    this.loading = true;
                    this.error = '';
    
                    // Email validation
                    if (!this.magicLinkEmail || !this.magicLinkEmail.includes('@')) {
                        this.error = 'Please enter a valid email address';
                        return;
                    }
    
                    // Call Supabase auth API to send magic link
                    const { error } = await supabase.auth.signInWithOtp({
                        email: this.magicLinkEmail,
                        options: {
                            emailRedirectTo: `${window.location.origin}${window.location.pathname}` // Redirect to the same page after auth
                        }
                    });
    
                    if (error) {
                        this.error = error.message;
                        return;
                    }
    
                    // Show confirmation message
                    this.showMagicLinkSent = true;
                    this.message = 'Magic link sent! Check your email to sign in.';
                } catch (err) {
                    this.error = 'An unexpected error occurred when sending the magic link.';
                    console.error(err);
                } finally {
                    this.loading = false;
                }
            },
    
            // Send password reset email
            async resetPassword() {
                if (!this.email) {
                    this.error = "Please enter your email";
                    return;
                }
    
                this.loading = true;
                this.error = '';
                try {
    
                    // Email validation
                    if (!this.email || !this.email.includes('@')) {
                        this.error = 'Please enter a valid email address';
                        return;
                    }
    
                    // Call Supabase auth API to send password reset email
                    const { error } = await supabase.auth.resetPasswordForEmail(this.email, {
                        redirectTo: `${window.location.origin}${window.location.pathname}` // Redirect to the same page after password reset
                    });
    
                    if (error) {
                        this.error = error.message;
                        return;
                    }
    
                    // Show confirmation message
                    this.message = 'Password reset link sent! Check your email to set a new password.';
                    this.showForgotPassword = false;
                } catch (err) {
                    this.error = 'An unexpected error occurred when sending the reset link.';
                    console.error(err);
                } finally {
                    this.loading = false;
                }
            },
    
            // Sign out current user
            async signOut() {
                try {
                    this.loading = true;
    
                    // Call Supabase auth API to sign out
                    const { error } = await supabase.auth.signOut();
    
                    if (error) {
                        this.error = error.message;
                        return;
                    }
    
                    // Reset user data
                    this.user = null;
                    this.message = 'Logged out successfully!';
                } catch (err) {
                    this.error = 'An unexpected error occurred during logout.';
                    console.error(err);
                } finally {
                    this.loading = false;
                }
            },
    
            // Social login handlers
            async signInWithGoogle() {
                try {
                    // Call Supabase auth API to sign in with Google
                    const { error } = await supabase.auth.signInWithOAuth({
                        provider: 'google',
                        options: {
                            redirectTo: `${window.location.origin}${window.location.pathname}` // Redirect to the same page after auth
                        }
                    });
    
                    if (error) {
                        this.error = error.message;
                    }
                } catch (err) {
                    this.error = 'Failed to sign in with Google.';
                    console.error(err);
                }
            },
    
            async signInWithFacebook() {
                try {
                    // Call Supabase auth API to sign in with Facebook
                    const { error } = await supabase.auth.signInWithOAuth({
                        provider: 'facebook',
                        options: {
                            redirectTo: `${window.location.origin}${window.location.pathname}` // Redirect to the same page after auth
                        }
                    });
    
                    if (error) {
                        this.error = error.message;
                    }
                } catch (err) {
                    this.error = 'Failed to sign in with Facebook.';
                    console.error(err);
                }
            },
    
            async signInWithDiscord() {
                try {
                    // Call Supabase auth API to sign in with discord
                    const { error } = await supabase.auth.signInWithOAuth({
                        provider: 'discord',
                        options: {
                            redirectTo: `${window.location.origin}${window.location.pathname}` // Redirect to the same page after auth
                        }
                    });
    
                    if (error) {
                        this.error = error.message;
                    }
                } catch (err) {
                    this.error = 'Failed to sign in with discord.';
                    console.error(err);
                }
            },
    
            async signInWithGitHub() {
                try {
                    // Call Supabase auth API to sign in with github
                    const { error } = await supabase.auth.signInWithOAuth({
                        provider: 'github',
                        options: {
                            redirectTo: `${window.location.origin}${window.location.pathname}` // Redirect to the same page after auth
                        }
                    });
    
                    if (error) {
                        this.error = error.message;
                    }
                } catch (err) {
                    this.error = 'Failed to sign in with github.';
                    console.error(err);
                }
            },
    
            // Check for existing session when app loads
            async checkUser() {
                try {
                    // Get current session from Supabase
                    const { data, error } = await supabase.auth.getSession();
    
                    if (error) {
                        console.error('Error checking auth status:', error);
                        return;
                    }
    
                    // If there's an active session, get the user details
                    if (data.session) {
                        this.user = data.session.user;
                    }
                } catch (err) {
                    console.error('Error checking user:', err);
                }
            }
        },

    // Lifecycle hook - runs when component is mounted
        mounted() {
            // Check if user is already logged in
            this.checkUser();
    
            // Set up auth state change listener
            supabase.auth.onAuthStateChange((event, session) => {
                if (event === 'SIGNED_IN') {
                    // Update user when signed in
                    this.user = session.user;
                    this.message = 'Logged in successfully!';
                } else if (event === 'SIGNED_OUT') {
                    // Clear user when signed out
                    this.user = null;
                    this.message = 'Logged out successfully!';
                }
            });
    
            // Check if is an authentication return
            if (window.location.hash && window.location.hash.includes('access_token')) {
                // Process authentication
                supabase.auth.getSession().then(({ data }) => {
                    if (data?.session) {
                        console.log('Sucessfuly authenticated!');
    
                        // If needed, redirect to the original url
                        const urlParams = new URLSearchParams(window.location.search);
                        const returnPath = urlParams.get('returnPath');
    
                        if (returnPath) {
                            window.location.href = decodeURIComponent(returnPath);
                        } else {
                            // Clear url hash to avoid interference with navigation
                            history.replaceState(
                                null,
                                document.title,
                                window.location.pathname + window.location.search
                            );
                        }
                    }
                });
            }
        }
}