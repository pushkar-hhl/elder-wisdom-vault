import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  detectSessionInUrl: true,
  flowType: 'implicit',
  },
});

export type Database = {
  public: {
    Tables: {
      families: {
        Row: {
          id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          created_at?: string;
        };
        Update: {
          name?: string;
        };
      };
      users: {
        Row: {
          id: string;
          family_id: string | null;
          full_name: string;
          created_at: string;
        };
        Insert: {
          id: string;
          family_id?: string | null;
          full_name: string;
          created_at?: string;
        };
        Update: {
          family_id?: string | null;
          full_name?: string;
        };
      };
      stories: {
        Row: {
          id: string;
          family_id: string;
          uploaded_by: string | null;
          elder_name: string;
          region: string | null;
          language_spoken: string | null;
          title: string;
          audio_url: string | null;
          video_url: string | null;
          transcript: string | null;
          translation: string | null;
          summary: string | null;
          tags: string[] | null;
          festival_date: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          family_id: string;
          uploaded_by?: string | null;
          elder_name: string;
          region?: string | null;
          language_spoken?: string | null;
          title: string;
          audio_url?: string | null;
          video_url?: string | null;
          transcript?: string | null;
          translation?: string | null;
          summary?: string | null;
          tags?: string[] | null;
          festival_date?: string | null;
          created_at?: string;
        };
        Update: {
          elder_name?: string;
          region?: string | null;
          language_spoken?: string | null;
          title?: string;
          audio_url?: string | null;
          video_url?: string | null;
          transcript?: string | null;
          translation?: string | null;
          summary?: string | null;
          tags?: string[] | null;
          festival_date?: string | null;
        };
      };
    };
  };
};
