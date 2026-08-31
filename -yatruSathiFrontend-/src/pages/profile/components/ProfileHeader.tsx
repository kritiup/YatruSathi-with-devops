import React from 'react';
import { Box, Chip, IconButton, Typography } from '@mui/material';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import VerifiedIcon from '@mui/icons-material/Verified';
import StarIcon from '@mui/icons-material/Star';
import type { ProfileSummary, UserProfile } from '../types';

interface Props {
  avatar: string;
  profile: UserProfile;
  isViewingOtherUser: boolean;
  publicSummary: { organizer?: ProfileSummary; participant?: ProfileSummary } | null;
  totalReviews: number;
  organizerRatingLabel: string;
  onAvatarChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const goldChipSx = {
  bgcolor: 'rgba(255, 193, 7, 0.15)',
  color: '#f57c00',
  fontWeight: 700,
  '& .MuiChip-icon': { marginLeft: '8px', marginRight: '-4px' },
} as const;

export const ProfileHeader: React.FC<Props> = ({
  avatar,
  profile,
  isViewingOtherUser,
  publicSummary,
  totalReviews,
  organizerRatingLabel,
  onAvatarChange,
}) => (
  <Box sx={{ mb: 3, display: 'flex', alignItems: 'flex-end', position: 'relative' }}>
    <Box sx={{ position: 'relative' }}>
      <Box
        component="img"
        src={avatar}
        sx={{
          width: 150,
          height: 200,
          borderRadius: 2,
          border: '4px solid white',
          boxShadow: 3,
          objectFit: 'cover',
        }}
      />
      {!isViewingOtherUser && (
        <IconButton
          component="label"
          sx={{
            position: 'absolute',
            bottom: 10,
            right: 10,
            bgcolor: 'white',
            boxShadow: 2,
            '&:hover': { bgcolor: '#f0f0f0' },
          }}
        >
          <CameraAltIcon fontSize="small" color="primary" />
          <input hidden accept="image/*" type="file" onChange={onAvatarChange} />
        </IconButton>
      )}
    </Box>
    <Box sx={{ ml: 3, mb: 2 }}>
      <Typography
        variant="h4"
        fontWeight={800}
        sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
      >
        {profile.name || 'Traveller'}
        {profile.is_kyc_verified && <VerifiedIcon color="primary" />}
      </Typography>
      <Typography color="text.secondary" variant="subtitle1">
        {profile.email}
      </Typography>
      <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap', alignItems: 'center' }}>
        {profile.is_kyc_verified ? (
          <Chip
            label="Verified Account"
            color="success"
            size="small"
            variant="outlined"
            sx={{ fontWeight: 700 }}
          />
        ) : (
          <Chip
            label="Unverified"
            color="warning"
            size="small"
            variant="outlined"
            sx={{ fontWeight: 700 }}
          />
        )}
        {isViewingOtherUser &&
          publicSummary?.organizer &&
          publicSummary.organizer.average_rating > 0 && (
            <Chip
              icon={<StarIcon sx={{ color: 'gold !important' }} />}
              label={`${publicSummary.organizer.average_rating.toFixed(1)} (${
                publicSummary.organizer.reviews_count || 0
              } reviews)`}
              size="small"
              variant="filled"
              sx={goldChipSx}
            />
          )}
        {!isViewingOtherUser && totalReviews > 0 && (
          <Chip
            icon={<StarIcon sx={{ color: 'gold !important' }} />}
            label={`${organizerRatingLabel} (${totalReviews} reviews)`}
            size="small"
            variant="filled"
            sx={goldChipSx}
          />
        )}
      </Box>
    </Box>
  </Box>
);

export default ProfileHeader;
