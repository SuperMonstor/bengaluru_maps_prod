// types/user.ts
export interface UserSchema {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  picture_url: string | null;
  created_at: string;
  updated_at: string;
  city?: string | null;
}

export interface User {
  id: string;
  first_name: string | null;
  last_name: string | null;
  picture_url: string | null;
  city?: string | null;
}