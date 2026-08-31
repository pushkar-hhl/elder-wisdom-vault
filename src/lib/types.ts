export type Family = {
  id: string;
  name: string;
  created_at: string;
};

export type UserProfile = {
  id: string;
  family_id: string | null;
  full_name: string;
  created_at: string;
};

export type Story = {
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

export type AuthMode = 'login' | 'signup';
