import api from '../../api/api';
import { ENDPOINTS } from '../../common/constants/endpoints';
import { toList } from '../../common/utils/formatters';

/** Notification-related API calls. */
export const notificationService = {
  getNotifications: async () =>
    toList(await api.get(ENDPOINTS.notifications.list).then(r => r.data)),

  getUnreadCount: async () => {
    const response = await api.get(ENDPOINTS.notifications.unreadCount);
    return response.data.count;
  },

  markAsRead: async () => {
    const response = await api.post(ENDPOINTS.notifications.markRead);
    return response.data;
  },

  deleteNotification: async (id: number) => {
    const response = await api.delete(ENDPOINTS.notifications.detail(id));
    return response.data;
  },
};
