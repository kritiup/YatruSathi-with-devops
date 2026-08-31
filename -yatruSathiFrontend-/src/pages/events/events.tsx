import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Chip,
  Container,
  Grid,
  InputAdornment,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import { useNavigate, useSearchParams } from 'react-router';

import { PageHero } from '../../common/components/PageHero';
import { ActivityCard } from '../../common/components/ActivityCard';
import { useRequireAuth } from '../../common/hooks/useRequireAuth';
import { useDebounce } from '../../common/hooks/useDebounce';
import { activityService } from '../../services/api/activities';
import { activityTypeService, type ActivityType } from '../../services/api/catalog';
import { getStoredToken } from '../../common/utils/storage';
import { ROUTES } from '../../common/constants/routes';
import type { ActivitySummary } from '../../common/types/activity';

export function Events() {
  const navigate = useNavigate();
  const ensureAuth = useRequireAuth();
  const [params, setParams] = useSearchParams();

  const [activities, setActivities] = useState<ActivitySummary[]>([]);
  const [types, setTypes] = useState<ActivityType[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState(params.get('search') ?? '');
  const debounced = useDebounce(search, 250);
  const activeType = params.get('type') ?? 'All';

  useEffect(() => {
    setLoading(true);
    Promise.all([activityService.getActivities(), activityTypeService.list().catch(() => [])])
      .then(([acts, t]) => {
        setActivities(acts as ActivitySummary[]);
        setTypes(t);
      })
      .catch(() => setError('Failed to load activities. Please try again.'))
      .finally(() => setLoading(false));

    if (getStoredToken()) {
      activityService
        .getFavorites()
        .then(favs =>
          setFavoriteIds(
            (favs as { activity?: { id: number } }[])
              .map(f => f.activity?.id)
              .filter((x): x is number => typeof x === 'number')
          )
        )
        .catch(() => undefined);
    }
  }, []);

  const typeNames = useMemo(() => ['All', ...types.map(t => t.name)], [types]);

  const filtered = activities.filter(a => {
    const q = debounced.trim().toLowerCase();
    const matchesText =
      !q ||
      (a.title || '').toLowerCase().includes(q) ||
      (a.description || '').toLowerCase().includes(q) ||
      (a.location || '').toLowerCase().includes(q);
    const matchesType =
      activeType === 'All' || a.activity_type?.name === activeType || a.category === activeType;
    return matchesText && matchesType;
  });

  const setType = (name: string) => {
    const next = new URLSearchParams(params);
    if (name === 'All') next.delete('type');
    else next.set('type', name);
    setParams(next, { replace: true });
  };

  const toggleFavorite = async (id: number) => {
    if (!ensureAuth()) return;
    const isFav = favoriteIds.includes(id);
    setFavoriteIds(prev => (isFav ? prev.filter(x => x !== id) : [...prev, id]));
    try {
      if (isFav) await activityService.removeFavorite(id);
      else await activityService.addFavorite(id);
    } catch {
      setFavoriteIds(prev => (isFav ? [...prev, id] : prev.filter(x => x !== id)));
    }
  };

  return (
    <Box>
      <PageHero
        title="Activities"
        subtitle="Every trek, raft, flight and cultural walk on YatruSathi."
        imageSeed="trekking"
      />
      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          alignItems={{ md: 'center' }}
          justifyContent="space-between"
          sx={{ mb: 3 }}
        >
          <TextField
            placeholder="Search activities…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            sx={{ flex: 1, maxWidth: { md: 460 } }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
            }}
          />
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              if (ensureAuth()) navigate(ROUTES.createActivity);
            }}
          >
            Host an activity
          </Button>
        </Stack>

        <Stack direction="row" spacing={1} sx={{ mb: 4, overflowX: 'auto', pb: 1 }}>
          {typeNames.map(name => (
            <Chip
              key={name}
              label={name}
              onClick={() => setType(name)}
              color={activeType === name ? 'primary' : 'default'}
              variant={activeType === name ? 'filled' : 'outlined'}
              sx={{ fontWeight: 600, flexShrink: 0 }}
            />
          ))}
        </Stack>

        {error ? (
          <Box sx={{ textAlign: 'center', py: 10 }}>
            <Typography color="error" variant="h6">
              {error}
            </Typography>
            <Button onClick={() => window.location.reload()} sx={{ mt: 2 }}>
              Retry
            </Button>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {loading
              ? [1, 2, 3, 4, 5, 6].map(i => (
                  <Grid item xs={12} sm={6} md={4} key={i}>
                    <Skeleton variant="rounded" height={300} sx={{ borderRadius: 4 }} />
                  </Grid>
                ))
              : filtered.map(a => (
                  <Grid item xs={12} sm={6} md={4} key={a.id}>
                    <ActivityCard
                      activity={a}
                      favorited={favoriteIds.includes(a.id)}
                      onToggleFavorite={toggleFavorite}
                    />
                  </Grid>
                ))}
            {!loading && filtered.length === 0 && (
              <Grid item xs={12}>
                <Box sx={{ textAlign: 'center', py: 10 }}>
                  <Typography variant="h6" color="text.secondary">
                    No activities match your filters.
                  </Typography>
                  <Button
                    sx={{ mt: 2 }}
                    onClick={() => {
                      setSearch('');
                      setType('All');
                    }}
                  >
                    Clear filters
                  </Button>
                </Box>
              </Grid>
            )}
          </Grid>
        )}
      </Container>
    </Box>
  );
}

export default Events;
