import React from 'react';
import { Box, Typography } from '@mui/material';
import { BRAND } from '../../theme';

interface Props {
  /** Render light-on-dark (for use over photos / dark footers). */
  light?: boolean;
  compact?: boolean;
  onClick?: () => void;
}

/** The YatruSathi wordmark with a small mountain glyph. */
export const BrandMark: React.FC<Props> = ({ light = false, compact = false, onClick }) => {
  const fg = light ? '#FFFFFF' : 'text.primary';
  const accent = light ? '#FFFFFF' : BRAND.green;
  return (
    <Box
      onClick={onClick}
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 1,
        cursor: onClick ? 'pointer' : 'default',
        userSelect: 'none',
      }}
    >
      <Box
        component="svg"
        viewBox="0 0 32 32"
        sx={{ width: 30, height: 30, flexShrink: 0 }}
        aria-hidden
      >
        <path
          d="M16 3 L29 27 H3 Z"
          fill={light ? 'rgba(255,255,255,0.16)' : BRAND.canvas}
          stroke={accent}
          strokeWidth={2}
          strokeLinejoin="round"
        />
        <path d="M11 18 l4 -6 4 6 -2.6 3.4 L16 18 l-2.4 3.4 Z" fill={accent} />
      </Box>
      {!compact && (
        <Typography
          sx={{
            fontFamily: BRAND.serif,
            fontWeight: 700,
            fontSize: '1.2rem',
            letterSpacing: '-0.01em',
            color: fg,
            lineHeight: 1,
          }}
        >
          Yatru
          <Box component="span" sx={{ color: accent }}>
            Sathi
          </Box>
        </Typography>
      )}
    </Box>
  );
};

export default BrandMark;
