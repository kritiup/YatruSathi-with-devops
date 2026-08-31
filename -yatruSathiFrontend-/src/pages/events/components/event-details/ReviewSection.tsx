import React from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  CircularProgress,
  Divider,
  Paper,
  Rating,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import StarIcon from '@mui/icons-material/Star';
import type { FeedbackMessage, Review } from '../../event-details.types';

interface Props {
  canWriteReview: boolean;
  showReviews: boolean;
  reviews: Review[];
  reviewsLoading: boolean;
  rating: number | null;
  setRating: (value: number | null) => void;
  reviewComment: string;
  setReviewComment: (value: string) => void;
  reviewLoading: boolean;
  reviewMessage: FeedbackMessage;
  onDismissMessage: () => void;
  onSubmit: () => void;
}

export const ReviewSection: React.FC<Props> = ({
  canWriteReview,
  showReviews,
  reviews,
  reviewsLoading,
  rating,
  setRating,
  reviewComment,
  setReviewComment,
  reviewLoading,
  reviewMessage,
  onDismissMessage,
  onSubmit,
}) => (
  <>
    {canWriteReview && (
      <>
        <Divider sx={{ my: 4 }} />
        <Typography variant="h5" fontWeight={700} gutterBottom>
          Rate Your Experience
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Share your thoughts about this adventure to help others make informed decisions.
        </Typography>

        {reviewMessage && (
          <Alert severity={reviewMessage.type} sx={{ mb: 2 }} onClose={onDismissMessage}>
            {reviewMessage.text}
          </Alert>
        )}

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" fontWeight={600} gutterBottom>
            Rating
          </Typography>
          <Rating
            name="event-rating"
            value={rating}
            onChange={(_, newValue) => setRating(newValue)}
            size="large"
            emptyIcon={<StarIcon style={{ opacity: 0.55 }} fontSize="inherit" />}
          />
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" fontWeight={600} gutterBottom>
            Your Review
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={4}
            placeholder="Share your experience with this event..."
            value={reviewComment}
            onChange={e => setReviewComment(e.target.value)}
            variant="outlined"
          />
        </Box>

        <Button
          variant="contained"
          color="primary"
          onClick={onSubmit}
          disabled={reviewLoading || !rating || !reviewComment.trim()}
          sx={{ fontWeight: 600 }}
          startIcon={reviewLoading ? <CircularProgress size={16} /> : null}
        >
          {reviewLoading ? 'Submitting...' : 'Submit Review'}
        </Button>
      </>
    )}

    {showReviews && reviews.length > 0 && (
      <>
        <Divider sx={{ my: 4 }} />
        <Typography variant="h5" fontWeight={700} gutterBottom>
          Reviews ({reviews.length})
        </Typography>
        <Stack spacing={2}>
          {reviewsLoading ? (
            <Box display="flex" justifyContent="center" py={3}>
              <CircularProgress />
            </Box>
          ) : (
            reviews.map(review => (
              <Paper key={review.id} sx={{ p: 2, borderRadius: 2, bgcolor: 'background.default' }}>
                <Stack direction="row" spacing={2} alignItems="flex-start">
                  <Avatar sx={{ bgcolor: 'primary.main' }}>
                    {review.user.username.charAt(0).toUpperCase()}
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                      mb={1}
                    >
                      <Typography variant="subtitle2" fontWeight={600}>
                        {review.user.username}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(review.created_at).toLocaleDateString()}
                      </Typography>
                    </Stack>
                    <Rating value={review.rating} readOnly size="small" sx={{ mb: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                      {review.comment}
                    </Typography>
                  </Box>
                </Stack>
              </Paper>
            ))
          )}
        </Stack>
      </>
    )}
  </>
);

export default ReviewSection;
