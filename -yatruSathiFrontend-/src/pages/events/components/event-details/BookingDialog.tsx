import React from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import {
  formatEventCurrency,
  type EventDetail,
  type FeedbackMessage,
} from '../../event-details.types';

interface Props {
  open: boolean;
  event: EventDetail;
  ticketCount: number;
  setTicketCount: (value: number) => void;
  bookingLoading: boolean;
  bookingMessage: FeedbackMessage;
  onClose: () => void;
  onConfirm: () => void;
}

export const BookingDialog: React.FC<Props> = ({
  open,
  event,
  ticketCount,
  setTicketCount,
  bookingLoading,
  bookingMessage,
  onClose,
  onConfirm,
}) => (
  <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
    <DialogTitle sx={{ fontWeight: 800 }}>Confirm Your Booking</DialogTitle>
    <DialogContent>
      {bookingMessage && (
        <Alert severity={bookingMessage.type} sx={{ mb: 2 }}>
          {bookingMessage.text}
        </Alert>
      )}
      <Typography variant="body2" color="text.secondary" gutterBottom>
        You are booking for: <strong>{event.title}</strong>
      </Typography>
      <Box sx={{ mt: 3 }}>
        <TextField
          label="Number of Travelers"
          type="number"
          fullWidth
          value={ticketCount}
          onChange={e => setTicketCount(Math.max(1, parseInt(e.target.value, 10) || 1))}
          inputProps={{ min: 1, max: event.max_participants || undefined }}
        />
        <Stack spacing={2} sx={{ mt: 3 }}>
          <Box display="flex" justifyContent="space-between">
            <Typography variant="body2" color="text.secondary" fontWeight={500}>
              Cost Per Person
            </Typography>
            <Typography variant="body2" fontWeight={700} color="primary">
              {formatEventCurrency(event.total_expenses || 0)}
            </Typography>
          </Box>
          <Box
            display="flex"
            justifyContent="space-between"
            sx={{ p: 2, bgcolor: 'rgba(59, 130, 246, 0.05)', borderRadius: 1 }}
          >
            <Typography variant="body2" color="text.secondary" fontWeight={600}>
              Total ({ticketCount} Traveler{ticketCount > 1 ? 's' : ''})
            </Typography>
            <Typography variant="h6" fontWeight={800} color="primary">
              {formatEventCurrency(Number(event.total_expenses || 0) * ticketCount)}
            </Typography>
          </Box>
          {event.advance_amount && Number(event.advance_amount) > 0 && (
            <Box display="flex" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">
                Advance Payment
              </Typography>
              <Typography variant="body2" fontWeight={600}>
                {formatEventCurrency(event.advance_amount)}
              </Typography>
            </Box>
          )}
        </Stack>
      </Box>
    </DialogContent>
    <DialogActions sx={{ p: 3 }}>
      <Button onClick={onClose} disabled={bookingLoading}>
        Cancel
      </Button>
      <Button variant="contained" onClick={onConfirm} disabled={bookingLoading} sx={{ px: 4 }}>
        {bookingLoading ? <CircularProgress size={24} /> : 'Confirm Booking'}
      </Button>
    </DialogActions>
  </Dialog>
);

export default BookingDialog;
