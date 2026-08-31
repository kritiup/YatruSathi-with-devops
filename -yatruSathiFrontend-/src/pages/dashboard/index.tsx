import React, { useEffect, useState } from 'react';
import { Box, Button, Chip, Grid, Paper, Skeleton, Stack, Typography } from '@mui/material';
import LuggageIcon from '@mui/icons-material/Luggage';
import FavoriteIcon from '@mui/icons-material/Favorite';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import RateReviewIcon from '@mui/icons-material/RateReview';
import { useNavigate } from 'react-router';

import { getStoredUser } from '../../common/utils/storage';
import { formatDate } from '../../common/utils/formatters';
import { ROUTES } from '../../common/constants/routes';
import {
  dashboardService,
  type DashboardSummary,
  type DashboardTrip,
} from '../../services/api/catalog';

const STAT_META = [
  { key: 'trips', label: 'Trips', icon: <LuggageIcon />, to: ROUTES.myBookings },
  { key: 'favorites', label: 'Favorites', icon: <FavoriteIcon />, to: ROUTES.myWishlist },
  { key: 'wishlist', label: 'Wishlist', icon: <BookmarkIcon />, to: ROUTES.myWishlist },
  { key: 'reviews', label: 'Reviews', icon: <RateReviewIcon />, to: ROUTES.myReviews },
] as const;

const statusColor = (s: string) =>
  s === 'confirmed'
    ? 'success'
    : s === 'completed'
      ? 'default'
      : s === 'cancelled'
        ? 'error'
        : 'warning';

const TripRow: React.FC<{ trip: DashboardTrip }> = ({ trip }) => {
  const navigate = useNavigate();
  return (
    <Stack
      direction="row"
      alignItems="center"
      spacing={2}
      sx={{
        py: 1.5,
        borderBottom: 1,
        borderColor: 'divider',
        '&:last-of-type': { borderBottom: 0 },
      }}
    >
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography noWrap sx={{ fontWeight: 700 }}>
          {trip.title}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {formatDate(trip.date)}
        </Typography>
      </Box>
      <Chip
        size="small"
        label={trip.status}
        color={statusColor(trip.status)}
        sx={{ textTransform: 'capitalize' }}
      />
      <Button size="small" onClick={() => navigate(ROUTES.activityDetail(trip.id))}>
        View
      </Button>
    </Stack>
  );
};

export const DashboardHome: React.FC = () => {
  const navigate = useNavigate();
  const user = getStoredUser();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardService
      .summary()
      .then(setSummary)
      .catch(() => setSummary(null))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 0.5 }}>
        Dashboard
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 4 }}>
        Welcome back, {user?.username || 'traveller'}!
      </Typography>

      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        {STAT_META.map(s => (
          <Grid item xs={6} md={3} key={s.key}>
            <Paper
              variant="outlined"
              onClick={() => navigate(s.to)}
              sx={{
                p: 2.5,
                cursor: 'pointer',
                transition: 'border-color .2s',
                '&:hover': { borderColor: 'primary.main' },
              }}
            >
              <Box sx={{ color: 'primary.main', mb: 1 }}>{s.icon}</Box>
              <Typography variant="h4">
                {loading ? <Skeleton width={40} /> : (summary?.[s.key] ?? 0)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {s.label}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper variant="outlined" sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 1 }}>
              Upcoming Trips
            </Typography>
            {loading ? (
              <Skeleton height={120} />
            ) : summary?.upcoming.length ? (
              summary.upcoming.map(t => <TripRow key={t.id} trip={t} />)
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                No confirmed trips yet.{' '}
                <Button size="small" onClick={() => navigate(ROUTES.activities)}>
                  Browse activities
                </Button>
              </Typography>
            )}
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper variant="outlined" sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 1 }}>
              Recent Bookings
            </Typography>
            {loading ? (
              <Skeleton height={120} />
            ) : summary?.recent.length ? (
              summary.recent.map(t => <TripRow key={t.id} trip={t} />)
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                Nothing booked yet.
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardHome;
