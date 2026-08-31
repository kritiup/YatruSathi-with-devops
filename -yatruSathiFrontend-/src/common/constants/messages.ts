/** User-facing copy used in more than one place. */
export const MESSAGES = {
  genericError: 'Something went wrong. Please try again.',
  networkError: 'Unable to reach the server. Check your connection and try again.',
  sessionExpired: 'Your session has expired. Please sign in again.',
  bookingFailed: 'Failed to book. You may have already booked this event.',
  reviewFailed: 'Failed to submit review. You may have already reviewed this event.',
  otpFailed: 'Invalid or expired code. Please try again.',
} as const;
