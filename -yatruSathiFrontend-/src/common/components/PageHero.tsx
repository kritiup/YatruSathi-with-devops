import React from 'react';
import { Box, Container, Typography } from '@mui/material';
import { fallbackImage, resolveMediaUrl } from '../utils/media';

interface Props {
  title: string;
  subtitle?: string;
  image?: string | null;
  imageSeed?: string;
  height?: number;
  children?: React.ReactNode;
}

/** The photographic header band used at the top of catalogue pages. */
export const PageHero: React.FC<Props> = ({
  title,
  subtitle,
  image,
  imageSeed,
  height = 300,
  children,
}) => {
  const src = resolveMediaUrl(image) || fallbackImage(imageSeed || title);
  return (
    <Box
      sx={{
        position: 'relative',
        minHeight: height,
        display: 'flex',
        alignItems: 'center',
        color: '#fff',
        overflow: 'hidden',
      }}
    >
      <Box
        component="img"
        src={src}
        alt=""
        sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
      />
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(180deg, rgba(18,61,40,0.35) 0%, rgba(12,44,29,0.78) 100%)',
        }}
      />
      <Container maxWidth="lg" sx={{ position: 'relative', py: 5 }}>
        <Typography
          variant="h2"
          sx={{ fontSize: { xs: '2rem', md: '2.9rem' }, mb: subtitle ? 1 : 0 }}
        >
          {title}
        </Typography>
        {subtitle && (
          <Typography sx={{ opacity: 0.92, maxWidth: 560, fontSize: '1.05rem' }}>
            {subtitle}
          </Typography>
        )}
        {children && <Box sx={{ mt: 3 }}>{children}</Box>}
      </Container>
    </Box>
  );
};

export default PageHero;
