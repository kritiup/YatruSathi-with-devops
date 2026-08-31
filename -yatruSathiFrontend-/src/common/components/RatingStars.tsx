import React from 'react';
import { Box, Typography } from '@mui/material';
import StarIcon from '@mui/icons-material/Star';
import StarHalfIcon from '@mui/icons-material/StarHalf';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import { BRAND } from '../../theme';

interface Props {
  value: number | string;
  count?: number;
  size?: 'small' | 'medium';
}

/** Five-star rating row with an optional "(N reviews)" suffix. */
export const RatingStars: React.FC<Props> = ({ value, count, size = 'small' }) => {
  const v = Math.max(0, Math.min(5, Number(value) || 0));
  const fontSize = size === 'small' ? '1rem' : '1.25rem';
  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
      <Box sx={{ display: 'inline-flex', color: BRAND.amber }}>
        {[0, 1, 2, 3, 4].map(i => {
          if (v >= i + 1) return <StarIcon key={i} sx={{ fontSize }} />;
          if (v >= i + 0.5) return <StarHalfIcon key={i} sx={{ fontSize }} />;
          return <StarBorderIcon key={i} sx={{ fontSize }} />;
        })}
      </Box>
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
        {v.toFixed(1)}
        {count != null ? ` (${count})` : ''}
      </Typography>
    </Box>
  );
};

export default RatingStars;
