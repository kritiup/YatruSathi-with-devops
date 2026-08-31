import { useCallback, useEffect, useState } from 'react';
import { notificationService } from '../../services/api/notification';
import { getApiErrorMessage } from '../utils/errors';
import { toList } from '../utils/formatters';

export interface NotificationItem {
  id: number;
  message: string;
  is_read: boolean;
  created_at: string;
}

/** Notification list plus unread count, with a manual `refetch` and `markAllRead`. */
export function useNotifications(pollMs?: number) {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    try {
      setLoading(true);
      const [list, count] = await Promise.all([
        notificationService.getNotifications(),
        notificationService.getUnreadCount().catch(() => 0),
      ]);
      setItems(toList<NotificationItem>(list));
      setUnreadCount(typeof count === 'number' ? count : 0);
      setError(null);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  const markAllRead = useCallback(async () => {
    await notificationService.markAsRead();
    setItems(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
  }, []);

  useEffect(() => {
    refetch();
    if (!pollMs) return;
    const id = setInterval(refetch, pollMs);
    return () => clearInterval(id);
  }, [refetch, pollMs]);

  return { items, unreadCount, loading, error, refetch, markAllRead };
}
