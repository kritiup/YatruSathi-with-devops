import React from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  Paper,
  Rating,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import StarIcon from '@mui/icons-material/Star';
import { getAverageRating, type ProfileSummary, type UserProfile } from '../types';

interface Props {
  isViewingOtherUser: boolean;
  profile: UserProfile;
  setProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  publicSummary: { organizer?: ProfileSummary; participant?: ProfileSummary } | null;
  createdEventsCount: number;
  totalReviews: number;
  totalComments: number;
  organizerRatingLabel: string;
  participantRatingLabel: string;
  saving: boolean;
  onSave: () => void;
}

export const ProfileInfoTab: React.FC<Props> = ({
  isViewingOtherUser,
  profile,
  setProfile,
  publicSummary,
  createdEventsCount,
  totalReviews,
  totalComments,
  organizerRatingLabel,
  participantRatingLabel,
  saving,
  onSave,
}) => (
  <Grid container spacing={4}>
    <Grid item xs={12} md={8}>
      {isViewingOtherUser ? (
        <>
          <Typography variant="h6" fontWeight={700} gutterBottom>
            About Me
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
            {profile.bio || 'No bio shared yet.'}
          </Typography>

          <Typography variant="h6" fontWeight={700} gutterBottom>
            Interests & Hobbies
          </Typography>
          {profile.hobbies ? (
            <Stack direction="row" spacing={1} flexWrap="wrap" gap={1} mb={2}>
              {profile.hobbies.split(',').map(hobby => (
                <Chip
                  key={hobby.trim()}
                  label={hobby.trim()}
                  color="primary"
                  variant="outlined"
                  sx={{ fontWeight: 600 }}
                />
              ))}
            </Stack>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No hobbies listed.
            </Typography>
          )}

          <Divider sx={{ my: 3 }} />

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                Organizer Overview
              </Typography>
              <Stack spacing={1.5} sx={{ mb: 2 }}>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    Past Events
                  </Typography>
                  <Typography variant="body2" fontWeight={700}>
                    {publicSummary?.organizer?.past_events_count || 0}
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2" color="text.secondary">
                    Average Rating
                  </Typography>
                  <Box display="flex" alignItems="center" gap={0.5}>
                    <StarIcon sx={{ color: 'gold', fontSize: 18 }} />
                    <Typography variant="body2" fontWeight={700}>
                      {publicSummary?.organizer?.average_rating?.toFixed(1) || '0.0'}
                    </Typography>
                  </Box>
                </Box>
              </Stack>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                Participant Overview
              </Typography>
              <Stack spacing={1.5} sx={{ mb: 2 }}>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    Past Events
                  </Typography>
                  <Typography variant="body2" fontWeight={700}>
                    {publicSummary?.participant?.past_events_count || 0}
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2" color="text.secondary">
                    Average Rating
                  </Typography>
                  <Box display="flex" alignItems="center" gap={0.5}>
                    <StarIcon sx={{ color: 'gold', fontSize: 18 }} />
                    <Typography variant="body2" fontWeight={700}>
                      {publicSummary?.participant?.average_rating?.toFixed(1) || '0.0'}
                    </Typography>
                  </Box>
                </Box>
              </Stack>
            </Grid>

            <Grid item xs={12}>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                Organizer Posts
              </Typography>
              {publicSummary?.organizer?.past_events?.some(
                event => event.status === 'completed'
              ) ? (
                <Stack spacing={2}>
                  {publicSummary.organizer.past_events
                    .filter(event => event.status === 'completed')
                    .map(event => {
                      const reviews =
                        publicSummary.organizer?.reviews?.filter(
                          review => review.activity === event.id
                        ) || [];
                      const averageRating = getAverageRating(reviews);

                      return (
                        <Stack key={event.id} spacing={1.5}>
                          <Paper sx={{ p: 1.5, bgcolor: 'rgba(0,0,0,0.02)' }}>
                            <Typography variant="subtitle2" fontWeight={700}>
                              {event.title}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {event.location || 'Location'} • {event.category || 'Adventure'}
                            </Typography>
                          </Paper>
                          <Paper
                            sx={{
                              p: 1.5,
                              borderRadius: 2,
                              bgcolor: 'rgba(255, 215, 0, 0.12)',
                            }}
                          >
                            <Stack direction="row" alignItems="center" spacing={1}>
                              <StarIcon sx={{ color: 'gold', fontSize: 18 }} />
                              <Typography variant="body2" fontWeight={700}>
                                Rating: {averageRating.toFixed(1)}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                ({reviews.length} reviews)
                              </Typography>
                            </Stack>
                          </Paper>
                          <Paper sx={{ p: 1.5, borderRadius: 2, bgcolor: 'rgba(0,0,0,0.02)' }}>
                            {event.image && (
                              <CardMedia
                                component="img"
                                height="200"
                                image={event.image}
                                alt={event.title}
                                sx={{ borderRadius: 2, mb: 1.5, objectFit: 'cover' }}
                              />
                            )}
                            {reviews.length ? (
                              <Stack spacing={1}>
                                {reviews.slice(0, 3).map(review => (
                                  <Box key={review.id}>
                                    <Stack
                                      direction="row"
                                      justifyContent="space-between"
                                      alignItems="center"
                                    >
                                      <Typography variant="caption" fontWeight={700}>
                                        {review.user.username}
                                      </Typography>
                                      <Rating value={review.rating} readOnly size="small" />
                                    </Stack>
                                    <Typography variant="body2" color="text.secondary">
                                      {review.comment}
                                    </Typography>
                                  </Box>
                                ))}
                              </Stack>
                            ) : (
                              <Typography variant="body2" color="text.secondary">
                                No reviews yet
                              </Typography>
                            )}
                          </Paper>
                        </Stack>
                      );
                    })}
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No completed posts yet.
                </Typography>
              )}
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 3 }} />
            </Grid>
          </Grid>
        </>
      ) : (
        <>
          <Typography variant="h6" fontWeight={700} gutterBottom>
            About Me
          </Typography>
          <TextField
            label="Bio"
            fullWidth
            multiline
            rows={4}
            value={profile.bio}
            onChange={e => setProfile({ ...profile, bio: e.target.value })}
            sx={{ mb: 4 }}
          />

          <Typography variant="h6" fontWeight={700} gutterBottom>
            Interests & Hobbies
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" gap={1} mb={2}>
            {profile.hobbies &&
              profile.hobbies
                .split(',')
                .map(hobby => (
                  <Chip
                    key={hobby.trim()}
                    label={hobby.trim()}
                    color="primary"
                    variant="outlined"
                    sx={{ fontWeight: 600 }}
                  />
                ))}
          </Stack>
          <TextField
            label="Update interests (comma separated)"
            fullWidth
            placeholder="e.g. Trekking, Photography, Food"
            value={profile.hobbies}
            onChange={e => setProfile({ ...profile, hobbies: e.target.value })}
          />

          <Button
            variant="contained"
            size="large"
            sx={{ mt: 4, px: 6, borderRadius: 2 }}
            onClick={onSave}
            disabled={saving}
          >
            {saving ? <CircularProgress size={24} color="inherit" /> : 'Save Changes'}
          </Button>
        </>
      )}
    </Grid>

    {!isViewingOtherUser && (
      <Grid item xs={12} md={4}>
        <Card sx={{ bgcolor: 'rgba(15, 23, 42, 0.03)', border: 'none', boxShadow: 'none' }}>
          <CardContent>
            <Typography variant="subtitle1" fontWeight={700} gutterBottom>
              Quick Stats
            </Typography>
            <Stack spacing={2} sx={{ mt: 2 }}>
              <Box display="flex" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">
                  Events Created
                </Typography>
                <Typography variant="body2" fontWeight={700}>
                  {createdEventsCount}
                </Typography>
              </Box>
              <Box display="flex" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">
                  Total Reviews
                </Typography>
                <Typography variant="body2" fontWeight={700}>
                  {totalReviews}
                </Typography>
              </Box>
              <Box display="flex" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">
                  Total Comments
                </Typography>
                <Typography variant="body2" fontWeight={700}>
                  {totalComments}
                </Typography>
              </Box>
              <Divider sx={{ my: 1 }} />
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="body2" color="text.secondary">
                  As Organizer
                </Typography>
                <Box display="flex" alignItems="center" gap={0.5}>
                  <StarIcon sx={{ color: 'gold', fontSize: 18 }} />
                  <Typography variant="body2" fontWeight={700}>
                    {organizerRatingLabel}
                  </Typography>
                </Box>
              </Box>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="body2" color="text.secondary">
                  As Participant
                </Typography>
                <Box display="flex" alignItems="center" gap={0.5}>
                  <StarIcon sx={{ color: 'gold', fontSize: 18 }} />
                  <Typography variant="body2" fontWeight={700}>
                    {participantRatingLabel}
                  </Typography>
                </Box>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Grid>
    )}
  </Grid>
);

export default ProfileInfoTab;
