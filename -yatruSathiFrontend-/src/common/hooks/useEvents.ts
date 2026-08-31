import { useCallback } from 'react';
import { eventService } from '../../services/api/events';
import { toList } from '../utils/formatters';
import { useApi } from './useApi';

export interface EventListItem {
  id: number;
  title: string;
  description: string;
  image?: string;
  location?: string;
  category?: string;
  date?: string;
  status?: string;
  created_by?: { id: number; username: string; email: string };
  [key: string]: unknown;
}

/** Fetches the event list and exposes {events, loading, error, refetch}. */
export function useEvents() {
  const fetcher = useCallback(
    async () => toList<EventListItem>(await eventService.getEvents()),
    []
  );
  const { data, loading, error, run } = useApi<EventListItem[]>(fetcher, []);

  return {
    events: data ?? [],
    loading,
    error,
    refetch: run,
  };
}
