import React, { useEffect, useState } from 'react';
import { Box, Button, Paper, Skeleton, Stack, Typography } from '@mui/material';
import { useNavigate } from 'react-router';

import api from '../../api/api';
import { toList, formatDate } from '../../common/utils/formatters';
import { RatingStars } from '../../common/components/RatingStars';
import { getStoredUser } from '../../common/utils/storage';
import { ROUTES } from '../../common/constants/routes';

interface ReviewRow {
  id: number;
  activity: number;
  rating: number;
  comment: string;
  created_at: string;
  rated_user: unknown | null;
  user: { id: number; username: string };
}

export const MyReviews: React.FC = () => {
  const navigate = useNavigate();
  const me = getStoredUser();
  const [rows, setRows] = useState<ReviewRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('reviews/')
      .then(r => toList<ReviewRow>(r.data))
      .then(all => setRows(all.filter(x => x.user?.id === me?.id && !x.rated_user)))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        My Reviews
      </Typography>

      {loading ? (
        <Skeleton height={200} />
      ) : rows.length ? (
        <Stack spacing={2}>
          {rows.map(r => (
            <Paper key={r.id} variant="outlined" sx={{ p: 2.5 }}>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                sx={{ mb: 1 }}
              >
                <RatingStars value={r.rating} />
                <Typography variant="caption" color="text.secondary">
                  {formatDate(r.created_at)}
                </Typography>
              </Stack>
              <Typography sx={{ mb: 1.5 }}>{r.comment}</Typography>
              <Button size="small" onClick={() => navigate(ROUTES.activityDetail(r.activity))}>
                View activity
              </Button>
            </Paper>
          ))}
        </Stack>
      ) : (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography color="text.secondary">
            You haven't written any reviews yet. Reviews open once a trip you joined is completed.
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default MyReviews;
