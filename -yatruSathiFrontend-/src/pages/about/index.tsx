import React from 'react';
import { Box, Container, Grid, Typography } from '@mui/material';
import ExploreIcon from '@mui/icons-material/Explore';
import HandshakeIcon from '@mui/icons-material/Handshake';
import PublicIcon from '@mui/icons-material/Public';

import { PageHero } from '../../common/components/PageHero';

const VALUES = [
  {
    icon: <ExploreIcon />,
    title: 'Local first',
    body: 'Every destination, activity and package is built with Nepali operators and guides.',
  },
  {
    icon: <HandshakeIcon />,
    title: 'Honest by default',
    body: 'Real reviews, clear pricing, and itineraries that say what actually happens each day.',
  },
  {
    icon: <PublicIcon />,
    title: 'Travel that gives back',
    body: 'We favour trips that keep money in the communities you travel through.',
  },
];

export const AboutPage: React.FC = () => (
  <Box>
    <PageHero
      title="About YatruSathi"
      subtitle="Your travel companion for exploring the beauty of Nepal."
      imageSeed="kathmandu"
    />
    <Container maxWidth="md" sx={{ py: { xs: 5, md: 8 } }}>
      <Typography sx={{ fontSize: '1.15rem', lineHeight: 1.9, mb: 4 }}>
        YatruSathi started as a simple idea: planning a trip across Nepal should be as rewarding as
        the trip itself. We bring destinations, activities and multi-day packages into one place, so
        you can go from "where should we go?" to a booked adventure without twenty browser tabs.
      </Typography>
      <Typography sx={{ fontSize: '1.15rem', lineHeight: 1.9, mb: 6 }}>
        Whether you are chasing a Himalayan sunrise, rafting the Trishuli, or walking the old
        courtyards of Kathmandu, YatruSathi helps you find it, understand it, and book it with
        confidence.
      </Typography>

      <Grid container spacing={4}>
        {VALUES.map(v => (
          <Grid item xs={12} sm={4} key={v.title}>
            <Box
              sx={{
                width: 52,
                height: 52,
                borderRadius: '14px',
                display: 'grid',
                placeItems: 'center',
                bgcolor: '#F4F7F5',
                color: 'primary.main',
                mb: 1.5,
              }}
            >
              {v.icon}
            </Box>
            <Typography sx={{ fontWeight: 700, mb: 0.5 }}>{v.title}</Typography>
            <Typography variant="body2" color="text.secondary">
              {v.body}
            </Typography>
          </Grid>
        ))}
      </Grid>
    </Container>
  </Box>
);

export default AboutPage;
