import { getImagePath } from '../home/components/event-card';

export interface Booking {
  id: number;
  user: {
    id: number;
    username: string;
    email: string;
  };
  profile?: {
    id: number;
    name?: string;
    full_name?: string;
    bio?: string;
    hobbies?: string;
    avatar?: string;
    phone?: string;
    location?: string;
    is_kyc_verified?: boolean;
  };
  status: 'pending' | 'confirmed' | 'cancelled';
  booked_at: string;
  ticket_count: number;
}

export interface Review {
  id: number;
  user: {
    id: number;
    username: string;
  };
  activity: number;
  rating: number;
  comment: string;
  created_at: string;
}

export interface EventDetail {
  id: number;
  title: string;
  description: string;
  category?: string;
  image?: string;
  tags?: string;
  duration?: string;
  difficulty?: '' | 'easy' | 'moderate' | 'challenging' | 'extreme';
  max_altitude?: string;
  best_season?: string;
  highlights?: string[];
  destination?: { id: number; name: string; slug: string } | null;
  activity_type?: { id: number; name: string; slug: string } | null;
  date?: string;
  start_date_time?: string;
  end_date_time?: string;
  location?: string;
  location_name?: string;
  map_link?: string;
  min_participants?: number | null;
  max_participants?: number | null;
  gender_preference?: string;
  age_limit?: number;
  prior_experience_required?: boolean;
  is_free_event?: boolean;
  ticket_price?: number | string | null;
  pay_on_site?: boolean;
  equipment_list?: string;
  organizer_name?: string;
  contact_email?: string;
  phone_number?: string;
  social_media_link?: string;
  total_expenses?: number | string | null;
  advance_amount?: number | string | null;
  images?: { id: number; image: string }[];
  created_by?: {
    id: number;
    username: string;
    email: string;
  };
  participants?: { id: number; username: string; email: string }[];
  bookings?: Booking[];
  status?: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
}

export interface OrganizerProfile {
  avatar?: string;
  [key: string]: unknown;
}

export interface ParticipantProfile {
  id: number;
  name: string;
  avatar: string;
  verified: boolean;
}

export type FeedbackMessage = { type: 'success' | 'error'; text: string } | null;

export function formatEventDate(dateStr?: string): string {
  if (!dateStr) return 'Not scheduled';
  return new Date(dateStr).toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatEventCurrency(value?: number | string | null): string {
  if (value === null || value === undefined || value === '') return 'NPR 0';
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return 'NPR 0';
  return `NPR ${numericValue.toLocaleString()}`;
}

export function resolveProfileAvatar(avatar?: string): string {
  if (!avatar) return '';
  if (avatar.startsWith('http')) return avatar;
  if (avatar.startsWith('/media/')) return getImagePath(avatar);
  return getImagePath(`/media/${avatar}`);
}

export function bookingDisplayName(booking: Booking): string {
  return (
    booking.profile?.full_name ||
    booking.profile?.name ||
    booking.user.username ||
    `Traveler ${booking.user.id}`
  );
}

export function bookingDisplayBio(booking: Booking): string {
  return booking.profile?.bio || 'Passionate traveler exploring new experiences.';
}

export function bookingDisplayLocation(booking: Booking): string {
  return booking.profile?.location || 'Nepal';
}
