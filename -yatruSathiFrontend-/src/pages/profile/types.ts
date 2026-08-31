export interface UserProfile {
  id?: number;
  name: string;
  email: string;
  bio: string;
  hobbies: string;
  avatar?: string;
  role?: string;
  full_name: string;
  father_spouse_name?: string;
  gender?: string;
  marital_status?: string;
  date_of_birth?: string;
  nationality?: string;
  residential_status?: string;
  document_type?: string;
  citizenship_number: string;
  document_image?: string;
  kyc_photo?: string;
  signature?: string;
  is_kyc_verified: boolean;
  organizer_summary?: ProfileSummary;
  participant_summary?: ProfileSummary;
}

export interface ProfileEvent {
  id: number;
  title: string;
  description: string;
  image?: string;
  location?: string;
  category?: string;
  status?: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  created_by: {
    id: number;
    username: string;
    email: string;
  };
}

export interface Review {
  id: number;
  user: {
    id: number;
    username: string;
    email: string;
  };
  activity: number;
  rating: number;
  comment: string;
  created_at: string;
}

export interface ProfileSummary {
  past_events_count: number;
  past_events: ProfileEvent[];
  reviews_count: number;
  average_rating: number;
  reviews: Review[];
}

export interface ProfileChatMessage {
  id: number;
  sender: {
    id: number;
    username: string;
    email: string;
  };
  message: string;
  timestamp: string;
}

export interface KycFormState {
  full_name: string;
  father_spouse_name: string;
  gender: string;
  marital_status: string;
  date_of_birth: string;
  nationality: string;
  residential_status: string;
  document_type: string;
  citizenship_number: string;
}

export const EMPTY_PROFILE: UserProfile = {
  name: '',
  email: '',
  bio: '',
  hobbies: '',
  full_name: '',
  father_spouse_name: '',
  gender: '',
  marital_status: '',
  date_of_birth: '',
  nationality: '',
  residential_status: '',
  citizenship_number: '',
  is_kyc_verified: false,
};

export const EMPTY_KYC_FORM: KycFormState = {
  full_name: '',
  father_spouse_name: '',
  gender: '',
  marital_status: '',
  date_of_birth: '',
  nationality: '',
  residential_status: '',
  document_type: '',
  citizenship_number: '',
};

export function getAverageRating(reviews?: Review[]): number {
  if (!reviews || reviews.length === 0) return 0;
  return reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
}
