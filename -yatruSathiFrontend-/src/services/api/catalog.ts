import api from '../../api/api';
import { ENDPOINTS } from '../../common/constants/endpoints';
import { toList } from '../../common/utils/formatters';

export interface Destination {
  id: number;
  name: string;
  slug: string;
  tagline: string;
  region: string;
  cover_image: string | null;
  is_featured: boolean;
  sort_order: number;
  activity_count?: number;
  package_count?: number;
}

export interface DestinationDetail extends Destination {
  description: string;
  images: { id: number; image: string; caption: string }[];
  activities: Record<string, unknown>[];
  packages: PackageSummary[];
}

export interface ActivityType {
  id: number;
  name: string;
  slug: string;
  description: string;
  image: string | null;
  icon: string;
  activity_count?: number;
}

export interface PackageSummary {
  id: number;
  name: string;
  slug: string;
  summary: string;
  cover_image: string | null;
  category: 'trekking' | 'adventure' | 'cultural' | 'wildlife';
  duration_days: number;
  price: string;
  currency: string;
  destination_name: string | null;
  rating: string;
  review_count: number;
  is_featured: boolean;
}

export interface PackageDetail extends PackageSummary {
  description: string;
  inclusions: string[];
  exclusions: string[];
  itinerary: { day: number; title: string; detail: string }[];
  images: { id: number; image: string; caption: string }[];
  destination: { id: number; name: string; slug: string } | null;
}

export interface PackageBooking {
  id: number;
  package: PackageSummary;
  participants: number;
  start_date: string | null;
  total_price: string;
  status: string;
  booked_at: string;
}

type ListParams = Record<string, string | number | boolean | undefined>;

const clean = (params?: ListParams) => {
  if (!params) return undefined;
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '' && v !== null) out[k] = String(v);
  }
  return out;
};

export const destinationService = {
  list: async (params?: ListParams): Promise<Destination[]> =>
    toList(await api.get(ENDPOINTS.destinations.list, { params: clean(params) }).then(r => r.data)),
  get: async (slug: string): Promise<DestinationDetail> =>
    (await api.get(ENDPOINTS.destinations.detail(slug))).data,
};

export const activityTypeService = {
  list: async (): Promise<ActivityType[]> =>
    toList(await api.get(ENDPOINTS.activityTypes.list).then(r => r.data)),
};

export const packageService = {
  list: async (params?: ListParams): Promise<PackageSummary[]> =>
    toList(await api.get(ENDPOINTS.packages.list, { params: clean(params) }).then(r => r.data)),
  get: async (slug: string): Promise<PackageDetail> =>
    (await api.get(ENDPOINTS.packages.detail(slug))).data,
  listBookings: async (): Promise<PackageBooking[]> =>
    toList(await api.get(ENDPOINTS.packages.bookings).then(r => r.data)),
  book: async (payload: {
    package_id: number;
    participants?: number;
    start_date?: string | null;
  }): Promise<PackageBooking> => (await api.post(ENDPOINTS.packages.bookings, payload)).data,
};

export interface DashboardSummary {
  trips: number;
  favorites: number;
  wishlist: number;
  reviews: number;
  package_bookings: number;
  upcoming: DashboardTrip[];
  recent: DashboardTrip[];
}

export interface DashboardTrip {
  id: number;
  kind: string;
  title: string;
  date: string;
  status: string;
}

export const dashboardService = {
  summary: async (): Promise<DashboardSummary> => (await api.get(ENDPOINTS.dashboard.summary)).data,
};
