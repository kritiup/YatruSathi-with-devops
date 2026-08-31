import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Chip,
  Divider,
  Paper,
  Skeleton,
  Stack,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';
import EventOutlinedIcon from '@mui/icons-material/EventOutlined';
import { useNavigate } from 'react-router';

import api from '../../api/api';
import { toList, formatDate, formatCurrency } from '../../common/utils/formatters';
import { imageOrFallback } from '../../common/utils/media';
import { ROUTES } from '../../common/constants/routes';
import { packageService, type PackageBooking } from '../../services/api/catalog';
import type { ActivitySummary } from '../../common/types/activity';

interface ActivityBooking {
  id: number;
  activity: ActivitySummary;
  status: string;
  booked_at: string;
  ticket_count: number;
}

const statusColor = (s: string) =>
  s === 'confirmed'
    ? 'success'
    : s === 'completed'
      ? 'default'
      : s === 'cancelled'
        ? 'error'
        : 'warning';

const Row: React.FC<{
  image: string;
  title: string;
  meta: string;
  status: string;
  price?: string;
  onView: () => void;
}> = ({ image, title, meta, status, price, onView }) => (
  <Stack
    direction={{ xs: 'column', sm: 'row' }}
    spacing={2}
    alignItems={{ sm: 'center' }}
    sx={{ py: 2 }}
  >
    <Box
      component="img"
      src={image}
      alt={title}
      sx={{
        width: { xs: '100%', sm: 96 },
        height: { xs: 140, sm: 72 },
        borderRadius: 2,
        objectFit: 'cover',
      }}
    />
    <Box sx={{ flex: 1, minWidth: 0 }}>
      <Typography sx={{ fontWeight: 700 }}>{title}</Typography>
      <Typography variant="caption" color="text.secondary">
        {meta}
      </Typography>
    </Box>
    {price && <Typography sx={{ fontWeight: 700, color: 'primary.main' }}>{price}</Typography>}
    <Chip
      size="small"
      label={status}
      color={statusColor(status)}
      sx={{ textTransform: 'capitalize' }}
    />
    <Button size="small" variant="outlined" onClick={onView}>
      Details
    </Button>
  </Stack>
);

export const MyBookings: React.FC = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState(0);
  const [activityBookings, setActivityBookings] = useState<ActivityBooking[]>([]);
  const [packageBookings, setPackageBookings] = useState<PackageBooking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api
        .get('bookings/')
        .then(r => toList<ActivityBooking>(r.data))
        .catch(() => []),
      packageService.listBookings().catch(() => []),
    ])
      .then(([a, p]) => {
        setActivityBookings(a);
        setPackageBookings(p);
      })
      .finally(() => setLoading(false));
  }, []);

  const empty = !activityBookings.length && !packageBookings.length;

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        My Bookings
      </Typography>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label={`Activities (${activityBookings.length})`} />
        <Tab label={`Packages (${packageBookings.length})`} />
      </Tabs>

      <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 } }}>
        {loading ? (
          <Skeleton height={200} />
        ) : empty ? (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <Typography color="text.secondary" sx={{ mb: 2 }}>
              You haven't booked anything yet.
            </Typography>
            <Button variant="contained" onClick={() => navigate(ROUTES.activities)}>
              Explore activities
            </Button>
          </Box>
        ) : tab === 0 ? (
          activityBookings.length ? (
            activityBookings.map((b, i) => (
              <React.Fragment key={b.id}>
                {i > 0 && <Divider />}
                <Row
                  image={imageOrFallback(b.activity?.image, b.activity?.title)}
                  title={b.activity?.title || 'Activity'}
                  meta={`${b.activity?.location || 'Nepal'} · booked ${formatDate(b.booked_at)}`}
                  status={b.status}
                  onView={() => navigate(ROUTES.activityDetail(b.activity.id))}
                />
              </React.Fragment>
            ))
          ) : (
            <Typography color="text.secondary" sx={{ py: 3 }}>
              No activity bookings.
            </Typography>
          )
        ) : packageBookings.length ? (
          packageBookings.map((b, i) => (
            <React.Fragment key={b.id}>
              {i > 0 && <Divider />}
              <Row
                image={imageOrFallback(b.package?.cover_image, b.package?.slug)}
                title={b.package?.name || 'Package'}
                meta={`${b.participants} traveller(s) · booked ${formatDate(b.booked_at)}`}
                status={b.status}
                price={formatCurrency(b.total_price, b.package?.currency)}
                onView={() => navigate(ROUTES.packageDetail(b.package.slug))}
              />
            </React.Fragment>
          ))
        ) : (
          <Typography color="text.secondary" sx={{ py: 3 }}>
            No package bookings.
          </Typography>
        )}
      </Paper>

      <Stack direction="row" spacing={1.5} sx={{ mt: 3, color: 'text.secondary' }}>
        <EventOutlinedIcon fontSize="small" />
        <Typography variant="body2">
          Activity organisers confirm requests manually — check back for updates.
        </Typography>
        <PlaceOutlinedIcon fontSize="small" />
      </Stack>
    </Box>
  );
};

export default MyBookings;
