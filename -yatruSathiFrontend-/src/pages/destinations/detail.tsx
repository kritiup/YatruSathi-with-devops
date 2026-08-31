import React, { useEffect, useState } from 'react';
import { Box, Button, Container, Grid, Skeleton, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate, useParams } from 'react-router';

import { PageHero } from '../../common/components/PageHero';
import { SectionHeading } from '../../common/components/SectionHeading';
import { ActivityCard } from '../../common/components/ActivityCard';
import { PackageCard } from '../../common/components/catalog-cards';
import { ROUTES } from '../../common/constants/routes';
import { destinationService, type DestinationDetail } from '../../services/api/catalog';
import type { ActivitySummary } from '../../common/types/activity';

export const DestinationDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<DestinationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    destinationService
      .get(slug)
      .then(setData)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Skeleton variant="rounded" height={300} sx={{ borderRadius: 4, mb: 4 }} />
        <Skeleton width="40%" height={40} />
        <Skeleton width="90%" />
      </Container>
    );
  }

  if (error || !data) {
    return (
      <Container maxWidth="lg" sx={{ py: 10, textAlign: 'center' }}>
        <Typography variant="h5" sx={{ mb: 2 }}>
          Destination not found
        </Typography>
        <Button onClick={() => navigate(ROUTES.destinations)}>Back to destinations</Button>
      </Container>
    );
  }

  const activities = (data.activities || []) as unknown as ActivitySummary[];

  return (
    <Box>
      <PageHero
        title={data.name}
        subtitle={data.tagline || data.region}
        image={data.cover_image}
        imageSeed={data.slug}
      />
      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(ROUTES.destinations)}
          sx={{ mb: 3 }}
        >
          All destinations
        </Button>

        {data.description && (
          <Typography sx={{ fontSize: '1.1rem', lineHeight: 1.9, mb: 6, maxWidth: 780 }}>
            {data.description}
          </Typography>
        )}

        {activities.length > 0 && (
          <Box sx={{ mb: 8 }}>
            <SectionHeading eyebrow="Things to do" title={`Activities in ${data.name}`} />
            <Grid container spacing={3}>
              {activities.map(a => (
                <Grid item xs={12} sm={6} md={4} key={a.id}>
                  <ActivityCard activity={a} />
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {data.packages.length > 0 && (
          <Box>
            <SectionHeading eyebrow="Multi-day trips" title="Packages" />
            <Grid container spacing={3}>
              {data.packages.map(p => (
                <Grid item xs={12} sm={6} md={4} key={p.id}>
                  <PackageCard pkg={p} />
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {activities.length === 0 && data.packages.length === 0 && (
          <Typography color="text.secondary">Nothing listed here yet — check back soon.</Typography>
        )}
      </Container>
    </Box>
  );
};

export default DestinationDetailPage;
