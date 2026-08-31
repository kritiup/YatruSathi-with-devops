import React from 'react';
import { Box, Button, Stack, Typography } from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

interface Props {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}

/** A consistent section header: eyebrow + title + optional "see all" link. */
export const SectionHeading: React.FC<Props> = ({
  eyebrow,
  title,
  subtitle,
  actionLabel,
  onAction,
}) => (
  <Stack
    direction={{ xs: 'column', sm: 'row' }}
    justifyContent="space-between"
    alignItems={{ xs: 'flex-start', sm: 'flex-end' }}
    spacing={2}
    sx={{ mb: 4 }}
  >
    <Box>
      {eyebrow && (
        <Typography variant="overline" sx={{ color: 'primary.main', display: 'block', mb: 0.5 }}>
          {eyebrow}
        </Typography>
      )}
      <Typography variant="h4" sx={{ fontSize: { xs: '1.6rem', md: '2rem' } }}>
        {title}
      </Typography>
      {subtitle && (
        <Typography color="text.secondary" sx={{ mt: 1, maxWidth: 560 }}>
          {subtitle}
        </Typography>
      )}
    </Box>
    {actionLabel && onAction && (
      <Button
        onClick={onAction}
        endIcon={<ArrowForwardIcon />}
        sx={{ color: 'secondary.main', flexShrink: 0 }}
      >
        {actionLabel}
      </Button>
    )}
  </Stack>
);

export default SectionHeading;
