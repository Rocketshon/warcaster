import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SUPABASE_URL = 'https://pipkhcgizgrfxnwuiqin.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBpcGtoY2dpemdyZnhud3VpcWluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI4NTM0NzEsImV4cCI6MjA4ODQyOTQ3MX0.4UEHPDQVDTnuRoYQe6omzZbmGLo54mcx3o-efsid8mU';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
