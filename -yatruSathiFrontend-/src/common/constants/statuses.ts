/** Enumerated status values mirrored from the backend models. */

export const EVENT_STATUS = {
  upcoming: 'upcoming',
  ongoing: 'ongoing',
  completed: 'completed',
  cancelled: 'cancelled',
} as const;
export type EventStatus = (typeof EVENT_STATUS)[keyof typeof EVENT_STATUS];

export const BOOKING_STATUS = {
  pending: 'pending',
  confirmed: 'confirmed',
  cancelled: 'cancelled',
} as const;
export type BookingStatus = (typeof BOOKING_STATUS)[keyof typeof BOOKING_STATUS];

export const KYC_STATUS = {
  pending: 'pending',
  approved: 'approved',
  rejected: 'rejected',
} as const;
export type KycStatus = (typeof KYC_STATUS)[keyof typeof KYC_STATUS];
