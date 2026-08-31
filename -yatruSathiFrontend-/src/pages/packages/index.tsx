import React, { useEffect, useMemo, useState } from 'react';
import { Box, Container, Grid, Skeleton, Tab, Tabs, Typography } from '@mui/material';

import { PageHero } from '../../common/components/PageHero';
import { PackageCard } from '../../common/components/catalog-cards';
import { packageService, type PackageSummary } from '../../services/api/catalog';

const TABS = [
  { label: 'All Packages', value: 'all' },
  { label: 'Trekking', value: 'trekking' },
  { label: 'Adventure', value: 'adventure' },
  { label: 'Cultural', value: 'cultural' },
  { label: 'Wildlife', value: 'wildlife' },
];

export const PackagesPage: React.FC = () => {
  const [all, setAll] = useState<PackageSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');

  useEffect(() => {
    packageService
      .list()
      .then(setAll)
      .catch(() => setAll([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(
    () => (tab === 'all' ? all : all.filter(p => p.category === tab)),
    [all, tab]
  );

  return (
    <Box>
      <PageHero
        title="Packages"
        subtitle="Handpicked packages for unforgettable experiences."
        imageSeed="everest"
      />
      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ mb: 4, borderBottom: 1, borderColor: 'divider' }}
        >
          {TABS.map(t => (
            <Tab key={t.value} label={t.label} value={t.value} />
          ))}
        </Tabs>

        <Grid container spacing={3}>
          {loading
            ? [1, 2, 3, 4, 5, 6].map(i => (
                <Grid item xs={12} sm={6} md={4} key={i}>
                  <Skeleton variant="rounded" height={280} sx={{ borderRadius: 4 }} />
                </Grid>
              ))
            : filtered.map(p => (
                <Grid item xs={12} sm={6} md={4} key={p.id}>
                  <PackageCard pkg={p} />
                </Grid>
              ))}
        </Grid>

        {!loading && filtered.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 10 }}>
            <Typography color="text.secondary">No packages in this category yet.</Typography>
          </Box>
        )}
      </Container>
    </Box>
  );
};

export default PackagesPage;
