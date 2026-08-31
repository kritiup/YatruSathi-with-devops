import React, { useEffect, useState } from 'react';
import { Box, Button, Grid, Skeleton, Typography } from '@mui/material';
import { useNavigate } from 'react-router';

import { ActivityCard } from '../../common/components/ActivityCard';
import { activityService } from '../../services/api/activities';
import { ROUTES } from '../../common/constants/routes';
import type { ActivitySummary } from '../../common/types/activity';

interface FavoriteRow {
  id: number;
  activity: ActivitySummary;
}

export const MyWishlist: React.FC = () => {
  const navigate = useNavigate();
  const [rows, setRows] = useState<FavoriteRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    activityService
      .getFavorites()
      .then(r => setRows(r as FavoriteRow[]))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, []);

  const remove = async (activityId: number) => {
    setRows(prev => prev.filter(r => r.activity?.id !== activityId));
    try {
      await activityService.removeFavorite(activityId);
    } catch {
      /* re-fetch on next mount */
    }
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        My Wishlist
      </Typography>

      {loading ? (
        <Grid container spacing={3}>
          {[1, 2, 3].map(i => (
            <Grid item xs={12} sm={6} md={4} key={i}>
              <Skeleton variant="rounded" height={300} sx={{ borderRadius: 4 }} />
            </Grid>
          ))}
        </Grid>
      ) : rows.length ? (
        <Grid container spacing={3}>
          {rows.map(r => (
            <Grid item xs={12} sm={6} md={4} key={r.id}>
              <ActivityCard activity={r.activity} favorited onToggleFavorite={remove} />
            </Grid>
          ))}
        </Grid>
      ) : (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            Your wishlist is empty. Tap the heart on any activity to save it here.
          </Typography>
          <Button variant="contained" onClick={() => navigate(ROUTES.activities)}>
            Browse activities
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default MyWishlist;
