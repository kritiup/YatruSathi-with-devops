import React, { useEffect, useState } from 'react';
import { Box, Button, Container, Grid, Skeleton, Stack, Typography } from '@mui/material';
import ExploreIcon from '@mui/icons-material/Explore';
import HikingIcon from '@mui/icons-material/Hiking';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import TravelExploreIcon from '@mui/icons-material/TravelExplore';
import RecommendIcon from '@mui/icons-material/Recommend';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import { useNavigate } from 'react-router';

import { SectionHeading } from '../../common/components/SectionHeading';
import { SearchBar } from '../../common/components/SearchBar';
import {
  DestinationCard,
  PackageCard,
  ActivityTypeTile,
} from '../../common/components/catalog-cards';
import { ROUTES } from '../../common/constants/routes';
import {
  destinationService,
  packageService,
  activityTypeService,
  type Destination,
  type PackageSummary,
  type ActivityType,
} from '../../services/api/catalog';
import { fallbackImage } from '../../common/utils/media';

const WHY = [
  {
    icon: <EventAvailableIcon />,
    title: 'Easy Trip Planning',
    body: 'Plan your journey with confidence and clear day-by-day detail.',
  },
  {
    icon: <TravelExploreIcon />,
    title: 'Authentic Destinations',
    body: 'Explore hidden gems alongside the classic Nepal highlights.',
  },
  {
    icon: <HikingIcon />,
    title: 'Real Activities',
    body: 'Choose from treks, rafting, safaris and cultural walks.',
  },
  {
    icon: <VerifiedUserIcon />,
    title: 'Trusted Information',
    body: 'Verified operators and honest reviews from other travellers.',
  },
  {
    icon: <RecommendIcon />,
    title: 'Personal Recommendations',
    body: 'Suggestions tuned to the way you like to travel.',
  },
];

const heroImg = fallbackImage('everest');
const ctaImg = fallbackImage('pokhara');

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [packages, setPackages] = useState<PackageSummary[]>([]);
  const [types, setTypes] = useState<ActivityType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      destinationService.list({ is_featured: true }).catch(() => []),
      packageService.list({ is_featured: true }).catch(() => []),
      activityTypeService.list().catch(() => []),
    ])
      .then(([d, p, t]) => {
        setDestinations(d.length ? d : []);
        setPackages(p);
        setTypes(t);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <Box>
      {/* ================= HERO ================= */}
      <Box sx={{ position: 'relative', color: '#fff', overflow: 'hidden' }}>
        <Box
          component="img"
          src={heroImg}
          alt="Himalaya"
          sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        />
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(100deg, rgba(12,44,29,.9) 0%, rgba(12,44,29,.5) 55%, rgba(12,44,29,.2) 100%)',
          }}
        />
        <Container maxWidth="lg" sx={{ position: 'relative', py: { xs: 8, md: 12 } }}>
          <Box sx={{ maxWidth: 620 }}>
            <Typography variant="h1" sx={{ fontSize: { xs: '2.7rem', md: '4rem' }, mb: 2 }}>
              Discover Nepal,
              <br />
              <Box component="span" sx={{ color: 'primary.light' }}>
                Your Way
              </Box>
            </Typography>
            <Typography sx={{ fontSize: { xs: '1.05rem', md: '1.2rem' }, opacity: 0.92, mb: 4 }}>
              Find amazing destinations, exciting activities and unforgettable experiences across
              Nepal.
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 5 }}>
              <Button
                variant="contained"
                size="large"
                startIcon={<ExploreIcon />}
                onClick={() => navigate(ROUTES.destinations)}
              >
                Explore Destinations
              </Button>
              <Button
                variant="outlined"
                size="large"
                onClick={() => navigate(ROUTES.activities)}
                sx={{
                  color: '#fff',
                  borderColor: 'rgba(255,255,255,.6)',
                  '&:hover': { borderColor: '#fff', bgcolor: 'rgba(255,255,255,.12)' },
                }}
              >
                Find Activities
              </Button>
            </Stack>
          </Box>
          <Box sx={{ maxWidth: 920 }}>
            <SearchBar />
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: { xs: 6, md: 9 } }}>
        {/* ================= POPULAR DESTINATIONS ================= */}
        <Box sx={{ mb: { xs: 7, md: 10 } }}>
          <SectionHeading
            eyebrow="Where to go"
            title="Popular Destinations"
            actionLabel="View All"
            onAction={() => navigate(ROUTES.destinations)}
          />
          <Grid container spacing={3}>
            {loading
              ? [1, 2, 3, 4].map(i => (
                  <Grid item xs={6} md={3} key={i}>
                    <Skeleton variant="rounded" height={220} sx={{ borderRadius: 4 }} />
                  </Grid>
                ))
              : destinations.slice(0, 4).map(d => (
                  <Grid item xs={6} md={3} key={d.id}>
                    <DestinationCard destination={d} />
                  </Grid>
                ))}
          </Grid>
        </Box>

        {/* ================= POPULAR ACTIVITIES ================= */}
        <Box sx={{ mb: { xs: 7, md: 10 } }}>
          <SectionHeading
            eyebrow="What to do"
            title="Popular Activities"
            actionLabel="View All"
            onAction={() => navigate(ROUTES.activities)}
          />
          <Grid container spacing={2}>
            {(loading ? [] : types).slice(0, 6).map(t => (
              <Grid item xs={6} sm={4} md={2} key={t.id}>
                <ActivityTypeTile type={t} />
              </Grid>
            ))}
            {loading &&
              [1, 2, 3, 4, 5, 6].map(i => (
                <Grid item xs={6} sm={4} md={2} key={i}>
                  <Skeleton variant="rounded" height={150} sx={{ borderRadius: 4 }} />
                </Grid>
              ))}
          </Grid>
        </Box>

        {/* ================= FEATURED PACKAGES ================= */}
        {!!packages.length && (
          <Box sx={{ mb: { xs: 7, md: 10 } }}>
            <SectionHeading
              eyebrow="Handpicked"
              title="Featured Packages"
              actionLabel="View All"
              onAction={() => navigate(ROUTES.packages)}
            />
            <Grid container spacing={3}>
              {packages.slice(0, 3).map(p => (
                <Grid item xs={12} sm={6} md={4} key={p.id}>
                  <PackageCard pkg={p} />
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {/* ================= WHY CHOOSE ================= */}
        <Box
          sx={{
            bgcolor: '#F4F7F5',
            borderRadius: 4,
            px: { xs: 3, md: 6 },
            py: { xs: 5, md: 7 },
            mb: { xs: 7, md: 10 },
            textAlign: 'center',
          }}
        >
          <Typography variant="h3" sx={{ fontSize: { xs: '1.7rem', md: '2.2rem' }, mb: 5 }}>
            Why Choose YatruSathi?
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gap: 4,
              gridTemplateColumns: {
                xs: 'repeat(1, 1fr)',
                sm: 'repeat(2, 1fr)',
                md: 'repeat(5, 1fr)',
              },
            }}
          >
            {WHY.map(w => (
              <Box key={w.title}>
                <Box
                  sx={{
                    width: 56,
                    height: 56,
                    mx: 'auto',
                    mb: 1.5,
                    borderRadius: '16px',
                    display: 'grid',
                    placeItems: 'center',
                    bgcolor: '#fff',
                    color: 'primary.main',
                    boxShadow: '0 10px 24px -14px rgba(23,37,30,.4)',
                  }}
                >
                  {w.icon}
                </Box>
                <Typography sx={{ fontWeight: 700, mb: 0.5 }}>{w.title}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {w.body}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>

        {/* ================= CTA BAND ================= */}
        <Box
          sx={{
            position: 'relative',
            borderRadius: 4,
            overflow: 'hidden',
            color: '#fff',
            minHeight: 280,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <Box
            component="img"
            src={ctaImg}
            alt=""
            sx={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(90deg, rgba(12,44,29,.92) 0%, rgba(12,44,29,.5) 100%)',
            }}
          />
          <Box sx={{ position: 'relative', p: { xs: 4, md: 7 }, maxWidth: 560 }}>
            <Typography variant="h3" sx={{ fontSize: { xs: '1.9rem', md: '2.4rem' }, mb: 1.5 }}>
              Start Your Journey Across Nepal
            </Typography>
            <Typography sx={{ opacity: 0.9, mb: 3 }}>
              Explore breathtaking places and create memories that last a lifetime.
            </Typography>
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate(ROUTES.destinations)}
              sx={{ bgcolor: '#fff', color: 'primary.dark', '&:hover': { bgcolor: '#fff' } }}
            >
              Explore Now
            </Button>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default Home;
