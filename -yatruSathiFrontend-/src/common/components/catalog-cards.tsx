import React from 'react';
import { Box, Card, CardActionArea, CardContent, Chip, Stack, Typography } from '@mui/material';
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';
import ScheduleIcon from '@mui/icons-material/Schedule';
import { useNavigate } from 'react-router';

import { imageOrFallback } from '../utils/media';
import { formatCurrency } from '../utils/formatters';
import { RatingStars } from './RatingStars';
import { ROUTES } from '../constants/routes';
import type { Destination, PackageSummary, ActivityType } from '../../services/api/catalog';

const CARD_HOVER = {
  transition: 'transform .3s ease, box-shadow .3s ease',
  '&:hover': { transform: 'translateY(-6px)', boxShadow: '0 26px 44px -22px rgba(23,37,30,.35)' },
  '&:hover .zoom': { transform: 'scale(1.06)' },
} as const;

const zoomImg = {
  position: 'absolute' as const,
  inset: 0,
  width: '100%',
  height: '100%',
  objectFit: 'cover' as const,
  transition: 'transform .6s ease',
};

export const DestinationCard: React.FC<{ destination: Destination }> = ({ destination }) => {
  const navigate = useNavigate();
  return (
    <Card sx={{ height: '100%', ...CARD_HOVER }}>
      <CardActionArea
        onClick={() => navigate(ROUTES.destinationDetail(destination.slug))}
        sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}
      >
        <Box sx={{ position: 'relative', pt: '70%', overflow: 'hidden' }}>
          <Box
            component="img"
            className="zoom"
            src={imageOrFallback(destination.cover_image, destination.slug)}
            alt={destination.name}
            sx={zoomImg}
          />
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to top, rgba(12,44,29,.8) 0%, rgba(12,44,29,0) 55%)',
            }}
          />
          <Box sx={{ position: 'absolute', left: 16, right: 16, bottom: 12, color: '#fff' }}>
            <Typography variant="h6" sx={{ fontFamily: 'inherit', fontWeight: 700 }}>
              {destination.name}
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.9 }}>
              {destination.tagline || destination.region}
            </Typography>
          </Box>
        </Box>
        {(destination.activity_count != null || destination.package_count != null) && (
          <CardContent sx={{ py: 1.5 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
              {destination.activity_count ?? 0} activities · {destination.package_count ?? 0}{' '}
              packages
            </Typography>
          </CardContent>
        )}
      </CardActionArea>
    </Card>
  );
};

export const PackageCard: React.FC<{ pkg: PackageSummary }> = ({ pkg }) => {
  const navigate = useNavigate();
  return (
    <Card sx={{ height: '100%', ...CARD_HOVER }}>
      <CardActionArea
        onClick={() => navigate(ROUTES.packageDetail(pkg.slug))}
        sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}
      >
        <Box sx={{ position: 'relative', pt: '62%', overflow: 'hidden' }}>
          <Box
            component="img"
            className="zoom"
            src={imageOrFallback(pkg.cover_image, pkg.slug)}
            alt={pkg.name}
            sx={zoomImg}
          />
          <Chip
            label={pkg.category}
            size="small"
            sx={{
              position: 'absolute',
              top: 12,
              left: 12,
              bgcolor: 'rgba(255,255,255,.92)',
              color: 'primary.dark',
              fontWeight: 700,
              textTransform: 'capitalize',
            }}
          />
        </Box>
        <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Stack direction="row" spacing={0.5} alignItems="center" color="text.secondary">
            <ScheduleIcon sx={{ fontSize: '1rem' }} />
            <Typography variant="caption" sx={{ fontWeight: 600 }}>
              {pkg.duration_days} {pkg.duration_days === 1 ? 'Day' : 'Days'}
            </Typography>
          </Stack>
          <Typography variant="h6" sx={{ fontFamily: 'inherit', fontWeight: 700, lineHeight: 1.3 }}>
            {pkg.name}
          </Typography>
          <RatingStars value={pkg.rating} count={pkg.review_count} />
          <Box sx={{ flexGrow: 1 }} />
          <Typography sx={{ fontWeight: 800, color: 'primary.main' }}>
            {formatCurrency(pkg.price, pkg.currency)}
            <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
              / person
            </Typography>
          </Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  );
};

export const ActivityTypeTile: React.FC<{ type: ActivityType }> = ({ type }) => {
  const navigate = useNavigate();
  return (
    <Card sx={{ ...CARD_HOVER }}>
      <CardActionArea
        onClick={() => navigate(`${ROUTES.activities}?type=${encodeURIComponent(type.name)}`)}
      >
        <Box sx={{ position: 'relative', pt: '88%', overflow: 'hidden' }}>
          <Box
            component="img"
            className="zoom"
            src={imageOrFallback(type.image, type.slug)}
            alt={type.name}
            sx={zoomImg}
          />
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to top, rgba(12,44,29,.82) 0%, rgba(12,44,29,0) 60%)',
            }}
          />
          <Stack
            direction="row"
            spacing={0.5}
            alignItems="center"
            sx={{ position: 'absolute', left: 12, bottom: 10, color: '#fff' }}
          >
            <PlaceOutlinedIcon sx={{ fontSize: '0.95rem' }} />
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              {type.name}
            </Typography>
          </Stack>
        </Box>
      </CardActionArea>
    </Card>
  );
};
