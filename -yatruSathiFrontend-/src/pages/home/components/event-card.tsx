import React from 'react';
import {
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  CardMedia,
  Stack,
  Typography,
} from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import LocationOnIcon from '@mui/icons-material/LocationOn';

export const getImagePath = (imagePath: string) => {
  if (!imagePath) return '/placeholder.jpg';

  // Handle absolute URLs
  if (imagePath.startsWith('http')) {
    // Check for double-prefixed URLs like http://.../media/http...
    const mediaHttpIndex = imagePath.indexOf('/media/http');
    if (mediaHttpIndex !== -1) {
      return decodeURIComponent(imagePath.substring(mediaHttpIndex + 7));
    }
    return imagePath;
  }

  // Get base URL for media (remove /api/ from end if present)
  const apiBaseUrl =
    import.meta.env.VITE_API_BASE_URL || 'https://yatrusathi-backend.onrender.com/api/';
  const mediaBaseUrl = apiBaseUrl.replace(/\/api\/?$/, '');

  if (imagePath.startsWith('/media/')) {
    return `${mediaBaseUrl}${imagePath}`;
  }
  if (imagePath.includes('event_images/')) {
    return `${mediaBaseUrl}/media/${imagePath}`;
  }
  if (imagePath.startsWith('/assets/imgs')) {
    return `/src${imagePath}`;
  }
  if (imagePath.startsWith('/src/assets')) {
    return imagePath;
  }
  return imagePath;
};

interface RecentEventCardProps {
  id: string | number;
  image: string;
  title: string;
  description: string;
  category?: string;
  location?: string;
  status?: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  onViewDetails?: (id: string | number) => void;
  actions?: React.ReactNode;
  metaItems?: { label: string; value: string }[];
}

export const EventCard: React.FC<RecentEventCardProps> = ({
  id,
  image,
  title,
  description,
  category = 'Adventure',
  location = 'Nepal',
  status,
  onViewDetails = () => {},
  actions,
  metaItems,
}) => {
  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        transition: 'transform .35s cubic-bezier(.4,0,.2,1), box-shadow .35s',
        '&:hover': {
          transform: 'translateY(-8px)',
          boxShadow: '0 28px 46px -18px rgba(32,48,46,.28)',
          '& .card-image': { transform: 'scale(1.08)' },
        },
      }}
    >
      <CardActionArea
        onClick={() => onViewDetails(id)}
        sx={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', flexGrow: 1 }}
      >
        <Box sx={{ position: 'relative', width: '100%', pt: '64%', overflow: 'hidden' }}>
          <CardMedia
            className="card-image"
            component="img"
            image={getImagePath(image)}
            alt={title}
            sx={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transition: 'transform .8s ease',
            }}
          />
          {/* bottom scrim so overlaid text is always legible */}
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              background:
                'linear-gradient(to top, rgba(22,36,31,.72) 0%, rgba(22,36,31,.05) 45%, transparent 70%)',
            }}
          />

          <Box
            sx={{
              position: 'absolute',
              top: 14,
              left: 14,
              px: 1.4,
              py: 0.5,
              borderRadius: 999,
              bgcolor: 'rgba(255,255,255,.92)',
              backdropFilter: 'blur(6px)',
              color: 'primary.dark',
              fontSize: '.7rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '.06em',
            }}
          >
            {category}
          </Box>

          {status === 'completed' && (
            <Box
              sx={{
                position: 'absolute',
                top: 14,
                right: 14,
                px: 1.4,
                py: 0.5,
                borderRadius: 999,
                bgcolor: 'rgba(22,36,31,.78)',
                color: '#fff',
                fontSize: '.7rem',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '.06em',
              }}
            >
              Completed
            </Box>
          )}

          <Stack
            direction="row"
            alignItems="center"
            spacing={0.5}
            sx={{ position: 'absolute', left: 16, bottom: 14, color: '#fff' }}
          >
            <LocationOnIcon sx={{ fontSize: '1rem' }} />
            <Typography
              variant="caption"
              sx={{ fontWeight: 700, letterSpacing: '.02em', textTransform: 'uppercase' }}
            >
              {location}
            </Typography>
          </Stack>
        </Box>

        <CardContent sx={{ p: 3, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
          <Typography
            variant="h6"
            sx={{
              fontSize: '1.2rem',
              lineHeight: 1.3,
              mb: 1,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              minHeight: '3.1rem',
            }}
          >
            {title}
          </Typography>

          <Typography
            variant="body2"
            sx={{
              color: 'text.secondary',
              lineHeight: 1.6,
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {description}
          </Typography>

          {metaItems && metaItems.length > 0 && (
            <Stack direction="row" spacing={2} sx={{ mt: 2, flexWrap: 'wrap' }}>
              {metaItems.map(item => (
                <Box key={`${item.label}-${item.value}`}>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{
                      display: 'block',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '.04em',
                    }}
                  >
                    {item.label}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 800 }}>
                    {item.value}
                  </Typography>
                </Box>
              ))}
            </Stack>
          )}
        </CardContent>
      </CardActionArea>

      <Box sx={{ px: 3, pb: 3 }}>
        {actions ? (
          <Box
            sx={{
              display: 'flex',
              width: '100%',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 1,
            }}
          >
            {Array.isArray(actions) ? (
              <>
                <Box sx={{ flexGrow: 1 }}>{actions[0]}</Box>
                <Box>{actions[1]}</Box>
              </>
            ) : (
              actions
            )}
          </Box>
        ) : (
          <Button
            variant="text"
            fullWidth
            onClick={() => onViewDetails(id)}
            endIcon={<ArrowForwardIcon className="arrow" />}
            sx={{
              justifyContent: 'space-between',
              px: 1.5,
              color: 'primary.main',
              fontWeight: 800,
              '& .arrow': { transition: 'transform .3s ease' },
              '&:hover .arrow': { transform: 'translateX(6px)' },
            }}
          >
            Explore experience
          </Button>
        )}
      </Box>
    </Card>
  );
};
