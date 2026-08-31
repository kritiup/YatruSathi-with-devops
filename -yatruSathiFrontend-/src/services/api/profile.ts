import api from '../../api/api';
import { ENDPOINTS } from '../../common/constants/endpoints';
import { toList } from '../../common/utils/formatters';

/** Profile, bookings, and per-event review/chat reads for the profile page. */
export const profileService = {
  getProfile: async () => {
    const response = await api.get(ENDPOINTS.profile);
    return response.data;
  },

  updateProfile: async (data: Record<string, unknown>) => {
    const response = await api.patch(ENDPOINTS.profile, data);
    return response.data;
  },

  getNotifications: async () =>
    toList(await api.get(ENDPOINTS.notifications.list).then(r => r.data)),

  markNotificationRead: async (id: number) => {
    const response = await api.patch(ENDPOINTS.notifications.detail(id), {
      is_read: true,
    });
    return response.data;
  },

  getBookings: async () => toList(await api.get(ENDPOINTS.bookings.list).then(r => r.data)),

  getMyCreatedEvents: async () =>
    toList(await api.get(ENDPOINTS.activities.list).then(r => r.data)),

  getEventReviews: async (eventId: number) =>
    toList(await api.get(ENDPOINTS.activities.reviews(eventId)).then(r => r.data)),

  getEventChat: async (eventId: number) =>
    toList(await api.get(ENDPOINTS.activities.chat(eventId)).then(r => r.data)),
};
