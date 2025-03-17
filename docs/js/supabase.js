// Import necessary libraries 
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Initialize the Supabase client with your project URL and public key
const supabaseUrl = 'https://lpnsvjanyqhbknpedraq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxwbnN2amFueXFoYmtucGVkcmFxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEwNDcxMDEsImV4cCI6MjA1NjYyMzEwMX0.-9Qh-JaPPSBQJD96boDnMsqATveGnpx-DCXBC6K0Gpo';
export const supabase = createClient(supabaseUrl, supabaseKey);