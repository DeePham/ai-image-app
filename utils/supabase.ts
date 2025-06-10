import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import "react-native-url-polyfill/auto";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Database types
export interface Database {
  public: {
    Tables: {
      generated_images: {
        Row: {
          id: string;
          user_id: string;
          image_url: string;
          prompt: string;
          model: string;
          aspect_ratio: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          image_url: string;
          prompt: string;
          model: string;
          aspect_ratio: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          image_url?: string;
          prompt?: string;
          model?: string;
          aspect_ratio?: string;
          created_at?: string;
        };
      };
    };
  };
}
