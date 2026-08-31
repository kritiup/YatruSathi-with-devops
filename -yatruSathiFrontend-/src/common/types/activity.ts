export interface MiniRef {
  id: number;
  name: string;
  slug: string;
}

export interface ActivitySummary {
  id: number;
  title: string;
  description: string;
  date?: string;
  location?: string;
  category?: string | null;
  image?: string | null;
  status?: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  duration?: string;
  difficulty?: '' | 'easy' | 'moderate' | 'challenging' | 'extreme';
  max_altitude?: string;
  best_season?: string;
  highlights?: string[];
  ticket_price?: string | number;
  is_free_event?: boolean;
  age_limit?: number | null;
  min_participants?: number;
  max_participants?: number | null;
  total_expenses?: string | number | null;
  advance_amount?: string | number | null;
  destination?: MiniRef | null;
  activity_type?: MiniRef | null;
  images?: { id: number; image: string }[];
  created_by?: { id: number; username: string; email: string; avatar?: string };
  [key: string]: unknown;
}
