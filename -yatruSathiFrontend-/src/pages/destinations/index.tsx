import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Container,
  Grid,
  InputAdornment,
  MenuItem,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

import { PageHero } from '../../common/components/PageHero';
import { DestinationCard } from '../../common/components/catalog-cards';
import { useDebounce } from '../../common/hooks/useDebounce';
import { destinationService, type Destination } from '../../services/api/catalog';

export const DestinationsPage: React.FC = () => {
  const [all, setAll] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [region, setRegion] = useState('All regions');
  const debounced = useDebounce(search, 250);

  useEffect(() => {
    destinationService
      .list()
      .then(setAll)
      .catch(() => setAll([]))
      .finally(() => setLoading(false));
  }, []);

  const regions = useMemo(
    () => ['All regions', ...Array.from(new Set(all.map(d => d.region).filter(Boolean)))],
    [all]
  );

  const filtered = all.filter(d => {
    const q = debounced.trim().toLowerCase();
    const matchesText =
      !q ||
      d.name.toLowerCase().includes(q) ||
      d.tagline.toLowerCase().includes(q) ||
      d.region.toLowerCase().includes(q);
    const matchesRegion = region === 'All regions' || d.region === region;
    return matchesText && matchesRegion;
  });

  return (
    <Box>
      <PageHero
        title="Destinations"
        subtitle="Explore the most beautiful places in Nepal."
        imageSeed="pokhara"
      />
      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 4 }}>
          <TextField
            fullWidth
            placeholder="Search destinations…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
            }}
          />
          <TextField
            select
            value={region}
            onChange={e => setRegion(e.target.value)}
            sx={{ minWidth: { sm: 200 } }}
          >
            {regions.map(r => (
              <MenuItem key={r} value={r}>
                {r}
              </MenuItem>
            ))}
          </TextField>
        </Stack>

        {!loading && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Showing {filtered.length} of {all.length} destinations
          </Typography>
        )}

        <Grid container spacing={3}>
          {loading
            ? [1, 2, 3, 4, 5, 6].map(i => (
                <Grid item xs={12} sm={6} md={4} key={i}>
                  <Skeleton variant="rounded" height={240} sx={{ borderRadius: 4 }} />
                </Grid>
              ))
            : filtered.map(d => (
                <Grid item xs={12} sm={6} md={4} key={d.id}>
                  <DestinationCard destination={d} />
                </Grid>
              ))}
        </Grid>

        {!loading && filtered.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 10 }}>
            <Typography color="text.secondary">No destinations match your search.</Typography>
          </Box>
        )}
      </Container>
    </Box>
  );
};

export default DestinationsPage;
