import { User } from "./user";

// types/map.ts
export interface MapSchema {
  title: string;
  shortDescription: string;
  body: string;
  displayPicture?: File;
  ownerId: string;
}

export interface MapDatabase {
  id: string;
  title: string;
  description: string;
  body: string;
  image: string;
  locations: number;
  contributors: number;
  upvotes: number;
  username: string;
  userProfilePicture: string | null;
}

export interface Location {
  id: string;
  map_id: string;
  creator_id: string;
  name: string;
  latitude: number;
  longitude: number;
  google_maps_url: string;
  note: string | null;
  created_at: string;
  is_approved: boolean;
}

export interface MapData {
  id: string;
  name: string;
  short_description: string;
  body: string;
  display_picture: string | null;
  owner_id: string;
  created_at: string;
  users: User;
  locations: Location[];
  votes: { id: string }[];
}

export interface MapResponse {
  id: string;
  title: string;
  description: string;
  image: string;
  locations: number;
  contributors: number;
  upvotes: number;
  username: string;
  userProfilePicture: string | null;
}

export interface MapsResult {
  data: MapResponse[];
  total: number;
  page: number;
  limit: number;
  error: string | null;
}

export interface CreateMapResult {
  data: any; // Adjust based on what Supabase returns
  error: string | null;
}

export interface CreateLocationResult {
  data: any;
  error: string | null;
}