import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Database } from './types';
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = "https://wqouxgcmjroadukklkoa.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indxb3V4Z2NtanJvYWR1a2tsa29hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM5MjU1OTYsImV4cCI6MjA5OTUwMTU5Nn0.CfNoMdtrabZPezIuTbzw1zvZO_3hkqWCoZqhl91JUos";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})
