export interface User {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
  full_name?: string;
  avatar_url: string | null;
  is_online: boolean;
  role: string;
  group?: string | null;
  course?: number | null;
  specialty?: string | null;
}
