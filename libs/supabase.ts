import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';



const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  // En un build de producción, este error es difícil de ver, pero en desarrollo te salvará.
  console.error("Supabase URL or Anon Key is missing. Check environment variables.");
  // Puedes lanzar un error si prefieres que la app se detenga por completo.
  // throw new Error("Supabase URL or Anon Key is missing."); 
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});