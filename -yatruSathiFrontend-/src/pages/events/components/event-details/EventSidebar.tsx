import React from 'react';
import { Box, Button, Paper, Stack, Typography } from '@mui/material';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import VerifiedIcon from '@mui/icons-material/Verified';
import ShareIcon from '@mui/icons-material/Share';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import {
  formatEventCurrency,
  resolveProfileAvatar,
  type EventDetail,
  type OrganizerProfile,
} from '../../event-details.types';
import { Avatar } from '@mui/material';

interface Props {
  event: EventDetail;
  organizerProfile: OrganizerProfile | null;
  isBookable: boolean;
  onBookNow: () => void;
  onOpenOrganizerProfile: () => void;
}

export const EventSidebar: React.FC<Props> = ({
  event,
  organizerProfile,
  isBookable,
  onBookNow,
  onOpenOrganizerProfile,
}) => (
  <Stack spacing={3} sx={{ position: { md: 'sticky' }, top: 100 }}>
    <Paper sx={{ p: 3, borderRadius: 4, border: '1px solid', borderColor: 'divider' }}>
      <Typography variant="h4" fontWeight={800} mb={3}>
        {event.is_free_event ? 'Free' : formatEventCurrency(event.total_expenses || 0)}
        <Typography variant="caption" color="text.secondary" sx={{ ml: 1, fontWeight: 400 }}>
          / person
        </Typography>
      </Typography>

      <Button
        variant="contained"
        fullWidth
        size="large"
        onClick={onBookNow}
        startIcon={<ShoppingCartIcon />}
        sx={{ py: 2, mb: 2, borderRadius: 2 }}
        disabled={!isBookable}
      >
        {event.status === 'completed'
          ? 'Event Completed'
          : event.status === 'cancelled'
            ? 'Event Cancelled'
            : 'Book Experience'}
      </Button>

      <Stack direction="row" spacing={1}>
        <Button fullWidth variant="outlined" startIcon={<FavoriteBorderIcon />}>
          Save
        </Button>
        <Button fullWidth variant="outlined" startIcon={<ShareIcon />}>
          Share
        </Button>
      </Stack>

      <Box sx={{ mt: 3, p: 2, bgcolor: 'background.default', borderRadius: 2 }}>
        <Stack spacing={2}>
          <Box display="flex" justifyContent="space-between">
            <Typography variant="body2" color="text.secondary">
              Max Participants
            </Typography>
            <Typography variant="body2" fontWeight={600}>
              {event.max_participants || 'No limit'}
            </Typography>
          </Box>
          <Box display="flex" justifyContent="space-between">
            <Typography variant="body2" color="text.secondary">
              Traveling Cost (Per Person)
            </Typography>
            <Typography variant="body2" fontWeight={600}>
              {formatEventCurrency(event.total_expenses || 0)}
            </Typography>
          </Box>
          <Box display="flex" justifyContent="space-between">
            <Typography variant="body2" color="text.secondary">
              Gender Preference
            </Typography>
            <Typography variant="body2" fontWeight={600} sx={{ textTransform: 'capitalize' }}>
              {event.gender_preference || 'Any'}
            </Typography>
          </Box>
          <Box display="flex" justifyContent="space-between">
            <Typography variant="body2" color="text.secondary">
              Age Limit
            </Typography>
            <Typography variant="body2" fontWeight={600}>
              {event.age_limit ? `${event.age_limit}+` : 'None'}
            </Typography>
          </Box>
          <Box display="flex" justifyContent="space-between">
            <Typography variant="body2" color="text.secondary">
              Advance Payment
            </Typography>
            <Typography variant="body2" fontWeight={600}>
              {formatEventCurrency(event.advance_amount || 0)}
            </Typography>
          </Box>
        </Stack>
      </Box>
    </Paper>

    <Paper sx={{ p: 3, borderRadius: 4 }}>
      <Typography variant="h6" fontWeight={700} mb={2}>
        Organized By
      </Typography>
      <Stack
        direction="row"
        spacing={2}
        alignItems="center"
        mb={3}
        sx={{
          cursor: 'pointer',
          p: 1,
          borderRadius: 2,
          transition: 'all 0.2s ease',
          '&:hover': { bgcolor: 'rgba(0,0,0,0.03)', transform: 'translateX(4px)' },
        }}
        onClick={onOpenOrganizerProfile}
      >
        <Avatar
          src={
            resolveProfileAvatar(organizerProfile?.avatar) ||
            `https://i.pravatar.cc/150?u=${event.created_by?.id || 0}`
          }
          alt={event.created_by?.username || 'Organizer'}
          sx={{
            width: 50,
            height: 50,
            boxShadow: 2,
            transition: 'box-shadow 0.2s ease',
            '&:hover': { boxShadow: 4 },
          }}
        >
          {event.created_by?.username?.charAt(0) || 'O'}
        </Avatar>
        <Box>
          <Typography
            variant="subtitle1"
            fontWeight={700}
            sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
          >
            {event.created_by?.username || event.organizer_name || 'Adventure Organizer'}
            <VerifiedIcon color="primary" sx={{ fontSize: 18 }} />
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Event Organizer
          </Typography>
        </Box>
      </Stack>

      <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 2, mb: 2 }}>
        <Stack spacing={1.5}>
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
              Email
            </Typography>
            <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
              {event.created_by?.email || event.contact_email || 'Not provided'}
            </Typography>
          </Box>
          {event.phone_number && (
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                Phone
              </Typography>
              <Typography variant="body2">{event.phone_number}</Typography>
            </Box>
          )}
        </Stack>
      </Box>

      <Stack spacing={1}>
        <Button
          variant="outlined"
          fullWidth
          startIcon={<EmailIcon />}
          onClick={() => {
            window.location.href = `mailto:${event.created_by?.email || event.contact_email}`;
          }}
          sx={{ justifyContent: 'flex-start' }}
        >
          Contact Email
        </Button>
        {event.phone_number && (
          <Button
            variant="outlined"
            fullWidth
            startIcon={<PhoneIcon />}
            onClick={() => {
              window.location.href = `tel:${event.phone_number}`;
            }}
          >
            {event.phone_number}
          </Button>
        )}
      </Stack>
    </Paper>
  </Stack>
);

export default EventSidebar;
