import api from '../../api/api';
import { ENDPOINTS } from '../../common/constants/endpoints';
import { toList } from '../../common/utils/formatters';

/** Activity-related API calls. List methods always resolve to a plain array. */
export const activityService = {
  getActivities: async () => toList(await api.get(ENDPOINTS.activities.list).then(r => r.data)),

  getActivityById: async (id: number) => {
    const response = await api.get(ENDPOINTS.activities.detail(id));
    return response.data;
  },

  createActivity: async (formData: FormData) => {
    const response = await api.post(ENDPOINTS.activities.list, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  updateActivity: async (id: number, data: Record<string, unknown>) => {
    const response = await api.patch(ENDPOINTS.activities.detail(id), data);
    return response.data;
  },

  deleteActivity: async (id: number) => {
    await api.delete(ENDPOINTS.activities.detail(id));
  },

  getFavorites: async () => toList(await api.get(ENDPOINTS.favorites.list).then(r => r.data)),

  addFavorite: async (activityId: number) => {
    const response = await api.post(ENDPOINTS.favorites.list, {
      activity_id: activityId,
    });
    return response.data;
  },

  removeFavorite: async (activityId: number) => {
    const response = await api.delete(ENDPOINTS.favorites.detail(activityId));
    return response.data;
  },

  getUsers: async () => toList(await api.get(ENDPOINTS.users.list).then(r => r.data)),

  bookActivity: async (activityId: number, ticketCount: number) => {
    const response = await api.post(ENDPOINTS.bookings.list, {
      activity_id: activityId,
      ticket_count: ticketCount,
    });
    return response.data;
  },

  updateBookingStatus: async (bookingId: number, action: 'accept' | 'reject') => {
    const response = await api.patch(ENDPOINTS.bookings.action(bookingId), { action });
    return response.data;
  },

  completeActivity: async (activityId: number) => {
    const response = await api.patch(ENDPOINTS.activities.detail(activityId), {
      status: 'completed',
    });
    return response.data;
  },

  cancelActivity: async (activityId: number) => {
    const response = await api.patch(ENDPOINTS.activities.detail(activityId), {
      status: 'cancelled',
    });
    return response.data;
  },

  submitReview: async (activityId: number, rating: number, comment: string) => {
    const response = await api.post(ENDPOINTS.reviews, {
      activity: activityId,
      rating,
      comment,
    });
    return response.data;
  },
};
