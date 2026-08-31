import React from 'react';
import {
  Avatar,
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
  Typography,
} from '@mui/material';
import StarIcon from '@mui/icons-material/Star';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import {
  getAverageRating,
  type ProfileChatMessage,
  type ProfileEvent,
  type Review,
} from '../types';

interface Props {
  eventsLoading: boolean;
  myEvents: ProfileEvent[];
  eventReviews: Record<number, Review[]>;
  eventChats: Record<number, ProfileChatMessage[]>;
  onOpenComplete: (eventId: number) => void;
  onOpenCancel: (eventId: number) => void;
}

export const MyEventsTab: React.FC<Props> = ({
  eventsLoading,
  myEvents,
  eventReviews,
  eventChats,
  onOpenComplete,
  onOpenCancel,
}) => {
  if (eventsLoading) {
    return (
      <Box display="flex" justifyContent="center" py={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (myEvents.length === 0) {
    return (
      <Box textAlign="center" py={8}>
        <Typography variant="h6" color="text.secondary">
          You haven't created any events yet
        </Typography>
        <Button variant="contained" sx={{ mt: 2 }} href="/events/create">
          Create Your First Event
        </Button>
      </Box>
    );
  }

  return (
    <Grid container spacing={3}>
      {myEvents.map(event => (
        <Grid item xs={12} key={event.id}>
          <Card sx={{ borderRadius: 3, overflow: 'hidden' }}>
            <Grid container>
              <Grid item xs={12} md={4}>
                <CardMedia
                  component="img"
                  height="200"
                  image={event.image || '/placeholder-event.jpg'}
                  alt={event.title}
                  sx={{ objectFit: 'cover' }}
                />
              </Grid>
              <Grid item xs={12} md={8}>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                    <Box flex={1}>
                      <Typography variant="h5" fontWeight={700} gutterBottom>
                        {event.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {event.location} • {event.category}
                      </Typography>
                    </Box>
                    <Box>
                      {event.status === 'completed' && (
                        <Chip
                          icon={<CheckCircleIcon />}
                          label="Completed"
                          color="success"
                          size="small"
                          sx={{ fontWeight: 700 }}
                        />
                      )}
                      {event.status === 'cancelled' && (
                        <Chip
                          icon={<CancelIcon />}
                          label="Cancelled"
                          color="error"
                          size="small"
                          sx={{ fontWeight: 700 }}
                        />
                      )}
                      {event.status === 'upcoming' && (
                        <Chip
                          label="Upcoming"
                          color="primary"
                          size="small"
                          sx={{ fontWeight: 700 }}
                        />
                      )}
                      {event.status === 'ongoing' && (
                        <Chip
                          label="Ongoing"
                          color="warning"
                          size="small"
                          sx={{ fontWeight: 700 }}
                        />
                      )}
                    </Box>
                  </Box>
                  <Typography variant="body2" sx={{ mb: 3 }} noWrap>
                    {event.description}
                  </Typography>

                  {event.status === 'completed' && (
                    <Box sx={{ mb: 3 }}>
                      <Typography
                        variant="overline"
                        sx={{ letterSpacing: '0.08em', color: 'text.secondary' }}
                      >
                        Completed Post
                      </Typography>
                      <Paper sx={{ p: 2, borderRadius: 2, bgcolor: 'rgba(0,0,0,0.02)' }}>
                        <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                          <StarIcon sx={{ color: 'gold' }} />
                          <Typography variant="subtitle2" fontWeight={700}>
                            Average Rating: {getAverageRating(eventReviews[event.id]).toFixed(1)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            ({eventReviews[event.id]?.length || 0} reviews)
                          </Typography>
                        </Stack>
                        {eventReviews[event.id]?.length ? (
                          <Stack spacing={1.5}>
                            {eventReviews[event.id].slice(0, 2).map(review => (
                              <Box key={review.id}>
                                <Stack
                                  direction="row"
                                  justifyContent="space-between"
                                  alignItems="center"
                                  mb={0.5}
                                >
                                  <Typography variant="subtitle2" fontWeight={700}>
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
                    </Box>
                  )}

                  {event.status !== 'completed' && event.status !== 'cancelled' && (
                    <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
                      <Button
                        variant="contained"
                        color="success"
                        size="small"
                        startIcon={<CheckCircleIcon />}
                        onClick={() => onOpenComplete(event.id)}
                      >
                        Mark as Complete
                      </Button>
                      <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        startIcon={<CancelIcon />}
                        onClick={() => onOpenCancel(event.id)}
                      >
                        Cancel Event
                      </Button>
                    </Stack>
                  )}

                  <Divider sx={{ my: 2 }} />

                  <Box sx={{ mb: 3 }}>
                    <Box display="flex" alignItems="center" gap={1} mb={2}>
                      <StarIcon sx={{ color: 'gold' }} />
                      <Typography variant="h6" fontWeight={700}>
                        Reviews ({eventReviews[event.id]?.length || 0})
                      </Typography>
                    </Box>
                    {eventReviews[event.id]?.length > 0 ? (
                      <Stack spacing={2}>
                        {eventReviews[event.id].slice(0, 3).map(review => (
                          <Paper key={review.id} sx={{ p: 2, bgcolor: 'rgba(0,0,0,0.02)' }}>
                            <Box
                              display="flex"
                              justifyContent="space-between"
                              alignItems="center"
                              mb={1}
                            >
                              <Typography variant="subtitle2" fontWeight={700}>
                                {review.user.username}
                              </Typography>
                              <Rating value={review.rating} readOnly size="small" />
                            </Box>
                            <Typography variant="body2" color="text.secondary">
                              {review.comment}
                            </Typography>
                            <Typography variant="caption" color="text.disabled">
                              {new Date(review.created_at).toLocaleDateString()}
                            </Typography>
                          </Paper>
                        ))}
                        {eventReviews[event.id].length > 3 && (
                          <Typography variant="caption" color="primary" sx={{ cursor: 'pointer' }}>
                            +{eventReviews[event.id].length - 3} more reviews
                          </Typography>
                        )}
                      </Stack>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No reviews yet
                      </Typography>
                    )}
                  </Box>

                  <Box>
                    <Box display="flex" alignItems="center" gap={1} mb={2}>
                      <ChatBubbleOutlineIcon color="primary" />
                      <Typography variant="h6" fontWeight={700}>
                        Comments ({eventChats[event.id]?.length || 0})
                      </Typography>
                    </Box>
                    {eventChats[event.id]?.length > 0 ? (
                      <Stack spacing={1.5}>
                        {eventChats[event.id].slice(0, 3).map(chat => (
                          <Box key={chat.id} display="flex" gap={1}>
                            <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                              {chat.sender.username[0].toUpperCase()}
                            </Avatar>
                            <Box flex={1}>
                              <Typography variant="caption" fontWeight={700}>
                                {chat.sender.username}
                              </Typography>
                              <Typography variant="body2">{chat.message}</Typography>
                              <Typography variant="caption" color="text.disabled">
                                {new Date(chat.timestamp).toLocaleDateString()}
                              </Typography>
                            </Box>
                          </Box>
                        ))}
                        {eventChats[event.id].length > 3 && (
                          <Typography variant="caption" color="primary" sx={{ cursor: 'pointer' }}>
                            +{eventChats[event.id].length - 3} more comments
                          </Typography>
                        )}
                      </Stack>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No comments yet
                      </Typography>
                    )}
                  </Box>
                </CardContent>
              </Grid>
            </Grid>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

export default MyEventsTab;
