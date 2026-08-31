import React, { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  Divider,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import ScheduleIcon from '@mui/icons-material/Schedule';
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';
import { useNavigate, useParams } from 'react-router';

import { PageHero } from '../../common/components/PageHero';
import { RatingStars } from '../../common/components/RatingStars';
import { useRequireAuth } from '../../common/hooks/useRequireAuth';
import { getApiErrorMessage } from '../../common/utils/errors';
import { formatCurrency } from '../../common/utils/formatters';
import { ROUTES } from '../../common/constants/routes';
import { packageService, type PackageDetail } from '../../services/api/catalog';

export const PackageDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const ensureAuth = useRequireAuth();

  const [pkg, setPkg] = useState<PackageDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [participants, setParticipants] = useState(1);
  const [startDate, setStartDate] = useState('');
  const [booking, setBooking] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    packageService
      .get(slug)
      .then(setPkg)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [slug]);

  const book = async () => {
    if (!pkg) return;
    if (!ensureAuth()) return;
    setBooking(true);
    setFeedback(null);
    try {
      await packageService.book({
        package_id: pkg.id,
        participants,
        start_date: startDate || null,
      });
      setFeedback({
        type: 'success',
        text: 'Package booked! You can track it under My Bookings.',
      });
    } catch (err) {
      setFeedback({ type: 'error', text: getApiErrorMessage(err, 'Could not book this package.') });
    } finally {
      setBooking(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Skeleton variant="rounded" height={300} sx={{ borderRadius: 4, mb: 4 }} />
        <Skeleton width="40%" height={40} />
      </Container>
    );
  }

  if (error || !pkg) {
    return (
      <Container maxWidth="lg" sx={{ py: 10, textAlign: 'center' }}>
        <Typography variant="h5" sx={{ mb: 2 }}>
          Package not found
        </Typography>
        <Button onClick={() => navigate(ROUTES.packages)}>Back to packages</Button>
      </Container>
    );
  }

  const total = Number(pkg.price) * participants;

  return (
    <Box>
      <PageHero
        title={pkg.name}
        subtitle={pkg.summary}
        image={pkg.cover_image}
        imageSeed={pkg.slug}
      />
      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(ROUTES.packages)}
          sx={{ mb: 3 }}
        >
          All packages
        </Button>

        <Grid container spacing={5}>
          <Grid item xs={12} md={8}>
            <Stack direction="row" spacing={2} flexWrap="wrap" sx={{ mb: 2 }}>
              <Chip icon={<ScheduleIcon />} label={`${pkg.duration_days} days`} />
              <Chip label={pkg.category} sx={{ textTransform: 'capitalize' }} />
              {pkg.destination && (
                <Chip icon={<PlaceOutlinedIcon />} label={pkg.destination.name} />
              )}
            </Stack>
            <RatingStars value={pkg.rating} count={pkg.review_count} size="medium" />

            <Typography sx={{ mt: 3, mb: 4, lineHeight: 1.9, fontSize: '1.05rem' }}>
              {pkg.description}
            </Typography>

            {pkg.itinerary?.length > 0 && (
              <Box sx={{ mb: 4 }}>
                <Typography variant="h5" sx={{ mb: 2 }}>
                  Itinerary
                </Typography>
                <Stack spacing={2}>
                  {pkg.itinerary.map(d => (
                    <Paper key={d.day} variant="outlined" sx={{ p: 2.5 }}>
                      <Typography variant="overline" color="primary.main">
                        Day {d.day}
                      </Typography>
                      <Typography sx={{ fontWeight: 700 }}>{d.title}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {d.detail}
                      </Typography>
                    </Paper>
                  ))}
                </Stack>
              </Box>
            )}

            <Grid container spacing={3}>
              {pkg.inclusions?.length > 0 && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="h6" sx={{ mb: 1 }}>
                    What's included
                  </Typography>
                  <List dense disablePadding>
                    {pkg.inclusions.map(x => (
                      <ListItem key={x} disableGutters>
                        <ListItemIcon sx={{ minWidth: 32 }}>
                          <CheckCircleIcon fontSize="small" color="success" />
                        </ListItemIcon>
                        <ListItemText primary={x} />
                      </ListItem>
                    ))}
                  </List>
                </Grid>
              )}
              {pkg.exclusions?.length > 0 && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="h6" sx={{ mb: 1 }}>
                    Not included
                  </Typography>
                  <List dense disablePadding>
                    {pkg.exclusions.map(x => (
                      <ListItem key={x} disableGutters>
                        <ListItemIcon sx={{ minWidth: 32 }}>
                          <CancelIcon fontSize="small" sx={{ color: 'text.disabled' }} />
                        </ListItemIcon>
                        <ListItemText primary={x} />
                      </ListItem>
                    ))}
                  </List>
                </Grid>
              )}
            </Grid>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper variant="outlined" sx={{ p: 3, position: { md: 'sticky' }, top: { md: 24 } }}>
              <Typography variant="h4" sx={{ color: 'primary.main' }}>
                {formatCurrency(pkg.price, pkg.currency)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                per person
              </Typography>
              <Divider sx={{ my: 2.5 }} />

              <Stack spacing={2}>
                <TextField
                  label="Participants"
                  type="number"
                  value={participants}
                  onChange={e => setParticipants(Math.max(1, Number(e.target.value)))}
                  inputProps={{ min: 1 }}
                  fullWidth
                />
                <TextField
                  label="Start date"
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />
              </Stack>

              <Stack direction="row" justifyContent="space-between" sx={{ my: 2.5 }}>
                <Typography color="text.secondary">Total</Typography>
                <Typography sx={{ fontWeight: 800 }}>
                  {formatCurrency(total, pkg.currency)}
                </Typography>
              </Stack>

              {feedback && (
                <Alert severity={feedback.type} sx={{ mb: 2 }}>
                  {feedback.text}
                </Alert>
              )}

              <Button fullWidth variant="contained" size="large" onClick={book} disabled={booking}>
                {booking ? 'Booking…' : 'Book Now'}
              </Button>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default PackageDetailPage;
