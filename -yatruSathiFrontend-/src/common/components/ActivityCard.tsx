import React from 'react';
import { Box, Card, CardActionArea, CardContent, Chip, Stack, Typography } from '@mui/material';
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';
import ScheduleIcon from '@mui/icons-material/Schedule';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import { IconButton } from '@mui/material';
import { useNavigate } from 'react-router';

import { imageOrFallback } from '../utils/media';
import { formatCurrency } from '../utils/formatters';
import { ROUTES } from '../constants/routes';
import type { ActivitySummary } from '../types/activity';

interface Props {
  activity: ActivitySummary;
  favorited?: boolean;
  onToggleFavorite?: (id: number) => void;
}

/** The card used in the activities grid and destination detail pages. */
export const ActivityCard: React.FC<Props> = ({ activity, favorited, onToggleFavorite }) => {
  const navigate = useNavigate();
  const price = activity.is_free_event ? 'Free' : formatCurrency(activity.ticket_price ?? 0);
  const category = activity.activity_type?.name || activity.category || 'Experience';

  return (
    <Card
      sx={{
        height: '100%',
        transition: 'transform .3s ease, box-shadow .3s ease',
        '&:hover': {
          transform: 'translateY(-6px)',
          boxShadow: '0 26px 44px -22px rgba(23,37,30,.35)',
        },
        '&:hover .zoom': { transform: 'scale(1.06)' },
      }}
    >
      <CardActionArea
        onClick={() => navigate(ROUTES.activityDetail(activity.id))}
        sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}
      >
        <Box sx={{ position: 'relative', pt: '62%', overflow: 'hidden' }}>
          <Box
            component="img"
            className="zoom"
            src={imageOrFallback(activity.image, activity.activity_type?.slug || activity.title)}
            alt={activity.title}
            sx={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transition: 'transform .6s ease',
            }}
          />
          <Chip
            label={category}
            size="small"
            sx={{
              position: 'absolute',
              top: 12,
              left: 12,
              bgcolor: 'rgba(255,255,255,.92)',
              color: 'primary.dark',
              fontWeight: 700,
            }}
          />
          {onToggleFavorite && (
            <IconButton
              onClick={e => {
                e.stopPropagation();
                e.preventDefault();
                onToggleFavorite(activity.id);
              }}
              sx={{
                position: 'absolute',
                top: 6,
                right: 6,
                bgcolor: 'rgba(255,255,255,.9)',
                color: favorited ? 'error.main' : 'text.secondary',
                '&:hover': { bgcolor: '#fff' },
              }}
              size="small"
            >
              {favorited ? (
                <FavoriteIcon fontSize="small" />
              ) : (
                <FavoriteBorderIcon fontSize="small" />
              )}
            </IconButton>
          )}
        </Box>
        <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Stack direction="row" spacing={1.5} color="text.secondary" flexWrap="wrap">
            {activity.location && (
              <Stack direction="row" spacing={0.4} alignItems="center">
                <PlaceOutlinedIcon sx={{ fontSize: '0.95rem' }} />
                <Typography variant="caption" sx={{ fontWeight: 600 }}>
                  {activity.location}
                </Typography>
              </Stack>
            )}
            {activity.duration && (
              <Stack direction="row" spacing={0.4} alignItems="center">
                <ScheduleIcon sx={{ fontSize: '0.95rem' }} />
                <Typography variant="caption" sx={{ fontWeight: 600 }}>
                  {activity.duration}
                </Typography>
              </Stack>
            )}
          </Stack>
          <Typography
            variant="h6"
            sx={{
              fontFamily: 'inherit',
              fontWeight: 700,
              lineHeight: 1.3,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {activity.title}
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {activity.description}
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
          <Typography sx={{ fontWeight: 800, color: 'primary.main' }}>
            {price}
            {!activity.is_free_event && (
              <Typography
                component="span"
                variant="caption"
                color="text.secondary"
                sx={{ ml: 0.5 }}
              >
                / person
              </Typography>
            )}
          </Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  );
};

export default ActivityCard;
