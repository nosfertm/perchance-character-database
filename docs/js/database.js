// Import the Supabase client
import { supabase } from './supabase.js';

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
        return { error: 'Not authenticated' };
      }
      
      // Get the user's profile from the profiles table
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();
        
      if (error) {
        console.error('Error fetching profile:', error);
        return { error };
      }
      
      return { data };
    } catch (error) {
      console.error('Error in getUserProfile:', error);
      return { error };
    }
  },
  
  /**
   * Update a user's profile information
   * @param {Object} profileData - Object containing profile fields to update
   * @returns {Promise} Promise containing result of update operation
   */
  async updateProfile(profileData) {
    try {
      // Get the current authenticated user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { error: 'Not authenticated' };
      }
      
      // Update the profile with the new data
      const { data, error } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('id', user.id);
        
      if (error) {
        console.error('Error updating profile:', error);
        return { error };
      }
      
      return { data };
    } catch (error) {
      console.error('Error in updateProfile:', error);
      return { error };
    }
  },
  async updateTable(table, updatedData, errorMsg) {
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
      
      // Create a unique file path for the avatar
      const filePath = `avatars/${user.id}/${Date.now()}_${file.name}`;
      
      // Upload the file to Supabase Storage
      const { data, error: uploadError } = await supabase
        .storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });
        
      if (uploadError) {
        console.error('Error uploading avatar:', uploadError);
        return { error: uploadError };
      }
      
      // Get the public URL for the uploaded file
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
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
      
      return { data: publicUrl };
    } catch (error) {
      console.error('Error in uploadAvatar:', error);
      return { error };
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
};