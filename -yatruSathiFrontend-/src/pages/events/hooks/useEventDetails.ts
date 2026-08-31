import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import api from '../../../api/api';
import { eventService } from '../../../services/api/events';
import { getApiErrorMessage } from '../../../common/utils/errors';
import { toList } from '../../../common/utils/formatters';
import { getStoredToken, getStoredUser } from '../../../common/utils/storage';
import { useRequireAuth } from '../../../common/hooks/useRequireAuth';
import {
  resolveProfileAvatar,
  type EventDetail,
  type FeedbackMessage,
  type OrganizerProfile,
  type ParticipantProfile,
  type Review,
} from '../event-details.types';

/**
 * All state and behaviour for the event details page: loading the event and
 * its organiser profile, reviews, booking, and the organiser's accept/reject
 * actions on booking requests.
 */
export function useEventDetails(id: string | undefined) {
  const navigate = useNavigate();
  const ensureAuth = useRequireAuth();

  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [organizerProfile, setOrganizerProfile] = useState<OrganizerProfile | null>(null);

  const [openBooking, setOpenBooking] = useState(false);
  const [ticketCount, setTicketCount] = useState(1);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingMessage, setBookingMessage] = useState<FeedbackMessage>(null);

  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [rating, setRating] = useState<number | null>(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewMessage, setReviewMessage] = useState<FeedbackMessage>(null);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  const isBookable = event?.status !== 'completed' && event?.status !== 'cancelled';

  const fetchReviews = async () => {
    if (!id) return;
    try {
      setReviewsLoading(true);
      const response = await api.get(`activities/${id}/reviews/`);
      const list = toList<Review>(response.data);
      setReviews(list);
      const user = getStoredUser();
      if (user) {
        setHasReviewed(list.some(review => review.user.id === user.id));
      }
    } catch (err) {
      console.error('Failed to fetch reviews', err);
    } finally {
      setReviewsLoading(false);
    }
  };

  useEffect(() => {
    const fetchEvent = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const data = await eventService.getEventById(parseInt(id, 10));
        setEvent(data);

        if (data.created_by?.id) {
          try {
            const orgProfile = await api.get(`users/${data.created_by.id}/profile/`);
            setOrganizerProfile(orgProfile.data);
          } catch (err) {
            console.error('Failed to fetch organizer profile', err);
          }
        }

        fetchReviews();
      } catch (err) {
        console.error('Failed to fetch event', err);
        setError('Event not found or failed to load.');
      } finally {
        setLoading(false);
      }
    };

    if (getStoredToken()) {
      const user = getStoredUser();
      if (user) setCurrentUserId(user.id);
    }

    fetchEvent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const openBookingDialog = () => {
    if (!isBookable) return;
    // Signed-out visitors are sent to /login and returned to this event page
    // afterwards so they can finish joining. Signed-in users continue straight
    // to the booking dialog.
    if (!ensureAuth()) return;
    setOpenBooking(true);
  };

  const confirmBooking = async () => {
    setBookingLoading(true);
    setBookingMessage(null);
    try {
      await eventService.bookEvent(Number(id), ticketCount);
      setBookingMessage({
        type: 'success',
        text: 'Adventure booked successfully! You can find it in My Events.',
      });
      setTimeout(() => {
        setOpenBooking(false);
        setBookingMessage(null);
      }, 3000);
    } catch (err) {
      setBookingMessage({
        type: 'error',
        text: getApiErrorMessage(err, 'Failed to book. You might have already booked this event.'),
      });
    } finally {
      setBookingLoading(false);
    }
  };

  const handleBookingAction = async (bookingId: number, action: 'accept' | 'reject') => {
    setActionLoading(bookingId);
    setActionError(null);
    try {
      const updatedBooking = await eventService.updateBookingStatus(bookingId, action);
      setEvent(prev =>
        prev && prev.bookings
          ? {
              ...prev,
              bookings: prev.bookings.map(b => (b.id === bookingId ? updatedBooking : b)),
            }
          : prev
      );
    } catch (err) {
      setActionError(getApiErrorMessage(err, 'Failed to update booking status'));
      console.error('Failed to update booking:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const submitReview = async () => {
    if (!rating || !reviewComment.trim()) {
      setReviewMessage({ type: 'error', text: 'Please provide both rating and comment' });
      return;
    }
    setReviewLoading(true);
    setReviewMessage(null);
    try {
      await eventService.submitReview(Number(id), rating, reviewComment);
      setReviewMessage({ type: 'success', text: 'Review submitted successfully!' });
      setHasReviewed(true);
      setReviewComment('');
      setRating(5);
      fetchReviews();
      setTimeout(() => setReviewMessage(null), 3000);
    } catch (err) {
      setReviewMessage({
        type: 'error',
        text: getApiErrorMessage(
          err,
          'Failed to submit review. You may have already reviewed this event.'
        ),
      });
    } finally {
      setReviewLoading(false);
    }
  };

  const goToUserProfile = (userId?: number) => {
    if (!userId) return;
    navigate(`/user-profile/${userId}`);
  };

  const confirmedBookings = useMemo(
    () => event?.bookings?.filter(booking => booking.status === 'confirmed') || [],
    [event]
  );

  const isParticipant = confirmedBookings.some(booking => booking.user.id === currentUserId);

  const participantProfiles: ParticipantProfile[] = useMemo(() => {
    if (confirmedBookings.length) {
      return confirmedBookings.map(booking => ({
        id: booking.user.id,
        name: booking.profile?.full_name || booking.profile?.name || booking.user.username,
        avatar:
          resolveProfileAvatar(booking.profile?.avatar) ||
          `https://i.pravatar.cc/150?u=${booking.user.id}`,
        verified: booking.profile?.is_kyc_verified ?? false,
      }));
    }
    return (
      event?.participants?.map(participant => ({
        id: participant.id,
        name: participant.username,
        avatar: `https://i.pravatar.cc/150?u=${participant.id}`,
        verified: false,
      })) || []
    );
  }, [confirmedBookings, event]);

  return {
    event,
    loading,
    error,
    currentUserId,
    organizerProfile,
    isBookable,

    openBooking,
    setOpenBooking,
    ticketCount,
    setTicketCount,
    bookingLoading,
    bookingMessage,
    openBookingDialog,
    confirmBooking,

    actionLoading,
    actionError,
    setActionError,
    handleBookingAction,

    rating,
    setRating,
    reviewComment,
    setReviewComment,
    reviewLoading,
    reviewMessage,
    setReviewMessage,
    hasReviewed,
    reviews,
    reviewsLoading,
    submitReview,

    confirmedBookings,
    isParticipant,
    participantProfiles,
    goToUserProfile,
  };
}
