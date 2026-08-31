import React from 'react';
import { useParams, useNavigate } from 'react-router';
import {
  Avatar,
  AvatarGroup,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Divider,
  Grid,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import VerifiedIcon from '@mui/icons-material/Verified';

import { getImagePath } from '../home/components/event-card';
import { useEventDetails } from './hooks/useEventDetails';
import { formatEventDate } from './event-details.types';
import { BookingRequestsList } from './components/event-details/BookingRequestsList';
import { ReviewSection } from './components/event-details/ReviewSection';
import { BookingDialog } from './components/event-details/BookingDialog';
import { EventSidebar } from './components/event-details/EventSidebar';

export const EventDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const details = useEventDetails(id);
  const {
    event,
    loading,
    currentUserId,
    organizerProfile,
    isBookable,
    participantProfiles,
    isParticipant,
    hasReviewed,
    goToUserProfile,
  } = details;

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress size={60} thickness={4} />
      </Box>
    );
  }

  if (!event) {
    return (
      <Container maxWidth="md" sx={{ py: 10, textAlign: 'center' }}>
        <Typography variant="h4" gutterBottom>
          Event not found
        </Typography>
        <Button onClick={() => navigate('/activities')}>Back to Activities</Button>
      </Container>
    );
  }

  const isOrganizer =
    event.created_by?.id === currentUserId && !!event.bookings && event.bookings.length > 0;

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', pb: 10 }}>
      <Box sx={{ position: 'relative', height: { xs: 300, md: 500 }, mb: -10 }}>
        <Box
          component="img"
          src={getImagePath(event.image || '')}
          sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 60%)',
          }}
        />
      </Box>

      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 2 }}>
        <Grid container spacing={4}>
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: { xs: 3, md: 6 }, borderRadius: 4, mb: 4 }}>
              <Stack direction="row" spacing={1} mb={2}>
                <Chip
                  label={event.category || 'Adventure'}
                  color="primary"
                  size="small"
                  sx={{ fontWeight: 700 }}
                />
                {event.is_free_event && (
                  <Chip label="Free" color="success" size="small" sx={{ fontWeight: 700 }} />
                )}
              </Stack>

              <Typography
                variant="h2"
                fontWeight={800}
                gutterBottom
                sx={{ fontSize: { xs: '2rem', md: '3.5rem' } }}
              >
                {event.title}
              </Typography>

              <Stack direction="row" spacing={3} alignItems="center" mb={4}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CalendarMonthIcon color="action" />
                  <Typography variant="subtitle1" fontWeight={600}>
                    {formatEventDate(event.date)}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LocationOnIcon color="action" />
                  <Typography variant="subtitle1" fontWeight={600}>
                    {event.location || 'Nepal'}
                  </Typography>
                </Box>
              </Stack>

              {(() => {
                const specs = [
                  { label: 'Duration', value: event.duration },
                  {
                    label: 'Difficulty',
                    value: event.difficulty
                      ? event.difficulty[0].toUpperCase() + event.difficulty.slice(1)
                      : '',
                  },
                  { label: 'Max Altitude', value: event.max_altitude },
                  {
                    label: 'Group Size',
                    value:
                      event.min_participants || event.max_participants
                        ? `${event.min_participants ?? 1}-${event.max_participants ?? '∞'} people`
                        : '',
                  },
                  { label: 'Best Season', value: event.best_season },
                ].filter(s => s.value);
                return specs.length ? (
                  <Box
                    sx={{
                      display: 'grid',
                      gap: 2,
                      gridTemplateColumns: {
                        xs: 'repeat(2, 1fr)',
                        sm: `repeat(${specs.length}, 1fr)`,
                      },
                      p: 2.5,
                      bgcolor: '#F4F7F5',
                      borderRadius: 3,
                      mt: 3,
                    }}
                  >
                    {specs.map(s => (
                      <Box key={s.label}>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '.04em',
                          }}
                        >
                          {s.label}
                        </Typography>
                        <Typography sx={{ fontWeight: 700 }}>{s.value}</Typography>
                      </Box>
                    ))}
                  </Box>
                ) : null;
              })()}

              <Divider sx={{ my: 4 }} />

              <Typography variant="h5" fontWeight={700} gutterBottom>
                About the Experience
              </Typography>
              <Typography
                variant="body1"
                sx={{ color: 'text.secondary', lineHeight: 1.8, fontSize: '1.1rem', mb: 4 }}
              >
                {event.description}
              </Typography>

              {!!event.highlights?.length && (
                <Box sx={{ mb: 4 }}>
                  <Typography variant="h6" fontWeight={700} gutterBottom>
                    Highlights
                  </Typography>
                  <Stack component="ul" spacing={1} sx={{ pl: 3, m: 0 }}>
                    {event.highlights.map(h => (
                      <Typography component="li" key={h} sx={{ color: 'text.secondary' }}>
                        {h}
                      </Typography>
                    ))}
                  </Stack>
                </Box>
              )}

              {event.images && event.images.length > 0 && (
                <Box sx={{ mb: 6 }}>
                  <Typography variant="h5" fontWeight={700} gutterBottom>
                    Experience Gallery
                  </Typography>
                  <Grid container spacing={2}>
                    {event.images.map(img => (
                      <Grid item xs={6} sm={4} key={img.id}>
                        <Box
                          sx={{
                            borderRadius: 3,
                            overflow: 'hidden',
                            height: 160,
                            cursor: 'pointer',
                            transition: 'transform 0.3s ease',
                            '&:hover': { transform: 'scale(1.02)' },
                          }}
                        >
                          <img
                            src={getImagePath(img.image)}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              )}

              {event.equipment_list && (
                <Box
                  sx={{
                    bgcolor: 'rgba(59, 130, 246, 0.05)',
                    p: 3,
                    borderRadius: 2,
                    mb: 4,
                  }}
                >
                  <Typography variant="h6" fontWeight={700} gutterBottom>
                    What to Bring
                  </Typography>
                  <Typography variant="body2">{event.equipment_list}</Typography>
                </Box>
              )}

              <Typography variant="h5" fontWeight={700} gutterBottom>
                Participants
              </Typography>
              <Stack direction="row" alignItems="center" spacing={2} mb={4}>
                {participantProfiles.length > 0 && (
                  <AvatarGroup max={5}>
                    {participantProfiles.map(profile => (
                      <Avatar key={profile.id} src={profile.avatar} alt={profile.name} />
                    ))}
                  </AvatarGroup>
                )}
                <Typography variant="body2" color="text.secondary">
                  {participantProfiles.length > 0
                    ? `${participantProfiles.length} confirmed`
                    : 'No confirmed participants yet'}
                </Typography>
              </Stack>

              {participantProfiles.length > 0 && (
                <Grid container spacing={2} sx={{ mb: 2 }}>
                  {participantProfiles.map(profile => (
                    <Grid item xs={12} sm={6} key={profile.id}>
                      <Stack
                        direction="row"
                        spacing={2}
                        alignItems="center"
                        sx={{
                          p: 2,
                          borderRadius: 2,
                          bgcolor: 'background.default',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          '&:hover': { transform: 'translateY(-2px)', boxShadow: 1 },
                        }}
                        onClick={() => goToUserProfile(profile.id)}
                      >
                        <Avatar
                          src={profile.avatar}
                          alt={profile.name}
                          sx={{ width: 44, height: 44 }}
                        />
                        <Box>
                          <Typography variant="subtitle2" fontWeight={700}>
                            {profile.name}
                          </Typography>
                          <Chip
                            size="small"
                            icon={<VerifiedIcon />}
                            label={profile.verified ? 'Verified profile' : 'Unverified'}
                            color={profile.verified ? 'success' : 'default'}
                            sx={{ mt: 0.5 }}
                          />
                        </Box>
                      </Stack>
                    </Grid>
                  ))}
                </Grid>
              )}

              {isOrganizer && event.bookings && (
                <BookingRequestsList
                  bookings={event.bookings}
                  actionLoading={details.actionLoading}
                  actionError={details.actionError}
                  onDismissError={() => details.setActionError(null)}
                  onAction={details.handleBookingAction}
                  onOpenProfile={goToUserProfile}
                />
              )}

              <ReviewSection
                canWriteReview={event.status === 'completed' && isParticipant && !hasReviewed}
                showReviews={event.status === 'completed'}
                reviews={details.reviews}
                reviewsLoading={details.reviewsLoading}
                rating={details.rating}
                setRating={details.setRating}
                reviewComment={details.reviewComment}
                setReviewComment={details.setReviewComment}
                reviewLoading={details.reviewLoading}
                reviewMessage={details.reviewMessage}
                onDismissMessage={() => details.setReviewMessage(null)}
                onSubmit={details.submitReview}
              />
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <EventSidebar
              event={event}
              organizerProfile={organizerProfile}
              isBookable={isBookable}
              onBookNow={details.openBookingDialog}
              onOpenOrganizerProfile={() => goToUserProfile(event.created_by?.id)}
            />
          </Grid>
        </Grid>
      </Container>

      <BookingDialog
        open={details.openBooking}
        event={event}
        ticketCount={details.ticketCount}
        setTicketCount={details.setTicketCount}
        bookingLoading={details.bookingLoading}
        bookingMessage={details.bookingMessage}
        onClose={() => !details.bookingLoading && details.setOpenBooking(false)}
        onConfirm={details.confirmBooking}
      />
    </Box>
  );
};

export default EventDetails;
