import React from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import {
  bookingDisplayBio,
  bookingDisplayLocation,
  bookingDisplayName,
  resolveProfileAvatar,
  type Booking,
} from '../../event-details.types';

interface Props {
  bookings: Booking[];
  actionLoading: number | null;
  actionError: string | null;
  onDismissError: () => void;
  onAction: (bookingId: number, action: 'accept' | 'reject') => void;
  onOpenProfile: (userId: number) => void;
}

const bgByStatus: Record<Booking['status'], string> = {
  pending: 'rgba(255, 193, 7, 0.05)',
  confirmed: 'rgba(76, 175, 80, 0.05)',
  cancelled: 'rgba(244, 67, 54, 0.05)',
};

const borderByStatus: Record<Booking['status'], string> = {
  pending: 'rgba(255, 193, 7, 0.3)',
  confirmed: 'rgba(76, 175, 80, 0.3)',
  cancelled: 'rgba(244, 67, 54, 0.3)',
};

export const BookingRequestsList: React.FC<Props> = ({
  bookings,
  actionLoading,
  actionError,
  onDismissError,
  onAction,
  onOpenProfile,
}) => (
  <>
    <Divider sx={{ my: 4 }} />
    <Typography variant="h5" fontWeight={700} gutterBottom>
      Booking Requests ({bookings.length})
    </Typography>

    {actionError && (
      <Alert severity="error" sx={{ mb: 2 }} onClose={onDismissError}>
        {actionError}
      </Alert>
    )}

    <Grid container spacing={2}>
      {bookings.map(booking => (
        <Grid item xs={12} key={booking.id}>
          <Paper
            sx={{
              p: 2,
              borderRadius: 2,
              bgcolor: bgByStatus[booking.status],
              border: '1px solid',
              borderColor: borderByStatus[booking.status],
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              '&:hover': { transform: 'translateY(-2px)', boxShadow: 2 },
            }}
          >
            <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
              <Box sx={{ flex: 1 }} onClick={() => onOpenProfile(booking.user.id)}>
                <Stack direction="row" spacing={2} alignItems="center" mb={1}>
                  <Avatar
                    src={
                      resolveProfileAvatar(booking.profile?.avatar) ||
                      `https://i.pravatar.cc/150?u=${booking.user.id}`
                    }
                    alt={bookingDisplayName(booking)}
                    sx={{
                      width: 44,
                      height: 44,
                      cursor: 'pointer',
                      '&:hover': { boxShadow: 3 },
                    }}
                  />
                  <Box>
                    <Typography variant="subtitle2" fontWeight={700}>
                      {bookingDisplayName(booking)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {booking.user.email}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      {bookingDisplayLocation(booking)}
                    </Typography>
                  </Box>
                </Stack>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {bookingDisplayBio(booking)}
                </Typography>
                <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                  <Chip
                    label={`${booking.ticket_count} ticket${booking.ticket_count > 1 ? 's' : ''}`}
                    size="small"
                    variant="outlined"
                  />
                  <Chip
                    label={booking.status}
                    size="small"
                    color={
                      booking.status === 'confirmed'
                        ? 'success'
                        : booking.status === 'pending'
                          ? 'warning'
                          : 'error'
                    }
                    variant="outlined"
                  />
                </Stack>
              </Box>

              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                sx={{ minWidth: 'fit-content' }}
                onClick={e => e.stopPropagation()}
              >
                {booking.status === 'pending' && (
                  <Button
                    size="small"
                    variant="contained"
                    color="success"
                    onClick={() => onAction(booking.id, 'accept')}
                    disabled={actionLoading === booking.id}
                    sx={{ fontWeight: 600, minWidth: 90 }}
                    startIcon={
                      actionLoading === booking.id ? <CircularProgress size={16} /> : <CheckIcon />
                    }
                  >
                    Accept
                  </Button>
                )}
                {booking.status !== 'cancelled' && (
                  <Button
                    size="small"
                    variant="outlined"
                    color="error"
                    onClick={() => onAction(booking.id, 'reject')}
                    disabled={actionLoading === booking.id}
                    sx={{ fontWeight: 600, minWidth: 90 }}
                    startIcon={
                      actionLoading === booking.id ? <CircularProgress size={16} /> : <CloseIcon />
                    }
                  >
                    Reject
                  </Button>
                )}
              </Stack>
            </Stack>
          </Paper>
        </Grid>
      ))}
    </Grid>
  </>
);

export default BookingRequestsList;
