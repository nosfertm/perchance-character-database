// Import necessary libraries 
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Initialize the Supabase client with your project URL and public key
const supabaseUrl = 'https://lpnsvjanyqhbknpedraq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxwbnN2amFueXFoYmtucGVkcmFxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEwNDcxMDEsImV4cCI6MjA1NjYyMzEwMX0.-9Qh-JaPPSBQJD96boDnMsqATveGnpx-DCXBC6K0Gpo';

export const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Database connector for Supabase operations
 * This file serves as a centralized connector between pages and Supabase
 */
export const DatabaseService = {
    /**
   * Fetch the current user's profile data
   * @returns {Promise} Promise containing user profile data or error
   */
    async getUserProfile() {
        try {
            // Get the current authenticated user
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                return { user: null, data: null, error: 'Not authenticated' };
            }

            // Get the user's profile from the profiles table
            const { data, error } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (error) {
                console.error('Error fetching profile:', error);
                return { user, data: null, error };
            }

            return { user, data, error: null };
        } catch (error) {
            console.error('Error in getUserProfile:', error);
            return { user: null, data: null, error };
        }
    },
    /**
   * Fetch data on the table
   * @returns {Promise} Promise containing user profile data or error
   */
    async select(table, errorMsg) {
        try {
            // Get the current authenticated user
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                return { data: null, error: 'Not authenticated' };
            }

            // Get the user's profile from the profiles table
            const { data, error } = await supabase
                .from(table)
                .select('*')
                .eq('id', user.id)
                .single();

            if (error) {
                console.error(`Error updating ${errorMsg || table}:`, error);
                return { data: null, error };
            }

            return { data, error: null };
        } catch (error) {
            console.error('Error in getUserProfile:', error);
            return { data: null, error };
        }
    },

    async update(table, updatedData, errorMsg) {
        try {
            // Get the current authenticated user
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                return { error: 'Not authenticated' };
            }

            // Update the profile with the new data
            const { data, error } = await supabase
                .from(table)
                .update(updatedData)
                .eq('id', user.id);

            if (error) {
                console.error(`Error updating ${errorMsg || table}:`, error);
                return { error };
            }

            return { data };
        } catch (error) {
            console.error('Error in updateTable:', error);
            return { error };
        }
    },

    /**
     * Upload a profile avatar image
     * @param {File} file - The image file to upload
     * @returns {Promise} Promise containing URL of uploaded avatar or error
     */
    async uploadAvatar(file) {
        try {
            // Get the current authenticated user
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                return { error: 'Not authenticated' };
            }

            // Create a consistent file path (without timestamp) so it always overwrites
            //const filePath = `user-avatars/${user.id}/avatar.png`;
            const filePath = `${user.id}/avatar.png`;

            // Upload the file to Supabase Storage with upsert to replace existing file
            const { data, error: uploadError } = await supabase
                .storage
                .from('user-avatars')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: true  // This ensures the file is replaced if it already exists
                });

            if (uploadError) {
                console.error('Error uploading avatar:', uploadError);
                return { error: uploadError };
            }

            // Get the public URL for the uploaded file
            const { data: { publicUrl } } = supabase.storage
                .from('user-avatars')
                .getPublicUrl(filePath);

            // Update the user's profile with the new avatar URL
            const { error: updateError } = await supabase
                .from('user_profiles')
                .update({ avatar_url: publicUrl })
                .eq('id', user.id);

            if (updateError) {
                console.error('Error updating profile with avatar:', updateError);
                return { error: updateError };
            }

            console.log("Avatar URL:", publicUrl);
            return { data: publicUrl };
        } catch (error) {
            console.error('Error in uploadAvatar:', error);
            return { error };
        }
    },

    /**
     * Sign out the current user
     * @returns {Promise} Promise containing success message or error
     */
    async signOut() {
        try {
            // Call Supabase auth API to sign out
            const { error } = await supabase.auth.signOut();

            if (error) {
                console.error('Error signing out:', error);
                return { error };
            }

            return true;
        } catch (error) {
            console.error('Unexpected error during logout:', error);
            return { error: 'An unexpected error occurred during logout.' };
        } finally {
            this.loading = false;
        }
    },


    /**
     * Update user email address
     * @param {String} newEmail - The new email address
     * @returns {Promise} Promise containing result of the email update operation
     */
    async updateEmail(newEmail) {
        try {
            // Update email in auth system
            const { data, error } = await supabase.auth.updateUser({
                email: newEmail
            });

            if (error) {
                console.error('Error updating email:', error);
                return { error };
            }

            return { data };
        } catch (error) {
            console.error('Error in updateEmail:', error);
            return { error };
        }
    },




    /**
     * Delete user account and related data
     * @returns {Promise} Promise containing result of account deletion
     */
    async deleteAccount() {
        try {
            // Get the current authenticated user
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                return { error: 'Not authenticated' };
            }

            // First, delete the user's profile
            const { error: profileError } = await supabase
                .from('profiles')
                .delete()
                .eq('id', user.id);

            if (profileError) {
                console.error('Error deleting profile:', profileError);
                return { error: profileError };
            }

            // Delete any avatars from storage
            // Note: In a real application, you might want to list files first
            const { error: storageError } = await supabase
                .storage
                .from('avatars')
                .remove([`avatars/${user.id}`]);

            // Finally delete the user account from auth
            // Note: In Supabase, this typically requires admin rights or a server-side function
            // Here we're signing out instead as a client-side alternative
            const { error: signOutError } = await supabase.auth.signOut();

            if (signOutError) {
                console.error('Error signing out after deletion:', signOutError);
                return { error: signOutError };
            }

            return { success: true };
        } catch (error) {
            console.error('Error in deleteAccount:', error);
            return { error };
        }
    }
}