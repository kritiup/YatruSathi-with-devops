import api from '../../api/api';
import { ENDPOINTS } from '../../common/constants/endpoints';
import { toList } from '../../common/utils/formatters';

/** Chat-related API calls. List methods resolve to a plain array. */
export const chatService = {
  getMessages: async (eventId: number) =>
    toList(await api.get(ENDPOINTS.activities.chat(eventId)).then(r => r.data)),

  getGroupMessages: async (groupId: number) =>
    toList(await api.get(ENDPOINTS.groups.chat(groupId)).then(r => r.data)),

  getChatGroups: async () => toList(await api.get(ENDPOINTS.groups.list).then(r => r.data)),

  getGroupDetail: async (groupId: number) => {
    const response = await api.get(ENDPOINTS.groups.detail(groupId));
    return response.data;
  },

  sendMessage: async (eventId: number, message: string, groupId?: number) => {
    const endpoint = groupId ? ENDPOINTS.groups.chat(groupId) : ENDPOINTS.activities.chat(eventId);
    const response = await api.post(endpoint, { message });
    return response.data;
  },

  addMember: async (groupId: number, userId: number) => {
    const response = await api.post(ENDPOINTS.groups.addMember(groupId), {
      user_id: userId,
    });
    return response.data;
  },

  removeMember: async (groupId: number, userId: number) => {
    const response = await api.post(ENDPOINTS.groups.removeMember(groupId), {
      user_id: userId,
    });
    return response.data;
  },

  markGroupAsRead: async (groupId: number) => {
    const response = await api.post(ENDPOINTS.groups.markRead(groupId));
    return response.data;
  },
};
